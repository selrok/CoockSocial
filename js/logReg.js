// TFG/js/logReg.js

$(document).ready(function() {
    // --- SECCIÓN: VERIFICACIÓN DE DEPENDENCIAS ---
    if (typeof AuthService === 'undefined' || 
        typeof AuthService.register !== 'function' ||
        typeof AuthService.login !== 'function') { // También chequear login para el futuro
        console.error('AuthService o sus métodos no están definidos. Verifica js/ajax/auth-service.js');
        $('#registerForm button[type="submit"], #loginForm button[type="submit"]').prop('disabled', true);
    }

    // --- SECCIÓN: MANEJO DE MOSTRAR/OCULTAR CONTRASEÑA (jQuery) ---
    $('.toggle-password').on('click', function() {
        const $this = $(this);
        const targetId = $this.data('target');
        const $passwordInput = $('#' + targetId);
        if (!$passwordInput.length) return;
        const $icon = $this.find('i');
        if ($passwordInput.attr('type') === 'password') {
            $passwordInput.attr('type', 'text');
            if ($icon.length) $icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            $passwordInput.attr('type', 'password');
            if ($icon.length) $icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    // --- SECCIÓN: FORMULARIO DE REGISTRO ---
    const $registerForm = $('#registerForm');
    const $regNameInput = $('#regName');
    const $regUsernameInput = $('#regUsername');
    const $regEmailInput = $('#regEmail');
    const $regPasswordInput = $('#regPassword');
    const $regConfirmPasswordInput = $('#regConfirmPassword');
    
    let $registerMessagesDiv = $('#registerMessages'); // Buscar si ya existe en HTML
    if ($registerForm.length && !$registerMessagesDiv.length) { // Crear si no existe
        $registerMessagesDiv = $('<div id="registerMessages" class="mb-3"></div>');
        $registerForm.before($registerMessagesDiv);
    }

    // Función para validar fortaleza de contraseña (misma que antes)
    function validatePasswordStrength(password) { /* ... (código completo de la función) ... */ 
        const errors = [];
        if (password.length < 8) { errors.push("Debe tener al menos 8 caracteres."); }
        if (!/[A-Z]/.test(password)) { errors.push("Debe contener al menos una letra mayúscula."); }
        if (!/[a-z]/.test(password)) { errors.push("Debe contener al menos una letra minúscula."); }
        if (!/[0-9]/.test(password)) { errors.push("Debe contener al menos un número."); }
        if (!/[^A-Za-z0-9\s]/.test(password)) { errors.push("Debe contener al menos un carácter especial."); }
        return errors;
    }

    // Validaciones en tiempo real para registro (usando jQuery)
    if ($regPasswordInput.length) {
        $regPasswordInput.on('input', function() {
            const password = $(this).val();
            const strengthErrors = validatePasswordStrength(password);
            const $feedbackEl = $(this).closest('.mb-3').find('.invalid-feedback-strength');
            if ($feedbackEl.length) $feedbackEl.empty().hide();
            $(this).removeClass('is-invalid');
            if (strengthErrors.length > 0) {
                $(this).addClass('is-invalid');
                if ($feedbackEl.length) {
                    strengthErrors.forEach(err => { $feedbackEl.append($('<div></div>').text(err)); });
                    $feedbackEl.show();
                }
            }
        });
    }
    if ($regPasswordInput.length && $regConfirmPasswordInput.length) {
        $([$regPasswordInput[0], $regConfirmPasswordInput[0]]).on('input', function() {
            const $feedbackEl = $regConfirmPasswordInput.closest('.mb-4').find('#regConfirmPasswordFeedback');
            if ($feedbackEl.length) $feedbackEl.empty();
            $regConfirmPasswordInput.removeClass('is-invalid');
            if ($regPasswordInput.val() && $regConfirmPasswordInput.val() && $regPasswordInput.val() !== $regConfirmPasswordInput.val()) {
                $regConfirmPasswordInput.addClass('is-invalid');
                if ($feedbackEl.length) $feedbackEl.text('Las contraseñas no coinciden.');
            }
        });
    }

    // Envío del formulario de Registro
    if ($registerForm.length) {
        $registerForm.on('submit', function(event) {
            event.preventDefault();
            if ($registerMessagesDiv.length) $registerMessagesDiv.empty().removeClass().addClass('mb-3');
            
            $(this).addClass('was-validated'); // Para estilos Bootstrap
            if (!this.checkValidity()) { // Validación HTML5/Bootstrap
                const $firstInvalid = $(this).find('.form-control:invalid').first();
                if ($firstInvalid.length) $firstInvalid.focus();
                return;
            }

            const fullName = $regNameInput.val().trim();
            const username = $regUsernameInput.val().trim();
            const email = $regEmailInput.val().trim();
            const password = $regPasswordInput.val();
            const confirmPassword = $regConfirmPasswordInput.val();

            // Re-validar fortaleza y coincidencia por si acaso
            const passwordStrengthErrors = validatePasswordStrength(password);
            if (passwordStrengthErrors.length > 0) { /* ... (mostrar errores como en el listener 'input') ... */ $regPasswordInput.addClass('is-invalid').focus(); return; }
            if (password !== confirmPassword) { /* ... (mostrar error de no coincidencia) ... */ $regConfirmPasswordInput.addClass('is-invalid').focus(); return; }

            const userData = {
                username: username,
                email: email,
                password: password,
                nombre_completo: fullName || null // Enviar null si está vacío
            };

            if ($registerMessagesDiv.length) $registerMessagesDiv.text('Registrando...').addClass('alert alert-info');
            
            AuthService.register(userData)
                .done(function(response) {
                    if (response && response.success) {
                        if ($registerMessagesDiv.length) $registerMessagesDiv.text(response.message + " Redirigiendo...").removeClass().addClass('mb-3 alert alert-success');
                        $registerForm[0].reset();
                        $registerForm.removeClass('was-validated');
                        $('.invalid-feedback-strength, #regConfirmPasswordFeedback').empty().hide();
                        $regPasswordInput.removeClass('is-invalid');
                        $regConfirmPasswordInput.removeClass('is-invalid');
                        setTimeout(function() { window.location.href = 'index.html'; }, 2500);
                    } else {
                        if ($registerMessagesDiv.length) $registerMessagesDiv.text("Error: " + (response.message || "No se pudo registrar.")).removeClass().addClass('mb-3 alert alert-danger');
                    }
                })
                .fail(function(jqXHR) {
                    let msg = "Error de comunicación."; /* ... (código de manejo de errores de jqXHR como antes) ... */
                    if (jqXHR.responseJSON && jqXHR.responseJSON.message) {msg = jqXHR.responseJSON.message;}
                    if ($registerMessagesDiv.length) $registerMessagesDiv.text("Error: " + msg).removeClass().addClass('mb-3 alert alert-danger');
                });
        });
    }

    // --- SECCIÓN: FORMULARIO DE LOGIN (CONECTAR AL AuthService.login) ---
    const $loginForm = $('#loginForm');
    let $loginMessagesDiv = $('#loginMessages');
    if ($loginForm.length && !$loginMessagesDiv.length) {
        $loginMessagesDiv = $('<div id="loginMessages" class="mb-3"></div>');
        $loginForm.before($loginMessagesDiv);
    }
        
    if ($loginForm.length) {
        $loginForm.on('submit', function(event) {
            event.preventDefault();
            if($loginMessagesDiv.length) $loginMessagesDiv.empty().removeClass().addClass('mb-3');
            
            $(this).addClass('was-validated');
            if (!this.checkValidity()) {
                const $firstInvalid = $(this).find('.form-control:invalid').first();
                if ($firstInvalid.length) $firstInvalid.focus();
                return;
            }

            const loginIdentifier = $('#loginUsername').val().trim(); // Asume que 'loginUsername' puede ser username o email
            const password = $('#loginPassword').val();

            const credentials = {
                loginIdentifier: loginIdentifier,
                password: password
            };

            if ($loginMessagesDiv.length) $loginMessagesDiv.text('Iniciando sesión...').addClass('alert alert-info');

            AuthService.login(credentials)
                .done(function(response) {
                    if (response && response.success) {
                        if ($loginMessagesDiv.length) $loginMessagesDiv.text(response.message + " Redirigiendo...").removeClass().addClass('mb-3 alert alert-success');
                        $loginForm[0].reset();
                        $loginForm.removeClass('was-validated');
                        // Redirigir al index o dashboard
                        window.location.href = 'index.html';
                    } else {
                        if ($loginMessagesDiv.length) $loginMessagesDiv.text("Error: " + (response.message || "Credenciales incorrectas.")).removeClass().addClass('mb-3 alert alert-danger');
                    }
                })
                .fail(function(jqXHR) {
                    let msg = "Error de comunicación.";
                     if (jqXHR.responseJSON && jqXHR.responseJSON.message) {msg = jqXHR.responseJSON.message;}
                    if ($loginMessagesDiv.length) $loginMessagesDiv.text("Error: " + msg).removeClass().addClass('mb-3 alert alert-danger');
                });
        });
    }

    // --- SECCIÓN: CAMBIAR ENTRE PESTAÑAS Y PESTAÑA ACTIVA POR URL (jQuery) ---
    $('.switch-tab').on('click', function(e) {
        e.preventDefault();
        const tabId = $(this).data('tab');
        const $tabElement = $('#' + tabId);
        if ($tabElement.length && typeof bootstrap !== 'undefined' && bootstrap.Tab) {
            const tab = new bootstrap.Tab($tabElement[0]);
            tab.show();
        }
    });
    function showTabFromUrl() {
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(window.location.search);
        let tabIdToActivate = null;
        if (hash === '#login' || urlParams.get('action') === 'login') { tabIdToActivate = 'login-tab'; }
        else if (hash === '#register' || urlParams.get('action') === 'register') { tabIdToActivate = 'register-tab'; }
        else { if ($('#authTabs .nav-link.active').length) return; tabIdToActivate = 'register-tab';}
        if (tabIdToActivate) {
            const $tabElement = $('#' + tabIdToActivate);
            if ($tabElement.length && typeof bootstrap !== 'undefined' && bootstrap.Tab) {
                const tab = new bootstrap.Tab($tabElement[0]);
                tab.show();
            }
        }
    }
    showTabFromUrl();
    $(window).on('hashchange', showTabFromUrl);
});