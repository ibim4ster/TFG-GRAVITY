from flask import Blueprint, request, redirect, url_for, flash
from flask_login import login_required, current_user, logout_user

from app.extensions import db
from app.models.models import Usuario, Licencia, TransaccionPaypal, Conversation

user = Blueprint('user', __name__, url_prefix='/user')

@user.route('/update_configuration', methods=['POST'])
@login_required
def update_configuration():
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')
    if not new_password or not confirm_password:
        flash('Ambos campos de contraseña son obligatorios.', 'danger')
        return redirect(request.referrer)
    if new_password != confirm_password:
        flash('Las contraseñas no coinciden.', 'danger')
        return redirect(request.referrer)
    user = current_user
    user.set_password(new_password)
    db.session.commit()
    flash('Tu contraseña ha sido actualizada con éxito. Por favor, inicia sesión de nuevo.', 'success')
    logout_user()
    return redirect(url_for('auth.login'))

@user.route('/eliminar_cuenta', methods=['POST'])
@login_required
def eliminar_cuenta():
    try:
        user_id = current_user.id
        user = Usuario.query.get(user_id)
        
        if user:
            # Paso 1: Eliminar todas las transacciones PayPal del usuario
            TransaccionPaypal.query.filter_by(usuario_id=user_id).delete()
            
            # Paso 2: Eliminar todas las licencias del usuario
            Licencia.query.filter_by(usuario_id=user_id).delete()
            
            # Paso 3: Eliminar todas las conversaciones del usuario
            # Aquí usamos user_id en lugar de usuario_id
            Conversation.query.filter_by(user_id=user_id).delete()
            
            # Paso 4: Confirmar los cambios antes de eliminar el usuario
            db.session.commit()
            
            # Paso 5: Ahora eliminar el usuario
            db.session.delete(user)
            db.session.commit()
            
            logout_user()
            flash('Tu cuenta y todos tus datos han sido eliminados con éxito.', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash('No se pudo encontrar tu cuenta. Por favor, intenta de nuevo.', 'danger')
            return redirect(url_for('main.dashboard'))
        
    except Exception as e:
        db.session.rollback()
        flash(f'Ha ocurrido un error al eliminar la cuenta: {str(e)}', 'danger')
        return redirect(url_for('main.dashboard'))