# 🌌 Gravity - Sistema de Gestión de Licencias SaaS

<div align="center">
  <img src="app/static/logo.png" alt="Gravity Logo" width="200"/>
  
  [![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
  [![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)](https://flask.palletsprojects.com/)
  [![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://mysql.com)
  [![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-purple.svg)](https://openai.com)
  [![PayPal](https://img.shields.io/badge/PayPal-SDK-blue.svg)](https://developer.paypal.com)
</div>

## 📋 Descripción

Gravity es una plataforma web integral diseñada para gestionar todo el ciclo de vida de las licencias de software tipo SaaS. El objetivo principal es centralizar y simplificar la venta, gestión de licencias y administración de usuarios desde un único lugar.

### ✨ Características Principales

- 🔐 **Sistema de Autenticación Robusto** - Control de acceso basado en roles
- 💳 **Gestión de Licencias** - Tres tipos: Mensual (€9.99), Anual (€99.99), Permanente (€299.99)
- 💰 **Integración PayPal** - Procesamiento automático de pagos
- 🎫 **Sistema de Tickets** - Soporte al cliente con prioridades y estados
- 🤖 **Chatbot IA** - Asistente automatizado 24/7 con OpenAI GPT-4o-mini
- 👥 **Panel Administrativo** - Gestión completa de usuarios y transacciones

## 🏗️ Arquitectura

```
Gravity/
├── app/
│   ├── models/          # Modelos de datos (Usuario, Licencia, Ticket, etc.)
│   ├── routes/          # Blueprints de Flask (auth, licenses, tickets, etc.)
│   ├── services/        # Servicios (chatbot, license management)
│   ├── templates/       # Templates HTML
│   ├── static/          # CSS, JS, imágenes
│   └── config.py        # Configuración de la aplicación
├── utils/               # Herramientas adicionales (Sherlock)
└── run.py              # Punto de entrada de la aplicación
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Python 3.8+
- MySQL 8.0+
- Cuenta de OpenAI (para el chatbot)
- Cuenta de PayPal Developer (para pagos)

### 1. Clonar el repositorio

```bash
git clone https://github.com/ibim4ster/TFG-GRAVITY.git
cd TFG-GRAVITY
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar base de datos

Crear una base de datos MySQL y actualizar la configuración en `app/config.py`:

```python
SQLALCHEMY_DATABASE_URI = 'mysql://usuario:contraseña@localhost/gravity'
```

### 4. Configurar APIs

Actualizar las claves API en `app/config.py`:

```python
OPENAI_API_KEY = 'tu-clave-openai'
```

### 5. Ejecutar la aplicación

```bash
python run.py
```

La aplicación estará disponible en `http://localhost:5000`

## 💾 Modelos de Datos

### Licencia
Gestiona los tres tipos de licencias con estados (Stock, Activa, Suspendida, Expirada) y códigos únicos para activación.

### Sistema de Tickets
Sistema completo de soporte con prioridades (Alta, Media, Baja) y estados de seguimiento.

### Transacciones PayPal
Registro detallado de todas las transacciones con trazabilidad completa.

## 🤖 Chatbot IA

El sistema incluye un chatbot especializado que utiliza OpenAI GPT-4o-mini con conocimiento específico sobre las funcionalidades de Gravity y gestión de historial de conversaciones.

## 🎯 Funcionalidades por Rol

### Administrador
- Gestión completa de usuarios y licencias
- Panel de transacciones PayPal
- Asignación y revocación de licencias
- Gestión de tickets de soporte

### Cliente
- Compra de licencias (mensual, anual, permanente)
- Activación por código
- Creación de tickets de soporte
- Acceso al chatbot IA

## 🛠️ Tecnologías Utilizadas

- **Backend**: Flask, SQLAlchemy, MySQL
- **Frontend**: HTML5, CSS3, JavaScript (AJAX)
- **Autenticación**: Flask-Login, bcrypt
- **IA**: OpenAI GPT-4o-mini
- **Pagos**: PayPal SDK
- **Testing**: pytest
- **Herramientas**: Sherlock (búsqueda de perfiles)

## 🔧 Desarrollo

### Estructura de Blueprints
La aplicación utiliza una arquitectura modular con blueprints separados para cada funcionalidad.

### Testing

```bash
pytest
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request


## 👨‍💻 Autor

**ibim4ster** - [GitHub](https://github.com/ibim4ster)

## 🙏 Agradecimientos

- OpenAI por la API de GPT-4o-mini
- PayPal por el SDK de pagos
- Flask community por el excelente framework

---

<div align="center">
  <p>⭐ ¡Dale una estrella si te gusta el proyecto! ⭐</p>
</div>
