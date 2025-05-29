        document.addEventListener('DOMContentLoaded', function () {
            // Mostrar/ocultar campo de fecha según el tipo de licencia
            document.getElementById('license_type').addEventListener('change', function () {
                const dateField = document.getElementById('license_end');

                if (this.value === 'Permanente') {
                    dateField.value = '';
                    dateField.parentElement.style.display = 'none';
                } else {
                    dateField.parentElement.style.display = 'block';

                    // Calcular la fecha de finalización automáticamente
                    const today = new Date();
                    let endDate = new Date(today);

                    if (this.value === 'Mensual') {
                        // Añadir un mes a la fecha actual
                        endDate.setMonth(endDate.getMonth() + 1);
                    } else if (this.value === 'Anual') {
                        // Añadir un año a la fecha actual
                        endDate.setFullYear(endDate.getFullYear() + 1);
                    }

                    // Formatear la fecha como YYYY-MM-DD para el input type="date"
                    const formattedDate = formatDateForInput(endDate);
                    dateField.value = formattedDate;
                }
            });

            // Añadir esta función para formatear la fecha correctamente
            function formatDateForInput(date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses son 0-indexados
                const day = String(date.getDate()).padStart(2, '0');

                return `${year}-${month}-${day}`;
            }

            // Guardar cambios usuario
            document.getElementById('editUserForm').addEventListener('submit', function (event) {
                event.preventDefault();
                var formData = new FormData(this);
                fetch(`/update_user/{{ user.id }}`, {
                    method: 'POST',
                    body: formData
                })
                    .then(response => {
                        if (!response.ok) throw new Error('Error al guardar los cambios.');
                        return response.json();
                    })
                    .then(data => {
                        if (data.success) {
                            loadContent('adminpanel', document.querySelector('.sidebar a[href*="adminpanel"]'));
                        } else {
                            alert('Error al actualizar el usuario: ' + data.error);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Hubo un problema al intentar guardar los cambios.');
                    });
            });

            // Eliminar usuario
            document.getElementById('deleteUser').addEventListener('click', function () {
                if (confirm("¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.")) {
                    fetch(`/delete_user/{{ user.id }}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                loadContent('adminpanel', document.querySelector('.sidebar a[href*="adminpanel"]'));
                            } else {
                                alert('Error al eliminar el usuario: ' + data.error);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Hubo un problema al intentar eliminar el usuario.');
                        });
                }
            });

            // Asignar licencia
            document.getElementById('assignLicenseBtn').addEventListener('click', function () {
                const licenseType = document.getElementById('license_type').value;
                let licenseEnd = document.getElementById('license_end').value;

                if (!licenseType) {
                    alert('Por favor selecciona un tipo de licencia.');
                    return;
                }

                if (licenseType !== 'Permanente' && !licenseEnd) {
                    alert('Por favor selecciona una fecha de finalización para la licencia.');
                    return;
                }

                if (licenseType === 'Permanente') {
                    licenseEnd = null;
                }

                fetch(`/assign_license/{{ user.id }}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        license_type: licenseType,
                        license_end: licenseEnd
                    })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Recargar la página para reflejar los cambios
                            location.reload();
                        } else {
                            alert('Error al asignar la licencia: ' + data.error);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Hubo un problema al intentar asignar la licencia.');
                    });
            });

            // Revocar licencia
            if (document.getElementById('revokeLicenseBtn')) {
                document.getElementById('revokeLicenseBtn').addEventListener('click', function () {
                    if (confirm("¿Estás seguro de que deseas revocar la licencia activa de este usuario?")) {
                        fetch(`/revoke_license/{{ user.id }}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    // Recargar la página para reflejar los cambios
                                    location.reload();
                                } else {
                                    alert('Error al revocar la licencia: ' + data.error);
                                }
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                alert('Hubo un problema al intentar revocar la licencia.');
                            });
                    }
                });
            }

            // Arreglar transacciones faltantes
            const fixMissingTransactionBtn = document.getElementById('fixMissingTransactionBtn');
            if (fixMissingTransactionBtn) {
                fixMissingTransactionBtn.addEventListener('click', function () {
                    if (confirm("¿Deseas crear automáticamente registros de transacción para las licencias activas sin transacción?")) {
                        fetch('/licenses/fix_missing_transactions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert(`Operación exitosa: ${data.message}`);
                                    location.reload();
                                } else {
                                    alert('Error: ' + data.error);
                                }
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                alert('Hubo un problema al intentar corregir las transacciones.');
                            });
                    }
                });
            }

            // Inicializar el estado del campo de fecha
            const licenseTypeSelect = document.getElementById('license_type');
            if (licenseTypeSelect.value === 'Permanente') {
                document.getElementById('license_end').parentElement.style.display = 'none';
            }

            // Handle transaction modal
            const addTransactionBtn = document.getElementById('addTransactionBtn');
            if (addTransactionBtn) {
                addTransactionBtn.addEventListener('click', function () {
                    // Show modal using Bootstrap's modal
                    $('#addTransactionModal').modal('show');
                });
            }

            // Save transaction button handler
            const saveTransactionBtn = document.getElementById('saveTransactionBtn');
            if (saveTransactionBtn) {
                saveTransactionBtn.addEventListener('click', function () {
                    const form = document.getElementById('addTransactionForm');
                    const formData = new FormData(form);
                    formData.append('user_id', '{{ user.id }}');

                    fetch('/admin/add_transaction', {
                        method: 'POST',
                        body: formData
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                // Close modal
                                $('#addTransactionModal').modal('hide');
                                // Reload page
                                location.reload();
                            } else {
                                alert('Error al guardar la transacción: ' + data.error);
                            }
                        })
                        .catch(err => {
                            console.error('Error:', err);
                            alert('Error al guardar la transacción');
                        });
                });
            }
        });
