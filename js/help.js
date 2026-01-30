// TFG/js/help.js

$(document).ready(function() {
    console.log("help.js: DOM ready. Configurando página de ayuda.");

    // Selectores para el formulario de soporte
    const $supportForm = $('#supportForm');
    const $nameInput = $('#name');          // ID del campo Nombre
    const $emailInput = $('#email');        // ID del campo Email (CORREGIDO A 'email')
    const $messageInput = $('#message');    // ID del campo Mensaje
    let $formMessagesDiv = $('#supportFormMessages'); 

    // Crear div de mensajes si no existe en el HTML
    if ($supportForm.length && !$formMessagesDiv.length) {
        $formMessagesDiv = $('<div id="supportFormMessages" class="mt-3"></div>');
        // Insertar antes del formulario, o después, según preferencia
        $supportForm.before($formMessagesDiv); 
    }

    // Escuchar el evento 'sessionChecked' disparado por notifications.js
    $(document).on('sessionChecked', function(event, sessionResponse) {
        console.log("help.js: Evento 'sessionChecked' recibido:", sessionResponse);
        
        if (sessionResponse && sessionResponse.is_logged_in && sessionResponse.data) {
            const userData = sessionResponse.data;
            console.log("help.js: Usuario logueado:", userData.username);

            // Autocompletar campos y hacerlos readonly si el usuario está logueado
            if (userData.nombre_completo && $nameInput.length) {
                $nameInput.val(userData.nombre_completo).prop('readonly', true);
            } else if (userData.username && $nameInput.length) { 
                // Fallback al username si no hay nombre_completo, aunque nombre_completo sería mejor
                $nameInput.val(userData.username).prop('readonly', true);
            }

            if (userData.email && $emailInput.length) {
                $emailInput.val(userData.email).prop('readonly', true);
            }
        } else {
            console.log("help.js: Usuario no logueado o datos de sesión no disponibles.");
            // Asegurarse de que los campos sean editables si no hay sesión
            if ($nameInput.length) $nameInput.prop('readonly', false).val(''); 
            if ($emailInput.length) $emailInput.prop('readonly', false).val(''); 
        }
    });

    // Manejo del envío del formulario de soporte
    if ($supportForm.length) {
        $supportForm.on('submit', function(event) {
            event.preventDefault(); 
            if ($formMessagesDiv.length) $formMessagesDiv.empty().removeClass().addClass('mt-3'); 

            // Validación de Bootstrap
            this.classList.add('was-validated'); // 'this' es el formulario DOM element
            if (!this.checkValidity()) {
                event.stopPropagation();
                // Buscar el primer campo inválido y hacerle focus (opcional, para UX)
                $(this).find('.form-control:invalid').first().focus();
                return;
            }

            const name = $nameInput.val().trim();
            const email = $emailInput.val().trim(); 
            const message = $messageInput.val().trim();

            const ticketData = {
                name: name,
                email: email, 
                message: message
            };

            console.log("help.js: Enviando ticket de soporte:", ticketData);
            if ($formMessagesDiv.length) $formMessagesDiv.text('Enviando mensaje...').addClass('alert alert-info');

            // Llamada AJAX para enviar el ticket
            $.ajax({
                url: 'api/support_tickets.php', 
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(ticketData),
                dataType: 'json',
                xhrFields: { withCredentials: true } 
            })
            .done(function(response) {
                console.log("help.js: Respuesta del servidor (ticket):", response);
                if (response && response.success) {
                    if ($formMessagesDiv.length) {
                        $formMessagesDiv.text(response.message).removeClass().addClass('mt-3 alert alert-success');
                    }
                    // Limpiar solo el campo de mensaje si el usuario estaba logueado,
                    // ya que nombre y email son readonly y pre-rellenados.
                    if ($messageInput.length) $messageInput.val(''); 
                    $supportForm.removeClass('was-validated'); // Quitar estilos de validación

                    // Si el usuario NO estaba logueado, el formulario completo se puede resetear.
                    if (!$nameInput.prop('readonly')) { // Si el nombre NO es readonly, el usuario no estaba logueado
                        $supportForm[0].reset();
                    }
                    
                } else {
                    if ($formMessagesDiv.length) {
                        $formMessagesDiv.text('Error: ' + (response.message || 'No se pudo enviar el mensaje.'))
                                       .removeClass().addClass('mt-3 alert alert-danger');
                    }
                }
            })
            .fail(function(jqXHR) {
                console.error("help.js: Error AJAX al enviar ticket:", jqXHR);
                let errorMsg = "Error de comunicación. Inténtalo más tarde.";
                if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                    errorMsg = jqXHR.responseJSON.message;
                } else if (jqXHR.responseText) { // Intentar obtener mensaje si no es JSON
                    errorMsg = jqXHR.responseText.substring(0,100) + "..."; // Acortar si es HTML de error
                }
                if ($formMessagesDiv.length) {
                    $formMessagesDiv.text('Error: ' + errorMsg).removeClass().addClass('mt-3 alert alert-danger');
                }
            });
        });
    }
});