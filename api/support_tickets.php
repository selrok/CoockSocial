<?php

// Iniciar sesión para obtener datos del usuario si está logueado (opcional, pero útil)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');
// AJUSTA EL ORIGEN A TU FRONTEND
header('Access-Control-Allow-Origin: https://sergisaiz.com.es'); 
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization'); // Authorization por si lo usas a futuro
header('Access-Control-Allow-Credentials: true'); // Por si la sesión influye

require_once __DIR__ . '/../config/db_connection.php'; // $pdo

// Manejo de OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputJSON = file_get_contents('php://input');
    $data = json_decode($inputJSON, true);

    if (json_last_error() !== JSON_ERROR_NONE || !$data) {
        $response['message'] = 'JSON inválido o no proporcionado.';
        http_response_code(400);
        echo json_encode($response);
        exit;
    }

    // Campos del formulario
    // Nota: el frontend llama al campo email 'username' en el form, lo manejamos como 'email_remitente' aquí
    $nombre_remitente = trim($data['name'] ?? ''); 
    $email_remitente = trim($data['email'] ?? ''); // Asumiendo que el JS enviará un campo 'email'
    $mensaje = trim($data['message'] ?? '');

    // Validaciones básicas
    if (empty($nombre_remitente) || empty($email_remitente) || empty($mensaje)) {
        $response['message'] = 'Todos los campos (nombre, email, mensaje) son requeridos.';
        http_response_code(400);
        echo json_encode($response);
        exit;
    }
    if (!filter_var($email_remitente, FILTER_VALIDATE_EMAIL)) {
        $response['message'] = 'Formato de email inválido.';
        http_response_code(400);
        echo json_encode($response);
        exit;
    }
    if (strlen($mensaje) < 10) {
        $response['message'] = 'El mensaje debe tener al menos 10 caracteres.';
        http_response_code(400);
        echo json_encode($response);
        exit;
    }
    // Longitud máxima para los campos según tu DB
    if (strlen($nombre_remitente) > 100) { $response['message'] = 'Nombre demasiado largo.'; http_response_code(400); echo json_encode($response); exit; }
    if (strlen($email_remitente) > 100) { $response['message'] = 'Email demasiado largo.'; http_response_code(400); echo json_encode($response); exit; }
    // TEXT para mensaje no tiene un límite práctico en este punto de PHP

    try {
        if (!$pdo) {
            throw new Exception("Conexión a la base de datos no disponible.");
        }

        // Estado por defecto 'Pendiente' ya está en la definición de la tabla
        $sql = "INSERT INTO tickets_soporte (nombre_remitente, email_remitente, mensaje) 
                VALUES (:nombre_remitente, :email_remitente, :mensaje)";
        $stmt = $pdo->prepare($sql);

        if (!$stmt) {
            $errorInfo = $pdo->errorInfo();
            error_log("API SupportTickets Error: Fallo al PREPARAR SQL. PDO Error: " . ($errorInfo[2] ?? 'ND') . ". SQL: " . $sql);
            throw new PDOException("Error interno del servidor al procesar la solicitud.");
        }

        $stmt->bindParam(':nombre_remitente', $nombre_remitente);
        $stmt->bindParam(':email_remitente', $email_remitente);
        $stmt->bindParam(':mensaje', $mensaje);

        if ($stmt->execute()) {
            $response['success'] = true;
            $response['message'] = '¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.';
            http_response_code(201); // Created
        } else {
            $errorInfo = $stmt->errorInfo();
            error_log("API SupportTickets Error (execute insert): " . ($errorInfo[2] ?? 'Error desconocido en execute'));
            $response['message'] = 'No se pudo enviar tu mensaje en este momento. Inténtalo más tarde.';
            http_response_code(500);
        }

    } catch (PDOException $e) {
        error_log("API DB PDOException (support_tickets.php): " . $e->getMessage() . " - Input: " . $inputJSON);
        $response['message'] = 'Error de base de datos. Inténtalo más tarde.';
        http_response_code(500);
    } catch (Exception $e) {
        error_log("API General Exception (support_tickets.php): " . $e->getMessage());
        $response['message'] = 'Error general del servidor. Inténtalo más tarde.';
        http_response_code(500);
    }
} else {
    $response['message'] = "Método HTTP '{$_SERVER['REQUEST_METHOD']}' no soportado. Use POST.";
    http_response_code(405); // Method Not Allowed
}

echo json_encode($response);
exit;
?>