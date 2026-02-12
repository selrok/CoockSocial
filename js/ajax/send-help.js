// TFG/js/ajax/send-help.js

window.HelpService = {
    /**
     * Envía el ticket al endpoint contactUs.php
     * @param {Object} ticketData - Datos del formulario
     */
    sendTicket: function(ticketData) {
        return $.ajax({
            url: 'api/contactUs.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(ticketData),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    }
};