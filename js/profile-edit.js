$(document).ready(function() {
    // Variables
    let form = $('#editProfileForm');
    let profileImage = $('#profileImage');
    let profileImageInput = $('#profileImageInput');
    let changeImageBtn = $('#changeImageBtn');
    let passwordInput = $('#password');
    let confirmPasswordInput = $('#confirmPassword');
    let passwordMismatch = $('#passwordMismatch');
    let saveBtn = $('#saveBtn');
    let cancelBtn = $('#cancelBtn');

    // Mostrar/ocultar contraseña
    $('.toggle-password').on('click', function() {
        let target = $(this).data('target');
        let input = $('#' + target);
        let icon = $(this).find('i');
        
        if (input.attr('type') === 'password') {
            input.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            input.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    // Cambiar imagen de perfil
    changeImageBtn.on('click', function() {
        profileImageInput.trigger('click');
    });

    profileImageInput.on('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            let file = e.target.files[0];
            let reader = new FileReader();
            
            reader.onload = function(e) {
                profileImage.attr('src', e.target.result);
            };
            
            reader.readAsDataURL(file);
        }
    });

    // Validar contraseñas
    function validatePasswords() {
        if (passwordInput.val() !== confirmPasswordInput.val()) {
            passwordMismatch.removeClass('d-none');
            confirmPasswordInput.addClass('is-invalid');
            return false;
        } else {
            passwordMismatch.addClass('d-none');
            confirmPasswordInput.removeClass('is-invalid');
            return true;
        }
    }

    confirmPasswordInput.on('input', validatePasswords);
    passwordInput.on('input', validatePasswords);

    // Guardar cambios
    saveBtn.on('click', function() {
        if (form[0].checkValidity() === false || !validatePasswords()) {
            form.addClass('was-validated');
            return;
        }

        // Obtener datos del formulario
        let formData = {
            name: $('#name').val(),
            bio: $('#bio').val(),
            password: passwordInput.val(),
            profileImage: profileImageInput[0].files[0] ? profileImageInput[0].files[0].name : null
        };

        // Simular envío (en producción sería AJAX)
        console.log('Datos del formulario:', formData);
        
        // Redireccionar al perfil
        window.location.href = 'profile.html';
    });

    // Cancelar edición
    cancelBtn.on('click', function() {
        if (confirm('¿Estás seguro de que deseas descartar los cambios?')) {
            window.location.href = 'profile.html';
        }
    });
});