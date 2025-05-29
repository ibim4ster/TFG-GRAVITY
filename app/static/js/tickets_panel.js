
// Búsqueda de tickets
document.getElementById('searchTickets').addEventListener('input', function () {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll('.tickets-table tbody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    });
});

// Función para eliminar ticket (solo admin)
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
                    if (typeof loadContent === 'function') {
                        loadContent('tickets', null);
                    } else {
                        location.reload();
                    }
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
