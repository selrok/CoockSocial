<?php
// TFG/api/activity.php

ob_start();
if (session_status() === PHP_SESSION_NONE) { session_start(); }

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es'); 
header('Access-Control-Allow-Credentials: true');

require_once __DIR__ . '/../config/db_connection.php';

try {
    if (!isset($_SESSION['user_id'])) {
        throw new Exception("No autorizado", 401);
    }
    $user_id = $_SESSION['user_id'];
    $type = $_GET['type'] ?? 'notifications';

    if (!$pdo) throw new Exception("Error de conexión a la base de datos.");

    $data = [];

    switch ($type) {
        case 'notifications':
            // Traer notificaciones con JOINs para emisor y receta
            $sql = "SELECT n.*, u.username as nombre_emisor, u.avatar_url as avatar_emisor, r.titulo as titulo_receta
                    FROM notificaciones n
                    LEFT JOIN usuarios u ON n.id_usuario_emisor = u.id
                    LEFT JOIN recetas r ON n.id_origen_contenido = r.id AND n.tipo IN ('like', 'comentario', 'baneo_receta')
                    WHERE n.id_usuario_receptor = ?
                    ORDER BY n.fecha_creacion DESC LIMIT 50";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$user_id]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'following':
            // Usuarios a los que yo sigo
            $sql = "SELECT u.id, u.username, u.nombre_completo, u.avatar_url 
                    FROM seguidores s
                    JOIN usuarios u ON s.id_usuario_seguido = u.id
                    WHERE s.id_usuario_seguidor = ?
                    ORDER BY u.username ASC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$user_id]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'followers':
            // Usuarios que me siguen + Subquery para saber si yo les sigo (is_followed_by_me)
            // Usamos marcadores ? para evitar conflictos en servidores locales
            $sql = "SELECT u.id, u.username, u.nombre_completo, u.avatar_url,
                    (SELECT COUNT(*) FROM seguidores WHERE id_usuario_seguidor = ? AND id_usuario_seguido = u.id) as is_followed_by_me
                    FROM seguidores s
                    JOIN usuarios u ON s.id_usuario_seguidor = u.id
                    WHERE s.id_usuario_seguido = ?
                    ORDER BY u.username ASC";
            $stmt = $pdo->prepare($sql);
            // Pasamos el ID dos veces para cubrir ambos marcadores ?
            $stmt->execute([$user_id, $user_id]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
    }

    ob_clean();
    echo json_encode(['success' => true, 'data' => $data]);

} catch (Exception $e) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
ob_end_flush();