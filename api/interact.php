<?php
// TFG/api/interact.php

if (session_status() === PHP_SESSION_NONE) { session_start(); }

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

require_once __DIR__ . '/../config/db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Verificar Login
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401); 
        echo json_encode(['success' => false, 'message' => 'No autorizado.']); 
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    $userId = $_SESSION['user_id'];

    try {
        if (!$pdo) throw new Exception("Error de conexión DB");

        // --- LÓGICA PARA LIKES ---
        if ($action === 'toggle_like') {
            $recipeId = (int)($input['recipe_id'] ?? 0);
            if ($recipeId <= 0) throw new Exception("ID receta inválido");

            $stmt = $pdo->prepare("SELECT 1 FROM likes_receta WHERE id_usuario = ? AND id_receta = ?");
            $stmt->execute([$userId, $recipeId]);
            
            if ($stmt->fetch()) {
                $pdo->prepare("DELETE FROM likes_receta WHERE id_usuario = ? AND id_receta = ?")->execute([$userId, $recipeId]);
                $response['liked'] = false;
            } else {
                $pdo->prepare("INSERT INTO likes_receta (id_usuario, id_receta, fecha_like) VALUES (?, ?, NOW())")->execute([$userId, $recipeId]);
                $response['liked'] = true;
            }
            
            $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM likes_receta WHERE id_receta = ?");
            $stmtCount->execute([$recipeId]);
            $response['newCount'] = $stmtCount->fetchColumn();
            $response['success'] = true;

        // --- LÓGICA PARA GUARDADOS (FAVORITOS) ---
        } elseif ($action === 'toggle_save') {
            $recipeId = (int)($input['recipe_id'] ?? 0);
            if ($recipeId <= 0) throw new Exception("ID receta inválido");

            $stmt = $pdo->prepare("SELECT 1 FROM recetas_guardadas WHERE id_usuario = ? AND id_receta = ?");
            $stmt->execute([$userId, $recipeId]);

            if ($stmt->fetch()) {
                $pdo->prepare("DELETE FROM recetas_guardadas WHERE id_usuario = ? AND id_receta = ?")->execute([$userId, $recipeId]);
                $response['saved'] = false;
            } else {
                $pdo->prepare("INSERT INTO recetas_guardadas (id_usuario, id_receta, fecha_guardado) VALUES (?, ?, NOW())")->execute([$userId, $recipeId]);
                $response['saved'] = true;
            }
            $response['success'] = true;

        // --- LÓGICA PARA SEGUIR (FOLLOW) ---
        } elseif ($action === 'toggle_follow') {
            // El JS envía 'target_user_id'
            $targetUserId = (int)($input['target_user_id'] ?? 0);

            // Validaciones básicas
            if ($targetUserId <= 0) throw new Exception("ID usuario objetivo inválido");
            if ($targetUserId === $userId) throw new Exception("No puedes seguirte a ti mismo");

            // Verificar si ya le sigue
            $stmt = $pdo->prepare("SELECT 1 FROM seguidores WHERE id_usuario_seguidor = ? AND id_usuario_seguido = ?");
            $stmt->execute([$userId, $targetUserId]);
            
            if ($stmt->fetch()) {
                // DEJAR DE SEGUIR
                $pdo->prepare("DELETE FROM seguidores WHERE id_usuario_seguidor = ? AND id_usuario_seguido = ?")
                    ->execute([$userId, $targetUserId]);
                $response['isFollowing'] = false;
                $response['message'] = 'Dejaste de seguir al usuario.';
            } else {
                // SEGUIR
                $pdo->prepare("INSERT INTO seguidores (id_usuario_seguidor, id_usuario_seguido, fecha_seguimiento) VALUES (?, ?, NOW())")
                    ->execute([$userId, $targetUserId]);
                $response['isFollowing'] = true;
                $response['message'] = 'Ahora sigues a este usuario.';
            }
            $response['success'] = true;

        } else {
            $response['message'] = 'Acción desconocida.';
            http_response_code(400);
        }

    } catch (Exception $e) {
        http_response_code(500); 
        $response['message'] = 'Error servidor: ' . $e->getMessage();
        error_log($e->getMessage());
    }
} else {
    http_response_code(405);
}

echo json_encode($response);
?>