    function activarLicencia(tipo) {
      fetch('/licenses/activate_paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tipo: tipo })
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
          console.error("Error:", error);
          alert("Hubo un problema al procesar tu compra. Por favor, inténtalo de nuevo.");
        });
    }

    // Render PayPal buttons when page is fully loaded
    document.addEventListener('DOMContentLoaded', function () {
      // Botón para Licencia Mensual (gris)
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
            activarLicencia('Mensual');
          });
        }
      }).render('#paypal-button-container-mensual');

      // Botón para Licencia Anual (azul)
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
            activarLicencia('Anual');
          });
        }
      }).render('#paypal-button-container-anual');

      // Botón para Licencia Permanente (amarillo)
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
            activarLicencia('Permanente');
          });
        }
      }).render('#paypal-button-container-permanente');

      // Event listener for redeem button
      const redeemButton = document.getElementById('redeem-button');
      if (redeemButton) {
        redeemButton.addEventListener('click', function () {
          console.log("Botón de redención clickeado");

          const licenseCode = document.getElementById('license-code').value.trim();
          const messageBox = document.getElementById('redeem-message');

          if (!licenseCode) {
            messageBox.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-circle"></i> Por favor, introduce un código de licencia válido.</div>';
            return;
          }

          console.log("Enviando código:", licenseCode);

          // Mostrar mensaje de carga
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
                // Redirigir a la página de éxito después de 2 segundos
                setTimeout(() => {
                  window.location.href = "/licenses/redeem_success";
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
        console.error("El botón de redención no se encontró en el DOM");
      }
    });
