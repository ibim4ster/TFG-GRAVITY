        document.getElementById('toggle-password').addEventListener('click', function () {
            togglePasswordVisibility('password', this);
        });

        document.getElementById('toggle-confirm-password').addEventListener('click', function () {
            togglePasswordVisibility('confirm_password', this);
        });

        function togglePasswordVisibility(inputId, icon) {
            const passwordInput = document.getElementById(inputId);
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }
