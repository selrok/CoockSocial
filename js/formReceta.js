// TFG/js/formReceta.js

$(document).ready(function() {
    console.log("formReceta.js: DOM listo. Esperando evento 'authGuardPassed'.");

    let currentUser = null;
    let editRecipeId = null;

    // Listener para el evento del guardián
    $(document).on('authGuardPassed', function(event, userData) {
        console.log("formReceta.js: Usuario autenticado recibido:", userData);
        currentUser = userData;
        
        // Verificar si es edición
        const urlParams = new URLSearchParams(window.location.search);
        editRecipeId = urlParams.get('edit') ? parseInt(urlParams.get('edit'), 10) : null;

        if (editRecipeId) {
            $('#pageTitle').text('Editar Receta');
            $('#submitRecipeBtn').html('<i class="fas fa-save me-2"></i>Guardar Cambios');
            // Cargar datos de la receta a editar
            loadRecipeForEditing(editRecipeId);
        }

        // Inicializar formulario
        inicializarFormulario(currentUser);
    });

    // Timeout de seguridad
    setTimeout(function() {
        if (!currentUser) {
            console.log("formReceta.js: Aún esperando autorización...");
        }
    }, 1000);

    // --- FUNCIÓN PARA CARGAR DATOS EN EDICIÓN ---
    function loadRecipeForEditing(id) {
        if (typeof RecipeService === 'undefined') {
            console.error("RecipeService no definido.");
            return;
        }

        RecipeService.getRecipeById(id)
            .done(function(response) {
                if (response && response.success && response.data) {
                    const recipe = response.data;
                    // Verificar permisos (dueño o admin)
                    const isOwner = (parseInt(recipe.id_usuario) === parseInt(currentUser.user_id));
                    const isAdmin = (currentUser.id_rol == 1 || currentUser.id_rol == 2);

                    if (!isOwner && !isAdmin) {
                        alert("No tienes permiso para editar esta receta.");
                        window.location.href = 'index.html';
                        return;
                    }
                    populateFormWithData(recipe);
                } else {
                    alert("Error al cargar receta: " + (response.message || "Desconocido"));
                }
            })
            .fail(function() {
                alert("Error de conexión al cargar la receta para editar.");
            });
    }

    function populateFormWithData(data) {
        // 1. Campos simples
        $('#recipeTitle').val(data.titulo);
        $('#recipeDescription').val(data.descripcion);
        $('#prepTime').val(data.tiempo_preparacion_min);
        $('#servings').val(data.porciones);
        $('#difficulty').val(data.dificultad.toLowerCase()); 
        $('#chefTips').val(data.consejos_chef);
        
        // 2. Switch de visibilidad
        const isPublic = data.visibilidad === 'publica';
        $('#recipeVisibility').prop('checked', isPublic).trigger('change');

        // 3. Selects (Categoría y Dieta) - LÓGICA MODIFICADA
        // Usamos una función interna para reintentar la selección si los options aún no cargaron
        const seleccionarOpcion = ($select, valorId, textoOpcion) => {
            const intentarSeleccion = () => {
                let encontrado = false;

                // Opción A: Intentar por ID (Value)
                if ($select.find(`option[value="${valorId}"]`).length > 0) {
                    $select.val(valorId);
                    encontrado = true;
                } 
                // Opción B: Intentar por Texto (Como pediste, por si los values no coinciden)
                else if (textoOpcion) {
                    $select.find('option').each(function() {
                        if ($(this).text().trim() === textoOpcion.trim()) {
                            $(this).prop('selected', true);
                            encontrado = true;
                            return false; // Break loop
                        }
                    });
                }
                
                return encontrado;
            };

            // Intentamos seleccionar inmediatamente
            if (!intentarSeleccion()) {
                // Si falla (porque el AJAX de categorías/dietas es lento), reintentamos varias veces
                setTimeout(intentarSeleccion, 500);  // 0.5 seg
                setTimeout(intentarSeleccion, 1500); // 1.5 seg
                setTimeout(intentarSeleccion, 3000); // 3.0 seg
            }
        };

        // Llamamos a la lógica segura para ambos selects
        // data.categoria y data.dieta son los NOMBRES que vienen del backend (gracias al JOIN)
        // data.id_categoria y data.id_tipo_dieta son los IDs
        seleccionarOpcion($('#recipeCategory'), data.id_categoria, data.categoria);
        seleccionarOpcion($('#dietType'), data.id_tipo_dieta, data.dieta);


        // 4. Ingredientes (Dinámicos)
        const $ingContainer = $('#ingredientsContainer');
        $ingContainer.empty(); 
        
        if (data.ingredientes && data.ingredientes.length > 0) {
            data.ingredientes.forEach(ing => {
                const html = `
                <div class="input-group mb-2 ingredient-item">
                    <input type="text" class="form-control ingredient-input" placeholder="Ingrediente" value="${escapeHTML(ing)}" required>
                    <button type="button" class="btn btn-outline-danger remove-ingredient"><i class="fas fa-minus"></i></button>
                </div>`;
                $ingContainer.append(html);
            });
        } else {
            $('#addIngredientBtn').click(); 
        }

        // 5. Pasos (Dinámicos)
        const $stepContainer = $('#stepsContainer');
        $stepContainer.empty();

        if (data.pasos && data.pasos.length > 0) {
            data.pasos.forEach((paso, index) => {
                const html = `
                <div class="mb-3 step-item">
                    <textarea class="form-control step-input" rows="2" placeholder="Paso ${index + 1}" required>${escapeHTML(paso)}</textarea>
                    <button type="button" class="btn btn-outline-danger remove-step mt-2"><i class="fas fa-minus me-1"></i>Eliminar paso</button>
                </div>`;
                $stepContainer.append(html);
            });
        } else {
             $('#addStepBtn').click();
        }
        
        // Actualizar listeners de botones eliminar generados dinámicamente
        // (Al estar delegado en 'inicializarFormulario', esto funciona automáticamente, 
        // pero refrescamos el estado de los botones por si acaso)
        updateSingleRemoveButtonState('.remove-ingredient', $ingContainer);
        updateSingleRemoveButtonState('.remove-step', $stepContainer);

        // 6. Imagen
        if (data.imagen_url) {
            $('#imagePreview').attr('src', data.imagen_url);
            $('#imagePreviewContainer').removeClass('d-none');
            $('#uploadImageBtn').html('<i class="fas fa-upload me-2"></i>Cambiar imagen');
        }
    }

    /**
     * Función principal para configurar el formulario.
     */
    function inicializarFormulario(userData) {
        console.log("Inicializando formulario para:", userData.username);

        // --- Selectores ---
        const $form = $('#recipeForm');
        const $ingredientsContainer = $('#ingredientsContainer');
        const $stepsContainer = $('#stepsContainer');
        const $addIngredientBtn = $('#addIngredientBtn');
        const $addStepBtn = $('#addStepBtn');
        const $uploadImageBtn = $('#uploadImageBtn');
        const $recipeImageInput = $('#recipeImage'); 
        const $imagePreviewContainer = $('#imagePreviewContainer');
        const $imagePreview = $('#imagePreview');
        const $recipeVisibilitySwitch = $('#recipeVisibility');
        const $recipeVisibilityLabel = $('label[for="recipeVisibility"]');
        
        const $categorySelect = $('#recipeCategory'); 
        const $dietTypeSelect = $('#dietType');

        let ingredientCount = $ingredientsContainer.find('.input-group').length || 1;
        let stepCount = $stepsContainer.find('.mb-3').length || 1;


        // --- CARGA DINÁMICA DE DATOS (AJAX) ---
        if (typeof fetchCategoriesFromAPI === 'function') cargarCategorias();
        else console.error("fetchCategoriesFromAPI no definida (falta get-categorias.js)");

        if (typeof fetchDietTypesFromAPI === 'function') cargarDietas();
        else console.error("fetchDietTypesFromAPI no definida (falta get-dietas.js)");


        // --- Event Listeners ---
        $addIngredientBtn.off('click').on('click', function(e) { e.preventDefault(); addIngredientField(); });
        $addStepBtn.off('click').on('click', function(e) { e.preventDefault(); addStepField(); });
        
        $uploadImageBtn.off('click').on('click', function(e) { 
            e.preventDefault(); 
            $recipeImageInput.trigger('click'); 
        });
        
        $recipeImageInput.off('change').on('change', handleImageUpload);
        
        $form.off('submit').on('submit', handleFormSubmit);
        
        $recipeVisibilitySwitch.off('change').on('change', function() {
            $recipeVisibilityLabel.text($(this).is(':checked') ? 'Pública' : 'Privada');
        });

        updateRemoveButtons('.remove-ingredient', $ingredientsContainer);
        updateRemoveButtons('.remove-step', $stepsContainer);
        $recipeVisibilityLabel.text($recipeVisibilitySwitch.is(':checked') ? 'Pública' : 'Privada');


        // --- FUNCIONES DE CARGA AJAX ---
        function cargarCategorias() {
            $categorySelect.prop('disabled', true).html('<option>Cargando...</option>');
            fetchCategoriesFromAPI().done(function(response) {
                $categorySelect.empty().append('<option value="" selected disabled>Selecciona una categoría</option>');
                if (response.success && response.data) {
                    response.data.forEach(function(cat) {
                        $categorySelect.append(`<option value="${cat.id}">${escapeHTML(cat.nombre_categoria)}</option>`);
                    });
                    $categorySelect.prop('disabled', false);
                } else { $categorySelect.html('<option>Error cargando</option>'); }
            }).fail(function() { $categorySelect.html('<option>Error conexión</option>'); });
        }

        function cargarDietas() {
            $dietTypeSelect.prop('disabled', true).html('<option>Cargando...</option>');
            fetchDietTypesFromAPI().done(function(response) {
                $dietTypeSelect.empty().append('<option value="" selected disabled>Selecciona tipo de dieta</option>');
                if (response.success && response.data) {
                    response.data.forEach(function(diet) {
                        $dietTypeSelect.append(`<option value="${diet.id}">${escapeHTML(diet.nombre_dieta)}</option>`);
                    });
                    $dietTypeSelect.prop('disabled', false);
                } else { $dietTypeSelect.html('<option>Error cargando</option>'); }
            }).fail(function() { $dietTypeSelect.html('<option>Error conexión</option>'); });
        }


        // --- Funciones Auxiliares del Formulario ---
        function addIngredientField() {
            ingredientCount++;
            $ingredientsContainer.append(`
                <div class="input-group mb-2 ingredient-item">
                    <input type="text" class="form-control ingredient-input" placeholder="Ingrediente ${ingredientCount}" required>
                    <button type="button" class="btn btn-outline-danger remove-ingredient"><i class="fas fa-minus"></i></button>
                </div>`);
            updateRemoveButtons('.remove-ingredient', $ingredientsContainer);
        }

        function addStepField() {
            stepCount++;
            $stepsContainer.append(`
                <div class="mb-3 step-item">
                    <textarea class="form-control step-input" rows="2" placeholder="Paso ${stepCount}" required></textarea>
                    <button type="button" class="btn btn-outline-danger remove-step mt-2"><i class="fas fa-minus me-1"></i>Eliminar paso</button>
                </div>`);
            updateRemoveButtons('.remove-step', $stepsContainer);
        }

        function updateRemoveButtons(selector, $container) {
            $container.off('click', selector).on('click', selector, function(e) {
                e.preventDefault();
                const $parent = selector === '.remove-ingredient' ? $(this).closest('.input-group') : $(this).closest('.mb-3');
                $parent.remove();
                if (selector === '.remove-ingredient') ingredientCount = Math.max(1, ingredientCount - 1);
                else stepCount = Math.max(1, stepCount - 1);
                updateSingleRemoveButtonState(selector, $container);
            });
            updateSingleRemoveButtonState(selector, $container);
        }

        function updateSingleRemoveButtonState(selector, $container) {
            const $buttons = $container.find(selector);
            $buttons.prop('disabled', $buttons.length <= 1);
        }

        function handleImageUpload(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    $imagePreview.attr('src', e.target.result);
                    $imagePreviewContainer.removeClass('d-none');
                    $uploadImageBtn.html('<i class="fas fa-upload me-2"></i>Cambiar imagen');
                };
                reader.readAsDataURL(file);
            }
        }

        // --- MANEJO DEL ENVÍO (CORREGIDO) ---
        function handleFormSubmit(event) {
            event.preventDefault();
            const $form = $(this); 

            // 1. DEFINICIÓN DE LA VARIABLE DE MENSAJES (ESTO FALTABA)
            let $formRecipeMessages = $('#formRecipeMessages');
            if (!$formRecipeMessages.length) {
                $formRecipeMessages = $('<div id="formRecipeMessages" class="mt-3"></div>');
                $form.after($formRecipeMessages);
            }
            $formRecipeMessages.empty().removeClass();

            // 2. Validaciones HTML5
            if ($form[0].checkValidity() === false) {
                event.stopPropagation();
                $form.addClass('was-validated');
                const $firstInvalid = $form.find(':invalid').first();
                if ($firstInvalid.length) {
                    $('html, body').animate({scrollTop: $firstInvalid.offset().top - 100}, 500);
                    $firstInvalid.focus();
                }
                return;
            }

            // 3. Crear FormData con TUS IDs
            let formData = new FormData();
            
            formData.append('titulo', $('#recipeTitle').val().trim());
            formData.append('descripcion', $('#recipeDescription').val().trim());
            
            // IDs de tu HTML:
            formData.append('tiempo_preparacion_min', $('#prepTime').val()); 
            formData.append('porciones', $('#servings').val());
            formData.append('dificultad', $('#difficulty').val());
            formData.append('consejos_chef', $('#chefTips').val().trim());
            
            // Selects y Switch
            formData.append('id_categoria', $categorySelect.val());
            formData.append('id_tipo_dieta', $dietTypeSelect.val());
            formData.append('visibilidad', $recipeVisibilitySwitch.is(':checked') ? 'publica' : 'privada');

            // Imagen
            if ($recipeImageInput[0].files[0]) {
                formData.append('imagen_url', $recipeImageInput[0].files[0]);
            }

            // Arrays (Ingredientes y Pasos)
            $ingredientsContainer.find('.ingredient-input').each(function() {
                const val = $(this).val().trim();
                if (val) formData.append('ingredientes[]', val);
            });

            $stepsContainer.find('.step-input').each(function() {
                const val = $(this).val().trim();
                if (val) formData.append('pasos[]', val);
            });

            // ID si es edición
            if (editRecipeId) {
                formData.append('id_receta', editRecipeId);
            }

            console.log("Datos a enviar:", [...formData]);

            // 4. Enviar
            $formRecipeMessages.text('Procesando...').addClass('alert alert-info');

            if (typeof RecipeService === 'undefined') {
                $formRecipeMessages.text('Error: RecipeService no cargado.').removeClass('alert-info').addClass('alert alert-danger');
                return;
            }

            RecipeService.saveRecipe(formData, !!editRecipeId)
                .done(function(response) {
                    if (response.success) {
                        $formRecipeMessages.text(response.message).removeClass('alert-info alert-danger').addClass('alert alert-success');
                        
                        if(!editRecipeId) simulateSuccess(); 
                        
                        setTimeout(() => {
                            if(response.recipe_id) window.location.href = 'recipe.html?id=' + response.recipe_id;
                        }, 1500);
                    } else {
                        $formRecipeMessages.text('Error: ' + response.message).removeClass('alert-info alert-success').addClass('alert alert-danger');
                    }
                })
                .fail(function(jqXHR) {
                    console.error("Error AJAX", jqXHR);
                    let msg = jqXHR.responseJSON ? jqXHR.responseJSON.message : "Error de comunicación";
                    $formRecipeMessages.text('Error: ' + msg).removeClass('alert-info alert-success').addClass('alert alert-danger');
                });
        }

        function simulateSuccess() {
            $form.removeClass('was-validated');
            $form[0].reset();
            
            ingredientCount = 1;
            stepCount = 1;
            $ingredientsContainer.html('<div class="input-group mb-2 ingredient-item"><input type="text" class="form-control ingredient-input" placeholder="Ingrediente 1" required><button type="button" class="btn btn-outline-danger remove-ingredient"><i class="fas fa-minus"></i></button></div>');
            $stepsContainer.html('<div class="mb-3 step-item"><textarea class="form-control step-input" rows="2" placeholder="Paso 1" required></textarea><button type="button" class="btn btn-outline-danger remove-step mt-2"><i class="fas fa-minus me-1"></i>Eliminar paso</button></div>');
            
            updateRemoveButtons('.remove-ingredient', $ingredientsContainer);
            updateRemoveButtons('.remove-step', $stepsContainer);
            
            $imagePreviewContainer.addClass('d-none');
            $imagePreview.attr('src', '#');
            $uploadImageBtn.html('<i class="fas fa-upload me-2"></i>Subir imagen');
            $recipeVisibilitySwitch.prop('checked', true).trigger('change');

            $('html, body').animate({ scrollTop: 0 }, 'fast');
        }
    }
    
    function escapeHTML(str) { 
        if (str === null || typeof str === 'undefined') return ''; 
        return $('<div></div>').text(String(str)).html(); 
    }
});