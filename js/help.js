// TFG/js/help.js

$(function() {
    console.log("help.js: Controlador cargado.");

    // 1. Caché de selectores para optimización
    const $form = $('#supportForm');
    const $nameInput = $('#name');
    const $emailInput = $('#email');
    const $messageInput = $('#message');
    const $btnSubmit = $form.find('button[type="submit"]');
    let $msgDiv = $('#supportFormMessages');

    // Crear el contenedor de mensajes si no existe
    if ($form.length && !$msgDiv.length) {
        $msgDiv = $('<div id="supportFormMessages" class="mt-3"></div>');
        $form.before($msgDiv);
    }

    /**
     * Escucha el estado de la sesión (Gestionado por notifications.js)
     */
    $(document).on('sessionStatusChecked', function(event, sessionResponse) {
        if (sessionResponse && sessionResponse.is_logged_in && sessionResponse.data) {
            const user = sessionResponse.data;
            // Bloqueamos campos para usuarios registrados
            $nameInput.val(user.nombre_completo || user.username).prop('disabled', true);
            $emailInput.val(user.email).prop('disabled', true);
        } else {
            // Habilitamos para invitados
            $nameInput.val('').prop('disabled', false);
            $emailInput.val('').prop('disabled', false);
        }
    });

    /**
     * Envío del formulario con validación Bootstrap 5
     */
    $form.on('submit', function(e) {
        e.preventDefault();

        // Limpiar mensajes previos
        $msgDiv.hide().removeClass('alert-success alert-danger alert-info');

        if (!this.checkValidity()) {
            e.stopPropagation();
            $(this).addClass('was-validated');
            return;
        }

        // Estado de carga
        $btnSubmit.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Enviando...');
        $msgDiv.text('Procesando solicitud...').addClass('alert alert-info').fadeIn();

        // Preparar datos (val() obtiene el valor aunque esté disabled)
        const ticketData = {
            nombre: $nameInput.val().trim(),
            email: $emailInput.val().trim(),
            mensaje: $messageInput.val().trim()
        };

        // 3. Llamada al Servicio AJAX
        if (typeof HelpService !== 'undefined') {
            HelpService.sendTicket(ticketData)
                .done(function(res) {
                    if (res.success) {
                        $msgDiv.text(res.message).removeClass('alert-info').addClass('alert alert-success');
                        $messageInput.val('');
                        $form.removeClass('was-validated');
                        // Si es invitado, vaciamos todo
                        if (!$nameInput.prop('disabled')) $form[0].reset();
                    } else {
                        $msgDiv.text("Error: " + res.message).removeClass('alert-info').addClass('alert alert-danger');
                    }
                })
                .fail(function(jqXHR) {
                    console.error("Error completo del servidor:", jqXHR.responseText);
                    let errMsg = "Error en el servidor. Inténtalo más tarde.";
                    if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                        errMsg = jqXHR.responseJSON.message;
                    }
                    $msgDiv.text(errMsg).removeClass('alert-info').addClass('alert alert-danger');
                })
                .always(function() {
                    $btnSubmit.prop('disabled', false).text('Enviar Mensaje');
                });
        } else {
            $msgDiv.text("Error técnico: HelpService no detectado.").addClass('alert alert-danger');
            $btnSubmit.prop('disabled', false).text('Enviar Mensaje');
        }
    });
});