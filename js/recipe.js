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
    let confirmDeleteCommentModalInstance = null; // Nuevo modal

    // Inicializar modales
    try {
        // Nota: Bootstrap 5 requiere el elemento DOM nativo, por eso usamos [0] o .get(0) con jQuery
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
                    // Una vez tenemos la receta, cargamos sus comentarios
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

        // Permisos
        let isAuthor = currentUser && (parseInt(currentUser.user_id) === parseInt(data.id_usuario));
        let isAdmin = currentUser && (currentUser.id_rol == 1 || currentUser.id_rol == 2);
        
        // Solo mostrar si hay usuario logueado Y no es el propio autor
        if (currentUser && !isAuthor) {
            // Texto y Clase según estado
            let isFollowing = data.isFollowingAuthor === true || data.isFollowingAuthor === 1;

            let followText = isFollowing ? 'Seguido' : 'Seguir';

            //Clases segun estado Seguir o Seguido
            let followClass = isFollowing ? 'btn-follow' : 'btn-outline-orange';

            followBtnHTML = `
                <button id="followBtn" class="btn ${followClass}">
                    ${followText}
                </button>`;
        }

        // Botones de acción para el autor/admin
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
        
        // Delegación de evento para redirección al perfil
        $recipeDetailContainer.off('click', '#authorLink').on('click', '#authorLink', function(){
            redirectProfile(user_id);
        });

        // HTML Principal
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
        
        // Inicializar listeners para los elementos recién creados
        setupActionListeners(); 
        setupCommentFormListener();
    }

    // 6. FUNCIONES DE COMENTARIOS
    function loadComments(recipeId) {
        if (typeof CommentService === 'undefined') {
            console.error("CommentService no cargado.");
            return;
        }

        CommentService.getComments(recipeId)
            .done(function(response) {
                if (response.success) {
                    renderCommentsList(response.data);
                } else {
                    console.error("Error API comentarios:", response.message);
                }
            })
            .fail(function() {
                console.error("Fallo de red al cargar comentarios.");
            });
    }

    function renderCommentsList(comments) {
        $commentsListContainer.empty();
        
        if (!comments || comments.length === 0) {
            $commentsListContainer.html('<p class="text-muted text-center py-3">Aún no hay comentarios. ¡Sé el primero!</p>');
            return;
        }

        comments.forEach(c => {
            appendSingleComment(c);
        });
    }

    function appendSingleComment(c, prepend = false) {
        const date = new Date(c.fecha_comentario).toLocaleDateString();
        const avatar = c.avatar_url; // Asume que la API lo devuelve, si no, poner default
        
        // Lógica de botones (Eliminar vs Reportar)
        let actionBtnHTML = '';
        if (currentUser) {
            if (parseInt(currentUser.user_id) === parseInt(c.id_usuario)) {
                // Es MI comentario -> Botón Eliminar (Abre Modal)
                actionBtnHTML = `
                    <button class="btn btn-sm btn-link text-danger delete-comment-btn position-absolute top-0 end-0 m-2 p-0" title="Eliminar comentario" style="text-decoration: none;">
                        <i class="bi bi-trash"></i>
                    </button>`;
            } else {
                // NO es mi comentario -> Botón Reportar (Abre Modal)
                actionBtnHTML = `
                    <button class="btn btn-sm btn-link text-muted report-comment-btn position-absolute top-0 end-0 m-2 p-0" title="Denunciar comentario" style="text-decoration: none;">
                        <i class="bi bi-flag-fill"></i>
                    </button>`;
            }
        }

        const commentHtml = `
            <div class="comment-item mb-3 p-3 border rounded bg-white position-relative" data-comment-id="${c.id}">
                ${actionBtnHTML}
                <div class="d-flex align-items-center mb-2">
                    <h6 class="mb-0 fw-bold">
                        <a href="profile.html?userId=${c.id_usuario}" class="text-decoration-none text-dark hover-orange">
                            ${escapeHTML(c.username)}
                        </a>
                    </h6>
                    <small class="text-muted ms-2">• ${date}</small>
                </div>
                <p class="comment-content mb-0 text-secondary">${escapeHTML(c.contenido)}</p>
            </div>
        `;

        if (prepend) {
            $commentsListContainer.prepend(commentHtml);
            $commentsListContainer.find('.no-comments-message').remove();
        } else {
            $commentsListContainer.append(commentHtml);
        }
    }

    // Función que realiza la llamada AJAX para borrar COMENTARIO
    function deleteCommentConfirmed() {
        if (!commentIdToDelete) return;

        CommentService.deleteComment(commentIdToDelete)
            .done(function(resp) {
                if (resp.success) {
                    // Recargar lista completa para evitar inconsistencias
                    loadComments(currentRecipeData.id); 
                } else {
                    console.error("Error al eliminar comentario:", resp.message);
                }
            })
            .fail(function() {
                console.error("Error de red al eliminar el comentario.");
            })
            .always(function() {
                // Ocultar modal y limpiar variable
                if (confirmDeleteCommentModalInstance) confirmDeleteCommentModalInstance.hide();
                commentIdToDelete = null;
            });
    }

    // Funcion para redirecionar al perfil
    function redirectProfile(userId){
        if(userId){
            window.location.assign(`profile.html?userId=${userId}`);
        }
    }


    // 7. LISTENERS DE ACCIONES Y FORMULARIOS
    function setupCommentFormListener() {
        if ($addCommentForm.length) {
            // Usamos .off().on() para asegurar que no duplicamos listeners
            $addCommentForm.off('submit').on('submit', function(e) {
                e.preventDefault();
                const $textarea = $('#commentText');
                const text = $textarea.val().trim();
                const $btn = $addCommentForm.find('button[type="submit"]');

                if (!text) return;

                const originalText = $btn.text();
                $btn.prop('disabled', true).text("Publicando...");

                CommentService.addComment(currentRecipeData.id, text)
                    .done(function(resp) {
                        if (resp.success) {
                            $textarea.val('');
                            // Pintar el nuevo comentario inmediatamente
                            appendSingleComment(resp.data, true); 
                        } else {
                            console.error("Error:", resp.message);
                        }
                    })
                    .fail(function() {
                        console.error("Error de red al publicar.");
                    })
                    .always(function() {
                        $btn.prop('disabled', false).text(originalText);
                    });
            });
        }
    }

    // 7. LISTENERS DE ACCIONES
    function setupActionListeners() {
        
        // --- RECETA: Eliminar (Abre Modal) ---
        const $deleteBtn = $('#deleteRecipeBtn');
        if ($deleteBtn.length) {
            $deleteBtn.on('click', function() {
                if (confirmDeleteRecipeModalInstance) {
                    confirmDeleteRecipeModalInstance.show();
                } else {
                    console.error("Modal Borrar Receta no inicializado");
                }
            });
        }

        // --- RECETA: Confirmar Eliminación (AJAX REAL REUTILIZABLE) ---
        $('#confirmDeleteRecipeBtn').off('click').on('click', function() {
            RecipeService.deleteRecipe(currentRecipeData.id)
                .done(function(resp) {
                    if (confirmDeleteRecipeModalInstance) confirmDeleteRecipeModalInstance.hide();
                    if (resp.success) {
                        $recipeDetailContainer.html('<div class="alert alert-success text-center">Receta eliminada correctamente. Redirigiendo...</div>');
                        setTimeout(() => window.location.href = 'index.html', 2000);
                    } else {
                        console.error("Error al eliminar receta:", resp.message);
                    }
                })
                .fail(function() { console.error("Error de conexión al eliminar."); });
        });
        
        // --- RECETA: Like (Me Gusta) ---
        let $likeBtn = $('#likeRecipeBtn');
        let $likesDisplay = $('#likesCountDisplay');
        if ($likeBtn.length && currentUser) {
            $likeBtn.on('click', function() {
                let isLiked = $likeBtn.toggleClass('liked').hasClass('liked');
                let $heartEmpty = $likeBtn.find('.bi-suit-heart');
                let $heartFill = $likeBtn.find('.bi-suit-heart-fill');
                
                if (isLiked) {
                    $heartEmpty.addClass('d-none');
                    $heartFill.removeClass('d-none');
                    currentRecipeData.likesCount++;
                } else {
                    $heartEmpty.removeClass('d-none');
                    $heartFill.addClass('d-none');
                    currentRecipeData.likesCount--;
                }
                $likesDisplay.text(`${currentRecipeData.likesCount} me gusta`);

                if (typeof InteractionService !== 'undefined') {
                    InteractionService.toggleLike(currentRecipeData.id).done(function(resp) {
                        if(resp.success) $likesDisplay.text(`${resp.newCount} me gusta`);
                    });
                }
            });
        } else if ($likeBtn.length) {
            $likeBtn.on('click', function() { window.location.href = 'logReg.html#login'; });
        }

        // --- RECETA: Guardar (Favorito) ---
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
        } else if ($favBtn.length) {
            $favBtn.on('click', function() { window.location.href = 'logReg.html#login'; });
        }

        // --- SEGUIR / DEJAR DE SEGUIR ---
        // CORRECCIÓN: Definir la variable antes de usarla
        const followBtn = document.getElementById('followBtn');
        
        if (followBtn) {
            // Clonamos el botón para limpiar listeners previos
            const newFollowBtn = followBtn.cloneNode(true);
            followBtn.parentNode.replaceChild(newFollowBtn, followBtn);

            newFollowBtn.addEventListener('click', function() {
                if (!currentUser) {
                    window.location.href = 'logReg.html#login';
                    return;
                }

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
                                    currentRecipeData.isFollowingAuthor = true;
                                } else {
                                    newFollowBtn.textContent = 'Seguir';
                                    newFollowBtn.classList.remove('btn-follow');
                                    newFollowBtn.classList.add('btn-outline-orange');
                                    currentRecipeData.isFollowingAuthor = false;
                                }
                            } else {
                                console.error("Error al seguir:", resp.message);
                            }
                        })
                        .fail(function() {
                            console.error("Error de conexión al intentar seguir.");
                        })
                        .always(function() {
                            newFollowBtn.disabled = false;
                        });
                } else {
                    console.error("InteractionService no está cargado.");
                    newFollowBtn.disabled = false;
                }
            });
        }

        // --- RECETA: Reportar (Abre Modal) ---
        let $reportBtn = $('#reportRecipeBtn');
        if ($reportBtn.length) {
            $reportBtn.on('click', function() {
                if (confirmReportRecipeModalInstance) confirmReportRecipeModalInstance.show();
            });
        }

        // --- RECETA: Confirmar Reporte (Botón del Modal) ---
        let $confirmReportRecBtn = $('#confirmReportRecipeBtn');
        if ($confirmReportRecBtn.length) {
            $confirmReportRecBtn.off('click').on('click', function() {
                if (typeof InteractionService !== 'undefined') {
                    InteractionService.reportRecipe(currentRecipeData.id).done(function(resp) {
                        if (confirmReportRecipeModalInstance) confirmReportRecipeModalInstance.hide();
                    });
                }
            });
        }

        // --- COMENTARIOS: Delegación de eventos (Click en lista) ---
        if ($commentsListContainer.length) {
            $commentsListContainer.off('click').on('click', function(e) {
                const $target = $(e.target);

                // A. ELIMINAR COMENTARIO
                const $deleteBtn = $target.closest('.delete-comment-btn');
                if ($deleteBtn.length) {
                    const $commentItem = $deleteBtn.closest('.comment-item');
                    commentIdToDelete = $commentItem.data('comment-id'); 
                    
                    if (confirmDeleteCommentModalInstance) {
                        confirmDeleteCommentModalInstance.show();
                    } else {
                        if(confirm("¿Eliminar comentario?")) deleteCommentConfirmed();
                    }
                    return;
                }

                // B. REPORTAR COMENTARIO
                const $reportBtn = $target.closest('.report-comment-btn');
                if ($reportBtn.length) {
                    const $commentItem = $reportBtn.closest('.comment-item');
                    commentToReport = $commentItem.data('comment-id'); 
                    if (confirmReportCommentModalInstance) confirmReportCommentModalInstance.show();
                }
            });
        }
        
        // --- COMENTARIOS: Confirmar Borrado ---
        $('#confirmDeleteCommentBtn').off('click').on('click', function() {
            deleteCommentConfirmed();
        });

        // --- COMENTARIOS: Confirmar Reporte ---
        $('#confirmReportCommentBtn').off('click').on('click', function() {
            if (commentIdToReport && typeof InteractionService !== 'undefined') {
                InteractionService.reportComment(commentIdToReport, currentRecipeData.id).done(function(resp) {
                    if (confirmReportCommentModalInstance) confirmReportCommentModalInstance.hide();
                });
            }
        });
    }

    // Utilidades
    function escapeHTML(str) {
        if (!str) return '';
        return $('<div>').text(String(str)).html();
    }
    
    function formatRecipeDuration(totalMinutes) {
        if (typeof window.formatRecipeDuration === 'function') return window.formatRecipeDuration(totalMinutes);
        
        let m = parseInt(totalMinutes);
        if(!m) return '0 min';
        let h = Math.floor(m / 60);
        let min = m % 60;
        return (h > 0 ? h + 'h ' : '') + (min > 0 ? min + 'min' : '');
    }
});