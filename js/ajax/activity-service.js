// TFG/js/ajax/activity-service.js

const ActivityService = {
    /**
     * Obtiene listas de actividad.
     * @param {string} type 'notifications' | 'followers' | 'following'
     */
    getList: function(type) {
        return $.ajax({
            url: 'api/activity.php',
            type: 'GET',
            data: { type: type },
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    }
};

if (typeof window !== 'undefined') { window.ActivityService = ActivityService; }