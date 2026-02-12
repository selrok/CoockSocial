// TFG/js/profile.js

$(function() {
    console.log("profile.js: Controlador cargado.");

    const $infoContainer = $('#profileInfoContainer');
    const $tabsContainer = $('#profileContentTabs');
    const $pubGrid = $('#publishedRecipesContainer');
    const $savGrid = $('#savedRecipesContainer');
    const $savedTabLi = $('#saved-tab').parent();
    
    // Variable local para almacenar el usuario de sesión
    let currentUserLocal = null;

    // Inicializar
    init();

    function init() {
        const urlParams = new URLSearchParams(window.location.search);
        let userId = urlParams.get('userId') || urlParams.get('id');

        // Checkeo de sesión primero (notifications.js ya hace el trabajo pesado, esto es un refresco local)
        if (typeof ProfileService === 'undefined') { console.error("Falta ProfileService"); return; }

        ProfileService.getProfile(userId)
            .done(function(res) {
                if (res.success) {
                    renderProfile(res);
                } else {
                    $infoContainer.html(`<div class="alert alert-warning text-center">${escapeHTML(res.message)}</div>`);
                }
            })
            .fail(function() {
                $infoContainer.html('<p class="text-center text-danger p-5">Error al cargar perfil.</p>');
            });
    }

    function renderProfile(res) {
        const user = res.user;
        const isOwn = res.is_own_profile;
        const published = res.publishedRecipes || [];
        const saved = res.savedRecipes || [];

        // Definimos los enlaces solo si es mi propio perfil
        const linkSiguiendo = isOwn ? 'href="activity.html?tab=following"' : 'href="javascript:void(0)"';
        const linkSeguidores = isOwn ? 'href="activity.html?tab=followers"' : 'href="javascript:void(0)"';
        const pointerClass = isOwn ? 'cursor-pointer' : '';

        // 1. INFO USUARIO
        let actionsHtml = isOwn 
            ? `<a href="profile-edit.html" class="btn btn-sm btn-outline-secondary"><i class="bi bi-pencil-fill me-1"></i> Editar Perfil</a>`//Print enlace editar perfil
            : `<button id="profileFollowBtn" class="btn btn-sm ${user.isFollowing ? 'btn-secondary' : 'btn-orange'}" data-userid="${user.id}">
                <i class="bi ${user.isFollowing ? 'bi-person-check-fill' : 'bi-person-plus-fill'}"></i> ${user.isFollowing ? 'Siguiendo' : 'Seguir'} 
               </button>`; //Print botón de seguir
        
        // Listener botón seguir mejorado con Notificaciones
        $(document).off('click', '#profileFollowBtn').on('click', '#profileFollowBtn', function() {
            if(typeof InteractionService !== 'undefined') {
                const uid = $(this).data('userid');
                const $btn = $(this);
                
                $btn.prop('disabled', true); // Evitar doble clic

                InteractionService.toggleFollow(uid).done(r => { 
                    if(r.success) {
                        // GESTIÓN DE NOTIFICACIONES (Idéntica a recipe.js)
                        if (typeof window.NotificationHelper !== 'undefined' && currentUserLocal) {
                            if (r.isFollowing) {
                                // Enviamos el ID de este usuario para que en el link salga su perfil
                                window.NotificationHelper.send(uid, 'seguidor', currentUserLocal.user_id);
                            } else {
                                // Borramos la notificación vinculada
                                window.NotificationHelper.remove(uid, 'seguidor', currentUserLocal.user_id);
                            }
                        }
                        init(); // Recargar perfil tras seguir para actualizar estadísticas
                    } 
                }).always(() => { $btn.prop('disabled', false); });
            }
        });

        const displayName = user.fullName || user.username;
        const infoHtml = `
            <div class="card shadow-sm mb-5 border-0 rounded-4">
                <div class="card-body p-4">
                    <div class="row align-items-center text-center text-md-start">
                        <div class="col-md-3 text-center mb-3">
                            <img src="${escapeHTML(user.avatarUrl)}" class="rounded-circle shadow-sm" style="width:140px; height:140px; object-fit:cover;">
                        </div>
                        <div class="col-md-9 border-start-md ps-md-4">
                            <div class="d-flex flex-column flex-md-row justify-content-between align-items-center mb-2">
                                <div>
                                    <h2 class="h3 fw-bold mb-0">@${escapeHTML(user.username)}</h2>
                                    <small class="text-muted">${escapeHTML(displayName)}</small>
                                </div>
                                <div class="mt-2 mt-md-0">${actionsHtml}</div>
                            </div>
                            <p class="text-muted" style="white-space: pre-wrap;">${escapeHTML(user.bio || "Sin biografía.")}</p>
                            <div class="d-flex justify-content-center justify-content-md-start gap-4 mt-3">
                                <a ${linkSiguiendo} class="text-center text-decoration-none text-dark ${pointerClass}">
                                    <b>${user.stats.following}</b><br><small class="text-muted">Siguiendo</small>
                                </a>
                                <a ${linkSeguidores} class="text-center text-decoration-none text-dark ${pointerClass}">
                                    <b>${user.stats.followers}</b><br><small class="text-muted">Seguidores</small>
                                </a>
                                <div class="text-center">
                                    <b>${published.length}</b><br><small class="text-muted">Recetas</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        $infoContainer.html(infoHtml);

        $('.seguidos').attr('href', 'activity.html');
        $('.seguidores').attr('href', 'activity.html');

        // 2. RECETAS PUBLICADAS
        $('#publishedRecipeCount').text(published.length);
        $pubGrid.empty();
        if (published.length > 0) {
            published.forEach(r => $pubGrid.append(createRecipeCardProfile(r, isOwn)));
        } else {
            $pubGrid.html('<div class="col-12"><p class="text-center text-muted py-5">Aún no hay recetas públicas.</p></div>');
        }

        // 3. RECETAS GUARDADAS
        if (isOwn) {
            $savedTabLi.show();
            $('#savedRecipeCount').text(saved.length);
            $savGrid.empty();
            if (saved.length > 0) {
                saved.forEach(r => $savGrid.append(createRecipeCardProfile(r, false)));
            } else {
                $savGrid.html('<div class="col-12"><p class="text-center text-muted py-5">No tienes recetas guardadas.</p></div>');
            }
        } else {
            $savedTabLi.hide();
        }
        $tabsContainer.fadeIn();
    }

    /**
     * Función MEJORADA para integrar Categoría, Dieta y Dificultad en el diseño
     */
    function createRecipeCardProfile(r, showVisibilityBadge) {
        // 1. Badge de Visibilidad (Pública/Privada) sobre la imagen
        let visibilityBadge = '';
        if (showVisibilityBadge) {
            const isPub = (r.visibilidad === 'publica');
            const badgeClass = isPub ? 'bg-success' : 'bg-secondary';
            const badgeIcon = isPub ? 'bi-eye' : 'bi-eye-slash';
            const badgeText = isPub ? 'Pública' : 'Privada';
            visibilityBadge = `<span class="badge position-absolute top-0 end-0 m-2 ${badgeClass} shadow-sm" style="z-index:10;">
                                <i class="bi ${badgeIcon}"></i> ${badgeText}
                               </span>`;
        }

        // 2. Datos básicos
        const img = r.imagen_url || 'resources/default-recipe.jpg';
        const time = formatTimeLocal(r.time);
        const recipeLink = `recipe.html?id=${r.id}`;

        // 3. Preparar Meta-datos (Categoría y Dieta)
        const categoria = r.categoria || '';
        const dieta = r.dieta || '';
        let metaString = '';
        if (categoria && dieta) metaString = `${escapeHTML(categoria)} &bull; ${escapeHTML(dieta)}`;
        else if (categoria) metaString = escapeHTML(categoria);
        else if (dieta) metaString = escapeHTML(dieta);

        // 4. Color y lógica de Dificultad
        const dif = r.dificultad || 'Normal';
        let difColor = 'text-secondary';
        let difIcon = 'bi-bar-chart';
        
        switch(dif.toLowerCase()) {
            case 'facil': difColor = 'text-success'; difIcon = 'bi-bar-chart-fill'; break;
            case 'normal': difColor = 'text-warning'; difIcon = 'bi-bar-chart-steps'; break;
            case 'dificil': difColor = 'text-danger'; difIcon = 'bi-graph-up-arrow'; break;
        }

        // --- HTML DISEÑO INTEGRADO ---
        return `
            <div class="col">
                <div class="card h-100 border-0 shadow-sm recipe-card position-relative overflow-hidden">
                    <a href="${recipeLink}" class="text-decoration-none text-dark h-100 d-flex flex-column">
                        
                        <!-- Imagen con Badge de Visibilidad -->
                        <div class="position-relative">
                            ${visibilityBadge}
                            <img src="${escapeHTML(img)}" class="card-img-top" style="height: 200px; object-fit: cover;" loading="lazy" alt="${escapeHTML(r.titulo)}">
                        </div>
                        
                        <div class="card-body d-flex flex-column p-3">
                            <!-- Metadatos Superiores (Categoría • Dieta) -->
                            <div class="text-uppercase text-muted fw-bold mb-2" style="font-size: 0.65rem; letter-spacing: 0.5px;">
                                ${metaString}
                            </div>

                            <!-- Título -->
                            <h6 class="card-title fw-bold mb-1 text-truncate" style="font-size: 1.1rem;">
                                ${escapeHTML(r.titulo)}
                            </h6>

                            <!-- Autor (Si no es propia) -->
                            ${r.author ? `<small class="text-muted mb-3 d-block">Por ${escapeHTML(r.author)}</small>` : '<div class="mb-3"></div>'}
                            
                            <!-- Pie de tarjeta: Dificultad, Tiempo, Likes -->
                            <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                                <!-- Izquierda: Dificultad con color -->
                                <span class="${difColor} small fw-semibold" title="Dificultad">
                                    <i class="bi ${difIcon}"></i> ${escapeHTML(dif)}
                                </span>
                                
                                <!-- Derecha: Tiempo y Likes -->
                                <div class="text-muted small">
                                    <span class="me-3"><i class="bi bi-clock"></i> ${time}</span>
                                    <span><i class="bi bi-heart-fill text-danger"></i> ${r.likes || 0}</span>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
            </div>`;
    }

    function escapeHTML(str) { return str ? $('<div>').text(String(str)).html() : ''; }
    
    function formatTimeLocal(m) {
        m = parseInt(m); if(!m) return '0 min';
        let h = Math.floor(m/60), min = m%60;
        return (h>0 ? h+'h ' : '') + (min>0 ? min+'min' : '');
    }

    /**
     * Escuchamos el evento global disparado por notifications.js
     * para obtener los datos del usuario logueado de forma segura.
     */
    $(document).on('sessionStatusChecked', function(event, sessionResponse) {
        if (sessionResponse && sessionResponse.is_logged_in) {
            currentUserLocal = sessionResponse.data;
            console.log("profile.js: Sesión detectada para acciones de seguimiento.");
        }
    });
});