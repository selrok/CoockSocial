<?php
// TFG/api/get_notifications.php

if (session_status() === PHP_SESSION_NONE) { session_start(); }

// Modelo de Éxito: Limpieza de Warnings y cabeceras
ob_start();
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es'); 
header('Access-Control-Allow-Credentials: true');

require_once __DIR__ . '/../config/db_connection.php';

try {
    $user_id = $_SESSION['user_id'] ?? null;
    if (!$user_id) throw new Exception("No autorizado", 401);

    if (!$pdo) throw new Exception("Error de conexión");

    // Consultamos notificaciones uniendo con usuarios (emisor) y recetas (origen)
    $sql = "SELECT n.*, 
                   u.username as nombre_emisor, 
                   u.avatar_url as avatar_emisor,
                   r.titulo as titulo_receta
            FROM notificaciones n
            LEFT JOIN usuarios u ON n.id_usuario_emisor = u.id
            LEFT JOIN recetas r ON n.id_origen_contenido = r.id 
                               AND n.tipo IN ('comentario', 'like', 'baneo_receta')
            WHERE n.id_usuario_receptor = ?
            ORDER BY n.fecha_creacion DESC 
            LIMIT 30";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    ob_clean();
    echo json_encode(['success' => true, 'data' => $notifications]);

} catch (Exception $e) {
    ob_clean();
    http_response_code($e->getCode() == 401 ? 401 : 400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
ob_end_flush();