// TFG/js/ajax/send-help.js

const SendHelpService = {
    /**
     * Envía un ticket de soporte.
     * @param {object} ticketData { name, email, message }
     */
    sendTicket: function(ticketData) {
        console.log("SendHelpService: Enviando...", ticketData);
        return $.ajax({
            url: 'api/contactUs.php', // Ruta relativa al index.html/help.html
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(ticketData),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    }
};

if (typeof window !== 'undefined') { window.SendHelpService = SendHelpService; }