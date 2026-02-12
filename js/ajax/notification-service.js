// TFG/js/ajax/notification-service.js

window.NotificationService = {
    /** Obtiene las notificaciones */
    getNotifications: function() {
        return $.ajax({
            url: 'api/get_notifications.php',
            type: 'GET',
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },
    
    /** Marca una notificación individual como leída */
    markOneAsRead: function(id) {
        return $.ajax({
            url: 'api/notification_actions.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: 'mark_as_read', id: id }),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },

    create: function(data) {
        return $.ajax({
            url: 'api/notification_actions.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: 'create_notification', ...data }),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },

    delete: function(data) {
        return $.ajax({
            url: 'api/notification_actions.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ action: 'delete_notification', ...data }),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    }
};