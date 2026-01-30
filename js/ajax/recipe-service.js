// TFG/js/ajax/recipe-service.js

const RecipeService = {
    /**
     * Obtiene el feed de recetas públicas (para el index).
     */
    getAllPublicRecipes: function() {
        return $.ajax({
            url: 'api/get_recipes_feed.php',
            type: 'GET',
            dataType: 'json'
        });
    },

    /**
     * Obtiene los detalles de una receta específica por ID.
     * Sirve tanto para visualizar (recipe.html) como para editar (formReceta.html).
     * @param {number} id - ID de la receta
     */
    getRecipeById: function(id) {
        console.log("RecipeService: Solicitando detalles receta ID:", id);
        return $.ajax({
            url: 'api/recipes.php',
            type: 'GET',
            data: { id: id },
            dataType: 'json',
            xhrFields: { withCredentials: true } // Importante para detectar si el usuario dio like o es dueño
        });
    },

    /**
     * Guarda una receta (crear o editar) usando FormData.
     */
    saveRecipe: function(formData, isEdit) {
        const url = isEdit ? 'api/editReceta.php' : 'api/formReceta.php';
        return $.ajax({
            url: url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },

    getAllPublicRecipes: function() {
        return $.ajax({ url: 'api/get_recipes_feed.php', type: 'GET', dataType: 'json' });
    },
    createRecipe: function(recipeData) {
        return $.ajax({ url: 'api/formReceta.php', type: 'POST', contentType: 'application/json', data: JSON.stringify(recipeData), dataType: 'json', xhrFields: { withCredentials: true } });
    },
    saveRecipe: function(formData, isEdit) {
        const url = isEdit ? 'api/editReceta.php' : 'api/formReceta.php';
        return $.ajax({ url: url, type: 'POST', data: formData, processData: false, contentType: false, dataType: 'json', xhrFields: { withCredentials: true } });
    },
    getRecipeById: function(id) {
        return $.ajax({ url: 'api/recipes.php', type: 'GET', data: { id: id }, dataType: 'json', xhrFields: { withCredentials: true } });
    },

    /**
     * Elimina una receta.
     * Reutilizable para recipe.js y admin.js
     * @param {number} recipeId - ID de la receta a eliminar
     */
    deleteRecipe: function(recipeId) {
        console.log("RecipeService: Eliminando receta ID:", recipeId);
        return $.ajax({
            url: 'api/recipes.php',
            type: 'POST', // Usamos POST para compatibilidad, enviando acción
            contentType: 'application/json',
            data: JSON.stringify({ 
                action: 'delete', 
                id: recipeId 
            }),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    }
};

if (typeof window !== 'undefined') { window.RecipeService = RecipeService; }