// TFG/js/ajax/support-service.js

/**
 * SupportService
 * Objeto para encapsular llamadas AJAX relacionadas con el sistema de soporte.
 */
const SupportService = {
    /**
     * Envía un nuevo ticket de soporte al backend.
     * @param {object} ticketData - Datos del ticket (name, email, message).
     * @returns {Promise} Promesa de jQuery.
     */
    sendTicket: function(ticketData) {
        console.log("SupportService: Enviando ticket...", ticketData);
        
        // CORRECCIÓN: Nombre correcto del archivo PHP
        const supportApiUrl = 'api/support_tickets.php'; 

        return $.ajax({
            url: supportApiUrl,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(ticketData),
            dataType: 'json',
            xhrFields: { 
                withCredentials: true
            }
        })
        .done(function(response) {
            console.log("SupportService.sendTicket - Éxito AJAX:", response);
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            console.error("SupportService.sendTicket - Fallo AJAX:", {jqXHR, textStatus, errorThrown});
        });
    }
};

if (typeof window !== 'undefined') {
    window.SupportService = SupportService;
}