    document.addEventListener("DOMContentLoaded", function () {
      // Set initial loading state
      const contentArea = document.getElementById("content");
      contentArea.classList.add("loading");

      // Mobile menu toggle setup
      document.getElementById("mobileMenuToggle").addEventListener("click", toggleMobileMenu);

      // Close sidebar when clicking outside on mobile
      document.addEventListener("click", function (event) {
        const sidebar = document.getElementById("sidebar");
        const mobileToggle = document.getElementById("mobileMenuToggle");

        if (window.innerWidth <= 768 &&
          sidebar.classList.contains("mobile-active") &&
          !sidebar.contains(event.target) &&
          event.target !== mobileToggle) {
          sidebar.classList.remove("mobile-active");
        }
      });

      // Handle window resize
      window.addEventListener("resize", function () {
        const sidebar = document.getElementById("sidebar");
        if (window.innerWidth > 768) {
          sidebar.classList.remove("mobile-active");
        }
      });

      // Verificar si hay un hash en la URL para cargar automáticamente
      const hash = window.location.hash.substring(1); // Quitar el #
      if (hash === 'tickets') {
        loadContent('tickets', document.querySelector('.sidebar a[onclick*="tickets"]'));
      } else {
        // Load default content
        loadContent("dashboard", document.querySelector(".sidebar a"));
      }
    });

    function toggleMobileMenu() {
      const sidebar = document.getElementById("sidebar");
      sidebar.classList.toggle("mobile-active");
    }

    function toggleSidebar() {
      const sidebar = document.getElementById("sidebar");
      const content = document.getElementById("content");

      if (window.innerWidth <= 768) {
        // On mobile, toggle the mobile menu
        toggleMobileMenu();
      } else {
        // On desktop, collapse/expand sidebar
        sidebar.classList.toggle("collapsed");
        content.classList.toggle("collapsed");
      }
    }

    function loadContent(section, element = null) {
      let contentArea = document.getElementById("content");

      // Add loading state immediately
      contentArea.classList.add("loading");

      // Verificar si la sección ya está activa
      if (element && element.classList.contains("active")) {
        contentArea.classList.remove("loading"); // Remove loading if no change
        return; // Si ya está activa, no hacer nada
      }

      // Remover clase activa de todas las opciones
      document.querySelectorAll(".sidebar a").forEach((link) => {
        link.classList.remove("active");
      });

      if (element) {
        // Agregar clase activa solo a la opción seleccionada
        element.classList.add("active");
      }

      // Agregar clase de animación de salida
      contentArea.classList.add("slide-out-up-animation");

      fetch(`/get_content/${section}`)
        .then((response) => {
          if (!response.ok) throw new Error("Error al cargar contenido");
          return response.text();
        })
        .then((data) => {
          setTimeout(() => {
            contentArea.classList.remove("slide-out-up-animation");
            contentArea.innerHTML = data;

            // Make tables responsive by wrapping them
            const tables = contentArea.querySelectorAll('table');
            tables.forEach(table => {
              if (!table.closest('.table-responsive')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-responsive';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
              }
            });

            // Animación de entrada
            contentArea.classList.add("slide-in-down-animation");

            // Inicializar funciones específicas según la sección cargada
            if (section === "adminpanel") {
              initSearch();
            }

            if (section === "licensespanel") {
              initLicenseSearch();
            }

            // --- ACTIVAR EVENTOS DE EDITAR USUARIO ---
            if (section.startsWith("edit_user/")) {
              activarEventosEditUser();
            }

            // Renderizar botones PayPal si es la sección de compra
            if (section === "comprar") {
              renderPayPalButtons();
              setupRedeemCode();
            }

            // --- INICIALIZAR EVENTOS DE TICKETS ---
            if (section === "tickets") {
              initTicketsEvents();
            }

            if (section === "create_ticket") {
              initCreateTicketEvents();
            }

            // MODIFICACIÓN IMPORTANTE: Solo inicializar dashboard events si no hay funciones globales
            if (section.startsWith("view_ticket/")) {
              // Esperar un poco para que view_ticket.html se cargue completamente
              setTimeout(() => {
                if (!window.updateTicket || !window.deleteTicket) {
                  initViewTicketEvents();
                }
              }, 200);
            }

            // Keep content hidden until styles are applied
            setTimeout(() => {
              contentArea.classList.remove("loading");
              contentArea.classList.remove("slide-in-down-animation");
            }, 300); // Delay to ensure CSS is applied

          }, 200);
        })
        .catch((error) => {
          console.error("Error al cargar contenido:", error);
          contentArea.classList.remove("loading");
          contentArea.classList.remove("slide-out-up-animation");
          contentArea.innerHTML = "<p>Error al cargar el contenido.</p>";
        });
    }

    // === FUNCIONES PARA TICKETS ===
    function initTicketsEvents() {
      // Búsqueda de tickets
      const searchInput = document.getElementById('searchTickets');
      if (searchInput) {
        searchInput.addEventListener('input', function () {
          const filter = this.value.toLowerCase();
          const rows = document.querySelectorAll('.tickets-table tbody tr');

          rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(filter) ? '' : 'none';
          });
        });
      }
    }

    function initCreateTicketEvents() {
      // Contador de caracteres para el título
      const tituloInput = document.getElementById('titulo');
      if (tituloInput) {
        tituloInput.addEventListener('input', function () {
          const current = this.value.length;
          const max = 200;
          const counter = document.getElementById('titulo-counter');
          if (counter) {
            counter.textContent = `${current}/${max} caracteres`;

            if (current > max * 0.9) {
              counter.className = 'char-counter danger';
            } else if (current > max * 0.7) {
              counter.className = 'char-counter warning';
            } else {
              counter.className = 'char-counter';
            }
          }
        });

        // Inicializar contador
        const event = new Event('input');
        tituloInput.dispatchEvent(event);
      }

      // MANEJO DEL FORMULARIO DE CREAR TICKET
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
            if (messageContainer) {
              messageContainer.innerHTML = `
                <div class="message error">
                  <i class="fas fa-exclamation-circle"></i>
                  Título y descripción son obligatorios
                </div>
              `;
            }
            return false;
          }

          // Deshabilitar botón
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';

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
                if (messageContainer) {
                  messageContainer.innerHTML = `
                  <div class="message success">
                    <i class="fas fa-check-circle"></i>
                    ${data.message || 'Ticket creado exitosamente'}
                  </div>
                `;
                }

                // Limpiar formulario
                this.reset();
                const counter = document.getElementById('titulo-counter');
                if (counter) {
                  counter.textContent = '0/200 caracteres';
                  counter.className = 'char-counter';
                }

                // Redirigir a tickets después de 1.5 segundos
                setTimeout(() => {
                  loadContent('tickets', null);
                }, 1500);
              } else {
                if (messageContainer) {
                  messageContainer.innerHTML = `
                  <div class="message error">
                    <i class="fas fa-exclamation-circle"></i>
                    ${data.error || 'Error al crear el ticket'}
                  </div>
                `;
                }
              }
            })
            .catch(error => {
              console.error('Error:', error);
              if (messageContainer) {
                messageContainer.innerHTML = `
                <div class="message error">
                  <i class="fas fa-exclamation-circle"></i>
                  Error al conectar con el servidor. Por favor, inténtalo de nuevo.
                </div>
              `;
              }
            })
            .finally(() => {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalText;
            });

          return false;
        });
      }
    }

    function initViewTicketEvents() {
      // Solo manejar eventos si no están ya definidos en view_ticket.html
      const messageForm = document.getElementById('messageForm');

      // Si ya existe el ticketId global y las funciones están definidas, no hacer nada más
      if (window.ticketId && window.updateTicket && window.deleteTicket) {
        return;
      }

      // Solo procesar formulario de mensajes si no está ya manejado
      if (messageForm && !messageForm.hasAttribute('data-dashboard-handled')) {
        messageForm.setAttribute('data-dashboard-handled', 'true');

        messageForm.addEventListener('submit', function (e) {
          e.preventDefault();
          e.stopPropagation();

          const submitBtn = this.querySelector('.btn-submit');
          const originalText = submitBtn.innerHTML;
          const messageContainer = document.getElementById('message-container');
          const contenido = document.getElementById('contenido').value.trim();

          if (!contenido) {
            if (messageContainer) {
              messageContainer.innerHTML = `
            <div class="alert-message error">
              <i class="fas fa-exclamation-circle"></i>
              El mensaje no puede estar vacío
            </div>
          `;
            }
            return false;
          }

          // Deshabilitar botón y mostrar estado de carga
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

          // Obtener el ID del ticket
          let ticketId = null;

          if (window.ticketId) {
            ticketId = window.ticketId;
          } else {
            const ticketHeader = document.querySelector('.ticket-header h2');
            if (ticketHeader) {
              const match = ticketHeader.textContent.match(/Ticket #(\d+)/);
              if (match) {
                ticketId = match[1];
              }
            }
          }

          if (!ticketId) {
            if (messageContainer) {
              messageContainer.innerHTML = `
            <div class="alert-message error">
              <i class="fas fa-exclamation-circle"></i>
              Error: No se pudo identificar el ticket
            </div>
          `;
            }
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return false;
          }

          const formData = new FormData();
          formData.append('contenido', contenido);

          fetch('/tickets/add_message/' + ticketId, {
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
                document.getElementById('contenido').value = '';

                if (messageContainer) {
                  messageContainer.innerHTML = `
              <div class="alert-message success">
                <i class="fas fa-check-circle"></i>
                Mensaje enviado correctamente
              </div>
            `;
                }

                // Recargar la vista del ticket
                setTimeout(() => {
                  loadContent('view_ticket/' + ticketId, null);
                }, 1000);

                setTimeout(() => {
                  if (messageContainer) {
                    messageContainer.innerHTML = '';
                  }
                }, 3000);
              } else {
                if (messageContainer) {
                  messageContainer.innerHTML = `
              <div class="alert-message error">
                <i class="fas fa-times-circle"></i>
                Error: ${data.error || 'No se pudo enviar el mensaje'}
              </div>
            `;
                }
              }
            })
            .catch(error => {
              console.error('Error:', error);
              if (messageContainer) {
                messageContainer.innerHTML = `
            <div class="alert-message error">
              <i class="fas fa-times-circle"></i>
              Error de conexión al enviar el mensaje
            </div>
          `;
              }
            })
            .finally(() => {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalText;
            });

          return false;
        });
      }
    }

    // Función para mostrar mensajes en tickets
    function showTicketMessage(message, type) {
      const messageContainer = document.getElementById('message-container');
      if (messageContainer) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-message ${type}`;
        alertDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;

        messageContainer.innerHTML = '';
        messageContainer.appendChild(alertDiv);

        // Scroll to top para ver el mensaje
        window.scrollTo(0, 0);

        // Remover mensaje después de 5 segundos
        setTimeout(() => {
          alertDiv.remove();
        }, 5000);
      }
    }

    // Función para eliminar ticket desde el panel (solo admin)
    function deleteTicketFromPanel(ticketId) {
      if (confirm('¿Estás seguro de que deseas eliminar este ticket? Esta acción no se puede deshacer.')) {
        fetch(`/tickets/delete/${ticketId}`, {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              // Recargar la página de tickets
              loadContent('tickets', null);
            } else {
              alert('Error al eliminar el ticket: ' + (data.error || 'Error desconocido'));
            }
          })
          .catch(error => {
            console.error('Error:', error);
            alert('Error de conexión al eliminar el ticket');
          });
      }
    }

    // === RESTO DE FUNCIONES EXISTENTES ===

    // Función para renderizar los botones de PayPal
    function renderPayPalButtons() {
      if (document.getElementById('paypal-button-container-mensual')) {
        paypal.Buttons({
          style: { layout: 'vertical', color: 'silver', shape: 'pill', label: 'paypal' },
          createOrder: function (data, actions) {
            return actions.order.create({
              purchase_units: [{
                amount: { value: '9.99' },
                description: 'Licencia Mensual'
              }]
            });
          },
          onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
              const transactionId = details.purchase_units[0].payments.captures[0].id;
              const orderId = data.orderID;
              const amount = details.purchase_units[0].amount.value;
              activarLicencia('Mensual', orderId, transactionId, amount);
            });
          }
        }).render('#paypal-button-container-mensual');
      }

      if (document.getElementById('paypal-button-container-anual')) {
        paypal.Buttons({
          style: { layout: 'vertical', color: 'blue', shape: 'pill', label: 'paypal' },
          createOrder: function (data, actions) {
            return actions.order.create({
              purchase_units: [{
                amount: { value: '99.99' },
                description: 'Licencia Anual'
              }]
            });
          },
          onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
              const transactionId = details.purchase_units[0].payments.captures[0].id;
              const orderId = data.orderID;
              const amount = details.purchase_units[0].amount.value;
              activarLicencia('Anual', orderId, transactionId, amount);
            });
          }
        }).render('#paypal-button-container-anual');
      }

      if (document.getElementById('paypal-button-container-permanente')) {
        paypal.Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'paypal' },
          createOrder: function (data, actions) {
            return actions.order.create({
              purchase_units: [{
                amount: { value: '299.99' },
                description: 'Licencia Permanente'
              }]
            });
          },
          onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
              const transactionId = details.purchase_units[0].payments.captures[0].id;
              const orderId = data.orderID;
              const amount = details.purchase_units[0].amount.value;
              activarLicencia('Permanente', orderId, transactionId, amount);
            });
          }
        }).render('#paypal-button-container-permanente');
      }
    }

    function activarLicencia(tipo, order_id, transaction_id, amount) {
      console.log("Activando licencia:", tipo, "Order ID:", order_id, "Transaction ID:", transaction_id, "Amount:", amount);

      fetch('/licenses/activate_paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipo,
          order_id: order_id,
          transaction_id: transaction_id,
          amount: amount
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            window.location.href = "/licenses/compra_exitosa";
          } else {
            alert("Error al activar la licencia: " + (data.error || "Desconocido"));
          }
        })
        .catch(error => {
          console.error("Error en la activación de licencia:", error);
          alert("Error al procesar el pago. Por favor, inténtalo de nuevo.");
        });
    }

    function setupRedeemCode() {
      const redeemButton = document.getElementById('redeem-button');
      if (redeemButton) {
        console.log("Inicializando botón de redención");
        redeemButton.addEventListener('click', function () {
          console.log("Botón de redención clickeado");

          const licenseCode = document.getElementById('license-code').value.trim();
          const messageBox = document.getElementById('redeem-message');

          if (!licenseCode) {
            messageBox.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-circle"></i> Por favor, introduce un código de licencia válido.</div>';
            return;
          }

          console.log("Enviando código:", licenseCode);

          messageBox.innerHTML = '<div class="info-message"><i class="fas fa-spinner fa-spin"></i> Verificando código...</div>';

          fetch('/licenses/redeem_code', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ codigo: licenseCode })
          })
            .then(res => {
              console.log("Respuesta HTTP:", res.status);
              return res.json();
            })
            .then(data => {
              console.log("Datos recibidos:", data);

              if (data.success) {
                messageBox.innerHTML = '<div class="success-message"><i class="fas fa-check-circle"></i> ' + data.message + '</div>';
                setTimeout(() => {
                  window.location.href = "/licenses/compra_exitosa";
                }, 2000);
              } else {
                messageBox.innerHTML = '<div class="error-message"><i class="fas fa-times-circle"></i> ' + (data.error || "Error desconocido") + '</div>';
              }
            })
            .catch(error => {
              console.error("Error en la solicitud:", error);
              messageBox.innerHTML = '<div class="error-message"><i class="fas fa-times-circle"></i> Hubo un problema al procesar tu código. Por favor, inténtalo de nuevo.</div>';
            });
        });
      } else {
        console.log("Botón de redención no encontrado");
      }
    }

    // Funciones para el modal de cierre de sesión
    function openLogoutModal() {
      document.getElementById("logoutModal").style.display = "block";
    }

    function closeLogoutModal() {
      document.getElementById("logoutModal").style.display = "none";
    }

    function confirmLogout() {
      window.location.href = "/logout";
    }

    function initSearch() {
      const searchInput = document.getElementById("searchInput");
      const table = document.getElementById("userTable");

      if (searchInput && table) {
        searchInput.addEventListener("input", function () {
          const filter = searchInput.value.toLowerCase();
          const rows = table.getElementsByTagName("tr");

          for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName("td");
            let found = false;

            for (let j = 0; j < cells.length; j++) {
              if (cells[j].textContent.toLowerCase().indexOf(filter) > -1) {
                found = true;
                break;
              }
            }

            rows[i].style.display = found ? "" : "none";
          }
        });
      }
    }

    // Manejar la eliminación de usuario
    document.addEventListener("click", function (event) {
      if (event.target.matches("#deleteUser")) {
        const userId = event.target.dataset.userId;
        if (!userId) {
          console.error("El atributo data-user-id no está definido.");
          return;
        }

        if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
          fetch(`/admin/delete_user/${userId}`, {
            method: "DELETE",
          })
            .then((response) => {
              if (!response.ok)
                throw new Error("Error al eliminar el usuario.");
              return response.json();
            })
            .then((data) => {
              if (data.success) {
                loadContent(
                  "adminpanel",
                  document.querySelector('.sidebar a[onclick*="adminpanel"]')
                );
              } else {
                alert("Error al eliminar el usuario: " + data.error);
              }
            })
            .catch((error) => {
              console.error("Error:", error);
              alert("Hubo un problema al intentar eliminar el usuario.");
            });
        }
      }
    });

    // Maneja el envío del formulario de edición de usuario
    document.addEventListener("submit", function (event) {
      if (event.target.matches("#editUserForm")) {
        event.preventDefault();

        const userId = event.target.dataset.userId;
        const formData = new FormData(event.target);

        fetch(`/admin/update_user/${userId}`, {
          method: "POST",
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              loadContent(
                "adminpanel",
                document.querySelector('.sidebar a[onclick*="adminpanel"]')
              );
            } else {
              alert(
                "Error al actualizar el usuario: " +
                (data.error || "Error desconocido")
              );
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            alert("Hubo un problema al intentar guardar los cambios.");
          });
      }
    });

    function activarEventosEditUser() {
      const assignBtn = document.getElementById('assignLicenseBtn');
      if (assignBtn) {
        assignBtn.addEventListener('click', function () {
          const userId = document.getElementById('editUserForm').dataset.userId;
          const tipo = document.getElementById('license_type').value;
          const fechaFin = document.getElementById('license_end').value;

          if (!tipo) {
            alert('Selecciona un tipo de licencia.');
            return;
          }
          if (tipo !== 'Permanente' && !fechaFin) {
            alert('Debes indicar la fecha de fin para licencias no permanentes.');
            return;
          }

          fetch(`/licenses/assign/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: tipo, fecha_fin: fechaFin })
          })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                loadContent('edit_user/' + userId);
              } else {
                alert('Error: ' + (data.error || 'No se pudo asignar la licencia.'));
              }
            })
            .catch(error => {
              alert('Error al asignar licencia.');
            });
        });

        document.getElementById('license_type').addEventListener('change', function () {
          const dateField = document.getElementById('license_end');

          if (this.value === 'Permanente') {
            dateField.value = '';
            dateField.parentElement.style.display = 'none';
          } else {
            dateField.parentElement.style.display = 'block';

            const today = new Date();
            let endDate = new Date(today);

            if (this.value === 'Mensual') {
              endDate.setMonth(endDate.getMonth() + 1);
            } else if (this.value === 'Anual') {
              endDate.setFullYear(endDate.getFullYear() + 1);
            }

            const year = endDate.getFullYear();
            const month = String(endDate.getMonth() + 1).padStart(2, '0');
            const day = String(endDate.getDate()).padStart(2, '0');
            dateField.value = `${year}-${month}-${day}`;
          }
        });
      }

      const revokeBtn = document.getElementById('revokeLicenseBtn');
      if (revokeBtn) {
        revokeBtn.addEventListener('click', function () {
          const userId = document.getElementById('editUserForm').dataset.userId;
          if (confirm("¿Seguro que quieres quitar la licencia activa?")) {
            fetch(`/licenses/revoke/${userId}`, {
              method: 'POST'
            })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  loadContent('edit_user/' + userId);
                } else {
                  alert('Error: ' + (data.error || 'No se pudo revocar la licencia.'));
                }
              })
              .catch(error => {
                alert('Error al revocar licencia.');
              });
          }
        });
      }
    }

    // Manejar el envío del formulario de edición de licencia
    document.addEventListener("submit", function (event) {
      if (event.target.matches("#editLicenseForm")) {
        event.preventDefault();
        const licenseId = event.target.dataset.licenseId;
        const formData = new FormData(event.target);

        fetch(`/licenses/update/${licenseId}`, {
          method: "POST",
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: formData
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              loadContent(
                "licensespanel",
                document.querySelector('.sidebar a[onclick*="licensespanel"]')
              );
            } else {
              alert(
                "Error al actualizar la licencia: " +
                (data.error || "Error desconocido")
              );
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            alert("Hubo un problema al intentar guardar los cambios: " + error.message);
          });
      }
    });

    // Manejar la eliminación de licencia
    document.addEventListener("click", function (event) {
      if (event.target.matches("#deleteLicenseBtn")) {
        const licenseId = event.target.dataset.licenseId;
        if (!licenseId) {
          console.error("El atributo data-license-id no está definido.");
          return;
        }

        if (confirm("¿Estás seguro de que deseas eliminar esta licencia?")) {
          fetch(`/licenses/delete/${licenseId}`, {
            method: "POST",
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.success) {
                loadContent(
                  "licensespanel",
                  document.querySelector('.sidebar a[onclick*="licensespanel"]')
                );
              } else {
                alert("Error al eliminar la licencia: " + data.error);
              }
            })
            .catch((error) => {
              console.error("Error:", error);
              alert("Hubo un problema al intentar eliminar la licencia.");
            });
        }
      }
    });

    // Reemplaza la función completa:

    document.addEventListener("click", function (event) {
      if (event.target.matches(".btn-delete") || event.target.closest(".btn-delete")) {
        const btn = event.target.closest(".btn-delete");
        const licenseId = btn.dataset.licenseId;
        if (!licenseId) {
          console.error("El atributo data-license-id no está definido.");
          return;
        }
        if (confirm("¿Estás seguro de que deseas eliminar esta licencia?")) {
          fetch(`/licenses/delete/${licenseId}`, {
            method: "POST",
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.success) {
                loadContent(
                  "licensespanel",
                  document.querySelector('.sidebar a[href*="licensespanel"]')
                );
              } else {
                alert("Error al eliminar la licencia: " + data.error);
              }
            })
            .catch((error) => {
              console.error("Error:", error);
              alert("Hubo un problema al intentar eliminar la licencia.");
            });
        }
      }
    });

    // Crear licencia 
    document.addEventListener("submit", function (event) {
      if (event.target.matches("#createLicenseForm")) {
        event.preventDefault();
        const formData = new FormData(event.target);

        fetch("/licenses/create", {
          method: "POST",
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              loadContent(
                "licensespanel",
                document.querySelector('.sidebar a[onclick*="licensespanel"]')
              );
            } else {
              alert(
                "Error al crear la licencia: " +
                (data.error || "Error desconocido")
              );
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            alert("Hubo un problema al intentar crear la licencia.");
          });
      }
    });

    function initLicenseSearch() {
      const searchInput = document.getElementById("searchLicenses");
      const table = document.querySelector(".license-table");
      if (!searchInput || !table) return;

      searchInput.addEventListener("input", function () {
        const filter = searchInput.value.toLowerCase();
        const rows = table.getElementsByTagName("tr");

        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].getElementsByTagName("td");
          let found = false;

          for (let j = 0; j < cells.length; j++) {
            if (cells[j].textContent.toLowerCase().indexOf(filter) > -1) {
              found = true;
              break;
            }
          }

          rows[i].style.display = found ? "" : "none";
        }
      });
    }
    // === FUNCIONES GLOBALES PARA TICKETS (FALLBACK) ===

    // Función global para enviar mensajes (fallback)
    if (typeof window.enviarMensaje === 'undefined') {
      window.enviarMensaje = function () {
        const messageContainer = document.getElementById('message-container');
        const contenido = document.getElementById('contenido').value.trim();
        const submitBtn = document.getElementById('submitBtn');

        if (!contenido) {
          messageContainer.innerHTML = '<div class="alert-message error"><i class="fas fa-exclamation-circle"></i> El mensaje no puede estar vacío</div>';
          return false;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        let ticketId = window.ticketId;
        if (!ticketId) {
          const ticketHeader = document.querySelector('.ticket-header h2');
          if (ticketHeader) {
            const match = ticketHeader.textContent.match(/Ticket #(\d+)/);
            if (match) {
              ticketId = match[1];
            }
          }
        }

        if (!ticketId) {
          messageContainer.innerHTML = '<div class="alert-message error"><i class="fas fa-exclamation-circle"></i> Error: No se pudo identificar el ticket</div>';
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar mensaje';
          return false;
        }

        const formData = new FormData();
        formData.append('contenido', contenido);

        fetch('/tickets/add_message/' + ticketId, {
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

              setTimeout(() => {
                if (typeof loadContent === 'function') {
                  loadContent('view_ticket/' + ticketId, null);
                } else {
                  window.location.reload();
                }
              }, 1000);

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
      };
    }

    // Función global para actualizar ticket (fallback)
    if (typeof window.updateTicket === 'undefined') {
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

        let ticketId = window.ticketId;
        if (!ticketId) {
          const ticketHeader = document.querySelector('.ticket-header h2');
          if (ticketHeader) {
            const match = ticketHeader.textContent.match(/Ticket #(\d+)/);
            if (match) {
              ticketId = match[1];
            }
          }
        }

        if (!ticketId) {
          messageContainer.innerHTML = '<div class="alert-message error"><i class="fas fa-exclamation-circle"></i> Error: No se pudo identificar el ticket</div>';
          updateBtn.disabled = false;
          updateBtn.innerHTML = originalText;
          return;
        }

        console.log('Enviando datos de actualización:', data);

        fetch('/tickets/update/' + ticketId, {
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
                  loadContent('view_ticket/' + ticketId, null);
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
    }

    // Función global para eliminar ticket (fallback)
    if (typeof window.deleteTicket === 'undefined') {
      window.deleteTicket = function () {
        if (confirm('¿Estás seguro de que quieres eliminar este ticket? Esta acción no se puede deshacer.')) {
          const messageContainer = document.getElementById('message-container');

          // Deshabilitar botón temporalmente
          const deleteBtn = document.querySelector('.btn-delete');
          const originalText = deleteBtn.innerHTML;
          deleteBtn.disabled = true;
          deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';

          let ticketId = window.ticketId;
          if (!ticketId) {
            const ticketHeader = document.querySelector('.ticket-header h2');
            if (ticketHeader) {
              const match = ticketHeader.textContent.match(/Ticket #(\d+)/);
              if (match) {
                ticketId = match[1];
              }
            }
          }

          if (!ticketId) {
            messageContainer.innerHTML = '<div class="alert-message error"><i class="fas fa-exclamation-circle"></i> Error: No se pudo identificar el ticket</div>';
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = originalText;
            return;
          }

          console.log('Eliminando ticket:', ticketId);

          fetch('/tickets/delete/' + ticketId, {
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
    }
    // === FIN DE FUNCIONES GLOBALES PARA TICKETS ===  
