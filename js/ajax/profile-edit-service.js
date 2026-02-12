// TFG/js/ajax/profile-edit-service.js
window.ProfileEditService = {
    // 1. OBTENER DATOS (GET)
    getMyProfileData: function() {
        console.log("ProfileEditService: Solicitando datos actuales al servidor...");
        return $.ajax({
            url: 'api/update_profile.php',
            type: 'GET',
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },

    // 2. GUARDAR DATOS (POST)
    updateProfile: function(formData) {
        return $.ajax({
            url: 'api/update_profile.php',
            type: 'POST',
            data: formData,
            processData: false, 
            contentType: false,
            xhrFields: { withCredentials: true }
        });
    }
};