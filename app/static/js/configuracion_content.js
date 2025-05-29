        // Manejar el envío del formulario con validaciones
        document.getElementById("change-password-form").addEventListener("submit", function (event) {
            var newPassword = document.getElementById("new_password").value;
            var confirmPassword = document.getElementById("confirm_password").value;

            // Limpiar mensajes de error anteriores
            document.getElementById("new_password_error").innerText = '';
            document.getElementById("confirm_password_error").innerText = '';

            // Validar que ambos campos no están vacíos
            if (!newPassword || !confirmPassword) {
                event.preventDefault();
                document.getElementById("new_password_error").innerText = 'Ambos campos de contraseña son obligatorios.';
                return;
            }

            // Validar que las contraseñas coinciden
            if (newPassword !== confirmPassword) {
                event.preventDefault();
                document.getElementById("confirm_password_error").innerText = 'Las contraseñas no coinciden.';
                return;
            }
        });
