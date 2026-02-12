// TFG/js/recipe.js

$(document).ready(function() {
    console.log("recipe.js: Iniciando (jQuery mode)...");

    // 1. SELECTORES PRINCIPALES (Cacheados con jQuery)
    const $recipeDetailContainer = $('#recipeDetailContainer');
    const $commentsSection = $('#comments-section');
    const $commentsListContainer = $('#commentsListContainer');
    const $addCommentForm = $('#addCommentForm');

    // 2. ESTADO
    let currentRecipeData = null;
    let currentUser = null; 
    
    // Variables temporales para acciones en modales
    let commentIdToReport = null;
    let commentIdToDelete = null;
    
    // Instancias de Modales Bootstrap
    let confirmDeleteRecipeModalInstance = null;
    let confirmReportCommentModalInstance = null;
    let confirmReportRecipeModalInstance = null;
    let confirmDeleteCommentModalInstance = null; 

    // Inicializar modales
    try {
        if ($('#confirmDeleteRecipeModal').length) {
            confirmDeleteRecipeModalInstance = new bootstrap.Modal($('#confirmDeleteRecipeModal')[0]);
        }
        if ($('#confirmReportCommentModal').length) {
            confirmReportCommentModalInstance = new bootstrap.Modal($('#confirmReportCommentModal')[0]);
        }
        if ($('#confirmReportRecipeModal').length) {
            confirmReportRecipeModalInstance = new bootstrap.Modal($('#confirmReportRecipeModal')[0]);
        }
        if ($('#confirmDeleteCommentModal').length) {
            confirmDeleteCommentModalInstance = new bootstrap.Modal($('#confirmDeleteCommentModal')[0]);
        }
    } catch (e) { 
        console.error("Error init modales recipe.js", e); 
    }

    // 3. INICIO: Obtener ID y Verificar Sesión
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (!recipeId) {
        $recipeDetailContainer.html('<div class="alert alert-danger text-center">Error: No se especificó ninguna receta.</div>');
        return;
    }

    // Paso A: Chequear sesión real
    if (typeof AuthService !== 'undefined') {
        AuthService.checkSession()
            .done(function(response) {
                if (response && response.is_logged_in && response.data) {
                    currentUser = response.data;
                    console.log("Usuario logueado:", currentUser.username);
                    $addCommentForm.show(); 
                } else {
                    console.log("Visitante anónimo.");
                }
                loadRecipeData(recipeId);
            })
            .fail(function() {
                console.error("Error al verificar sesión.");
                loadRecipeData(recipeId); 
            });
    } else {
        loadRecipeData(recipeId);
    }

    // 4. CARGAR DATOS DE LA API (RECETA)
    function loadRecipeData(id) {
        if (typeof RecipeService === 'undefined') {
            $recipeDetailContainer.html('<div class="alert alert-danger">Error: RecipeService no cargado.</div>');
            return;
        }

        RecipeService.getRecipeById(id)
            .done(function(response) {
                if (response && response.success && response.data) {
                    currentRecipeData = response.data;
                    renderRecipe(currentRecipeData);
                    loadComments(currentRecipeData.id);
                } else {
                    $recipeDetailContainer.html(`<div class="alert alert-warning text-center">${escapeHTML(response.message || 'Receta no encontrada.')}</div>`);
                }
            })
            .fail(function() {
                $recipeDetailContainer.html('<div class="alert alert-danger text-center">Error de comunicación al cargar la receta.</div>');
            });
    }

    // 5. RENDERIZADO DE LA RECETA
    function renderRecipe(data) {
        let publishDateFormatted = new Date(data.fecha_publicacion).toLocaleDateString('es-ES', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        });
        let imageUrl = data.imagen_url;
        let avatarUrl = data.autor_avatar;
        let prepTimeFormatted = formatRecipeDuration(data.tiempo_preparacion_min);
        let followBtnHTML = '';

        let isAuthor = currentUser && (parseInt(currentUser.user_id) === parseInt(data.id_usuario));
        let isAdmin = currentUser && (currentUser.id_rol == 1 || currentUser.id_rol == 2);
        
        if (currentUser && !isAuthor) {
            let isFollowing = data.isFollowingAuthor === true || data.isFollowingAuthor === 1;
            let followText = isFollowing ? 'Seguido' : 'Seguir';
            let followClass = isFollowing ? 'btn-follow' : 'btn-outline-orange';

            followBtnHTML = `
                <button id="followBtn" class="btn ${followClass}">
                    ${followText}
                </button>`;
        }

        let authorActionButtonsHTML = '';
        if (isAuthor) {
            authorActionButtonsHTML = `
                <div class="recipe-action-buttons btn-group ms-md-auto d-flex gap-2">
                    <a href="formReceta.html?edit=${data.id}" class="btn btn-outline-secondary btn-edit-recipe" title="Editar Receta">
                        <i class="bi bi-pencil-square"></i> Editar
                    </a>
                    <button type="button" class="btn btn-delete-recipe btn-outline-danger" id="deleteRecipeBtn" title="Eliminar Receta">
                        <i class="bi bi-trash-fill"></i> Eliminar
                    </button>
                </div>`;
        } else if (isAdmin) {
             authorActionButtonsHTML = `
                <div class="recipe-action-buttons btn-group ms-md-auto d-flex gap-2">
                    <button type="button" class="btn btn-delete-recipe btn-outline-danger" id="deleteRecipeBtn" title="Eliminar Receta (Admin)">
                        <i class="bi bi-trash-fill"></i> Eliminar
                    </button>
                </div>`;
        }
        
        let user_id = data.id_usuario;
        $recipeDetailContainer.off('click', '#authorLink').on('click', '#authorLink', function(){
            redirectProfile(user_id);
        });

        const htmlContent = `
            <div class="card shadow-lg border-0 overflow-hidden">
                <div class="card-header bg-white border-0 pb-0">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h1 class="h2 mb-1 fw-bold">${escapeHTML(data.titulo)}</h1>
                            <p class="text-muted lead mb-2">${escapeHTML(data.descripcion)}</p>
                        </div>
                        <div class="d-flex align-items-center recipe-header-actions">
                            ${(currentUser && !isAuthor) ? `
                            <button id="reportRecipeBtn" class="btn btn-report-recipe me-2" title="Denunciar Receta">
                                <i class="bi bi-flag-fill"></i>
                            </button>` : ''}
                            
                            <button id="favoriteBtn" class="btn btn-outline-secondary border-0 fs-4 p-2 ${data.userHasSaved ? 'favorito' : ''}" title="Guardar en Favoritos">
                                <i class="bi bi-bookmark"></i>
                                <i class="bi bi-bookmark-fill"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="recipe-image-container mb-4 text-center">
                        <img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(data.titulo)}" class="recipe-image img-fluid rounded-3 w-100">
                    </div>
                    
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                        <div id="authorLink" class="d-flex align-items-center gap-3 mb-3 mb-md-0 recipe-author-link" style="cursor:pointer">
                            <img src="${escapeHTML(avatarUrl)}" alt="${escapeHTML(data.autor_username)}" class="avatar rounded-circle" width="50" height="50">
                            <div>
                                <h3 class="h5 mb-0">${escapeHTML(data.autor_username)}</h3>
                                <small class="text-muted">Publicado el ${publishDateFormatted}</small>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-2 btn-actions">
                            ${(currentUser && !isAuthor) ? `
                            ${followBtnHTML}` : ''}
                            ${authorActionButtonsHTML} 
                        </div>
                    </div>

                    <div class="d-flex flex-wrap justify-content-start gap-3 mb-4 text-muted border-top border-bottom py-3">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-clock me-2 fs-5 text-orange"></i>
                            <span>${prepTimeFormatted}</span>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="bi bi-people me-2 fs-5 text-orange"></i>
                            <span>${escapeHTML(data.porciones)}</span>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="bi bi-fire me-2 fs-5 text-orange"></i>
                            <span>Dificultad: ${escapeHTML(data.dificultad)}</span>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="bi bi-tag me-2 fs-5 text-orange"></i>
                            <span>Categoría: ${escapeHTML(data.nombre_categoria || data.categoria)}</span>
                        </div>
                        <div class="d-flex align-items-center">
                            <i class="bi bi-apple me-2 fs-5 text-orange"></i>
                            <span>Dieta: ${escapeHTML(data.nombre_dieta || data.dieta)}</span>
                        </div>
                    </div>

                    <section class="mb-5">
                        <h3 class="h4 mb-3 fw-bold">Ingredientes</h3>
                        <ul class="list-group list-group-flush">
                            ${(data.ingredientes || []).map(ing => `<li class="list-group-item bg-orange-10 border-0 mb-1 rounded"><i class="bi bi-caret-right-square-fill me-2 text-success"></i>${escapeHTML(ing)}</li>`).join('')}
                        </ul>
                    </section>

                    <section class="mb-5">
                        <h3 class="h4 mb-3 fw-bold">Preparación</h3>
                        <ol class="list-group list-group-numbered">
                            ${(data.pasos || []).map(step => `<li class="list-group-item bg-orange-10 border-0 mb-2 rounded">${escapeHTML(step)}</li>`).join('')}
                        </ol>
                    </section>

                    ${data.consejos_chef ? `
                    <section class="mb-5">
                        <h3 class="h4 mb-3 fw-bold">Consejos del chef</h3>
                        <div class="chef-tips p-4 rounded-3 bg-light border-start border-4 border-warning">
                            <i class="bi bi-lightbulb-fill text-warning me-2"></i>
                            <span class="mb-0 fst-italic">${escapeHTML(data.consejos_chef)}</span>
                        </div>
                    </section>` : ''}
                </div>
                
                <div class="card-footer bg-white d-flex flex-wrap justify-content-between align-items-center border-0 pt-0 pb-3">
                    <div class="d-flex align-items-center">
                        <button id="likeRecipeBtn" class="btn btn-like-recipe ${data.userHasLiked ? 'liked' : ''} border-0 fs-3 p-0 me-2" title="${data.userHasLiked ? 'Quitar Me Gusta' : 'Me Gusta'}">
                            <i class="bi bi-suit-heart ${data.userHasLiked ? 'd-none' : ''}"></i>
                            <i class="bi bi-suit-heart-fill text-danger ${data.userHasLiked ? '' : 'd-none'}"></i>
                        </button>
                        <span id="likesCountDisplay" class="ms-1 text-muted fw-bold">${data.likesCount} me gusta</span>
                    </div>
                </div>
            </div>`;
        
        $recipeDetailContainer.html(htmlContent);
        $commentsSection.show();
        setupActionListeners(); 
        setupCommentFormListener();
    }

    // 6. FUNCIONES DE COMENTARIOS
    function loadComments(recipeId) {
        if (typeof CommentService === 'undefined') return;
        CommentService.getComments(recipeId).done(function(response) {
            if (response.success) renderCommentsList(response.data);
        });
    }

    function renderCommentsList(comments) {
        $commentsListContainer.empty();
        if (!comments || comments.length === 0) {
            $commentsListContainer.html('<p class="text-muted text-center py-3">Aún no hay comentarios. ¡Sé el primero!</p>');
            return;
        }
        comments.forEach(c => appendSingleComment(c));
    }

    function appendSingleComment(c, prepend = false) {
        const date = new Date(c.fecha_comentario).toLocaleDateString();
        let actionBtnHTML = '';
        if (currentUser) {
            if (parseInt(currentUser.user_id) === parseInt(c.id_usuario)) {
                actionBtnHTML = `<button class="btn btn-sm btn-link text-danger delete-comment-btn position-absolute top-0 end-0 m-2 p-0" title="Eliminar comentario" style="text-decoration: none;"><i class="bi bi-trash"></i></button>`;
            } else {
                actionBtnHTML = `<button class="btn btn-sm btn-link text-muted report-comment-btn position-absolute top-0 end-0 m-2 p-0" title="Denunciar comentario" style="text-decoration: none;"><i class="bi bi-flag-fill"></i></button>`;
            }
        }
        const commentHtml = `<div class="comment-item mb-3 p-3 border rounded bg-white position-relative" data-comment-id="${c.id}">${actionBtnHTML}<div class="d-flex align-items-center mb-2"><h6 class="mb-0 fw-bold"><a href="profile.html?userId=${c.id_usuario}" class="text-decoration-none text-dark hover-orange">${escapeHTML(c.username)}</a></h6><small class="text-muted ms-2">• ${date}</small></div><p class="comment-content mb-0 text-secondary">${escapeHTML(c.contenido)}</p></div>`;
        if (prepend) { $commentsListContainer.prepend(commentHtml); $commentsListContainer.find('.no-comments-message').remove(); }
        else { $commentsListContainer.append(commentHtml); }
    }

    function deleteCommentConfirmed() {
        if (!commentIdToDelete) return;
        CommentService.deleteComment(commentIdToDelete).done(function(resp) {
            if (resp.success) {
                // ELIMINAR NOTIFICACIÓN DE COMENTARIO
                if (typeof window.NotificationHelper !== 'undefined') {
                    window.NotificationHelper.remove(currentRecipeData.id_usuario, 'comentario', currentRecipeData.id);
                }
                loadComments(currentRecipeData.id); 
            }
        }).always(function() {
            if (confirmDeleteCommentModalInstance) confirmDeleteCommentModalInstance.hide();
            commentIdToDelete = null;
        });
    }

    function redirectProfile(userId){ if(userId) window.location.assign(`profile.html?userId=${userId}`); }

    function setupCommentFormListener() {
        if ($addCommentForm.length) {
            $addCommentForm.off('submit').on('submit', function(e) {
                e.preventDefault();
                const $textarea = $('#commentText');
                const text = $textarea.val().trim();
                if (!text) return;
                const $btn = $addCommentForm.find('button[type="submit"]');
                $btn.prop('disabled', true);
                
                CommentService.addComment(currentRecipeData.id, text).done(function(resp) {
                    if (resp.success) {
                        $textarea.val('');
                        appendSingleComment(resp.data, true); 

                        // DISPARAR NOTIFICACIÓN DE COMENTARIO
                        if (typeof window.NotificationHelper !== 'undefined') {
                            window.NotificationHelper.send(currentRecipeData.id_usuario, 'comentario', currentRecipeData.id);
                        }
                    }
                }).always(() => $btn.prop('disabled', false));
            });
        }
    }

    // 7. LISTENERS DE ACCIONES
    function setupActionListeners() {
        // --- RECETA: Eliminar ---
        $('#deleteRecipeBtn').on('click', () => confirmDeleteRecipeModalInstance?.show());

        $('#confirmDeleteRecipeBtn').off('click').on('click', function() {
            RecipeService.deleteRecipe(currentRecipeData.id).done(function(resp) {
                if (confirmDeleteRecipeModalInstance) confirmDeleteRecipeModalInstance.hide();
                if (resp.success) window.location.href = 'index.html';
            });
        });
        
        // --- RECETA: Like ---
        let $likeBtn = $('#likeRecipeBtn');
        let $likesDisplay = $('#likesCountDisplay');
        if ($likeBtn.length && currentUser) {
            $likeBtn.on('click', function() {
                let haDadoLike = $likeBtn.toggleClass('liked').hasClass('liked');
                let $heartEmpty = $likeBtn.find('.bi-suit-heart');
                let $heartFill = $likeBtn.find('.bi-suit-heart-fill');
                
                if (haDadoLike) {
                    $heartEmpty.addClass('d-none'); $heartFill.removeClass('d-none');
                    currentRecipeData.likesCount++;
                } else {
                    $heartEmpty.removeClass('d-none'); $heartFill.addClass('d-none');
                    currentRecipeData.likesCount--;
                }
                $likesDisplay.text(`${currentRecipeData.likesCount} me gusta`);

                if (typeof InteractionService !== 'undefined') {
                    InteractionService.toggleLike(currentRecipeData.id).done(function(resp) {
                        if(resp.success) {
                            $likesDisplay.text(`${resp.newCount} me gusta`);
                            if (typeof window.NotificationHelper !== 'undefined') {
                                if (haDadoLike) {
                                    window.NotificationHelper.send(currentRecipeData.id_usuario, 'like', currentRecipeData.id);
                                } else {
                                    window.NotificationHelper.remove(currentRecipeData.id_usuario, 'like', currentRecipeData.id);
                                }
                            }
                        }
                    });
                }
            });
        } else if ($likeBtn.length) {
            $likeBtn.on('click', () => window.location.href = 'logReg.html#login');
        }

        // --- RECETA: Guardar ---
        let $favBtn = $('#favoriteBtn');
        if ($favBtn.length && currentUser) {
            $favBtn.on('click', function() {
                if (typeof InteractionService !== 'undefined') {
                    InteractionService.toggleSave(currentRecipeData.id).done(function(resp) {
                        if (resp.success) {
                            if (resp.saved) $favBtn.addClass('favorito');
                            else $favBtn.removeClass('favorito');
                        }
                    });
                }
            });
        }

        // --- SEGUIR / DEJAR DE SEGUIR ---
        const followBtn = document.getElementById('followBtn');
        if (followBtn) {
            const newFollowBtn = followBtn.cloneNode(true);
            followBtn.parentNode.replaceChild(newFollowBtn, followBtn);

            newFollowBtn.addEventListener('click', function() {
                if (!currentUser) { window.location.href = 'logReg.html#login'; return; }
                newFollowBtn.disabled = true;
                const authorId = currentRecipeData.id_usuario;

                if (typeof InteractionService !== 'undefined') {
                    InteractionService.toggleFollow(authorId)
                        .done(function(resp) {
                            if (resp.success) {
                                if (resp.isFollowing) {
                                    newFollowBtn.textContent = 'Seguido';
                                    newFollowBtn.classList.remove('btn-outline-orange');
                                    newFollowBtn.classList.add('btn-follow');
                                    
                                    // ENVIAR NOTIFICACIÓN DE SEGUIDOR
                                    // Enviamos currentUser.user_id como contenido_id para que el backend 
                                    // lo vincule y el enlace apunte al perfil del seguidor.
                                    if (typeof window.NotificationHelper !== 'undefined') {
                                        window.NotificationHelper.send(authorId, 'seguidor', currentUser.user_id);
                                    }
                                } else {
                                    newFollowBtn.textContent = 'Seguir';
                                    newFollowBtn.classList.remove('btn-follow');
                                    newFollowBtn.classList.add('btn-outline-orange');
                                    
                                    // ELIMINAR NOTIFICACIÓN DE SEGUIDOR
                                    if (typeof window.NotificationHelper !== 'undefined') {
                                        window.NotificationHelper.remove(authorId, 'seguidor', currentUser.user_id);
                                    }
                                }
                            }
                        })
                        .always(() => newFollowBtn.disabled = false);
                }
            });
        }

        // --- REPORTES ---
        $('#reportRecipeBtn').on('click', () => confirmReportRecipeModalInstance?.show());
        $('#confirmReportRecipeBtn').off('click').on('click', function() {
            if (typeof InteractionService !== 'undefined') {
                InteractionService.reportRecipe(currentRecipeData.id).done(() => confirmReportRecipeModalInstance?.hide());
            }
        });

        if ($commentsListContainer.length) {
            $commentsListContainer.off('click').on('click', function(e) {
                const $target = $(e.target);
                const $del = $target.closest('.delete-comment-btn');
                const $rep = $target.closest('.report-comment-btn');
                if ($del.length) {
                    commentIdToDelete = $del.closest('.comment-item').data('comment-id'); 
                    confirmDeleteCommentModalInstance?.show();
                }
                if ($rep.length) {
                    commentIdToReport = $rep.closest('.comment-item').data('comment-id'); 
                    confirmReportCommentModalInstance?.show();
                }
            });
        }
        
        $('#confirmDeleteCommentBtn').off('click').on('click', () => deleteCommentConfirmed());
        $('#confirmReportCommentBtn').off('click').on('click', function() {
            if (commentIdToReport && typeof InteractionService !== 'undefined') {
                InteractionService.reportComment(commentIdToReport, currentRecipeData.id).done(() => confirmReportCommentModalInstance?.hide());
            }
        });
    }

    function escapeHTML(str) { return str ? $('<div>').text(String(str)).html() : ''; }
    function formatRecipeDuration(totalMinutes) {
        let m = parseInt(totalMinutes); if(!m) return '0 min';
        let h = Math.floor(m / 60); let min = m % 60;
        return (h > 0 ? h + 'h ' : '') + (min > 0 ? min + 'min' : '');
    }
});