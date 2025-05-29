// Añadir animación de entrada para los elementos
document.addEventListener('DOMContentLoaded', function () {
    const elements = document.querySelectorAll('.card, .welcome-header');
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('visible');
        }, index * 200);
    });
});
