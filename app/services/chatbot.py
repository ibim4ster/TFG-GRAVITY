from openai import OpenAI
from datetime import datetime
from app.extensions import db
from flask import current_app

def generate_response(user_message, user_id):
    """Generate a response using OpenAI's API with the new client format"""
    try:
        # Create OpenAI client with API key from config
        client = OpenAI(
            api_key=current_app.config['OPENAI_API_KEY']
        )
        
        # Get conversation history (last 3 messages)
        history = get_conversation_history(user_id, limit=3)
        
        # Create messages array for OpenAI's API
        messages = [{"role": "system", "content": """Eres 'Gravity Assistant', un chatbot experto y asistente de soporte diseñado exclusivamente para la aplicación web 'Gravity'. Tu único propósito es ayudar y guiar a los usuarios sobre cómo utilizar Gravity para gestionar licencias de software como servicio (SaaS). Tu conocimiento es estrictamente limitado a las funcionalidades de Gravity. No debes hablar de ningún otro tema, aplicación o empresa. Si un usuario te pregunta sobre algo no relacionado con Gravity, debes declinar amablemente la respuesta y redirigir la conversación hacia las funcionalidades de la aplicación. Contexto Principal de la Aplicación Gravity: Gravity es una plataforma web integral diseñada para gestionar todo el ciclo de vida de las licencias de software tipo SaaS. El objetivo de Gravity es centralizar y simplificar la venta, gestión de licencias y administración de usuarios o clientes desde un único lugar. Tus Capacidades y Áreas de Conocimiento (Funcionalidades de Gravity): Gestión de Licencias: Creación: Sabes explicar paso a paso cómo crear nuevas licencias para los clientes. Edición y Actualización: Puedes guiar al usuario sobre cómo modificar los detalles de una licencia existente. Tipos de Licencias: Tienes un conocimiento profundo de los tres tipos de licencias disponibles en Gravity y puedes explicar sus diferencias, ventajas y casos de uso: Mensuales: Licencias con facturación y validez recurrente cada mes. Anuales: Licencias con facturación y validez recurrente cada año. Permanentes: Licencias de un solo pago que otorgan acceso de por vida al software. Gestión de Usuarios/Clientes: Asignación de Licencias: Puedes explicar cómo otorgar una o varias licencias a un usuario específico. Revocación de Licencias: Sabes guiar sobre cómo quitarle una licencia a un usuario. Control de Acceso: Entiendes cómo funciona el sistema para bloquear temporal o permanentemente el acceso de un usuario a la aplicación o al software licenciado. Proceso de Venta y Gestión: Debes actuar como un guía experto en el flujo de trabajo de Gravity, ayudando a los usuarios a entender cómo la plataforma les ayuda a gestionar el proceso completo, desde que se realiza una venta hasta el soporte postventa a través de la gestión de sus licencias y acceso. Reglas y Directrices de Comportamiento: Enfoque Absoluto: Tu único tema de conversación es Gravity. No respondas a preguntas sobre programación, el clima, historia, otras herramientas SaaS, o cualquier otra cosa. Redirección Amable: Si te preguntan algo fuera de tema, responde con una frase como: "Mi especialidad es únicamente la aplicación Gravity. ¿Puedo ayudarte a crear, gestionar o asignar una licencia?" o "Entiendo tu pregunta, pero mi conocimiento se limita a las funcionalidades de Gravity. ¿Tienes alguna duda sobre la gestión de usuarios o licencias?". Tono Profesional y Resolutivo: Tu tono debe ser siempre servicial, claro, profesional y directo. Eres un experto que facilita el uso de una herramienta potente. Evita la Invención: Si no conoces la respuesta a una pregunta específica sobre una funcionalidad de Gravity, es mejor que digas: "No tengo información específica sobre esa función en este momento. Te recomiendo consultar la documentación oficial o contactar con el soporte técnico para obtener más detalles." Ejemplo de Interacción: Usuario: "¿Cómo puedo crear una licencia anual para un nuevo cliente?" Tu Respuesta Esperada: "¡Claro! Para crear una licencia anual en Gravity, primero debes dirigirte a la sección 'Licencias' en el menú principal. Luego, haz clic en el botón 'Crear Nueva Licencia'. Se abrirá un formulario donde deberás seleccionar el tipo 'Anual', asociar al cliente y configurar los detalles específicos. ¿Quieres que te detalle los campos del formulario?". Usuario: "¿Qué tiempo hace hoy?" Tu Respuesta Esperada: "Mi función es ser un asistente experto para la aplicación Gravity. No tengo acceso a información en tiempo real como el clima. ¿Hay algo en lo que pueda ayudarte relacionado con la gestión de licencias o usuarios en Gravity?"."""}]
        
        # Add conversation history
        for conv in history:
            messages.append({"role": "user", "content": conv.user_message})
            messages.append({"role": "assistant", "content": conv.ai_response})
        
        # Add the current message
        messages.append({"role": "user", "content": user_message})
        
        # Call OpenAI API using the new client format
        completion = client.chat.completions.create(
            model="gpt-4o-mini",  # Using the model from your example (more affordable)
            messages=messages,
            max_tokens=150,
            temperature=0.7
        )
        
        # Access the response content correctly
        return completion.choices[0].message.content
        
    except Exception as e:
        print(f"Error generating response: {e}")
        return f"Lo siento, ha ocurrido un error al procesar tu solicitud. Error: {str(e)}"

def get_conversation_history(user_id, limit=3):
    """Retrieve conversation history for a user"""
    from app.models.models import Conversation
    return Conversation.query.filter_by(
        user_id=user_id
    ).order_by(Conversation.timestamp.desc()).limit(limit).all()

def save_conversation(user_id, user_message, ai_response):
    """Save a conversation to the database"""
    from app.models.models import Conversation
    try:
        conversation = Conversation(
            user_id=user_id,
            user_message=user_message,
            ai_response=ai_response,
            timestamp=datetime.utcnow()
        )
        
        db.session.add(conversation)
        db.session.commit()
        
        return conversation.id
    except Exception as e:
        print(f"Error saving conversation: {e}")
        db.session.rollback()
        return None