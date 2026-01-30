// /js/llamada.js

$(document).ready(function() {
    console.log("Página de ejemplo lista (desde llamada.js).");

    const $dietFilterSelect = $('#dietFilterExample');
    const $statusMessages = $('#statusMessagesExample');
    const $selectedValueDisplay = $('#selectedValue');
    const $selectedTextDisplay = $('#selectedText');

    // Función para escapar HTML, la mantenemos aquí ya que es utilizada por esta lógica
    function escapeHTML(str) {
        if (str === null || typeof str === 'undefined') return '';
        return $('<div>').text(String(str)).html();
    }

    // Función que maneja la respuesta exitosa de la API
    function handleDietLoadSuccess(response) {
        console.log("Respuesta del servidor (api/get_diet_types.php procesada en llamada.js):", response);
        $dietFilterSelect.empty(); // Limpiar el "Cargando..."
        $dietFilterSelect.prop('disabled', false); // Habilitar el select

        // Añadir la opción por defecto "Dieta (Todas)"
        $dietFilterSelect.append(
            $('<option>', {
                value: '',
                text: 'Dieta (Todas)'
            }).prop('selected', true)
        );

        if (response && response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
            $statusMessages.html('<div class="alert alert-success">Tipos de dieta cargados correctamente.</div>');
            
            $.each(response.data, function(index, dieta) {
                const optionValue = dieta.id; // Asumimos que el 'id' es el valor para el option
                const optionText = dieta.nombre_dieta;
                
                $dietFilterSelect.append($('<option>', {
                    value: optionValue,
                    text: optionText
                }));
            });
        } else if (response && response.success && (!response.data || response.data.length === 0)) {
            const message = response.message || 'No se encontraron tipos de dieta.';
            $statusMessages.html(`<div class="alert alert-info">${escapeHTML(message)}</div>`);
            console.info("Respuesta del servidor:", message);
        } else {
            const message = response.message || 'Respuesta no válida del servidor.';
            $statusMessages.html(`<div class="alert alert-warning">Error al procesar: ${escapeHTML(message)}</div>`);
            console.warn('Respuesta no exitosa o datos inválidos:', response);
            $dietFilterSelect.append($('<option value="">Error en datos</option>'));
        }
    }

    // Función que maneja los errores de la petición AJAX
    function handleDietLoadError(jqXHR, textStatus, errorThrown) {
        console.error("Error en la petición AJAX (manejado en llamada.js):", textStatus, errorThrown, jqXHR.responseText);
        $dietFilterSelect.empty().prop('disabled', false);
        $dietFilterSelect.html('<option value="">Error de conexión</option>');
        $statusMessages.html(`<div class="alert alert-danger">Error de comunicación con el servidor: ${escapeHTML(textStatus)}. Revisa la consola.</div>`);
    }

    // Función principal para cargar y popular los tipos de dieta
    function loadAndPopulateDietTypes() {
        console.log("Llamando a loadAndPopulateDietTypes (desde llamada.js)...");
        $statusMessages.empty();
        $dietFilterSelect.html('<option value="">Cargando dietas...</option>').prop('disabled', true);

        // Usamos la función fetchData
        // La URL 'api/get_diet_types.php' sigue siendo relativa al archivo HTML
        fetchData('api/get_diet_types.php', handleDietLoadSuccess, handleDietLoadError);
    }

    // Para mostrar el valor seleccionado (opcional, para depuración)
    $dietFilterSelect.on('change', function() {
        const value = $(this).val();
        const text = $(this).find('option:selected').text();
        $selectedValueDisplay.text(value || 'N/A');
        $selectedTextDisplay.text(text || 'N/A');
        console.log("Dieta seleccionada - Valor:", value, "Texto:", text);
    });

    // Cargar las opciones de dieta automáticamente al cargar la página
    loadAndPopulateDietTypes();
});