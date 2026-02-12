// TFG/js/index.js
$(document).ready(function() {
    console.log("index.js: DOM ready. Configurando listener para 'sessionStatusChecked'.");

    let pageSessionData = null; 
    let globalRecipes = []; // Almacenará todas las recetas descargadas
    let featuredChefs = [];

    // Escuchar el evento personalizado disparado por notifications.js
    $(document).on('sessionStatusChecked', function(event, sessionResponse) {
        console.log("index.js: Evento 'sessionStatusChecked' recibido.", sessionResponse);
        pageSessionData = sessionResponse;
        
        // Mostrar pestaña de siguiendo si el usuario está logueado
        if (sessionResponse && sessionResponse.is_logged_in) {
            $('#following-tab-li').removeClass('d-none');
        }

        loadInitialPageContent(sessionResponse); 
    });

    // Fallback por si el evento no llega
    const sessionCheckTimeout = setTimeout(function() {
        if (pageSessionData === null && (!$('#popularRecipesContainer').length || $('#popularRecipesContainer').is(':empty')) ) {
            console.warn("index.js: Timeout. Cargando contenido como invitado.");
            const fallbackData = (window.globalSessionData && window.globalSessionData.checked) ? 
                                 window.globalSessionData : 
                                 { is_logged_in: false, data: null };
            loadInitialPageContent(fallbackData);
        }
    }, 3000); 

    // --- Selectores Globales ---
    const $followingContainer = $('#followingRecipesContainer');
    const $popularContainer = $('#popularRecipesContainer');
    const $trendingContainer = $('#trendingRecipesContainer');
    const $featuredChefsContainer = $('#featuredChefsContainer');
    const $timeMaxSlider = $('#timeMaxSlider');
    const $timeMaxValueDisplay = $('#timeMaxValueDisplay');
    const $mainSearchInput = $('#mainSearchInput');
    const $categoryFilter = $('#categoryFilter');
    const $dietFilterSelect = $('#dietFilter');
    const $difficultyFilter = $('#difficultyFilter');
    const $sortOrderFilter = $('#sortOrderFilter');
    const $applyFiltersBtn = $('#applyFiltersBtn');

    // --- CARGA DE CONTENIDO ---
    function loadInitialPageContent(sessionDataForPage) {
        clearTimeout(sessionCheckTimeout); 

        // 1. Configurar Listeners de Filtros
        setupFilterListeners();

        // 2. Cargar Recetas de la API
        console.log("index.js: Solicitando recetas públicas...");
        
        let recipesPromise;
        if (typeof RecipeService !== 'undefined') {
            recipesPromise = RecipeService.getAllPublicRecipes();
        } else {
            console.error("RecipeService no definido.");
            recipesPromise = $.Deferred().reject().promise();
        }

        // 3. Cargar Filtro de Dietas
        let dietTypesPromise;
        if (typeof loadAndPopulateDietTypes === 'function') {
            dietTypesPromise = loadAndPopulateDietTypes();
        } else {
            dietTypesPromise = $.Deferred().resolve().promise();
        }

        // Cuando ambas (recetas y estructura) estén listas o fallen
        recipesPromise
            .done(function(response) {
                if (response.success) {
                    globalRecipes = response.data; // Guardamos para filtrar en local
                    
                    // Extraer chefs de los datos reales del feed
                    extractFeaturedChefs(globalRecipes);
                    console.log(`index.js: ${globalRecipes.length} recetas cargadas.`);
                } else {
                    console.error("Error cargando recetas:", response.message);
                }
            })
            .fail(function() { console.error("Error red al cargar recetas."); })
            .always(function() {
                dietTypesPromise.always(function() {
                    filterAndRenderRecipes(); // Renderiza por primera vez
                    renderFeaturedChefs();    // Renderiza la lista de chefs
                });
            });
    }

    function setupFilterListeners() {
        if ($timeMaxSlider.length) {
            $timeMaxSlider.off('input').on('input', function() { 
                $timeMaxValueDisplay.text(formatTimeForDisplaySlider($(this).val())); 
            });
            $timeMaxSlider.trigger('input'); 
        }

        const events = 'change.indexfilters';
        const selectors = '#categoryFilter, #dietFilter, #difficultyFilter, #sortOrderFilter';
        
        $(selectors).off(events).on(events, filterAndRenderRecipes);

        $timeMaxSlider.on('change', filterAndRenderRecipes);

        if($applyFiltersBtn.length) $applyFiltersBtn.off('click').on('click', filterAndRenderRecipes);
        
        if($mainSearchInput.length) $mainSearchInput.off('keypress').on('keypress', function(e) { 
            if (e.which === 13) { e.preventDefault(); filterAndRenderRecipes(); }
        });

        $('button[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
            filterAndRenderRecipes();
        });
    }

    /**
     * Extrae chefs únicos mapeando las propiedades reales de la API
     */
    function extractFeaturedChefs(recipes) {
        const authorsMap = {};
        recipes.forEach(r => {
            const authorId = r.authorId;
            if (authorId && !authorsMap[authorId]) {
                authorsMap[authorId] = {
                    id: authorId,
                    name: r.author,
                    avatar: r.authorAvatar,
                    followers: parseInt(r.authorFollowersCount) || 0
                };
            }
        });
        featuredChefs = Object.values(authorsMap).sort((a,b) => b.followers - a.followers);
    }

    // --- FUNCIÓN DE FILTRADO Y RENDERIZADO PRINCIPAL ---
    function filterAndRenderRecipes() {
        if (!globalRecipes || globalRecipes.length === 0) return;

        const sT = $mainSearchInput.val().toLowerCase().trim();
        const maxT = parseInt($timeMaxSlider.val(), 10) || 0;
        const selCat = $categoryFilter.val(); 
        const selDiet = $dietFilterSelect.val(); 
        const selDiff = $difficultyFilter.val();
        const sortO = $sortOrderFilter.val();

        // Aplicar Filtros Globales
        let filteredBase = globalRecipes.filter(r => {
            const matchesSearch = !sT || (r.title && r.title.toLowerCase().includes(sT)) || (r.author && r.author.toLowerCase().includes(sT));
            const matchesTime = (maxT === 0 || maxT >= 180) ? true : (parseInt(r.timeInMinutes) <= maxT);
            const matchesCat = !selCat || (r.category_name === selCat);
            const matchesDiet = !selDiet || (r.diet_id === selDiet);
            const matchesDiff = !selDiff || (r.difficulty === selDiff);

            return matchesSearch && matchesTime && matchesCat && matchesDiet && matchesDiff;
        });

        const activeTabId = $('#recipesTab .nav-link.active').attr('id');

        // Pestaña SIGUIENDO
        if (activeTabId === 'following-tab') {
            let followedRecipes = filteredBase.filter(r => r.isAuthorFollowed === true);
            followedRecipes.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
            renderRecipeCards($followingContainer, followedRecipes, "No se encontraron recetas de tus seguidos.");
        }

        // Ordenación Global
        let sortedMain = [...filteredBase];
        switch(sortO){
            case 'time_asc': sortedMain.sort((a,b)=>a.timeInMinutes - b.timeInMinutes); break;
            case 'time_desc': sortedMain.sort((a,b)=>b.timeInMinutes - a.timeInMinutes); break;
            case 'recent': sortedMain.sort((a,b)=>new Date(b.publishDate).getTime()-new Date(a.publishDate).getTime()); break;
            case 'popularity': default: sortedMain.sort((a,b)=>b.likes - a.likes); break;
        }

        renderRecipeCards($popularContainer, sortedMain.slice(0, 15), "Sin recetas con estos filtros.");
        
        if($trendingContainer.length){
            const thresholdDate = new Date(); thresholdDate.setDate(thresholdDate.getDate() - 30);
            const trending = filteredBase.filter(r => new Date(r.publishDate) >= thresholdDate)
                                         .sort((a,b) => b.likes - a.likes)
                                         .slice(0, 6);
            renderRecipeCards($trendingContainer, trending, "Sin tendencias.");
        }
    }

    function renderFeaturedChefs() {
        if (!$featuredChefsContainer.length) return;
        $featuredChefsContainer.empty();
        if (featuredChefs && featuredChefs.length > 0) {
            featuredChefs.slice(0, 9).forEach(chef => $featuredChefsContainer.append(createChefCard(chef)));
        } else { 
            $featuredChefsContainer.html('<div class="col-12 text-center text-muted p-5">Aún no hay chefs.</div>'); 
        }
    }

    // --- DISEÑO DE TARJETA RECETA (CALCULO DE TIEMPO RECUPERADO) ---
    function createRecipeCard(recipe) {
        const rL = `recipe.html?id=${recipe.id}`;
        const imgSrc = escapeHTML(recipe.image);
        
        // --- AQUÍ ESTÁ EL CÁLCULO RECUPERADO ---
        const timeFormatted = formatRecipeDuration(recipe.timeInMinutes);

        const categoria = recipe.category_name || '';
        const dieta = recipe.diet_name || '';
        let metaString = '';
        if (categoria && dieta) metaString = `${escapeHTML(categoria)} &bull; ${escapeHTML(dieta)}`;
        else if (categoria) metaString = escapeHTML(categoria);
        else if (dieta) metaString = escapeHTML(dieta);

        const dif = recipe.difficulty || 'Normal';
        let difColor = 'text-secondary';
        let difIcon = 'bi-bar-chart';
        
        switch(dif.toLowerCase()) {
            case 'facil': difColor = 'text-success'; difIcon = 'bi-bar-chart-fill'; break;
            case 'normal': difColor = 'text-warning'; difIcon = 'bi-bar-chart-steps'; break;
            case 'dificil': difColor = 'text-danger'; difIcon = 'bi-graph-up-arrow'; break;
        }

        const html = `
        <div class="col">
            <div class="card h-100 border-0 shadow-sm recipe-card position-relative overflow-hidden">
                <a href="${rL}" class="text-decoration-none text-dark h-100 d-flex flex-column">
                    <div class="position-relative overflow-hidden">
                        <img src="${imgSrc}" class="card-img-top" alt="${escapeHTML(recipe.title)}" loading="lazy" style="height: 200px; object-fit: cover;">
                    </div>
                    <div class="card-body d-flex flex-column p-3">
                        <div class="text-uppercase text-muted fw-bold mb-1" style="font-size: 0.65rem; letter-spacing: 0.5px;">${metaString || '&nbsp;'}</div>
                        <h5 class="card-title fw-bold mb-1 text-truncate" title="${escapeHTML(recipe.title)}">${escapeHTML(recipe.title)}</h5>
                        <small class="text-muted mb-3 d-block">Por <span class="text-orange">${escapeHTML(recipe.author)}</span></small>
                        <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                            <span class="${difColor} small fw-semibold text-uppercase" style="font-size: 0.75rem;"><i class="bi ${difIcon}"></i> ${escapeHTML(dif)}</span>
                            <div class="text-muted small d-flex gap-3">
                                <span><i class="bi bi-clock"></i> ${timeFormatted}</span>
                                <span><i class="bi bi-heart-fill text-danger"></i> ${recipe.likes || 0}</span>
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        </div>`;
        return $(html);
    }

    function createChefCard(chef) {
        const cL = `profile.html?userId=${chef.id}`;
        const followersCount = new Intl.NumberFormat('es-ES').format(chef.followers);
        
        const html = `
        <div class="col">
            <div class="card h-100 shadow-sm chef-card border-0">
                <div class="card-body text-center d-flex flex-column align-items-center p-4">
                    <a href="${cL}" class="text-decoration-none">
                        <img src="${escapeHTML(chef.avatar)}" alt="${escapeHTML(chef.name)}" class="avatar mb-3 img-thumbnail p-1 rounded-circle" style="width:90px;height:90px;object-fit:cover;">
                    </a>
                    <h5 class="card-title mb-1 fw-bold"><a href="${cL}" class="text-dark text-decoration-none stretched-link">${escapeHTML(chef.name)}</a></h5>
                    <p class="card-text text-muted small mb-0">${followersCount} seguidores</p>
                </div>
            </div>
        </div>`;
        return $(html);
    }

    // --- FUNCIONES AUXILIARES ---

    function renderRecipeCards($con, recipes, msg){ 
        if(!$con || !$con.length) return;
        $con.empty(); 
        if(recipes && recipes.length > 0){ 
            recipes.forEach(r => $con.append(createRecipeCard(r))); 
        } else { 
            $con.html(`<div class="col-12"><p class="text-center text-muted p-5">${escapeHTML(msg)}</p></div>`);
        }
    }

    function formatTimeForDisplaySlider(m) { 
        m=parseInt(m); if(!m)return"Cualquiera"; if(m>=180)return"+3h"; const h=Math.floor(m/60),r=m%60; return (h>0?h+"h ":"")+(r>0?r+"min":""); 
    }

    /**
     * Convierte minutos totales en formato H y MIN
     */
    function formatRecipeDuration(totalMinutes) {
        let m = parseInt(totalMinutes);
        if (!m || m === 0) return '0 min';
        let h = Math.floor(m / 60);
        let min = m % 60;
        return (h > 0 ? h + 'h ' : '') + (min > 0 ? min + 'min' : '');
    }
    
    function escapeHTML(str) { if(str==null)return''; return $('<div>').text(String(str)).html(); }

    function loadAndPopulateDietTypes(){ 
        const $dFS = $('#dietFilter'); if(!$dFS.length) return $.Deferred().resolve().promise();
        if(typeof fetchDietTypesFromAPI !== 'function') return $.Deferred().resolve().promise();
        
        $dFS.prop('disabled', true).html('<option value="">Cargando...</option>');
        return fetchDietTypesFromAPI().done(function(resp){
            $dFS.empty().prop('disabled',false).append('<option value="">Dieta (Todas)</option>');
            if(resp && resp.success && resp.data) {
                resp.data.forEach(d => {
                    $dFS.append(`<option value="${d.id}">${escapeHTML(d.nombre_dieta)}</option>`);
                });
            }
        });
    }
});