// js/profile.js

$(document).ready(function() {
    const $profileInfoContainer = $('#profileInfoContainer');
    const $profileContentTabsContainer = $('#profileContentTabs'); // Contenedor de las pestañas y su contenido
    const $profileTabsList = $('#profileTabs'); // El <ul> de las pestañas
    const $publishedRecipesContainer = $('#publishedRecipesContainer');
    const $savedRecipesContainer = $('#savedRecipesContainer');

    if (typeof mockProfileData === 'undefined' || !mockProfileData || !mockProfileData.user) {
        console.error("ERROR: mockProfileData o mockProfileData.user no está definido.");
        $profileInfoContainer.html('<p class="text-center text-danger p-5">Error al cargar datos del perfil.</p>');
        $profileContentTabsContainer.hide(); 
        return; 
    }

    const viewingUserProfile = mockProfileData.user;
    const publishedRecipesData = mockProfileData.publishedRecipes || [];
    const savedRecipesData = mockProfileData.savedRecipes || []; // Estas solo se mostrarán si es el perfil propio
    
    // SIMULACIÓN: Quién está viendo la página. En una app real, esto vendría de la sesión.
    const loggedInUser = { 
        id: 'currentUser123', // ID del usuario logueado
        // Este es el perfil que ESTAMOS VIENDO, no necesariamente el del usuario logueado
        // Para determinar si es el perfil propio:
        isViewingOwnProfile: viewingUserProfile.isOwnProfile // Usamos el flag de mockProfileData.user
    };
    
    let currentUserIsFollowingTarget = viewingUserProfile.isFollowing; // Estado inicial si es perfil de otro


    function renderProfileInfo() {
        if (!$profileInfoContainer.length) return;

        let actionButtonsHtml = '';
        if (loggedInUser.isViewingOwnProfile) {
            actionButtonsHtml = `
                <a href="profile-edit.html?userId=${viewingUserProfile.id}" class="btn btn-sm btn-outline-secondary">
                    <i class="bi bi-pencil-fill me-1"></i> Editar Perfil
                </a>`;
        } else {
            // Botón de Seguir/Dejar de seguir para perfiles de otros usuarios
            actionButtonsHtml = `
                <button id="followProfileBtn" class="btn btn-sm ${currentUserIsFollowingTarget ? 'btn-secondary' : 'btn-orange'}">
                    <i class="bi ${currentUserIsFollowingTarget ? 'bi-person-check-fill' : 'bi-person-plus-fill'} me-1"></i> 
                    ${currentUserIsFollowingTarget ? 'Siguiendo' : 'Seguir'}
                </button>`;
        }

        const profileHtml = `
            <div class="card shadow-sm mb-5 border-0">
                <div class="card-body p-4">
                    <div class="row">
                        <div class="col-md-3 text-center mb-4 mb-md-0">
                            <img src="${viewingUserProfile.avatarUrl}" 
                                 alt="${escapeHTML(viewingUserProfile.fullName)}" 
                                 class="avatar img-fluid rounded-circle shadow-sm mb-3">
                            <h2 class="h4 fw-bold mb-1">${escapeHTML(viewingUserProfile.username)}</h2>
                            <p class="text-muted mb-2">${escapeHTML(viewingUserProfile.fullName)}</p>
                            <div class="d-flex justify-content-center gap-3 my-3">
                                <div class="text-center">
                                    <p class="fw-bold mb-0">${viewingUserProfile.stats.following || 0}</p>
                                    <small class="text-muted">Siguiendo</small>
                                </div>
                                <div class="text-center">
                                    <p class="fw-bold mb-0">${(viewingUserProfile.stats.followers || 0).toLocaleString('es-ES')}</p>
                                    <small class="text-muted">Seguidores</small>
                                </div>
                                <div class="text-center">
                                    <p class="fw-bold mb-0">${publishedRecipesData.filter(r => loggedInUser.isViewingOwnProfile || r.visibility === 'public').length || 0}</p>
                                    <small class="text-muted">Recetas</small>
                                </div>
                            </div>
                            <div class="d-flex flex-wrap justify-content-center gap-2 mt-3 profile-main-actions">
                                ${actionButtonsHtml}
                            </div>
                        </div>
                        <div class="col-md-9">
                            <div class="bg-white p-4 rounded-3 shadow-sm h-100">
                                <h3 class="h5 fw-bold mb-3 border-bottom pb-2">Sobre mí</h3>
                                <p class="text-muted mb-0" style="white-space: pre-wrap;">${escapeHTML(viewingUserProfile.bio || (loggedInUser.isViewingOwnProfile ? "Añade una biografía para que otros te conozcan." : "Este usuario aún no ha añadido una biografía."))}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        $profileInfoContainer.html(profileHtml);
        setupProfileButtonListeners(); 
    }

    function createRecipeCard(recipe, isOwnProfileViewing) {
        const $card = $('<div>').addClass('col');
        const recipeLink = `recipe.html?id=${recipe.id}`;
        
        // Para recetas guardadas, el autor es diferente al del perfil que se está viendo
        // Para recetas publicadas, el autor es el del perfil que se está viendo
        const authorName = isOwnProfileViewing ? viewingUserProfile.fullName : recipe.author;
        const authorProfileLink = isOwnProfileViewing ? `profile.html?userId=${viewingUserProfile.id}` : `profile.html?userId=${recipe.authorId}`;

        let visibilityBadgeHtml = '';
        // El distintivo de visibilidad solo se muestra si es el perfil propio y la receta es publicada por este usuario
        if (isOwnProfileViewing) { 
            const badgeClass = recipe.visibility === 'public' ? 'is-public' : 'is-private';
            const badgeIcon = recipe.visibility === 'public' ? 'bi-eye-fill' : 'bi-eye-slash-fill';
            const badgeText = recipe.visibility === 'public' ? 'Pública' : 'Oculta';
            visibilityBadgeHtml = `<span class="badge visibility-badge ${badgeClass}"><i class="bi ${badgeIcon}"></i> ${badgeText}</span>`;
        }
        
        const cardHtml = `
            <div class="card recipe-card h-100 shadow-sm">
                 <a href="${recipeLink}" class="text-decoration-none position-relative">
                    ${visibilityBadgeHtml}
                    <img src="${recipe.image}" class="card-img-top" alt="${escapeHTML(recipe.title)}">
                </a>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title mb-1">
                        <a href="${recipeLink}" class="text-dark text-decoration-none stretched-link">${escapeHTML(recipe.title)}</a>
                    </h5>
                    ${!isOwnProfileViewing && recipe.author ? `<p class="card-text text-muted small mb-2">Por: <a href="${authorProfileLink}" class="text-orange text-decoration-none">${escapeHTML(authorName)}</a></p>` : '<p class="card-text text-muted small mb-2"> </p>'}
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <span class="text-danger"> 
                            <i class="bi bi-heart-fill"></i> ${recipe.likes || 0}
                        </span>
                        <span class="badge bg-light text-dark">
                            <i class="bi bi-clock-fill"></i> ${escapeHTML(recipe.time)}
                        </span>
                    </div>
                </div>
            </div>`;
        $card.html(cardHtml);
        return $card;
    }

    function renderPublishedRecipes() {
        $publishedRecipesContainer.empty();
        // Si no es mi perfil, solo muestro las públicas. Si es mi perfil, muestro todas.
        const recipesToShow = loggedInUser.isViewingOwnProfile ? publishedRecipesData : publishedRecipesData.filter(r => r.visibility === 'public');
        
        $('#publishedRecipeCount').text(recipesToShow.length);

        if (recipesToShow.length > 0) {
            recipesToShow.forEach(recipe => {
                // El segundo argumento de createRecipeCard es true si es el perfil del usuario logueado Y estamos en la pestaña de publicadas por él.
                $publishedRecipesContainer.append(createRecipeCard(recipe, loggedInUser.isViewingOwnProfile)); 
            });
        } else {
            $publishedRecipesContainer.html(`<p class="text-center text-muted col-12">${loggedInUser.isViewingOwnProfile ? "Aún no has publicado recetas." : "Este usuario no tiene recetas públicas."}</p>`);
        }
    }

    function renderSavedRecipes() {
        $savedRecipesContainer.empty();
        // La pestaña de guardadas y su contenido solo se muestran si es el perfil propio
        if (loggedInUser.isViewingOwnProfile) {
            $('#saved-tab').show(); // Asegurar que la pestaña sea visible
            $('#savedRecipeCount').text(savedRecipesData.length);

            if (savedRecipesData.length > 0) {
                savedRecipesData.forEach(recipe => {
                    // El segundo argumento es false porque son recetas guardadas (podrían ser de otros autores)
                    $savedRecipesContainer.append(createRecipeCard(recipe, false)); 
                });
            } else {
                $savedRecipesContainer.html('<p class="text-center text-muted col-12">Aún no has guardado ninguna receta.</p>');
            }
        } else {
            $('#saved-tab').hide(); // Ocultar la pestaña "Guardadas" si no es mi perfil
            $('#saved').removeClass('show active'); // Asegurar que no esté activa
        }
    }

    function setupProfileButtonListeners() {
        const $followProfileBtn = $('#followProfileBtn');
        if ($followProfileBtn.length) {
            $followProfileBtn.on('click', function() {
                currentUserIsFollowingTarget = !currentUserIsFollowingTarget;
                $(this).html(`<i class="bi ${currentUserIsFollowingTarget ? 'bi-person-check-fill' : 'bi-person-plus-fill'} me-1"></i> ${currentUserIsFollowingTarget ? 'Siguiendo' : 'Seguir'}`);
                $(this).toggleClass('btn-orange', !currentUserIsFollowingTarget).toggleClass('btn-secondary', currentUserIsFollowingTarget);
                console.log('Siguiendo a este perfil:', currentUserIsFollowingTarget);
                // Aquí iría la llamada AJAX para actualizar el estado de seguimiento en el backend
                // mockProfileData.user.isFollowing = currentUserIsFollowingTarget; // Actualizar el mock localmente
            });
        }
    }

    function escapeHTML(str) {
        if (str === null || typeof str === 'undefined') return '';
        return $('<div>').text(String(str)).html();
    }

    // --- INICIALIZACIÓN ---
    renderProfileInfo(); // Renderiza el header del perfil y configura los botones de acción principales
    
    // Configurar y mostrar pestañas después de cargar la info del perfil
    if ($profileContentTabsContainer.length) {
        renderPublishedRecipes();
        renderSavedRecipes(); // Esta función ahora decide si mostrarse
        $profileContentTabsContainer.show(); // Mostrar el contenedor de las pestañas
    }

});