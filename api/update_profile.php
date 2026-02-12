<?php
// TFG/api/update_profile.php

ob_start();
if (session_status() === PHP_SESSION_NONE) { session_start(); }

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS'); // Añadido GET
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/image_helper.php';

// Pre-flight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); exit();
}

try {
    // 1. Obtener conexión global si establishUserSessionFunction no la retorna (tu estructura)
    global $pdo; 
    if (!$pdo) {
        throw new Exception("Error de conexión a la base de datos.");
    }

    // 2. Verificar Sesión
    if (!isset($_SESSION['user_id'])) {
        throw new Exception("Debes iniciar sesión.", 401);
    }
    $user_id = $_SESSION['user_id'];

    // ==========================================
    // MÉTODO GET: OBTENER DATOS ACTUALES (BIO)
    // ==========================================
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Consultar directamente la BD para tener la BIO más reciente
        $stmt = $pdo->prepare("SELECT username, email, nombre_completo, bio, avatar_url FROM usuarios WHERE id = ?");
        $stmt->execute([$user_id]);
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($userData) {
            ob_clean();
            echo json_encode([
                'success' => true,
                'data' => [
                    'username' => $userData['username'],
                    'email' => $userData['email'],
                    'nombre_completo' => $userData['nombre_completo'],
                    'bio' => $userData['bio'], // <-- Aquí viene la BIO fresca de la BD
                    'avatar_url' => $userData['avatar_url']
                ]
            ]);
            exit;
        } else {
            throw new Exception("Usuario no encontrado.", 404);
        }
    }

    // ==========================================
    // MÉTODO POST: ACTUALIZAR DATOS
    // ==========================================
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        
        // ... (Recuperar datos antiguos para gestión de imagen) ...
        $stmtData = $pdo->prepare("SELECT avatar_url, nombre_completo, bio FROM usuarios WHERE id = ?");
        $stmtData->execute([$user_id]);
        $current = $stmtData->fetch(PDO::FETCH_ASSOC);

        $name = trim($_POST['name'] ?? $current['nombre_completo']);
        $bio  = trim($_POST['bio'] ?? $current['bio']);
        $pass = $_POST['password'] ?? '';

        if (empty($name)) { throw new Exception("El nombre es obligatorio."); }

        // Gestión de imagen (reutilizamos tu lógica)
        $new_avatar_path = $current['avatar_url'];
        if (isset($_FILES['profileImage']) && $_FILES['profileImage']['error'] === UPLOAD_ERR_OK) {
            $upload = replaceImage($_FILES['profileImage'], 'avatar', $current['avatar_url']);
            if ($upload['success']) {
                $new_avatar_path = $upload['path'];
            } else {
                throw new Exception($upload['message']);
            }
        }

        // Update SQL
        $sql = "UPDATE usuarios SET nombre_completo = :nom, bio = :bio, avatar_url = :img";
        $params = [':nom' => $name, ':bio' => empty($bio)?null:$bio, ':img' => $new_avatar_path, ':id' => $user_id];
        
        if (!empty($pass)) {
            $sql .= ", password_hash = :pass";
            $params[':pass'] = password_hash($pass, PASSWORD_DEFAULT);
        }
        $sql .= " WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        
        if ($stmt->execute($params)) {
            // Actualizar sesión para el resto de la navegación
            $_SESSION['nombre_completo'] = $name;
            $_SESSION['avatar_url'] = $new_avatar_path;
            
            ob_clean();
            echo json_encode([
                'success' => true,
                'message' => 'Perfil actualizado.',
                'data' => ['nombre_completo' => $name, 'avatar_url' => $new_avatar_path]
            ]);
        } else {
            throw new Exception("Error al actualizar la base de datos.");
        }
    } else {
        throw new Exception("Método no permitido.", 405);
    }

} catch (Exception $e) {
    ob_clean();
    $code = $e->getCode();
    http_response_code(($code >= 400 && $code <= 599) ? $code : 500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
ob_end_flush();
?>