        // Esperar a que el DOM esté completamente cargado
        document.addEventListener('DOMContentLoaded', function () {
            // Contador de caracteres para el título
            document.getElementById('titulo').addEventListener('input', function () {
                const current = this.value.length;
                const max = 200;
                const counter = document.getElementById('titulo-counter');
                counter.textContent = `${current}/${max} caracteres`;

                if (current > max * 0.9) {
                    counter.className = 'char-counter danger';
                } else if (current > max * 0.7) {
                    counter.className = 'char-counter warning';
                } else {
                    counter.className = 'char-counter';
                }
            });

            // MANEJO DEL FORMULARIO CORREGIDO
            const form = document.getElementById('createTicketForm');
            if (form) {
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    const formData = new FormData(this);
                    const submitBtn = this.querySelector('.btn-submit');
                    const originalText = submitBtn.innerHTML;
                    const messageContainer = document.getElementById('message-container');

                    // Validar campos requeridos
                    const titulo = document.getElementById('titulo').value.trim();
                    const descripcion = document.getElementById('descripcion').value.trim();

                    if (!titulo || !descripcion) {
                        messageContainer.innerHTML = `
                        <div class="message error">
                            <i class="fas fa-exclamation-circle"></i>
                            Título y descripción son obligatorios
                        </div>
                    `;
                        return false;
                    }

                    // Deshabilitar botón
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';

                    // Usar la ruta de main para mantener consistencia con el dashboard
                    fetch('/tickets/create', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: new URLSearchParams(formData)
                    })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Error en la respuesta del servidor');
                            }
                            return response.json();
                        })
                        .then(data => {
                            if (data.success) {
                                messageContainer.innerHTML = `
                            <div class="message success">
                                <i class="fas fa-check-circle"></i>
                                ${data.message || 'Ticket creado exitosamente'}
                            </div>
                        `;

                                // Limpiar formulario
                                this.reset();
                                document.getElementById('titulo-counter').textContent = '0/200 caracteres';
                                document.getElementById('titulo-counter').className = 'char-counter';

                                // Redirigir a tickets después de 1.5 segundos
                                setTimeout(() => {
                                    // Verificar si existe la función loadContent (dashboard dinámico)
                                    if (typeof loadContent === 'function') {
                                        loadContent('tickets', null);
                                    } else {
                                        // Fallback para navegación directa
                                        window.location.href = '/tickets/panel';
                                    }
                                }, 1500);
                            } else {
                                messageContainer.innerHTML = `
                            <div class="message error">
                                <i class="fas fa-exclamation-circle"></i>
                                ${data.error || 'Error al crear el ticket'}
                            </div>
                        `;
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            messageContainer.innerHTML = `
                        <div class="message error">
                            <i class="fas fa-exclamation-circle"></i>
                            Error al conectar con el servidor. Por favor, inténtalo de nuevo.
                        </div>
                    `;
                        })
                        .finally(() => {
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = originalText;
                        });

                    return false;
                });
            }

            // Inicializar contador
            const tituloInput = document.getElementById('titulo');
            if (tituloInput) {
                const event = new Event('input');
                tituloInput.dispatchEvent(event);
            }
        });
