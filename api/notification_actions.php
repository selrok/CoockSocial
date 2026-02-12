<?php
// TFG/api/notification_actions.php

// 1. Patrón Blindado: Limpieza de salida y gestión de sesión
ob_start();
if (session_status() === PHP_SESSION_NONE) { session_start(); }

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es'); 
header('Access-Control-Allow-Credentials: true');

require_once __DIR__ . '/../config/db_connection.php';

try {
    // 2. Validar que el usuario esté logueado
    if (!isset($_SESSION['user_id'])) {
        throw new Exception("No autorizado", 401);
    }
    $user_id = $_SESSION['user_id'];

    // 3. Capturar datos POST
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    $noti_id = $input['id'] ?? null;

    if (!$pdo) throw new Exception("Error de conexión a la BD");

    switch ($action) {
        case 'mark_as_read':
            if (!$noti_id) throw new Exception("Falta ID de notificación");
            
            // Seguridad: Solo marcamos como leída si la notificación pertenece al usuario
            $stmt = $pdo->prepare("UPDATE notificaciones SET leida = 1 WHERE id = ? AND id_usuario_receptor = ?");
            $stmt->execute([$noti_id, $user_id]);
            break;

        case 'mark_all_as_read':
            $stmt = $pdo->prepare("UPDATE notificaciones SET leida = 1 WHERE id_usuario_receptor = ?");
            $stmt->execute([$user_id]);
            break;
            
        case 'create_notification':
            $receptor = $input['receptor_id'] ?? null;
            $tipo = $input['tipo'] ?? null;
            $contenido = $input['contenido_id'] ?? null;
            $emisor = $_SESSION['user_id'];

            if (!$receptor || !$tipo) throw new Exception("Datos incompletos");
            
            // Lógica de validación de auto-notificación
            // Permitimos auto-notificación si es un baneo (para que el admin pueda testear consigo mismo)
            if ($receptor == $emisor && !str_contains($tipo, 'baneo')) {
                ob_clean();
                echo json_encode(['success' => true, 'message' => 'Auto-notificación ignorada']);
                exit; 
            }

            // Requerimiento especial: Si es seguidor, el origen es el emisor para el link al perfil
            if ($tipo === 'seguidor') {
                $contenido = $emisor;
            }

            $sql = "INSERT INTO notificaciones (id_usuario_receptor, id_usuario_emisor, tipo, id_origen_contenido, leida) 
                    VALUES (?, ?, ?, ?, 0)";
            $pdo->prepare($sql)->execute([$receptor, $emisor, $tipo, $contenido]);
            break;

        case 'delete_notification':
            $receptor = $input['receptor_id'] ?? null;
            $tipo = $input['tipo'] ?? null;
            $contenido = $input['contenido_id'] ?? null;
            $emisor = $_SESSION['user_id'];

            if ($tipo === 'seguidor') {
                $contenido = $emisor;
            }

            $sql = "DELETE FROM notificaciones 
                    WHERE id_usuario_receptor = ? AND id_usuario_emisor = ? AND tipo = ? AND id_origen_contenido = ?";
            $pdo->prepare($sql)->execute([$receptor, $emisor, $tipo, $contenido]);
            break;

        default:
            throw new Exception("Acción no válida");
    }

    ob_clean(); 
    echo json_encode(['success' => true, 'message' => 'Operación realizada con éxito']);

} catch (Exception $e) {
    ob_clean();
    http_response_code($e->getCode() == 401 ? 401 : 400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
ob_end_flush();