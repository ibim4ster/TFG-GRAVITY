# TFG-GRAVITY

¡Bienvenido/a a TFG-GRAVITY!  
Este proyecto ofrece una aplicación de gestión de licencias de software (al estilo SaaS) que incluye:

• Portal de venta de licencias.  
• Gestión de usuarios y asignación de licencias.  
• Sistema de tickets de soporte para dudas o problemas.  

---

## Tabla de Contenidos
1. [Descripción General](#descripción-general)  
2. [Características Principales](#características-principales)  
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)  
4. [Requisitos](#requisitos)  
5. [Instalación](#instalación)  
6. [Ejecución](#ejecución)  
7. [Uso de la Aplicación](#uso-de-la-aplicación)  
8. [Contribución](#contribución)  
9. [Licencia](#licencia)  

---

## Descripción General

TFG-GRAVITY es una solución integral para la gestión de licencias, usuarios y tickets de soporte.  
Su objetivo es brindar una plataforma web que permita a los usuarios:

• Adquirir y renovar licencias.  
• Recibir soporte técnico a través de un sistema de tickets.  
• Adminsitrar usuarios y permisos (para casos de uso con roles Administrador).  

---

## Características Principales

1. **Portal de venta de licencias**  
   - Interfaz para comprar licencias y procesar pagos (ej. integración PayPal).  

2. **Gestión de licencias y usuarios**  
   - Crear, asignar y revocar licencias  
   - Control de fechas de vencimiento y renovaciones  
   - Panel para que administradores gestionen usuarios (crear, modificar, eliminar)  

3. **Sistema de tickets de soporte**  
   - Creación y seguimiento de tickets por parte de los usuarios  
   - Panel administrativo para visualizar y responder tickets  

---

## Tecnologías Utilizadas

• **Python** (versión 3.8+)  
• **Flask** (framework web)  
• **SQLAlchemy** (ORM para la base de datos)  
• **HTML**, **CSS**, **JavaScript** (interfaz web)  
• **Docker** (opcional, para contenedorización)  

---

## Requisitos

• Python 3.8 o superior  
• Gestor de paquetes de Python (pip, pipenv, poetry, etc.)  
• (Opcional) Docker para despliegue en contenedor  

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/ibim4ster/TFG-GRAVITY.git

# 2. Instalar dependencias
cd TFG-GRAVITY
pip install -r requirements.txt
```

---

## Ejecución

```bash
# 1. Ejecutar la aplicación
python run.py

# 2. Acceder en el navegador
# Normalmente, la aplicación escucha en el puerto 5000
# Visita http://127.0.0.1:5000
```

### Ejecución con Docker (Opcional)

```bash
# 1. Construir la imagen
docker build -t tfg-gravity .

# 2. Ejecutar el contenedor
docker run -p 5000:5000 tfg-gravity
```

---

## Uso de la Aplicación

1. **Registro e inicio de sesión**  
   - Los usuarios pueden registrarse e iniciar sesión para comprar y gestionar licencias.  

2. **Compra de licencias**  
   - Al iniciar sesión, se presenta el catálogo de licencias disponibles y opciones de pago.  

3. **Panel de administración (solo usuarios con rol admin)**  
   - Visualizar y gestionar usuarios, licencias y pedidos de compra.  

4. **Soporte al usuario**  
   - Los usuarios pueden crear tickets solicitando ayuda o reportando problemas.  
   - El administrador puede responder a dichos tickets y mantener un historial de soporte.  

---

## Contribución

1. Haz un **fork** de este repositorio.  
2. Crea una rama (`git checkout -b feature/nueva-funcion`).  
3. Realiza tus cambios y haz _commit_.  
4. Haz _push_ de la rama a tu fork.  
5. Abre un **pull request** en este repositorio explicando tus mejoras.  

---

## Licencia

Consulta el archivo `LICENSE` (si existe) para más detalles.  

¡Gracias por tu interés en TFG-GRAVITY!  
