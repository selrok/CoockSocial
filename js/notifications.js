// TFG/js/notifications.js

let $navBarUserAuthButtons = null;
let $navBarUserProfileButtons = null;
let $navBarAdminLinkContainer = null;
let $navBarMainLinksUl = null;

window.globalSessionData = { is_logged_in: false, data: null, checked_once: false };

/**
 * Actualiza el Navbar según el estado de la sesión
 */
function updateLoginStatusUIGlobal(currentSessionState) {
    if (!$navBarUserAuthButtons) return;
    
    $navBarUserAuthButtons.addClass('d-none');
    $navBarUserProfileButtons.addClass('d-none');
    $navBarAdminLinkContainer.addClass('d-none');
    $navBarMainLinksUl.addClass('d-none'); 

    if (currentSessionState && currentSessionState.is_logged_in && currentSessionState.data) {
        const userData = currentSessionState.data;
        $navBarUserProfileButtons.removeClass('d-none'); 
        if (userData.id_rol && parseInt(userData.id_rol) !== 3) { 
            $navBarAdminLinkContainer.removeClass('d-none');
            $navBarMainLinksUl.removeClass('d-none');
        }
    } else {
        $navBarUserAuthButtons.removeClass('d-none'); 
    }
}

/**
 * Módulo de Notificaciones - Optimizado para CoockSocial
 */
const NotificationsModule = {
    $list: null, 
    $badge: null,
    unreadCount: 0,
    
    init: function(userData) {
        if(!userData) return;
        this.$list = $('#notificationsList');
        this.$badge = $('#notification-badge');
        this.load();
        this.setupEvents();
    },

    /**
     * Delegación de eventos para marcar como leída al hacer click
     */
    setupEvents: function() {
        this.$list.off('click', '.noti-item').on('click', '.noti-item', (e) => {
            const $item = $(e.currentTarget);
            const id = $item.data('id');
            const estaLeida = $item.data('status') == 1;

            if (!estaLeida) {
                if (typeof window.NotificationService !== 'undefined') {
                    window.NotificationService.markOneAsRead(id).done((res) => {
                        if (res.success) {
                            this.markItemAsReadUI($item);
                        }
                    });
                }
            }
        });
    },

    /**
     * Actualización visual inmediata sin recarga
     */
    markItemAsReadUI: function($item) {
        $item.removeClass('bg-light').data('status', 1);
        $item.find('.bi-circle-fill').fadeOut(200, function() { $(this).remove(); });
        
        if (this.unreadCount > 0) {
            this.unreadCount--;
            this.updateBadgeUI();
        }
    },

    updateBadgeUI: function() {
        if (this.unreadCount > 0) {
            this.$badge.text(this.unreadCount > 99 ? '99+' : this.unreadCount).show();
        } else {
            this.$badge.hide().text('0');
        }
    },

    load: function() {
        if (typeof window.NotificationService === 'undefined') return;
        window.NotificationService.getNotifications().done((res) => {
            if (res.success) this.render(res.data);
        });
    },

    /**
     * Renderizado optimizado con Pie de página Sticky
     */
    render: function(notifications) {
        this.$list.empty();
        this.unreadCount = 0;

        // 1. Si no hay notificaciones, mensaje amigable
        if (!notifications || notifications.length === 0) {
            this.$list.append('<li><p class="text-center text-muted p-4 mb-0 small">No tienes notificaciones nuevas</p></li>');
        } else {
            // 2. Mapeo de items
            const itemsHtml = notifications.map(n => {
                const isUnread = (n.leida == 0);
                if (isUnread) this.unreadCount++;

                const config = this.getNotificationConfig(n);
                
                return `
                    <li>
                        <a class="dropdown-item py-2 border-bottom noti-item ${isUnread ? 'bg-light' : ''}" 
                           href="${config.link}" 
                           data-id="${n.id}" 
                           data-status="${n.leida}">
                            <div class="d-flex align-items-center">
                                <div class="me-3 fs-5 ${config.color}">
                                    <i class="bi ${config.icon}"></i>
                                </div>
                                <div class="flex-grow-1 overflow-hidden" style="max-width: 210px;">
                                    <p class="mb-0 small text-dark" style="white-space: normal; line-height: 1.2;">
                                        ${config.text}
                                    </p>
                                </div>
                                ${isUnread ? '<i class="bi bi-circle-fill text-primary ms-2" style="font-size: 0.5rem;"></i>' : ''}
                            </div>
                        </a>
                    </li>`;
            });
            this.$list.append(itemsHtml.join(''));
        }

        // --- 3. INYECCIÓN DEL PIE DE PÁGINA "STICKY" ---
        // Se coloca al final pero gracias al CSS se mantendrá pegado abajo si hay scroll.
        this.$list.append(`
            <li class="sticky-bottom bg-white border-top shadow-sm" style="position: sticky; bottom: 0; z-index: 10;">
                <a class="dropdown-item text-center small text-orange fw-bold py-2" href="activity.html">
                    Ver toda la actividad <i class="bi bi-arrow-right ms-1"></i>
                </a>
            </li>
        `);

        this.updateBadgeUI();
    },

    /**
     * Lógica de configuración por tipo
     */
    getNotificationConfig: function(n) {
        const emisor = n.nombre_emisor || 'Alguien';
        const receta = n.titulo_receta;
        
        switch(n.tipo) {
            case 'like': 
                return {
                    icon: 'bi-suit-heart-fill', color: 'text-danger',
                    text: `A <b>${emisor}</b><br> le gusta tu receta <i>${receta || 'eliminada'}</i>`,
                    link: receta ? `recipe.html?id=${n.id_origen_contenido}` : '#'
                };
            case 'comentario': 
                return {
                    icon: 'bi-chat-dots-fill', color: 'text-primary',
                    text: `<b>${emisor}</b> comentó en:<br> <i>${receta || 'una receta eliminada'}</i>`,
                    link: `recipe.html?id=${n.id_origen_contenido}#comment-section`
                };
            case 'seguidor': 
                return {
                    icon: 'bi-person-plus-fill', color: 'text-success',
                    text: `<b>${emisor}</b> <br>ha empezado a seguirte`,
                    link: `profile.html?userId=${n.id_origen_contenido}`
                };
            case 'baneo_receta': 
                return {
                    icon: 'bi-info-circle-fill', color: 'text-warning',
                    text: `Tu receta <b>${receta || 'fue eliminada'}</b><br> por infringir las normas`,
                    link: '#' 
                };
            case 'baneo_comentario': 
                return {
                    icon: 'bi-info-square-fill', color: 'text-warning',
                    text: `Un comentario tuyo ha sido eliminado <br>en <i>${receta || 'el contenido'}</i>`,
                    link: `recipe.html?id=${n.id_origen_contenido}`
                };
            default: 
                return { icon: 'bi-bell', color: 'text-secondary', text: 'Novedades en tu cuenta', link: '#' };
        }
    }
};

$(document).ready(function() {
    $navBarUserAuthButtons = $('#user-auth-buttons');
    $navBarUserProfileButtons = $('#user-profile-buttons');
    $navBarAdminLinkContainer = $('#nav-admin-link');
    $navBarMainLinksUl = $('#nav-main-links');

    if (typeof AuthService !== 'undefined') {
        AuthService.checkSession().done(res => {
            window.globalSessionData = { ...res, checked: true };
            updateLoginStatusUIGlobal(res);
            if (res.is_logged_in) NotificationsModule.init(res.data);
            $(document).trigger('sessionStatusChecked', [res]);
        });
    }

    $('#logoutButton').on('click', function(e) {
        e.preventDefault();
        if(typeof AuthService !== 'undefined') {
            AuthService.logout().done(() => window.location.href = 'index.html');
        }
    });
});

function escapeHTML(str) { return str ? $('<div>').text(str).html() : ''; }

window.NotificationHelper = {
    send: function(receptorId, tipo, contenidoId) {
        if (typeof NotificationService !== 'undefined') {
            return window.NotificationService.create({
                receptor_id: receptorId,
                tipo: tipo,
                contenido_id: contenidoId
            });
        }
    },
    remove: function(receptorId, tipo, contenidoId) {
        if (typeof NotificationService !== 'undefined') {
            return window.NotificationService.delete({
                receptor_id: receptorId,
                tipo: tipo,
                contenido_id: contenidoId
            });
        }
    }
};