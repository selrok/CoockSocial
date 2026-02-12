// TFG/js/help.js

$(document).ready(function() {
    console.log("help.js: DOM ready. Esperando evento de sesión...");

    const $form = $('#supportForm');
    // IMPORTANTE: Asegúrate que los IDs en el HTML coincidan
    const $nameInput = $('#name'); 
    const $emailInput = $('#email'); 
    const $messageInput = $('#message');
    const $msgContainer = $('#supportFormMessages');

    // 1. GESTIÓN DE SESIÓN
    // Escuchar el evento que notifications.js dispara cuando termina de verificar al usuario
    $(document).on('sessionStatusChecked', function(event, sessionData) {
        console.log("help.js: Evento de sesión recibido:", sessionData);
        
        if (sessionData && sessionData.is_logged_in && sessionData.data) {
            const user = sessionData.data;
            
            // Autocompletar nombre
            if (user.nombre_completo) {
                $nameInput.val(user.nombre_completo).prop('disabled', true);
            } else if (user.username) {
                $nameInput.val(user.username).prop('disabled', true);
            }

            // Autocompletar email
            if (user.email) {
                $emailInput.val(user.email).prop('disabled', true);
            }
        } else {
            // Si no hay sesión, asegurarnos de que están editables y vacíos (opcional)
            // $nameInput.val('').prop('disabled', false);
            // $emailInput.val('').prop('disabled', false);
        }
    });

    // 2. GESTIÓN DE ENVÍO
    $form.on('submit', function(e) {
        e.preventDefault();

        // Limpiar mensajes
        $msgContainer.text('').removeClass();

        // Validaciones HTML5
        if (this.checkValidity() === false) {
            e.stopPropagation();
            $form.addClass('was-validated');
            return;
        }

        // Preparar datos
        const formData = {
            name: $nameInput.val().trim(),
            email: $emailInput.val().trim(),
            message: $messageInput.val().trim()
        };

        const $btn = $(this).find('button[type="submit"]');
        const btnOriginalText = $btn.html();
        $btn.prop('disabled', true).text('Enviando...');

        // Llamar al servicio nuevo
        SendHelpService.sendTicket(formData)
            .done(function(response) {
                if (response.success) {
                    $msgContainer.text(response.message).addClass('alert alert-success');
                    $messageInput.val(''); // Limpiar solo el mensaje
                    $form.removeClass('was-validated');
                } else {
                    $msgContainer.text(response.message).addClass('alert alert-danger');
                }
            })
            .fail(function() {
                $msgContainer.text('Error de conexión al enviar el mensaje.').addClass('alert alert-danger');
            })
            .always(function() {
                $btn.prop('disabled', false).html(btnOriginalText);
            });
    });
});