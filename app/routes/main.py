from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user
from app.extensions import db
from datetime import datetime

from app.models.models import Licencia, Usuario, Ticket, MensajeTicket

main = Blueprint('main', __name__)

@main.route('/')
def start_page():
    return render_template('start_page.html')

@main.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', section='dashboard', Licencia=Licencia)

@main.route('/get_content/<path:section>')
@login_required
def get_content(section):
    if section == 'dashboard':
        return render_template('dashboard_content.html')
    elif section == 'comprar':
        return render_template('comprar_content.html')
    elif section == 'buscar':
        return render_template('index.html')
    elif section == 'sherlock':
        return render_template('sherlock.html')
    elif section == 'configuracion':
        return render_template('configuracion_content.html', user=current_user)
    elif section == 'adminpanel':
        if current_user.rol != 'Admin':
            return jsonify({'error': 'Acceso denegado'}), 403
        users = Usuario.query.all()
        return render_template('admin_panel.html', users=users)
    elif section == 'licensespanel':
        if current_user.rol != 'Admin':
            return jsonify({'error': 'Acceso denegado'}), 403
        licencias = Licencia.query.all()
        # CAMBIAR ESTA LÍNEA:
        return render_template('licensespanel.html', licencias=licencias)  # Sin guión bajo
    elif section == 'create_license':  
        if current_user.rol != 'Admin':
            return jsonify({'error': 'Acceso denegado'}), 403
        return render_template('create_license.html')
    elif section.startswith('edit_license/'):
        if current_user.rol != 'Admin':
            return jsonify({'error': 'Acceso denegado'}), 403
        license_id = section.split('/')[-1]
        licencia = Licencia.query.get_or_404(license_id)
        return render_template('edit_license.html', licencia=licencia)
    elif section.startswith('edit_user/'):
        if current_user.rol != 'Admin':
            return jsonify({'error': 'Acceso denegado'}), 403
        user_id = section.split('/')[-1]
        user = Usuario.query.get_or_404(user_id)
        return render_template('edit_user.html', user=user)
    elif section == 'tickets':
        # Mostrar tickets según el rol del usuario
        if current_user.rol == 'Admin':
            tickets_list = Ticket.query.order_by(Ticket.fecha_creacion.desc()).all()
        else:
            tickets_list = Ticket.query.filter_by(usuario_id_creador=current_user.id).order_by(Ticket.fecha_creacion.desc()).all()
        return render_template('tickets_panel.html', tickets=tickets_list)
    elif section == 'create_ticket':
        return render_template('create_ticket.html')
    elif section.startswith('view_ticket/'):
        ticket_id = section.split('/')[-1]
        ticket = Ticket.query.get_or_404(ticket_id)
        
        # Verificar permisos
        if current_user.rol != 'Admin' and ticket.usuario_id_creador != current_user.id:
            return redirect(url_for('main.get_content', section='tickets'))
        
        mensajes = MensajeTicket.query.filter_by(ticket_id=ticket_id).order_by(MensajeTicket.fecha_creacion.asc()).all()
        usuarios = Usuario.query.filter_by(rol='Admin').all()
        
        return render_template('view_ticket.html', ticket=ticket, mensajes=mensajes, usuarios=usuarios)
    else:
        return jsonify({'error': 'Sección no encontrada'}), 404

# Importación dentro de la función para evitar errores de importación circular
@main.route('/comprar', methods=['GET', 'POST'])
@login_required
def comprar():
    from flask import redirect, url_for, request
    if request.method == 'POST':
        return redirect(url_for('main.dashboard'))
    return render_template('comprar_content.html')

@main.route('/tickets/create', methods=['POST'])
@login_required
def create_ticket_main():
    """Crear un nuevo ticket desde el contenido dinámico"""
    try:
        titulo = request.form.get('titulo')
        descripcion = request.form.get('descripcion')
        prioridad = request.form.get('prioridad', 'Media')
        
        if not titulo or not descripcion:
            return jsonify(success=False, error='Título y descripción son obligatorios')
        
        nuevo_ticket = Ticket(
            titulo=titulo,
            descripcion_inicial=descripcion,
            prioridad=prioridad,
            usuario_id_creador=current_user.id,
            estado='Abierto'
        )
        
        db.session.add(nuevo_ticket)
        db.session.commit()
        
        return jsonify(success=True, message='Ticket creado exitosamente', ticket_id=nuevo_ticket.id)
        
    except Exception as e:
        db.session.rollback()
        return jsonify(success=False, error=str(e))

@main.route('/tickets/add_message/<int:ticket_id>', methods=['POST'])
@login_required
def add_message_main(ticket_id):
    """Añadir mensaje a un ticket"""
    try:
        ticket = Ticket.query.get_or_404(ticket_id)
        
        # Verificar permisos
        if current_user.rol != 'Admin' and ticket.usuario_id_creador != current_user.id:
            return jsonify(success=False, error="Acceso denegado"), 403
        
        contenido = request.form.get('contenido') or request.json.get('contenido')
        
        if not contenido or not contenido.strip():
            return jsonify(success=False, error="El mensaje no puede estar vacío")
        
        mensaje = MensajeTicket(
            contenido=contenido.strip(),
            ticket_id=ticket_id,
            usuario_id_autor=current_user.id
        )
        
        # Actualizar fecha de actualización del ticket
        ticket.fecha_actualizacion = datetime.utcnow()
        
        db.session.add(mensaje)
        db.session.commit()
        
        return jsonify(success=True, message="Mensaje añadido correctamente")
        
    except Exception as e:
        db.session.rollback()
        return jsonify(success=False, error=str(e))