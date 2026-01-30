// TFG/js/redirect/auth-guard-admin.js
$(document).ready(function() {
    console.log("AuthGuard-Admin: DOM ready. Esperando evento 'sessionStatusChecked' desde notifications.js...");

    const loginRedirectUrl = window.authGuardRedirectUrl || 'logReg.html#login'; 
    const accessDeniedRedirectUrl = window.authGuardAccessDeniedUrl || 'index.html';
    const ADMIN_ROLES = [1, 2]; // IDs para SuperAdministrador y Administrador

    let guardActionTaken = false; 

    function processAuthForAdminPage(sessionResponse) {
        if (guardActionTaken) return; 
        guardActionTaken = true;
        console.log("AuthGuard-Admin: processAuthForAdminPage procesando:", sessionResponse);

        if (sessionResponse && sessionResponse.is_logged_in && sessionResponse.data && sessionResponse.data.user_id) {
            const userData = sessionResponse.data;
            const userRol = parseInt(userData.id_rol, 10);

            if (ADMIN_ROLES.includes(userRol)) {
                console.log("AuthGuard-Admin: Acceso PERMITIDO. Rol:", userRol, ". Disparando 'authGuardAdminPassed'.");
                $(document).trigger('authGuardAdminPassed', [userData]);
            } else {
                console.warn(`AuthGuard-Admin: Acceso DENEGADO por rol (${userRol}). Redirigiendo a: ${accessDeniedRedirectUrl}`);
                window.location.href = accessDeniedRedirectUrl;
            }
        } else {
            let reason = "Usuario NO autenticado";
            if(sessionResponse && sessionResponse.error) reason += " (Error previo: " + (sessionResponse.message || "Detalles en consola") + ")";
            else if (sessionResponse && sessionResponse.message) reason += ` (${sessionResponse.message})`;
            
            console.log(`AuthGuard-Admin: ${reason}. Redirigiendo a login.`);
            const currentPath = window.location.pathname + window.location.search + window.location.hash;
            const redirectParam = `${loginRedirectUrl.includes('?') ? '&' : (loginRedirectUrl.includes('#') && loginRedirectUrl.split('#')[1].includes('?') ? '&' : '?')}redirect=${encodeURIComponent(currentPath)}`;
            window.location.href = `${loginRedirectUrl}${redirectParam}`;
        }
    }

    // Intentar usar el estado global si ya fue chequeado por notifications.js
    if (window.globalSessionData && window.globalSessionData.checked === true) {
        console.log("AuthGuard-Admin: Usando 'window.globalSessionData' pre-chequeado.");
        processAuthForAdminPage(window.globalSessionData);
    } else {
        // Si no, escuchar el evento de notifications.js
        console.log("AuthGuard-Admin: 'window.globalSessionData' no chequeado. Escuchando 'sessionStatusChecked'.");
        $(document).on('sessionStatusChecked.authguardadmin', function(event, sessionResponseFromEvent) {
            console.log("AuthGuard-Admin: Evento 'sessionStatusChecked' recibido.");
            $(document).off('sessionStatusChecked.authguardadmin'); 
            processAuthForAdminPage(sessionResponseFromEvent);
        });

        // Fallback de seguridad con timeout por si el evento nunca llega
        setTimeout(function() {
            if (!guardActionTaken) { 
                console.warn("AuthGuard-Admin: Timeout (3s). 'sessionStatusChecked' no recibido o no se actuó. Forzando redirección a login como último recurso.");
                // Asumir no autorizado si no hay respuesta clara.
                const currentPath = window.location.pathname + window.location.search + window.location.hash;
                const redirectParam = `${loginRedirectUrl.includes('?') ? '&' : (loginRedirectUrl.includes('#') && loginRedirectUrl.split('#')[1].includes('?') ? '&' : '?')}redirect=${encodeURIComponent(currentPath)}`;
                window.location.href = `${loginRedirectUrl}${redirectParam}`;
            }
        }, 500); 
    }
});