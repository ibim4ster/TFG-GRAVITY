function adjustViewport() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (window.innerWidth < 480) {
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    adjustViewport();

    // Inicializar AOS
    AOS.init({
        duration: 800,
        once: true,
        easing: "ease-out-quart",
        disable: window.innerWidth < 768 ? 'mobile' : false
    });
});

window.addEventListener('resize', adjustViewport);
