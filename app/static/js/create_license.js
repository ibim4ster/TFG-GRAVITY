
        // Set today's date as default for fecha_inicio
        document.addEventListener('DOMContentLoaded', function() {
            const today = new Date();
            const todayFormatted = today.toISOString().split('T')[0];
            document.getElementById('fecha_inicio').value = todayFormatted;
            
            // Calculate default end date (30 days from now) for monthly licenses
            const nextMonth = new Date();
            nextMonth.setDate(nextMonth.getDate() + 30);
            const nextMonthFormatted = nextMonth.toISOString().split('T')[0];
            
            // Set the default end date
            const fechaFin = document.getElementById('fecha_fin');
            fechaFin.value = nextMonthFormatted;
        });

        // Toggle fecha_fin field based on license type
        document.getElementById('tipo').addEventListener('change', function() {
            const fechaFinField = document.getElementById('fecha_fin');
            if (this.value === 'Permanente') {
                fechaFinField.value = '';
                fechaFinField.disabled = true;
            } else {
                fechaFinField.disabled = false;
                
                // Set appropriate end date based on license type
                if (!fechaFinField.value) {
                    const today = new Date();
                    if (this.value === 'Mensual') {
                        today.setMonth(today.getMonth() + 1);
                    } else if (this.value === 'Anual') {
                        today.setFullYear(today.getFullYear() + 1);
                    }
                    fechaFinField.value = today.toISOString().split('T')[0];
                }
                
                // Force reflow to fix mobile rendering issues
                fechaFinField.style.display = 'none';
                setTimeout(() => {
                    fechaFinField.style.display = 'block';
                }, 10);
            }
        });
        
        // Form submission handler
        document.getElementById('createLicenseForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const form = this;
            const formData = new FormData(form);
            
            fetch(form.action, {
                method: 'POST',
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                let msg = document.getElementById('msg');
                if (data.success) {
                    msg.innerHTML = "<div class='success-msg'>¡Licencia creada correctamente!</div>";
                    setTimeout(() => {
                        loadContent('licensespanel');
                    }, 1500);
                } else {
                    msg.innerHTML = "<div class='error-msg'>Error: " + (data.error || "No se pudo crear la licencia") + "</div>";
                }
            })
            .catch(() => {
                let msg = document.getElementById('msg');
                msg.innerHTML = "<div class='error-msg'>Error al conectar con el servidor.</div>";
            });
        });
