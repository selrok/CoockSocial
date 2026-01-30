// /js/ajax/get-dietas.js

/**
 * Realiza una petición AJAX para obtener los tipos de dieta desde la API.
 * @returns {Promise} Una promesa de jQuery que se resolverá con la respuesta del servidor
 *                    o se rechazará si hay un error.
 */
function fetchDietTypesFromAPI() {
    // La URL debe apuntar a tu script PHP real que devuelve los tipos de dieta.
    const apiUrl = 'api/get_diet_types.php'; 

    return $.ajax({
        url: apiUrl,
        type: 'GET',
        dataType: 'json' // jQuery intentará parsear la respuesta como JSON automáticamente
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.error("get-dietas.js (AJAX .fail): Error en la petición a la API.",
            "Status:", textStatus,
            "Error:", errorThrown,
            "Respuesta del servidor:", jqXHR.responseText
        );
    });
}