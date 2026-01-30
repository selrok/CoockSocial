                                              document.addEventListener('DOMContentLoaded', function() {
    // Verificar hash después de que Bootstrap esté cargado
    const triggerTab = () => {
        const hash = window.location.hash;
        if(hash === '#login') {
            const trigger = document.getElementById('login-tab');
            if(trigger) bootstrap.Tab.getOrCreateInstance(trigger).show();
        }
    };
    
    // Ejecutar al cargar
    triggerTab();
    
    // Escuchar cambios de hash
    window.addEventListener('hashchange', triggerTab);
});