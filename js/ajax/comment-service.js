// TFG/js/ajax/comment-service.js

const CommentService = {
    /**
     * Obtiene los comentarios de una receta
     */
    getComments: function(recipeId) {
        // console.log("CommentService: Obteniendo comentarios...");
        return $.ajax({
            url: 'api/comments.php',
            type: 'GET',
            data: { recipe_id: recipeId },
            dataType: 'json'
        });
    },

    /**
     * Envía un nuevo comentario
     */
    addComment: function(recipeId, content) {
        // console.log("CommentService: Enviando comentario...");
        return $.ajax({
            url: 'api/comments.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
                action: 'create', // Explicito la acción por si acaso
                recipe_id: recipeId, 
                content: content 
            }),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },

    /**
     * Elimina un comentario propio
     */
    deleteComment: function(commentId) {
        console.log("CommentService: Eliminando comentario ID:", commentId);
        return $.ajax({
            url: 'api/comments.php',
            type: 'POST', // Usamos POST para compatibilidad, enviando action: delete
            contentType: 'application/json',
            data: JSON.stringify({ 
                action: 'delete', 
                comment_id: commentId 
            }),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    }
};

if (typeof window !== 'undefined') { window.CommentService = CommentService; }