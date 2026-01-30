// Variables jQuery para elementos del Navbar (cacheadas en document.ready)
let $navBarUserAuthButtons = null;
let $navBarUserProfileButtons = null;
let $navBarAdminLinkContainer = null;
let $navBarMainLinksUl = null;

// Almacenamiento global del estado de la sesión, accesible por otros scripts después del evento.
window.globalSessionData = { 
    is_logged_in: false, 
    data: null, 
    error: null, 
    checked_once: false // Bandera para indicar si el chequeo inicial ya se hizo
};

// Función para actualizar la UI del Navbar según el estado de sesión
function updateLoginStatusUIGlobal(currentSessionState) {

    if (!$navBarUserAuthButtons || !$navBarUserProfileButtons || !$navBarAdminLinkContainer || !$navBarMainLinksUl ||
        !$navBarUserAuthButtons.length || !$navBarUserProfileButtons.length || 
        !$navBarAdminLinkContainer.length || !$navBarMainLinksUl.length) {
        return;
    }

    // Reset: ocultar todos los elementos condicionales primero
    $navBarUserAuthButtons.addClass('d-none');
    $navBarUserProfileButtons.addClass('d-none');
    $navBarAdminLinkContainer.addClass('d-none');
    $navBarMainLinksUl.addClass('d-none'); 

    if (currentSessionState && currentSessionState.is_logged_in && currentSessionState.data && currentSessionState.data.user_id) {
        const userData = currentSessionState.data;
        
        $navBarUserProfileButtons.removeClass('d-none'); 
        
        let mainLinksUlShouldBeVisible = false; 
        // Mostrar "Administrar" si id_rol NO es 3 (Usuario)
        if (userData.id_rol && parseInt(userData.id_rol, 10) !== 3) { 
            $navBarAdminLinkContainer.removeClass('d-none');
            mainLinksUlShouldBeVisible = true;               
        }
        // Aquí podrías añadir más lógica si #nav-main-links contiene otros elementos para usuarios logueados
        // if (algunOtroLinkParaLogueadosEsVisible) { mainLinksUlShouldBeVisible = true; }

        if (mainLinksUlShouldBeVisible) {
            $navBarMainLinksUl.removeClass('d-none');
        } else {
            // Si el UL de la izquierda solo contenía el link de admin y no es admin, lo dejamos oculto
            $navBarMainLinksUl.addClass('d-none');
        }

    } else {
        $navBarUserAuthButtons.removeClass('d-none'); 
    }
}

// Definición del Módulo de Notificaciones (para la campanita)
const NotificationsModule = {
    notificationsDropdown: null, notificationsList: null, notificationBadge: null, currentUserData: null,
    init: function(userData) {
        if(!userData||!userData.user_id){ this.clearNotificationsUI(); return; }
        this.currentUserData = userData;
        this.notificationsDropdown = $('#notificationsDropdown');
        this.notificationsList = $('#notificationsList');
        this.notificationBadge = $('#notification-badge');
        if(!this.notificationsDropdown.length||!this.notificationsList.length||!this.notificationBadge.length){;
            return; }
        this.loadUserNotifications();
        const self = this;
        this.notificationsDropdown.on('show.bs.dropdown', function(){ if(self.notificationBadge.length) self.notificationBadge.text('0').hide(); });
    },
    loadUserNotifications: function(){ const mockN = this.getMockNotifications(); this.renderNotifications(mockN); },
    renderNotifications: function(notifications){
        if(!this.notificationsList||!this.notificationsList.length) return;
        this.notificationsList.empty();
        if(!notifications||notifications.length===0){ this.notificationsList.append('<li class="dropdown-item text-center text-muted p-3 mb-0">No hay notificaciones nuevas.</li>'); if(this.notificationBadge.length)this.notificationBadge.hide(); return; }
        let unreadCount = 0; const self = this;
        notifications.forEach(n=>{ const isUnread=!n.read; if(isUnread)unreadCount++; const li=$(`<li><a class="dropdown-item notification-item ${isUnread?'unread':''}" href="${n.link||'#'}"><div class="d-flex align-items-start"><div class="notification-icon text-${self.getNotificationColor(n.type)} me-2"><i class="${self.getNotificationIcon(n.type)} fa-fw"></i></div><div class="notification-content flex-grow-1"><strong class="notification-title">${self.escapeHTML(n.title)}</strong><div class="notification-message small text-muted">${self.escapeHTML(n.message)}</div></div>${isUnread?'<span class="unread-dot ms-auto align-self-center"><i class="fas fa-circle text-primary fa-xs"></i></span>':''}</div></a></li>`); this.notificationsList.append(li); });
        if(this.notificationBadge.length){ unreadCount > 0 ? this.notificationBadge.text(unreadCount > 99 ? '99+' : unreadCount).show() : this.notificationBadge.hide(); }
    },
    clearNotificationsUI: function(){ if(this.notificationsList&&this.notificationsList.length){this.notificationsList.empty().append('<li class="dropdown-item text-center text-muted p-3 mb-0">Inicia sesión para ver notificaciones.</li>');} if(this.notificationBadge&&this.notificationBadge.length)this.notificationBadge.hide(); },
    getNotificationIcon: function(type){const icons={'like':'fa-heart','comment':'fa-comment','follow':'fa-user-plus','admin_message':'fa-shield-alt','system':'fa-info-circle'}; return `fas ${icons[type]||'fa-bell'}`;},
    getNotificationColor: function(type){const colors={'like':'danger','comment':'primary','follow':'success','admin_message':'warning','system':'info'}; return colors[type]||'secondary';},
    getMockNotifications: function(){return[{id:1,type:'comment',title:'Bienvenido a CookSocial!',message:'Explora y comparte tus recetas.',read:false,link:'#'},{id:2,type:'system',title:'Actualización',message:'Hemos mejorado la búsqueda.',read:true,link:'#'}];},
    escapeHTML: function(str) { if (str == null) return ''; return $('<div></div>').text(String(str)).html(); }
};
// --- CÓDIGO PRINCIPAL DE notifications.js (Se ejecuta en $(document).ready) ---
$(document).ready(function() {

    // Cachear selectores del Navbar
    $navBarUserAuthButtons = $('#user-auth-buttons');
    $navBarUserProfileButtons = $('#user-profile-buttons');
    $navBarAdminLinkContainer = $('#nav-admin-link');
    $navBarMainLinksUl = $('#nav-main-links');

    // Verificar que los elementos críticos del Navbar existan
    if (!$navBarUserAuthButtons.length || !$navBarUserProfileButtons.length || 
        !$navBarAdminLinkContainer.length || !$navBarMainLinksUl.length) {
        console.error("notifications.js: Error crítico - Faltan elementos del Navbar en el DOM. La UI de sesión y notificaciones no funcionará correctamente.");
        window.globalSessionData = { is_logged_in: false, data: null, error: "Navbar elements missing", checked: true };
        // Disparar evento para que otras páginas (como guardianes) sepan que el chequeo falló
        $(document).trigger('sessionStatusChecked', [window.globalSessionData]);
        return; 
    }
    
    // Establecer UI inicial como "no logueado" (evita parpadeo)
    updateLoginStatusUIGlobal({ is_logged_in: false, data: null });
    NotificationsModule.clearNotificationsUI();

    // Verificar AuthService
    if (typeof AuthService === 'undefined' || typeof AuthService.checkSession !== 'function') {
        console.error("notifications.js: AuthService.checkSession no disponible. Imposible verificar sesión.");
        window.globalSessionData = { is_logged_in: false, data: null, error: "AuthService missing", checked: true };
        updateLoginStatusUIGlobal(window.globalSessionData); // Reflejar estado de error en UI
        NotificationsModule.clearNotificationsUI();
        $(document).trigger('sessionStatusChecked', [window.globalSessionData]);
        return; 
    }

    // Realizar la llamada para verificar la sesión
    AuthService.checkSession()
        .done(function(sessionResponse) {
            // Actualizar el estado global de la sesión. sessionResponse ya tiene is_logged_in, data, etc.
            window.globalSessionData = { ...sessionResponse, checked: true }; 
            
            updateLoginStatusUIGlobal(sessionResponse); // Actualizar la UI del navbar

            if (sessionResponse && sessionResponse.is_logged_in && sessionResponse.data) {
                NotificationsModule.init(sessionResponse.data); // Iniciar módulo de notificaciones si está logueado
            } else {
                NotificationsModule.clearNotificationsUI(); // Limpiar UI de notificaciones si no está logueado
            }
        })
        .fail(function(jqXHR) {
            console.error("notifications.js (checkSession.fail): Error AJAX al verificar sesión:", jqXHR.status, jqXHR.responseText);
            window.globalSessionData = { success: false, is_logged_in: false, message: 'Error al verificar estado de sesión.', data: null, error: jqXHR, checked: true };
            updateLoginStatusUIGlobal(window.globalSessionData); // Mostrar UI como no logueado
            NotificationsModule.clearNotificationsUI();
        })
        .always(function() {
            // Disparar el evento global para que otros scripts sepan que la información de sesión está lista (o falló).
            $(document).trigger('sessionStatusChecked', [window.globalSessionData]);
        });

    // Manejo del Botón de Logout (asegúrate que tu botón de logout tenga id="logoutButton")
    const $logoutButton = $('#logoutButton');
    if ($logoutButton.length) {
        $logoutButton.on('click', function(e) {
            e.preventDefault();
            if (AuthService && AuthService.logout) {
                AuthService.logout()
                    .done(function(logoutResponse) {
                        const loggedOutState = { is_logged_in: false, data: null, checked: true, message: logoutResponse.message || "Sesión cerrada" };
                        window.globalSessionData = loggedOutState;

                        updateLoginStatusUIGlobal(loggedOutState); // Actualizar UI del navbar
                        NotificationsModule.clearNotificationsUI(); // Limpiar notificaciones
                        
                        // Informar a otras partes de la aplicación que el estado de la sesión ha cambiado
                        $(document).trigger('sessionStatusChecked', [loggedOutState]); 
                        
                        // Redirigir a index.html si no estamos en una página pública principal, para asegurar un estado limpio.
                        const currentPath = window.location.pathname.toLowerCase();
                        const isNonEssentialPublic = !currentPath.endsWith('/') && 
                                                   !currentPath.endsWith('index.html') && 
                                                   !currentPath.endsWith('logreg.html') && 
                                                   !currentPath.endsWith('help.html') &&
                                                   !currentPath.endsWith('/tfg/') && 
                                                   !currentPath.endsWith('/tfg/index.html') && 
                                                   !currentPath.endsWith('/tfg/logreg.html') && 
                                                   !currentPath.endsWith('/tfg/help.html');
                        if (isNonEssentialPublic) {
                            window.location.href = 'index.html'; // O './index.html' dependiendo de tu estructura base
                        }
                    })
                    .fail(function(jqXHR_logout) {
                        console.error("notifications.js: Falló la llamada AJAX de Logout:", jqXHR_logout.status, jqXHR_logout.responseText);
                        // Considerar mostrar un mensaje de error no intrusivo al usuario.
                    });
            } else {
                console.error("notifications.js: AuthService.logout no está disponible.");
            }
        });
    } else {
        // Es normal si el botón no está en la página actual (ej. logReg.html).
        // console.warn("notifications.js: Botón de logout ('#logoutButton') no encontrado en el DOM de esta página.");
    }
});
function formatRecipeDuration(totalMinutes) {
    const minutes = parseInt(totalMinutes, 10);
    
    if (isNaN(minutes) || minutes <= 0) return '0 min';
    
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    
    let timeString = "";
    
    if (h > 0) {
        timeString += `${h}h`;
    }
    
    if (m > 0) {
        // Añade un espacio si ya hay horas
        if (h > 0) timeString += " ";
        timeString += `${m}min`;
    }
    
    return timeString;
}