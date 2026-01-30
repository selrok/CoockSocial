// TFG/js/index.js
$(document).ready(function() {
    console.log("index.js: DOM ready. Esperando evento 'sessionStatusChecked'.");

    let pageSessionData = null;
    let globalRecipes = []; // Variable para almacenar las recetas cargadas de la API

    // Escuchar evento de sesión
    $(document).on('sessionStatusChecked', function(event, sessionResponse) {
        console.log("index.js: Datos de sesión recibidos.");
        pageSessionData = sessionResponse;
        loadInitialPageContent(pageSessionData); 
    });

    // Fallback timeout
    let sessionCheckTimeout = setTimeout(function() {
        if (pageSessionData === null && (!$('#popularRecipesContainer').length || $('#popularRecipesContainer').is(':empty'))) {
            console.warn("index.js: Timeout sesión. Cargando contenido público.");
            loadInitialPageContent({ is_logged_in: false });
        }
    }, 3000); 

    // --- Selectores Globales ---
    let $popularContainer = $('#popularRecipesContainer');
    let $trendingContainer = $('#trendingRecipesContainer');
    let $featuredChefsContainer = $('#featuredChefsContainer');
    // Filtros
    let $timeMaxSlider = $('#timeMaxSlider');
    let $timeMaxValueDisplay = $('#timeMaxValueDisplay');
    let $mainSearchInput = $('#mainSearchInput');
    let $categoryFilter = $('#categoryFilter');
    let $dietFilterSelect = $('#dietFilter');
    let $difficultyFilter = $('#difficultyFilter');
    let $sortOrderFilter = $('#sortOrderFilter');
    let $applyFiltersBtn = $('#applyFiltersBtn');

    // --- Lógica Principal de Carga ---
    function loadInitialPageContent(sessionDataForPage) {
        clearTimeout(sessionCheckTimeout);

        // 1. Configurar UI de Filtros (Listeners)
        setupFilterListeners();

        // 2. Cargar Tipos de Dieta (Para el select)
        let dietTypesPromise;
        if (typeof loadAndPopulateDietTypes === 'function') {
            dietTypesPromise = loadAndPopulateDietTypes();
        } else {
            dietTypesPromise = $.Deferred().resolve().promise();
        }

        // 3. Cargar Recetas Reales de la API
        console.log("index.js: Solicitando recetas a la API...");
        
        // Usamos $.when para esperar a que carguen las dietas Y las recetas (opcional, pueden ir en paralelo)
        // Pero para simplificar, cargamos recetas independientemente.
        
        if (typeof RecipeService === 'undefined') {
            console.error("RecipeService no definido.");
            $popularContainer.html('<p class="text-danger">Error: Servicio de recetas no cargado.</p>');
            return;
        }

        let recipesPromise = RecipeService.getAllPublicRecipes();

        // Cuando ambas promesas (dietas y recetas) terminen (o fallen)
        // Nota: Si dietas falla, queremos seguir mostrando recetas, así que manejamos recetas independientemente en la UI
        
        recipesPromise
            .done(function(response) {
                if (response && response.success) {
                    console.log("index.js: Recetas cargadas:", response.data.length);
                    globalRecipes = response.data; // Guardar en variable global para filtrar
                } else {
                    console.error("index.js: Error API recetas:", response.message);
                    $popularContainer.html(`<p class="text-center text-muted p-3">${response.message || 'No se pudieron cargar las recetas.'}</p>`);
                }
            })
            .fail(function(jqXHR) {
                console.error("index.js: Fallo AJAX recetas.", jqXHR);
                $popularContainer.html('<p class="text-center text-danger p-3">Error de conexión al cargar recetas.</p>');
            })
            .always(function() {
                // Una vez que tenemos (o no) las recetas, aplicamos el primer renderizado
                // Esperamos también a que las dietas terminen para que el select esté listo
                dietTypesPromise.always(function() {
                    console.log("index.js: Datos listos. Renderizando UI.");
                    filterAndRenderRecipes(); // Renderiza usando globalRecipes
                    renderChefs(); // Renderiza chefs (mock por ahora)
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
        
        // Eventos para filtrar
        let filterEvents = 'change.indexfilters';
        $('#categoryFilter, #dietFilter, #difficultyFilter, #sortOrderFilter, #timeMaxSlider').off(filterEvents).on(filterEvents, filterAndRenderRecipes);
        
        if($applyFiltersBtn.length) $applyFiltersBtn.off('click').on('click', filterAndRenderRecipes);
        if($mainSearchInput.length) $mainSearchInput.off('keypress').on('keypress', function(e) { 
            if (e.which === 13) { e.preventDefault(); filterAndRenderRecipes(); }
        });
    }

    function filterAndRenderRecipes() {
        console.log("index.js: Filtrando recetas...");
        
        // Usar globalRecipes en lugar de mockIndexData
        let filtered = [...globalRecipes]; 

        if (filtered.length === 0) {
             // Si no hay recetas cargadas, no borrar contenedores si muestran mensajes de error
             if (!$popularContainer.html().includes("Error") && !$popularContainer.html().includes("Cargando")) {
                 renderRecipeCards($popularContainer, [], "No hay recetas disponibles.");
                 renderRecipeCards($trendingContainer, [], "No hay tendencias.");
             }
             return;
        }

        // Obtener valores de filtros
        let sT = $mainSearchInput.val().toLowerCase().trim();
        let maxT = parseInt($timeMaxSlider.val(), 10) || 0;
        let selCat = $categoryFilter.val(); // ID Categoría
        let selDiet = $dietFilterSelect.val(); // ID Dieta
        let selDiff = $difficultyFilter.val(); // Texto 'facil', etc.
        let sortO = $sortOrderFilter.val();

        // 1. Filtrado
        if (sT) {
            filtered = filtered.filter(r => 
                (r.title && r.title.toLowerCase().includes(sT)) || 
                (r.author && r.author.toLowerCase().includes(sT))
            );
        }
        if (maxT > 0 && maxT < 180) {
            filtered = filtered.filter(r => r.timeInMinutes <= maxT);
        }
        if (selCat) filtered = filtered.filter(r => r.category == selCat); // Comparación laxa por si string vs int
        if (selDiet) filtered = filtered.filter(r => r.diet == selDiet);
        if (selDiff) filtered = filtered.filter(r => r.difficulty == selDiff);

        // 2. Ordenación
        switch(sortO){
            case 'time_asc': filtered.sort((a,b)=>(a.timeInMinutes||Infinity)-(b.timeInMinutes||Infinity)); break;
            case 'time_desc': filtered.sort((a,b)=>(b.timeInMinutes||0)-(a.timeInMinutes||0)); break;
            case 'recent': filtered.sort((a,b)=>new Date(b.publishDate).getTime()-new Date(a.publishDate).getTime()); break;
            case 'popularity': default: filtered.sort((a,b)=>(b.likes||0)-(a.likes||0)); break;
        }

        // 3. Renderizado
        // Populares (primeras 6 tras filtro)
        renderRecipeCards($popularContainer, filtered.slice(0,6), "No se encontraron recetas con estos filtros.");
        
        // Tendencias (Recientes de la última semana)
        if($trendingContainer.length){
            let oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            let trending = filtered.filter(r => new Date(r.publishDate) >= oneWeekAgo)
                                     .sort((a,b) => (b.likes||0)-(a.likes||0)) // Las recientes más populares
                                     .slice(0, 6);
            renderRecipeCards($trendingContainer, trending, "No hay tendencias recientes.");
        }
    }
    
    function renderChefs() {
        // Por ahora seguimos usando Mock para chefs o vacío si no existe
        let chefs = (typeof mockIndexData !== 'undefined' && mockIndexData.chefs) ? mockIndexData.chefs : [];
        if ($featuredChefsContainer.length) {
            $featuredChefsContainer.empty();
            if (chefs.length > 0) {
                chefs.slice(0, 9).forEach(chef => { $featuredChefsContainer.append(createChefCard(chef)); });
            } else {
                $featuredChefsContainer.html('<p class="text-center text-muted col-12">No hay chefs destacados.</p>');
            }
        }
    }

    // --- Funciones Auxiliares de Renderizado ---
    
    function renderRecipeCards($con, recipes, msg){ 
        if(!$con || !$con.length) return;
        $con.empty(); 
        if(recipes && recipes.length > 0){ 
            recipes.forEach(r => $con.append(createRecipeCard(r))); 
        } else { 
            $con.html(`<div class="col-12"><p class="text-center text-muted p-3">${escapeHTML(msg)}</p></div>`);
        }
    }

    function createRecipeCard(recipe) {
        let rL = `recipe.html?id=${recipe.id}`;
        let aL = `profile.html?userId=${recipe.authorId}`;
        let imgSrc = escapeHTML(recipe.image); // Ya trae ruta o default desde PHP
        
        let html = `
        <div class="col">
            <div class="card h-100 shadow-sm recipe-card">
                <a href="${rL}" class="text-decoration-none">
                    <img src="${imgSrc}" class="card-img-top" alt="${escapeHTML(recipe.title)}" style="height: 200px; object-fit: cover;">
                </a>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title mb-1">
                        <a href="${rL}" class="text-dark stretched-link text-decoration-none">${escapeHTML(recipe.title)}</a>
                    </h5>
                    <p class="card-text text-muted small mb-2">
                        Por: <a href="${aL}" class="text-orange text-decoration-none position-relative" style="z-index: 2;">${escapeHTML(recipe.author)}</a>
                    </p>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <span class="rating text-danger"><i class="fas fa-heart me-1"></i>${recipe.likes}</span>
                        <span class="badge bg-light text-dark"><i class="far fa-clock me-1"></i>${formatRecipeDuration(recipe.timeInMinutes)}</span>
                    </div>
                </div>
            </div>
        </div>`;
        return $(html);
    }

    function createChefCard(chef) {
        // Mantener lógica mock para chefs por ahora
        let cL = `profile.html?userId=${chef.id}`;
        let html = `
        <div class="col">
            <div class="card h-100 shadow-sm chef-card">
                <div class="card-body text-center d-flex flex-column align-items-center">
                    <a href="${cL}" class="text-decoration-none">
                        <img src="${escapeHTML(chef.avatar)}" alt="${escapeHTML(chef.name)}" class="avatar mb-3 img-thumbnail p-1 rounded-circle" style="width:80px;height:80px;object-fit:cover;">
                    </a>
                    <h5 class="card-title mb-1"><a href="${cL}" class="text-dark stretched-link text-decoration-none">${escapeHTML(chef.name)}</a></h5>
                    <p class="card-text text-muted small">${escapeHTML(chef.followers)} seguidores</p>
                </div>
            </div>
        </div>`;
        return $(html);
    }

    function loadAndPopulateDietTypes(){ 
        // Esta función debe existir para poblar el select de filtros
        // Reutilizamos la lógica que ya tenías, asegurando que devuelva promesa
        let $dFS = $('#dietFilter'); 
        if(!$dFS.length) return $.Deferred().resolve().promise();
        
        if(typeof fetchDietTypesFromAPI !== 'function') {
            console.warn("fetchDietTypesFromAPI no disponible.");
            return $.Deferred().resolve().promise();
        }

        return fetchDietTypesFromAPI().done(function(resp){
            $dFS.empty().append('<option value="">Dieta (Todas)</option>');
            if(resp && resp.success && resp.data) {
                resp.data.forEach(d => {
                    $dFS.append(`<option value="${d.id}">${escapeHTML(d.nombre_dieta)}</option>`);
                });
            }
        });
    }

    function formatTimeForDisplaySlider(m) {
        m=parseInt(m); if(!m)return"Cualquiera";
        if(m>=180)return"+3h";
        let h=Math.floor(m/60),r=m%60;
        return (h>0?h+"h ":"")+(r>0?r+"min":"");
    }
    function escapeHTML(str) {
        if(str==null)return'';
        return $('<div>').text(String(str)).html();
    }
});