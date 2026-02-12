// TFG/js/activity.js

$(document).ready(function() {
    console.log("activity.js: DOM ready. Esperando Auth...");

    let currentUser = null;

    // Protección con Guardián (Disparado por notifications.js)
    $(document).on('authGuardPassed', function(event, userData) {
        currentUser = userData;
        initActivityPage();
    });

    // Fallback de seguridad
    setTimeout(() => { if (!currentUser) { console.warn("activity.js: Sin usuario."); } }, 3500);

    function initActivityPage() {
        console.log("activity.js: Inicializando.");

        // LEER PARÁMETRO DE LA URL
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab'); // Puede ser 'following' o 'followers'

        if (tabParam) {
            // Buscamos el botón de la pestaña que coincida con el data-type
            const $targetTab = $(`#activityTabs button[data-type="${tabParam}"]`);
            if ($targetTab.length) {
                // Activamos la pestaña usando el constructor de Bootstrap
                const tabTrigger = new bootstrap.Tab($targetTab[0]);
                tabTrigger.show();
                loadData(tabParam);
            } else {
                loadNotifications(); // Fallback si el parámetro es inválido
            }
        } else {
            // Carga por defecto si no hay parámetros
            loadNotifications(); 
        }

        // Listeners para cambio de pestaña (Bootstrap Pills)
        const triggerTabList = [].slice.call(document.querySelectorAll('#activityTabs button'));
        triggerTabList.forEach(function (triggerEl) {
            const tabTrigger = new bootstrap.Tab(triggerEl);
            triggerEl.addEventListener('click', function (event) {
                event.preventDefault();
                tabTrigger.show();
                const targetType = this.getAttribute('data-type'); 
                loadData(targetType);
            });
        });
    }

    function loadData(type) {
        if (type === 'notifications') loadNotifications();
        else if (type === 'followers') loadUserList('followers');
        else if (type === 'following') loadUserList('following');
    }

    function loadNotifications() {
        const $container = $('#notifications-container');
        $container.html('<div class="text-center py-5"><div class="spinner-border text-orange" role="status"></div></div>');

        ActivityService.getList('notifications')
            .done(function(resp) {
                $container.empty();
                if (resp.success && resp.data.length > 0) {
                    resp.data.forEach(n => $container.append(createNotificationItem(n)));
                } else {
                    $container.html('<div class="text-center text-muted py-5"><i class="fas fa-bell-slash fs-1 mb-3"></i><p>No tienes notificaciones aún.</p></div>');
                }
            })
            .fail(function(err) {
                console.error("Error al cargar notificaciones:", err);
                $container.html('<div class="alert alert-danger m-3">Error al cargar la lista de notificaciones.</div>');
            });
    }

    function loadUserList(type) {
        const $container = type === 'following' ? $('#following-container') : $('#followers-container');
        $container.html('<div class="text-center py-5"><div class="spinner-border text-orange" role="status"></div></div>');

        ActivityService.getList(type)
            .done(function(resp) {
                $container.empty();
                if (resp.success && resp.data.length > 0) {
                    const $list = $('<div class="list-group list-group-flush"></div>');
                    resp.data.forEach(user => {
                        $list.append(createUserItem(user, type));
                    });
                    $container.append($list);
                } else {
                    const msg = type === 'following' ? 'No sigues a nadie aún.' : 'Aún no tienes seguidores.';
                    $container.html(`<div class="text-center text-muted py-5"><i class="bi bi-person-plus-fill mb-3"></i><p>${msg}</p></div>`);
                }
            })
            .fail(function(err) {
                console.error(`Error al cargar ${type}:`, err);
                $container.html('<div class="alert alert-danger m-3">Error al conectar con el servidor.</div>');
            });
    }

    function createNotificationItem(n) {
        const date = new Date(n.fecha_creacion).toLocaleDateString();
        const emisor = n.nombre_emisor || 'Alguien';
        const receta = n.titulo_receta;
        
        let config = { icon: 'fa-bell text-secondary', text: 'Novedad en tu cuenta', link: '#' };

        switch(n.tipo) {
            case 'like': 
                config = {
                    icon: 'bi-suit-heart-fill text-danger',
                    text: `A <b>${emisor}</b> le gusta tu receta <i>${receta || 'eliminada'}</i>`,
                    link: receta ? `recipe.html?id=${n.id_origen_contenido}` : ''
                }; break;
            case 'comentario': 
                config = {
                    icon: 'bi-chat-dots-fill text-primary',
                    text: `<b>${emisor}</b> comentó en: <i>${receta || 'una receta eliminada'}</i>`,
                    link: `recipe.html?id=${n.id_origen_contenido}`
                }; break;
            case 'seguidor': 
                config = {
                    icon: 'bi-person-plus-fill text-success',
                    text: `<b>${emisor}</b> ha empezado a seguirte`,
                    link: `profile.html?userId=${n.id_origen_contenido}`
                }; break;
            case 'baneo_receta': 
                config = {
                    icon: 'bi-info-circle-fill text-warning',
                    text: `Tu receta <b>${receta || 'fue eliminada'}</b> por moderación`,
                    link: '#' 
                }; break;
            case 'baneo_comentario': 
                config = {
                    icon: 'bi-info-square-fill text-warning',
                    text: `Un comentario tuyo ha sido eliminado en <i>${receta || 'el contenido'}</i>`,
                    link: `recipe.html?id=${n.id_origen_contenido}`
                }; break;
        }

        return `
            <a href="${config.link}" class="list-group-item list-group-item-action p-3 d-flex align-items-center ${n.leida == 0 ? 'bg-light border-start border-primary border-4' : ''}">
                <div class="me-3 fs-4"><i class="bi ${config.icon}"></i></div>
                <div class="flex-grow-1">
                    <div class="mb-1 text-dark">${config.text}</div>
                    <small class="text-muted">${date}</small>
                </div>
                ${n.leida == 0 ? '<div class="ms-2"><i class="bi bi-circle-fill text-primary" style="font-size: 0.5rem;"></i></div>' : ''}
            </a>
        `;
    }

    function createUserItem(user, listType) {
        const avatar = user.avatar_url ? user.avatar_url : 'resources/default-avatar.svg';
        const profileLink = `profile.html?userId=${user.id}`;
        
        let actionBtn = '';
        if (listType === 'following') {
            actionBtn = `<button class="btn btn-outline-secondary btn-sm follow-toggle-btn" data-userid="${user.id}" data-status="following">Dejar de seguir</button>`;
        } else {
            const iFollowBack = user.is_followed_by_me == 1;
            const btnClass = iFollowBack ? 'btn-secondary' : 'btn-orange';
            const btnText = iFollowBack ? 'Siguiendo' : 'Seguir';
            actionBtn = `<button class="btn ${btnClass} btn-sm follow-toggle-btn" data-userid="${user.id}" data-status="${iFollowBack ? 'following' : 'none'}">${btnText}</button>`;
        }

        const item = $(`
            <div class="list-group-item p-3 d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <a href="${profileLink}">
                        <img src="${escapeHTML(avatar)}" alt="${escapeHTML(user.username)}" class="rounded-circle me-3" width="50" height="50" style="object-fit:cover">
                    </a>
                    <div>
                        <h5 class="mb-0 fs-6 fw-bold"><a href="${profileLink}" class="text-decoration-none text-dark">${escapeHTML(user.username)}</a></h5>
                        <small class="text-muted">${escapeHTML(user.nombre_completo || '')}</small>
                    </div>
                </div>
                <div>${actionBtn}</div>
            </div>
        `);

        // Lógica de Toggle Seguir/Dejar de seguir
        item.find('.follow-toggle-btn').on('click', function(e) {
            e.preventDefault();
            const btn = $(this);
            const targetId = btn.data('userid');
            
            btn.prop('disabled', true);
            
            if (typeof InteractionService !== 'undefined') {
                InteractionService.toggleFollow(targetId)
                    .done(function(resp) {
                        if (resp.success) {
                            if (resp.isFollowing) {
                                // ACCIÓN: SEGUIR
                                btn.text('Siguiendo').removeClass('btn-orange').addClass('btn-secondary').data('status', 'following');
                                if (typeof window.NotificationHelper !== 'undefined') {
                                    window.NotificationHelper.send(targetId, 'seguidor', currentUser.user_id);
                                }
                            } else {
                                // ACCIÓN: DEJAR DE SEGUIR
                                if (listType === 'following') {
                                    item.fadeOut(300, function() { $(this).remove(); });
                                } else {
                                    btn.text('Seguir').removeClass('btn-secondary').addClass('btn-orange').data('status', 'none');
                                }
                                
                                if (typeof window.NotificationHelper !== 'undefined') {
                                    window.NotificationHelper.remove(targetId, 'seguidor', currentUser.user_id);
                                }
                            }
                        }
                    })
                    .always(() => btn.prop('disabled', false));
            }
        });

        return item;
    }

    function escapeHTML(str) { 
        if (str == null) return ''; 
        return $('<div></div>').text(String(str)).html(); 
    }
});