// TFG/js/ajax/auth-service.js
const AuthService = {
    register: function(userData) { 
        console.log("AuthService: Registrando usuario...", userData);
        return $.ajax({
            url: 'api/users.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(userData),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },
    login: function(credentials) { 
        console.log("AuthService: Iniciando sesión...", credentials);
        const loginUrl = 'api/auth.php?action=login'; // Asegúrate que esta ruta sea correcta desde el HTML
        return $.ajax({
            url: loginUrl,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(credentials),
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },
    logout: function() { 
        console.log("AuthService: Cerrando sesión...");
        const logoutUrl = 'api/auth.php?action=logout';
        return $.ajax({
            url: logoutUrl,
            type: 'POST',
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    },
    checkSession: function() {
        const checkSessionUrl = 'api/auth.php?action=check_session';
        return $.ajax({
            url: checkSessionUrl,
            type: 'GET',
            dataType: 'json',
            xhrFields: { withCredentials: true }
        });
    }
};
if (typeof window !== 'undefined') { window.AuthService = AuthService; }