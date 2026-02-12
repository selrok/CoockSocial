// TFG/js/profile-edit.js

$(document).ready(function() {
    console.log("profile-edit.js: DOM listo. Inicializando...");

    // --- 1. VARIABLES Y SELECTORES ---
    const $form = $('#editProfileForm');
    const $nameInput = $('#name');
    const $bioTextarea = $('#bio');
    const $imgPreview = $('#profileImage');
    const $imgInput = $('#profileImageInput');
    const $changeImageBtn = $('#changeImageBtn');
    
    const $passInput = $('#password');
    const $confirmPassInput = $('#confirmPassword');
    const $passwordMismatchMsg = $('#passwordMismatch');
    
    const $btnSave = $('#saveBtn');
    const $btnCancel = $('#cancelBtn');
    
    // Contenedor de mensajes (lo creamos si no existe)
    let $msgDiv = $('#statusMessage');
    if (!$msgDiv.length) {
        $msgDiv = $('<div id="statusMessage" class="alert mt-3" style="display:none;"></div>');
        $form.before($msgDiv); 
    }

    // --- 2. LÓGICA DE CARGA DE DATOS ---

    /**
     * Escuchamos el evento global de sesión disparado por notifications.js.
     * Esto asegura que el usuario esté logueado antes de pedir sus datos.
     */
    $(document).on('sessionStatusChecked', function(event, session) {
        
        if (!session || !session.is_logged_in) {
            console.warn("profile-edit.js: No hay sesión activa. Redirigiendo a login.");
            window.location.href = 'logReg.html#login';
            return;
        }

        console.log("profile-edit.js: Usuario validado. Cargando datos completos del perfil...");
        
        // Llamamos a la función que pide los datos frescos a la BD (incluyendo BIO)
        loadMyProfileDataFromDB();
    });

    function loadMyProfileDataFromDB() {
        // Bloquear campos visualmente mientras carga
        $nameInput.prop('disabled', true);
        $bioTextarea.prop('disabled', true);

        // Verificar que el servicio existe
        if (typeof ProfileEditService === 'undefined') {
            showMsg("Error: ProfileEditService no está cargado.", "danger");
            return;
        }

        // Llamada GET a la API
        ProfileEditService.getMyProfileData()
            .done(function(response) {
                if (response.success && response.data) {
                    const dbUser = response.data;
                    console.log("profile-edit.js: Datos recibidos:", dbUser);

                    // Rellenar formulario
                    $nameInput.val(dbUser.nombre_completo || dbUser.username || "");
                    // Rellenar BIO (si es null o string "null", poner vacío)
                    if (dbUser.bio && dbUser.bio !== "null") {
                        $bioTextarea.val(dbUser.bio);
                    } else {
                        $bioTextarea.val(""); 
                    }
                    
                    // Imagen actual
                    const avatar = dbUser.avatar_url ? dbUser.avatar_url : 'resources/default-avatar.svg'; // Ajusta la extensión si es .jpg o .png
                    $imgPreview.attr('src', avatar);

                } else {
                    showMsg("No se pudieron cargar los datos del perfil.", "warning");
                }
            })
            .fail(function(jqXHR) {
                console.error("profile-edit.js: Error carga AJAX", jqXHR);
                showMsg("Error de conexión al cargar el perfil.", "danger");
            })
            .always(function() {
                // Desbloquear campos
                $nameInput.prop('disabled', false);
                $bioTextarea.prop('disabled', false);
            });
    }

    // --- 3. MANEJO DE LA IMAGEN DE PERFIL ---

    // Botón "Cambiar foto" activa el input oculto
    $changeImageBtn.on('click', function(e) {
        e.preventDefault();
        $imgInput.trigger('click');
    });

    // Cuando se selecciona un archivo, mostrar vista previa
    $imgInput.on('change', function() {
        const file = this.files[0];
        if (file) {
            // Validar tamaño básico (ej. 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showMsg("La imagen es demasiado grande. Máximo 5MB.", "danger");
                this.value = ""; // Resetear input
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                $imgPreview.attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // --- 4. UTILIDADES UI (Password toggle) ---
    
    $('.toggle-password').on('click', function() {
        const targetId = $(this).data('target');
        const $input = $('#' + targetId);
        const $icon = $(this).find('i');
        
        // Asumiendo FontAwesome (fa-eye / fa-eye-slash)
        if ($input.attr('type') === 'password') {
            $input.attr('type', 'text');
            $icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            $input.attr('type', 'password');
            $icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    // --- 5. GUARDAR CAMBIOS (SUBMIT) ---

    $btnSave.on('click', function(e) {
        e.preventDefault();
        
        // Limpiar estados previos
        $passwordMismatchMsg.addClass('d-none');
        $msgDiv.hide();
        
        // Obtener valores
        const passVal = $passInput.val();
        const confVal = $confirmPassInput.val();
        const nameVal = $nameInput.val().trim();
        const bioVal  = $bioTextarea.val().trim();

        // Validaciones Frontend
        if (nameVal === "") {
            showMsg("El nombre es obligatorio.", "danger");
            $nameInput.focus();
            return;
        }

        if (passVal !== "" && passVal !== confVal) {
            $passwordMismatchMsg.removeClass('d-none');
            showMsg("Las contraseñas no coinciden.", "danger");
            $confirmPassInput.focus();
            return;
        }
        
        if (passVal !== "" && passVal.length < 8) {
            showMsg("La contraseña debe tener al menos 8 caracteres.", "danger");
            return;
        }

        // Construir FormData
        const formData = new FormData();
        formData.append('name', nameVal);
        formData.append('bio', bioVal);
        
        if (passVal !== "") {
            formData.append('password', passVal);
        }
        
        // Solo añadir la imagen si el usuario seleccionó una nueva
        if ($imgInput[0].files[0]) {
            formData.append('profileImage', $imgInput[0].files[0]);
        }

        // Estado visual de carga
        const originalText = $btnSave.html();
        $btnSave.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Guardando...');

        // Llamada al Servicio
        if (typeof ProfileEditService === 'undefined') {
            showMsg("Error crítico: Servicio de edición no cargado.", "danger");
            $btnSave.prop('disabled', false).html(originalText);
            return;
        }

        ProfileEditService.updateProfile(formData)
            .done(function(res) {
                if (res.success) {
                    showMsg(res.message, "success");
                    
                    // Actualizar imagen en el navbar si cambió (opcional, requiere recarga o evento)
                    
                    // Redirigir al perfil tras 1.5s
                    setTimeout(function() {
                        window.location.href = 'profile.html'; 
                    }, 1500);
                } else {
                    showMsg("Error: " + res.message, "danger");
                    $btnSave.prop('disabled', false).html(originalText);
                }
            })
            .fail(function(jqXHR) {
                console.error("Error AJAX Guardar:", jqXHR);
                let errorMsg = "Error al conectar con el servidor.";
                if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                    errorMsg = jqXHR.responseJSON.message;
                }
                showMsg(errorMsg, "danger");
                $btnSave.prop('disabled', false).html(originalText);
            });
    });

    // --- 6. CANCELAR ---
    $btnCancel.on('click', function() {
        // Volver a la página de perfil sin guardar
        window.location.href = 'profile.html';
    });

    /**
     * Helper para mostrar mensajes de alerta
     */
    function showMsg(text, type) {
        $msgDiv.removeClass('alert-success alert-danger alert-info alert-warning')
               .addClass('alert-' + type)
               .text(text)
               .slideDown();
        
        // Scroll suave hacia arriba para ver el mensaje
        $('html, body').animate({
            scrollTop: $msgDiv.offset().top - 100
        }, 500);
    }
});