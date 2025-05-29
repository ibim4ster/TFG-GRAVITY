from flask import Blueprint, render_template, request, jsonify, redirect, url_for
from flask_login import login_required, current_user
from datetime import datetime

from app.extensions import db
from app.models.models import Ticket, MensajeTicket, Usuario

tickets = Blueprint('tickets', __name__, url_prefix='/tickets')

@tickets.route('/panel')
@login_required
def tickets_panel():
    """Muestra todos los tickets según el rol del usuario"""
    if current_user.rol == 'Admin':
        tickets_list = Ticket.query.order_by(Ticket.fecha_creacion.desc()).all()
    else:
        tickets_list = Ticket.query.filter_by(usuario_id_creador=current_user.id).order_by(Ticket.fecha_creacion.desc()).all()
    
    return render_template('tickets_panel.html', tickets=tickets_list)

@tickets.route('/create', methods=['GET', 'POST'])
@login_required
def create_ticket():
    """Crear un nuevo ticket"""
    if request.method == 'POST':
        try:
            titulo = request.form.get('titulo')
            descripcion = request.form.get('descripcion')
            prioridad = request.form.get('prioridad', 'Media')
            
            if not titulo or not descripcion:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return jsonify(success=False, error='Título y descripción son obligatorios')
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
    
    return render_template('create_ticket.html')

@tickets.route('/view/<int:ticket_id>')
@login_required
def view_ticket(ticket_id):
    """Ver detalles de un ticket específico"""
    ticket = Ticket.query.get_or_404(ticket_id)
    
    # Verificar permisos
    if current_user.rol != 'Admin' and ticket.usuario_id_creador != current_user.id:
        return redirect(url_for('tickets.tickets_panel'))
    
    mensajes = MensajeTicket.query.filter_by(ticket_id=ticket_id).order_by(MensajeTicket.fecha_creacion.asc()).all()
    usuarios = Usuario.query.filter_by(rol='Admin').all()
    
    return render_template('view_ticket.html', ticket=ticket, mensajes=mensajes, usuarios=usuarios)

@tickets.route('/add_message/<int:ticket_id>', methods=['POST'])
@login_required
def add_message(ticket_id):
    """Añadir mensaje a un ticket"""
    ticket = Ticket.query.get_or_404(ticket_id)
    
    # Verificar permisos
    if current_user.rol != 'Admin' and ticket.usuario_id_creador != current_user.id:
        return jsonify(success=False, error="Acceso denegado"), 403
    
    try:
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

@tickets.route('/update/<int:ticket_id>', methods=['POST'])
@login_required
def update_ticket(ticket_id):
    """Actualizar un ticket (solo admin)"""
    if current_user.rol != 'Admin':
        return jsonify(success=False, error="Acceso denegado"), 403
    
    ticket = Ticket.query.get_or_404(ticket_id)
    
    try:
        # Obtener datos del request
        if request.is_json:
            data = request.get_json()
        else:
            data = {
                'estado': request.form.get('estado'),
                'prioridad': request.form.get('prioridad'),
                'asignado': request.form.get('asignado')
            }
        
        # Actualizar campos si están presentes
        if 'estado' in data and data['estado']:
            if data['estado'] in ['Abierto', 'En progreso', 'Cerrado']:
                ticket.estado = data['estado']
            else:
                return jsonify(success=False, error="Estado inválido")
        
        if 'prioridad' in data and data['prioridad']:
            if data['prioridad'] in ['Baja', 'Media', 'Alta']:
                ticket.prioridad = data['prioridad']
            else:
                return jsonify(success=False, error="Prioridad inválida")
        
        if 'asignado' in data:
            if data['asignado'] and data['asignado'] != '':
                # Verificar que el usuario existe y es admin
                usuario_asignado = Usuario.query.get(data['asignado'])
                if not usuario_asignado or usuario_asignado.rol != 'Admin':
                    return jsonify(success=False, error="Usuario asignado inválido")
                ticket.usuario_id_asignado = data['asignado']
            else:
                ticket.usuario_id_asignado = None
        
        # Actualizar fecha de modificación
        ticket.fecha_actualizacion = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(success=True, message="Ticket actualizado correctamente")
        
    except Exception as e:
        db.session.rollback()
        return jsonify(success=False, error=f"Error al actualizar: {str(e)}")

@tickets.route('/update_status/<int:ticket_id>', methods=['POST'])
@login_required
def update_status(ticket_id):
    """Actualizar estado de un ticket"""
    if current_user.rol != 'Admin':
        return jsonify(success=False, error="Acceso denegado"), 403
    
    ticket = Ticket.query.get_or_404(ticket_id)
    
    try:
        nuevo_estado = request.form.get('estado')
        if nuevo_estado in ['Abierto', 'En progreso', 'Cerrado']:
            ticket.estado = nuevo_estado
            ticket.fecha_actualizacion = datetime.utcnow()
            db.session.commit()
            return jsonify(success=True, message="Estado actualizado correctamente")
        else:
            return jsonify(success=False, error="Estado inválido")
            
    except Exception as e:
        db.session.rollback()
        return jsonify(success=False, error=str(e))

@tickets.route('/delete/<int:ticket_id>', methods=['POST'])
@login_required
def delete_ticket(ticket_id):
    """Eliminar un ticket (solo admin)"""
    if current_user.rol != 'Admin':
        return jsonify(success=False, error="Acceso denegado"), 403
    
    ticket = Ticket.query.get_or_404(ticket_id)
    
    try:
        # Primero eliminar todos los mensajes asociados
        MensajeTicket.query.filter_by(ticket_id=ticket_id).delete()
        
        # Luego eliminar el ticket
        db.session.delete(ticket)
        db.session.commit()
        
        return jsonify(success=True, message="Ticket eliminado correctamente")
        
    except Exception as e:
        db.session.rollback()
        return jsonify(success=False, error=f"Error al eliminar: {str(e)}")

@tickets.route('/get_ticket_data/<int:ticket_id>')
@login_required 
def get_ticket_data(ticket_id):
    """Obtener datos de un ticket para actualización dinámica"""
    ticket = Ticket.query.get_or_404(ticket_id)
    
    # Verificar permisos
    if current_user.rol != 'Admin' and ticket.usuario_id_creador != current_user.id:
        return jsonify(success=False, error="Acceso denegado"), 403
    
    try:
        mensajes = MensajeTicket.query.filter_by(ticket_id=ticket_id).order_by(MensajeTicket.fecha_creacion.asc()).all()
        
        mensajes_data = []
        for mensaje in mensajes:
            mensajes_data.append({
                'id': mensaje.id,
                'contenido': mensaje.contenido,
                'autor': mensaje.autor.username if mensaje.autor else 'Usuario eliminado',
                'es_admin': mensaje.autor.rol == 'Admin' if mensaje.autor else False,
                'fecha': mensaje.fecha_creacion.strftime('%d/%m/%Y %H:%M')
            })
        
        return jsonify(
            success=True,
            ticket={
                'id': ticket.id,
                'titulo': ticket.titulo,
                'estado': ticket.estado,
                'prioridad': ticket.prioridad,
                'usuario_id_asignado': ticket.usuario_id_asignado,
                'mensajes': mensajes_data
            }
        )
    except Exception as e:
        return jsonify(success=False, error=f"Error al obtener datos: {str(e)}")

@tickets.route('/close/<int:ticket_id>', methods=['POST'])
@login_required
def close_ticket(ticket_id):
    """Cerrar un ticket"""
    if current_user.rol != 'Admin':
        return jsonify(success=False, error="Acceso denegado"), 403
    
    ticket = Ticket.query.get_or_404(ticket_id)
    
    try:
        ticket.estado = 'Cerrado'
        ticket.fecha_actualizacion = datetime.utcnow()
        db.session.commit()
        
        return jsonify(success=True, message="Ticket cerrado correctamente")
        
    except Exception as e:
        db.session.rollback()
        return jsonify(success=False, error=str(e))

@tickets.route('/reopen/<int:ticket_id>', methods=['POST'])
@login_required
def reopen_ticket(ticket_id):
    """Reabrir un ticket"""
    if current_user.rol != 'Admin':
        return jsonify(success=False, error="Acceso denegado"), 403
    
    ticket = Ticket.query.get_or_404(ticket_id)
    
    try:
        ticket.estado = 'Abierto'
        ticket.fecha_actualizacion = datetime.utcnow()
        db.session.commit()
        
        return jsonify(success=True, message="Ticket reabierto correctamente")
        
    except Exception as e:
        db.session.rollback()
        return jsonify(success=False, error=str(e))

@tickets.route('/stats')
@login_required
def ticket_stats():
    """Estadísticas de tickets (solo admin)"""
    if current_user.rol != 'Admin':
        return redirect(url_for('tickets.tickets_panel'))
    
    total_tickets = Ticket.query.count()
    tickets_abiertos = Ticket.query.filter_by(estado='Abierto').count()
    tickets_en_progreso = Ticket.query.filter_by(estado='En progreso').count()
    tickets_cerrados = Ticket.query.filter_by(estado='Cerrado').count()
    
    stats = {
        'total': total_tickets,
        'abiertos': tickets_abiertos,
        'en_progreso': tickets_en_progreso,
        'cerrados': tickets_cerrados
    }
    
    return jsonify(stats)