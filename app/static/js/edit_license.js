        // Toggle fecha_fin field based on license type
        document.getElementById('tipo').addEventListener('change', function () {
            const fechaFinField = document.getElementById('fecha_fin');
            if (this.value === 'Permanente') {
                fechaFinField.value = '';
                fechaFinField.disabled = true;
            } else {
                fechaFinField.disabled = false;
                // Force reflow to fix mobile rendering issues
                fechaFinField.style.display = 'none';
                setTimeout(() => {
                    fechaFinField.style.display = 'block';
                }, 10);
            }
        });

        // Initialize date inputs
        document.addEventListener('DOMContentLoaded', function () {
            const dateInputs = document.querySelectorAll('.date-input');

            // Set default date format to YYYY-MM-DD for all browsers
            dateInputs.forEach(input => {
                if (!input.value && !input.disabled) {
                    const today = new Date();
                    if (input.id === 'fecha_fin' && document.getElementById('tipo').value !== 'Permanente') {
                        today.setDate(today.getDate() + 30); // Default end date is 30 days later
                    }
                    const formattedDate = today.toISOString().split('T')[0];
                    input.value = formattedDate;
                }
            });
        });

        // Guardar cambios por AJAX y mostrar mensaje
        // Reemplazar el evento de submit del formulario
        document.getElementById('editLicenseForm').addEventListener('submit', function (e) {
            e.preventDefault();
            const form = this;
            const formData = new FormData(form);

            fetch(form.action, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'  // Añadir este encabezado
                },
                body: formData
            })
                .then(r => r.json())
                .then(data => {
                    let msg = document.getElementById('msg');
                    if (data.success) {
                        msg.innerHTML = "<div class='success-msg'>¡Licencia actualizada correctamente!</div>";
                        // Opcional: recargar la página después de un breve retraso
                        setTimeout(() => {
                            loadContent('licensespanel', document.querySelector('.sidebar a[href*="licensespanel"]'));
                        }, 1500);
                    } else {
                        msg.innerHTML = "<div class='error-msg'>Error: " + (data.error || "No se pudo actualizar") + "</div>";
                    }
                })
                .catch((error) => {
                    console.error("Error:", error);
                    let msg = document.getElementById('msg');
                    msg.innerHTML = "<div class='error-msg'>Error al conectar con el servidor.</div>";
                });
        });

        // Asignar licencia en stock a usuario por AJAX
        const assignForm = document.getElementById('assignLicenseForm');
        if (assignForm) {
            assignForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const form = this;
                const licenseId = form.getAttribute('data-license-id');
                const usuario_id = form.usuario_id.value;

                fetch(`/licenses/assign_stock/${licenseId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario_id })
                })
                    .then(r => r.json())
                    .then(data => {
                        let msg = document.getElementById('assignMsg');
                        if (data.success) {
                            msg.innerHTML = "<div class='success-msg'>¡Licencia asignada correctamente!</div>";
                        } else {
                            msg.innerHTML = "<div class='error-msg'>Error: " + (data.error || "No se pudo asignar") + "</div>";
                        }
                    })
                    .catch(() => {
                        let msg = document.getElementById('assignMsg');
                        msg.innerHTML = "<div class='error-msg'>Error al conectar con el servidor.</div>";
                    });
            });
        }

        // Delete license handler
        const deleteBtn = document.getElementById('deleteLicenseBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function () {
                const licenseId = this.getAttribute('data-license-id');
                if (confirm("¿Estás seguro de que deseas eliminar esta licencia?")) {
                    // Add your delete license logic here
                    fetch(`/licenses/delete/${licenseId}`, {
                        method: 'POST'
                    })
                        .then(r => r.json())
                        .then(data => {
                            if (data.success) {
                                loadContent('licensespanel');
                            } else {
                                let msg = document.getElementById('msg');
                                msg.innerHTML = "<div class='error-msg'>Error: " + (data.error || "No se pudo eliminar") + "</div>";
                            }
                        })
                        .catch(() => {
                            let msg = document.getElementById('msg');
                            msg.innerHTML = "<div class='error-msg'>Error al conectar con el servidor.</div>";
                        });
                }
            });
        }
