from app.extensions import db, login_manager
from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class Usuario(db.Model, UserMixin):
    __tablename__ = 'usuario'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    rol = db.Column(db.Enum('Admin', 'Vendedor', 'Cliente'), default='Cliente')
    is_banned = db.Column(db.Boolean, default=False)
    licencias = db.relationship('Licencia', backref='usuario', lazy=True)
    tickets_creados = db.relationship('Ticket', foreign_keys='[Ticket.usuario_id_creador]', backref='creador', lazy=True)
    tickets_asignados = db.relationship('Ticket', foreign_keys='[Ticket.usuario_id_asignado]', backref='asignado', lazy=True)


    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

# Función necesaria para Flask-Login
@login_manager.user_loader
def load_user(user_id):
    return Usuario.query.get(int(user_id))

class Licencia(db.Model):
    __tablename__ = 'licencia'
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.Enum('Mensual', 'Anual', 'Permanente'), nullable=False)
    precio = db.Column(db.Numeric(10,2), nullable=False)
    codigo = db.Column(db.String(50), unique=True)
    es_promocional = db.Column(db.Boolean, default=False)
    fecha_creacion = db.Column(db.Date, nullable=False)
    fecha_inicio = db.Column(db.Date)
    fecha_fin = db.Column(db.Date)
    estado = db.Column(db.Enum('Stock', 'Activa', 'Suspendida', 'Expirada'), default='Stock')
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))

class Ticket(db.Model):
    __tablename__ = 'ticket'
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descripcion_inicial = db.Column(db.Text, nullable=False)
    prioridad = db.Column(db.Enum('Alta', 'Media', 'Baja'), default='Media')
    estado = db.Column(db.Enum('Abierto', 'En progreso', 'Cerrado'), default='Abierto')
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    usuario_id_creador = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    usuario_id_asignado = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    mensajes = db.relationship('MensajeTicket', backref='ticket', lazy=True)

class MensajeTicket(db.Model):
    __tablename__ = 'mensajeticket'
    id = db.Column(db.Integer, primary_key=True)
    contenido = db.Column(db.Text, nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    ticket_id = db.Column(db.Integer, db.ForeignKey('ticket.id'))
    usuario_id_autor = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    
     # AÑADIR ESTA LÍNEA para la relación con el autor del mensaje
    autor = db.relationship('Usuario', backref=db.backref('mensajes_tickets', lazy=True))
    
class Conversation(db.Model):
    __tablename__ = 'conversations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)  # Changed from users.id to usuario.id
    user_message = db.Column(db.Text, nullable=False)
    ai_response = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('Usuario', backref=db.backref('conversations', lazy=True))  # Changed from User to Usuario
    

# Add this after your existing models

class TransaccionPaypal(db.Model):
    __tablename__ = 'transaccion_paypal'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    licencia_id = db.Column(db.Integer, db.ForeignKey('licencia.id'), nullable=True)
    paypal_transaction_id = db.Column(db.String(100), unique=True)
    paypal_order_id = db.Column(db.String(100))
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    monto = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Relationships
    usuario = db.relationship('Usuario', backref=db.backref('transacciones', lazy=True))
    licencia = db.relationship('Licencia', backref=db.backref('transaccion', uselist=False))