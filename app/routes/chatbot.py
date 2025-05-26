from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required, current_user
from app.services.chatbot import generate_response, save_conversation
import os

chatbot = Blueprint('chatbot', __name__, url_prefix='/chatbot')

@chatbot.route('/send', methods=['POST'])
@login_required
def send_message():
    data = request.json
    user_message = data.get('message', '')
    
    if not user_message.strip():
        return jsonify({'error': 'Message cannot be empty'}), 400
    
    # Get AI response
    response = generate_response(user_message, current_user.id)
    
    # Save conversation to database
    conversation_id = save_conversation(
        user_id=current_user.id,
        user_message=user_message,
        ai_response=response
    )
    
    return jsonify({
        'response': response,
        'conversation_id': conversation_id
    })

@chatbot.route('/history', methods=['GET'])
@login_required
def get_history():
    from app.models.models import Conversation
    from app.extensions import db
    
    conversations = Conversation.query.filter_by(
        user_id=current_user.id
    ).order_by(Conversation.timestamp.desc()).limit(5).all()
    
    history = [{
        'id': conv.id,
        'user_message': conv.user_message,
        'ai_response': conv.ai_response,
        'timestamp': conv.timestamp.strftime("%Y-%m-%d %H:%M:%S")
    } for conv in conversations]
    
    return jsonify(history)