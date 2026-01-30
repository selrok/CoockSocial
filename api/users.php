<?php

// Iniciar sesión AL PRINCIPIO.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// --- Cabeceras HTTP ---
header('Content-Type: application/json');
// AJUSTA EL ORIGEN A TU FRONTEND REAL (https://sergisaiz.com.es o http://localhost:PUERTO)
header('Access-Control-Allow-Origin: https://sergisaiz.com.es'); 
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Incluir conexión y función de sesión
require_once __DIR__ . '/../config/db_connection.php'; // $pdo y establishUserSessionFunction()

// Manejo de OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = ['success' => false, 'message' => '', 'data' => null];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputJSON = file_get_contents('php://input');
    $data = json_decode($inputJSON, true);

    if (json_last_error() !== JSON_ERROR_NONE || !$data) {
        $response['message'] = 'JSON inválido o vacío para registro.';
        http_response_code(400);
        echo json_encode($response); exit;
    }

    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $nombre_completo = isset($data['nombre_completo']) && trim($data['nombre_completo']) !== '' ? trim($data['nombre_completo']) : null;
    $id_rol_defecto = 3; // VERIFICA ID DEL ROL 'Usuario'

    // Validaciones
    if (empty($username) || empty($email) || empty($password)) {
        $response['message'] = 'Usuario, email y contraseña son obligatorios.';
        http_response_code(400); echo json_encode($response); exit;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response['message'] = 'Formato de email incorrecto.';
        http_response_code(400); echo json_encode($response); exit;
    }
    if (strlen($password) < 8) {
        $response['message'] = 'La contraseña debe tener al menos 8 caracteres.';
        http_response_code(400); echo json_encode($response); exit;
    }
    if ($nombre_completo !== null && (strlen($nombre_completo) < 2 || strlen($nombre_completo) > 100)) {
        $response['message'] = 'El nombre completo, si se proporciona, debe tener entre 2 y 100 caracteres.';
        http_response_code(400); echo json_encode($response); exit;
    }

    try {
        if (!$pdo) { throw new Exception("La conexión a la base de datos no está disponible."); }

        // Verificar unicidad (username)
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE username = :username");
        $stmt->bindParam(':username', $username); $stmt->execute();
        if ($stmt->fetch()) { $response['message'] = 'El nombre de usuario ya existe.'; http_response_code(409); echo json_encode($response); exit; }

        // Verificar unicidad (email)
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = :email");
        $stmt->bindParam(':email', $email); $stmt->execute();
        if ($stmt->fetch()) { $response['message'] = 'El email ya está registrado.'; http_response_code(409); echo json_encode($response); exit; }

        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        $sql = "INSERT INTO usuarios (username, email, password_hash, nombre_completo, id_rol, avatar_url, bio) 
                VALUES (:username, :email, :password_hash, :nombre_completo, :id_rol, NULL, NULL)";
        $stmt = $pdo->prepare($sql);
        if (!$stmt) { throw new PDOException("Error al preparar la inserción del nuevo usuario."); }

        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password_hash', $password_hash);
        $stmt->bindParam(':nombre_completo', $nombre_completo);
        $stmt->bindParam(':id_rol', $id_rol_defecto, PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            $newUserId = $pdo->lastInsertId();
            
            // Preparar datos para la sesión y la respuesta
            $userDataForSessionAndResponse = [
                'id' => $newUserId,
                'username' => $username,
                'email' => $email, // Guardar también en sesión para `check_session`
                'nombre_completo' => $nombre_completo, // Guardar también en sesión
                'id_rol' => $id_rol_defecto,
                'avatar_url' => null // Avatar es null al registrar
            ];

            establishUserSessionFunction($userDataForSessionAndResponse); // Auto-login

            $response['success'] = true;
            $response['message'] = 'Usuario registrado y sesión iniciada correctamente.';
            $response['data'] = $userDataForSessionAndResponse; // Devolver todos los datos relevantes
            http_response_code(201);
        } else {
            $errorInfo = $stmt->errorInfo();
            error_log("API Users Error (execute insert): " . ($errorInfo[2] ?? 'Error desconocido en execute'));
            $response['message'] = 'No se pudo registrar el usuario en la base de datos.';
            http_response_code(500);
        }
    } catch (PDOException $e) {
        error_log("API DB PDOException (users.php): " . $e->getMessage() . " - Input: " . $inputJSON);
        $response['message'] = 'Error de base de datos durante el registro.'; 
        http_response_code(500);
    } catch (Exception $e) {
        error_log("API General Exception (users.php): " . $e->getMessage());
        $response['message'] = 'Error general del servidor durante el registro.'; 
        http_response_code(500);
    }
} else {
    $response['message'] = "Método HTTP '{$method}' no soportado. Use POST para registrar.";
    http_response_code(405);
}

echo json_encode($response);
exit;
?>