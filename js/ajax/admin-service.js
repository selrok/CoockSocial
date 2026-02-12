// TFG/js/ajax/admin-service.js

const AdminService = {
    getAllData: function() {
        return $.ajax({
            url: 'api/admin_actions.php',
            type: 'GET',
            data: { action: 'get_all' },
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },


    performAction: function(payload) {
        return $.ajax({
            url: 'api/admin_actions.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    }
};

if (typeof window !== 'undefined') { window.AdminService = AdminService; }