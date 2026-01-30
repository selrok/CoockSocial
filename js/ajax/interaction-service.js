// TFG/js/ajax/interaction-service.js

const InteractionService = {
    toggleLike: function(recipeId) {
        return $.ajax({
            url: 'api/interact.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: 'toggle_like', recipe_id: recipeId }),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },

    toggleSave: function(recipeId) {
        return $.ajax({
            url: 'api/interact.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: 'toggle_save', recipe_id: recipeId }),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },

    reportRecipe: function(recipeId) {
        return $.ajax({
            url: 'api/reports.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ type: 'recipe', target_id: recipeId }),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },

    reportComment: function(commentId, recipeId) {
        return $.ajax({
            url: 'api/reports.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ type: 'comment', target_id: commentId, recipe_id: recipeId }),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },

    //Seguir usuario
    toggleFollow: function(targetUserId) {
        return $.ajax({
            url: 'api/interact.php', // Debe apuntar al archivo que creamos arriba
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
                action: 'toggle_follow', 
                target_user_id: targetUserId 
            }),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    }
};

if (typeof window !== 'undefined') { window.InteractionService = InteractionService; }