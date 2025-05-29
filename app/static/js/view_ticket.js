// DECLARAR FUNCIONES GLOBALES INMEDIATAMENTE (antes del DOMContentLoaded)
window.ticketId = parseInt('{{ ticket.id }}');

// Función específica para enviar mensajes
function enviarMensaje() {
    const messageContainer = document.getElementById('message-container');
    const contenido = document.getElementById('contenido').value.trim();
    const submitBtn = document.getElementById('submitBtn');

    if (!contenido) {
        messageContainer.innerHTML = '<div class="alert-message error"><i class="fas fa-exclamation-circle"></i> El mensaje no puede estar vacío</div>';
        return false;
    }

    // Deshabilitar botón
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    const formData = new FormData();
    formData.append('contenido', contenido);

    fetch('/tickets/add_message/' + window.ticketId, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                messageContainer.innerHTML = '<div class="alert-message success"><i class="fas fa-check-circle"></i> Mensaje enviado correctamente</div>';
                document.getElementById('contenido').value = '';

                // Recargar solo la vista del ticket sin cambiar de página
                setTimeout(() => {
                    if (typeof loadContent === 'function') {
                        loadContent('view_ticket/' + window.ticketId, null);
                    } else {
                        window.location.reload();
                    }
                }, 1000);

                // Limpiar el mensaje de éxito después de 3 segundos
                setTimeout(() => {
                    if (messageContainer) {
                        messageContainer.innerHTML = '';
                    }
                }, 3000);
            } else {
                messageContainer.innerHTML = '<div class="alert-message error"><i class="fas fa-times-circle"></i> Error: ' + (data.error || 'No se pudo enviar el mensaje') + '</div>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            messageContainer.innerHTML = '<div class="alert-message error"><i class="fas fa-times-circle"></i> Error de conexión al enviar el mensaje</div>';
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar mensaje';
        });

    return false;
}

// Función global para actualizar ticket
window.updateTicket = function () {
    const messageContainer = document.getElementById('message-container');
    const estado = document.getElementById('estado').value;
    const prioridad = document.getElementById('prioridad_admin').value;
    const asignado = document.getElementById('asignado').value;

    // Validaciones básicas
    if (!estado || !prioridad) {
        messageContainer.innerHTML = '<div class="alert-message error"><i class="fas fa-exclamation-circle"></i> Estado y prioridad son obligatorios</div>';
        return;
    }

    // Deshabilitar botón temporalmente
    const updateBtn = document.querySelector('.btn-update');
    const originalText = updateBtn.innerHTML;
    updateBtn.disabled = true;
    updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';

    // Preparar datos
    const data = {
        estado: estado,
        prioridad: prioridad,
        asignado: asignado || null
    };

    console.log('Enviando datos de actualización:', data);

    fetch('/tickets/update/' + window.ticketId, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            console.log('Respuesta recibida:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos de respuesta:', data);
            if (data.success) {
                messageContainer.innerHTML = '<div class="alert-message success"><i class="fas fa-check-circle"></i> Ticket actualizado correctamente</div>';

                // Recargar la vista del ticket después de 1 segundo
                setTimeout(() => {
                    if (typeof loadContent === 'function') {
                        loadContent('view_ticket/' + window.ticketId, null);
                    } else {
                        window.location.reload();
                    }
                }, 1000);
            } else {
                messageContainer.innerHTML = '<div class="alert-message error"><i class="fas fa-times-circle"></i> Error: ' + (data.error || 'No se pudo actualizar') + '</div>';
            }
        })
        .catch(error => {
            console.error('Error completo:', error);
            messageContainer.innerHTML = '<div class="alert-message error"><i class="fas fa-times-circle"></i> Error de conexión: ' + error.message + '</div>';
        })
        .finally(() => {
            updateBtn.disabled = false;
            updateBtn.innerHTML = originalText;
        });
};

// Función global para eliminar ticket
window.deleteTicket = function () {
    if (confirm('¿Estás seguro de que quieres eliminar este ticket? Esta acción no se puede deshacer.')) {
        const messageContainer = document.getElementById('message-container');

        // Deshabilitar botón temporalmente
        const deleteBtn = document.querySelector('.btn-delete');
        const originalText = deleteBtn.innerHTML;
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';

        console.log('Eliminando ticket:', window.ticketId);

        fetch('/tickets/delete/' + window.ticketId, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => {
                console.log('Respuesta de eliminación:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Resultado de eliminación:', data);
                if (data.success) {
                    messageContainer.innerHTML = '<div class="alert-message success"><i class="fas fa-check-circle"></i> Ticket eliminado correctamente</div>';

                    // Redirigir al panel de tickets después de 1.5 segundos
                    setTimeout(() => {
                        if (typeof loadContent === 'function') {
                            loadContent('tickets', null);
                        } else {
                            window.location.href = '/tickets/panel';
                        }
                    }, 1500);
                } else {
                    messageContainer.innerHTML = '<div class="alert-message error"><i class="fas fa-times-circle"></i> Error: ' + (data.error || 'No se pudo eliminar') + '</div>';
                }
            })
            .catch(error => {
                console.error('Error de eliminación:', error);
                messageContainer.innerHTML = '<div class="alert-message error"><i class="fas fa-times-circle"></i> Error de conexión: ' + error.message + '</div>';
            })
            .finally(() => {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = originalText;
            });
    }
};

// Función global para recargar mensajes
window.reloadMessages = function () {
    fetch('/tickets/get_ticket_data/' + window.ticketId)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const messagesContainer = document.getElementById('messages-container');

                if (data.ticket.mensajes && data.ticket.mensajes.length > 0) {
                    let messagesHTML = '';
                    data.ticket.mensajes.forEach(mensaje => {
                        const messageClass = mensaje.es_admin ? 'admin-message' : 'user-message';
                        const iconClass = mensaje.es_admin ? 'fas fa-user-shield' : 'fas fa-user';
                        const soporteTag = mensaje.es_admin ? '<span style="color: var(--success); font-size: 0.8rem;">(Soporte)</span>' : '';

                        messagesHTML += `
                        <div class="message ${messageClass}">
                            <div class="message-header">
                                <div class="message-author">
                                    <i class="${iconClass}"></i>
                                    ${mensaje.autor}
                                    ${soporteTag}
                                </div>
                                <div class="message-date">
                                    ${mensaje.fecha}
                                </div>
                            </div>
                            <div class="message-content">${mensaje.contenido}</div>
                        </div>
                    `;
                    });
                    messagesContainer.innerHTML = messagesHTML;
                } else {
                    messagesContainer.innerHTML = `
                    <div class="no-messages">
                        <i class="fas fa-comment-slash"></i><br>
                        No hay mensajes en este ticket aún.
                    </div>
                `;
                }

                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        })
        .catch(error => {
            console.error('Error al recargar mensajes:', error);
        });
};

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, ticketId:', window.ticketId);
    console.log('updateTicket function:', typeof window.updateTicket);
    console.log('deleteTicket function:', typeof window.deleteTicket);

    // Ya no necesitamos el event listener aquí porque usamos onclick="enviarMensaje()"
});
