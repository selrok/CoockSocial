// TFG/js/ajax/recipe-service.js

const RecipeService = {
    /**
     * Obtiene el feed de recetas públicas (para el index).
     * IMPORTANTE: Enviamos credenciales para que el servidor sepa si seguimos a los autores.
     */
    getAllPublicRecipes: function() {
        return $.ajax({
            url: 'api/get_recipes_feed.php',
            type: 'GET',
            dataType: 'json',
            xhrFields: { withCredentials: true } 
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
            xhrFields: { withCredentials: true } 
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

    /**
     * Métodos duplicados mantenidos por compatibilidad de versiones anteriores en tu código
     */
    getAllPublicRecipes: function() {
        return $.ajax({ url: 'api/get_recipes_feed.php', type: 'GET', dataType: 'json', xhrFields: { withCredentials: true } });
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
            type: 'POST', 
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