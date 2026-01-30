<?php
// TFG/config/db_connection.php

// Incluir el archivo de configuración de la base de datos (constantes)
require_once __DIR__ . '/db_config.php'; // Define DB_HOST, DB_NAME, $dsn, $pdo_options, etc.

$pdo = null; // Variable para la conexión PDO

try {
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $pdo_options);
} catch (PDOException $e) {
    error_log("CRITICAL DB Connection Error: " . $e->getMessage() . " (DSN: $dsn, User: " . DB_USER . ")");
    // $pdo permanecerá null. Los scripts que lo incluyan deben manejar la posibilidad de que $pdo sea null.
}

/**
 * Establece la sesión para un usuario dado.
 * Esta función ASUME que session_start() ya ha sido llamada en el script que la invoca.
 * @param array $user - Array asociativo con los datos del usuario. Debe incluir al menos 'id', 'username', 'id_rol'.
 *                      Puede incluir opcionalmente 'email', 'nombre_completo', 'avatar_url' para guardarlos también en sesión.
 */
function establishUserSessionFunction(array $user) {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        // Salvaguarda, aunque session_start() debería ser la primera línea en scripts API.
        error_log("ALERTA: establishUserSessionFunction llamada sin sesión PHP activa. Intentando iniciar.");
        session_start(); 
    }
    session_regenerate_id(true); // Seguridad contra fijación de sesión

    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['id_rol'] = (int)$user['id_rol'];
    
    // Guardar datos adicionales en sesión si están presentes en el array $user
    // Estos son útiles para no tener que consultar la DB en cada check_session
    if (isset($user['email'])) {
        $_SESSION['email'] = $user['email'];
    }
    if (isset($user['nombre_completo'])) {
        $_SESSION['nombre_completo'] = $user['nombre_completo'];
    }
    if (isset($user['avatar_url'])) {
        $_SESSION['avatar_url'] = $user['avatar_url'];
    }
}
?>