<?php
// TFG/api/contactUs.php

// 1. Iniciar sesión para validar CSRF o leer datos de sesión si fuera necesario internamente
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 2. Cabeceras CORS (Igual que en tus otros archivos)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es'); // O http://localhost
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

require_once __DIR__ . '/../config/db_connection.php'; // $pdo

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputJSON = file_get_contents('php://input');
    $data = json_decode($inputJSON, true);

    if (json_last_error() !== JSON_ERROR_NONE || !$data) {
        $response['message'] = 'JSON inválido.';
        http_response_code(400);
        echo json_encode($response);
        exit;
    }

    // Sanear datos
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $message = trim($data['message'] ?? '');
    
    // El id_usuario es opcional (NULL si es visitante), pero lo cogemos si está logueado
    // para tener trazabilidad.
    $id_usuario = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

    // Validaciones
    if (empty($name) || empty($email) || empty($message)) {
        $response['message'] = 'Por favor, rellena todos los campos.';
        http_response_code(400);
        echo json_encode($response);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response['message'] = 'El correo electrónico no es válido.';
        http_response_code(400);
        echo json_encode($response);
        exit;
    }

    try {
        if (!$pdo) throw new Exception("Error de conexión a la BD");

        // Insertar en la tabla tickets_soporte
        // Asegúrate que tu tabla tenga las columnas: nombre_remitente, email_remitente, mensaje, estado
        // Si tienes una columna 'id_usuario' (FK) también puedes guardarla, si no, omítela.
        
        $sql = "INSERT INTO tickets_soporte (nombre_remitente, email_remitente, mensaje, estado, fecha_envio) 
                VALUES (:name, :email, :message, 'Pendiente', NOW())";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':message' => $message
        ]);

        $response['success'] = true;
        $response['message'] = 'Tu mensaje ha sido enviado. Te responderemos pronto.';
        http_response_code(201);

    } catch (Exception $e) {
        error_log("Error en contactUs.php: " . $e->getMessage());
        $response['message'] = 'Error interno al enviar el mensaje. Inténtalo más tarde.';
        http_response_code(500);
    }
} else {
    http_response_code(405);
    $response['message'] = 'Método no permitido';
}

echo json_encode($response);
?>