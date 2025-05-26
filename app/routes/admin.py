from datetime import datetime
from flask import Blueprint, render_template, request, redirect, jsonify
from flask_login import login_required, current_user

from app.extensions import db
from app.models.models import TransaccionPaypal, Usuario, Licencia, Ticket, MensajeTicket, Conversation
from app.services.license import get_licencia_activa

admin = Blueprint('admin', __name__, url_prefix='/admin')

@admin.route('/')
@login_required
def admin_panel():
    if current_user.rol != 'Admin':
        return 'Acceso denegado', 403
    users = Usuario.query.all()
    return render_template('admin_panel.html', users=users)

@admin.route('/edit_user/<int:user_id>', methods=['GET', 'POST'])
@login_required
def edit_user(user_id):
    if current_user.rol != 'Admin':
        return 'Acceso denegado', 403
    user = Usuario.query.get_or_404(user_id)
    if request.method == 'POST':
        new_username = request.form.get('username')
        new_rol = request.form.get('rol')
        ban_status = request.form.get('ban_status')
        if new_username:
            user.username = new_username
        if new_rol:
            user.rol = new_rol
        user.is_banned = (ban_status == '1')
        db.session.commit()
        return redirect('/admin')
    return render_template('edit_user.html', user=user)

@admin.route('/update_user/<int:user_id>', methods=['POST'])
@login_required
def update_user(user_id):
    if current_user.rol != 'Admin':
        return 'Acceso denegado', 403
    user = Usuario.query.get_or_404(user_id)
    if user:
        username = request.form.get('username')
        rol = request.form.get('rol')
        banned_status = request.form.get('banned') == '1'
        user.username = username  # Si tienes username como campo, cámbialo aquí
        user.rol = rol
        user.is_banned = banned_status
        db.session.commit()
        return jsonify(success=True)
    return jsonify(success=False, error='Usuario no encontrado'), 404

@admin.route('/delete_user/<int:user_id>', methods=['DELETE', 'POST'])
@login_required
def delete_user(user_id):
    if current_user.rol != 'Admin':
        return jsonify(success=False, error="Acceso denegado"), 403
    
    if user_id == current_user.id:
        return jsonify(success=False, error="No puedes eliminar tu propia cuenta desde el panel de administración"), 400
    
    user = Usuario.query.get(user_id)
    if not user:
        return jsonify(success=False, error="Usuario no encontrado"), 404
    
    try:
        # Primero debemos eliminar todos los registros relacionados
        
        # 1. Eliminar transacciones PayPal
        TransaccionPaypal.query.filter_by(usuario_id=user_id).delete()
        
        # 2. Eliminar conversaciones
        Conversation.query.filter_by(user_id=user_id).delete()
        
        # 3. Eliminar tickets creados o asignados al usuario
        # Primero eliminar los mensajes de los tickets donde el usuario es autor
        MensajeTicket.query.filter_by(usuario_id_autor=user_id).delete()
        
        # Luego eliminar los tickets donde el usuario es creador
        Ticket.query.filter_by(usuario_id_creador=user_id).delete()
        
        # Modificar tickets donde el usuario es asignado (no eliminarlos)
        for ticket in Ticket.query.filter_by(usuario_id_asignado=user_id).all():
            ticket.usuario_id_asignado = None
        
        # 4. Actualizar licencias (marcar como disponibles en Stock en lugar de eliminar)
        for licencia in Licencia.query.filter_by(usuario_id=user_id).all():
            licencia.usuario_id = None
            licencia.estado = 'Stock'
            licencia.fecha_inicio = None
            licencia.fecha_fin = None
            
        # 5. Hacer commit para asegurar que todos los cambios relacionales se apliquen antes
        db.session.commit()
        
        # 6. Ahora sí eliminar el usuario
        db.session.delete(user)
        db.session.commit()
        
        return jsonify(success=True)
    except Exception as e:
        db.session.rollback()
        return jsonify(success=False, error=f"Error al eliminar usuario: {str(e)}"), 500
    

@admin.route('/add_transaction', methods=['POST'])
@login_required
def add_transaction():
    if current_user.rol != 'Admin':
        return jsonify(success=False, error="Acceso denegado"), 403
    
    try:
        user_id = request.form.get('user_id')
        transaction_id = request.form.get('transaction_id')
        order_id = request.form.get('order_id', '')
        amount = request.form.get('amount')
        license_id = request.form.get('license_id') or None
        
        if not user_id or not transaction_id or not amount:
            return jsonify(success=False, error="Datos incompletos"), 400
        
        # Create transaction record
        transaction = TransaccionPaypal(
            usuario_id=user_id,
            licencia_id=license_id,
            paypal_transaction_id=transaction_id,
            paypal_order_id=order_id,
            monto=amount,
            fecha=datetime.utcnow()
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify(success=True)
    
    except Exception as e:
        db.session.rollback()
        return jsonify(success=False, error=str(e)), 500
    
@admin.route('/fix_missing_transactions', methods=['POST'])
@login_required
def fix_missing_transactions():
    if current_user.rol != 'Admin':
        return jsonify(success=False, error="Acceso denegado"), 403
    
    # Get all active licenses without transactions
    from sqlalchemy.orm import aliased
    from app.models.models import Licencia, TransaccionPaypal
    
    tp_alias = aliased(TransaccionPaypal)
    missing_licenses = Licencia.query.outerjoin(
        tp_alias, Licencia.id == tp_alias.licencia_id
    ).filter(
        Licencia.estado == 'Activa', 
        tp_alias.id == None
    ).all()
    
    count = 0
    for license in missing_licenses:
        # Create placeholder transaction
        transaction = TransaccionPaypal(
            usuario_id=license.usuario_id,
            licencia_id=license.id,
            paypal_transaction_id=f"MANUAL-{license.id}-{int(datetime.utcnow().timestamp())}",
            paypal_order_id="",
            monto=0.00,  # Since we don't know the actual amount
            fecha=license.fecha_creacion or datetime.utcnow()
        )
        db.session.add(transaction)
        count += 1
    
    db.session.commit()
    return jsonify(success=True, count=count, message=f"Se crearon {count} registros de transacción para licencias sin transacción.")