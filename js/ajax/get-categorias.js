// TFG/js/ajax/get-categorias.js

/**
 * Obtiene las categorías de recetas desde la API.
 * @returns {Promise} Promesa de jQuery.
 */
function fetchCategoriesFromAPI() {
    // Ruta relativa desde donde se llama el HTML (TFG/) hacia la API
    const apiUrl = 'api/get_categories.php'; 

    return $.ajax({
        url: apiUrl,
        type: 'POST',
        dataType: 'json'
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.error("get-categorias.js: Error AJAX.", textStatus, errorThrown);
    });
}