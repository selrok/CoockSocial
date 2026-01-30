// TFG/js/redirect/auth-guard-user.js
$(document).ready(function() {
    console.log("AuthGuard-User: DOM ready. Esperando señal de sesión...");

    const loginRedirectUrl = 'logReg.html#login';
    let guardActionTaken = false;

    // Función que decide si te quedas o te vas
    function processUserAuth(sessionResponse) {
        if (guardActionTaken) return;
        guardActionTaken = true;

        console.log("AuthGuard-User: Procesando acceso con:", sessionResponse);

        // CONDICIÓN: ¿Está logueado?
        if (sessionResponse && sessionResponse.is_logged_in && sessionResponse.data && sessionResponse.data.user_id) {
            // SÍ: Acceso concedido
            console.log("AuthGuard-User: Usuario autenticado. Acceso PERMITIDO.");
            // Avisamos al script de la página (formReceta.js) que puede arrancar
            $(document).trigger('authGuardPassed', [sessionResponse.data]);
        } else {
            // NO: Acceso denegado -> Redirigir
            console.warn("AuthGuard-User: Usuario NO autenticado. Redirigiendo a login.");
            
            // Guardamos la página actual para volver después de loguearse
            const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `${loginRedirectUrl}?redirect=${currentUrl}`;
        }
    }

    // 1. INTENTO RÁPIDO: ¿notifications.js ya terminó de chequear?
    if (window.globalSessionData && window.globalSessionData.checked === true) {
        processUserAuth(window.globalSessionData);
    } 
    // 2. ESPERA NORMAL: Esperar al evento de notifications.js
    else {
        $(document).on('sessionStatusChecked.authguarduser', function(event, sessionResponse) {
            $(document).off('sessionStatusChecked.authguarduser'); // Dejar de escuchar
            processUserAuth(sessionResponse);
        });

        // 3. FALLBACK DE SEGURIDAD: Si notifications.js falla o tarda más de 2s
        setTimeout(function() {
            if (!guardActionTaken) {
                console.warn("AuthGuard-User: Timeout. No hubo respuesta de notifications.js. Forzando chequeo propio.");
                
                // Intentamos verificar nosotros mismos
                if (typeof AuthService !== 'undefined') {
                    AuthService.checkSession()
                        .done(function(response) { processUserAuth(response); })
                        .fail(function() { processUserAuth({ is_logged_in: false }); });
                } else {
                    // Si no hay AuthService, expulsar directamente
                    window.location.href = loginRedirectUrl;
                }
            }
        }, 2000);
    }
});