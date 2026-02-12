// TFG/js/ajax/profile-service.js

window.ProfileService = {
    /**
     * Obtiene el perfil completo.
     * Si userId es null, el backend intentará usar la sesión.
     */
    getProfile: function(userId) {
        console.log("ProfileService: Pidiendo perfil para ID:", userId || "Actual (Sesión)");
        // Construcción limpia de URL
        let url = 'api/get_profile.php';
        if (userId) {
            url += '?id=' + encodeURIComponent(userId);
        }

        return $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            xhrFields: { withCredentials: true } // Importante para enviar sesión
        });
    }
};