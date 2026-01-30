<?php
// TFG/api/get_recipes_feed.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es'); // O tu localhost
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Credentials: true');

require_once __DIR__ . '/../config/db_connection.php';

$response = ['success' => false, 'data' => [], 'message' => ''];

try {
    if (!$pdo) {
        throw new Exception("Error de conexión a la base de datos.");
    }
    
    $sql = "
        SELECT 
            r.id, 
            r.titulo, 
            r.imagen_url, 
            r.tiempo_preparacion_min, 
            r.fecha_publicacion,
            r.dificultad,
            r.id_usuario as authorId,
            u.username as author_name,
            u.avatar_url as author_avatar, -- Traemos el avatar del autor también
            c.id as cat_id,
            c.nombre_categoria,
            d.id as diet_id,
            d.nombre_dieta,
            (SELECT COUNT(*) FROM likes_receta l WHERE l.id_receta = r.id) as total_likes
        FROM recetas r
        JOIN usuarios u ON r.id_usuario = u.id
        LEFT JOIN categorias_receta c ON r.id_categoria = c.id
        LEFT JOIN tipos_dieta_receta d ON r.id_tipo_dieta = d.id
        WHERE r.visibilidad = 'publica'
        ORDER BY r.fecha_publicacion DESC
    ";

    $stmt = $pdo->query($sql);
    $rawRecipes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $mappedRecipes = [];
    foreach ($rawRecipes as $row) {
        $mappedRecipes[] = [
            'id' => $row['id'],
            'title' => $row['titulo'],
            'author' => $row['author_name'],
            'authorId' => $row['authorId'],
            'authorAvatar' => $row['author_avatar'] ? $row['author_avatar'] : 'resources/default-avatar.svg',
            'image' => $row['imagen_url'] ? $row['imagen_url'] : 'resources/default-recipe.svg',
            'likes' => (int)$row['total_likes'],
            'time' => $row['tiempo_preparacion_min'] . " min",
            'timeInMinutes' => (int)$row['tiempo_preparacion_min'],
            'publishDate' => $row['fecha_publicacion'],
            
            // Datos para filtros y visualización
            'category_id' => (string)$row['cat_id'],
            'category_name' => $row['nombre_categoria'],
            
            'diet_id' => (string)$row['diet_id'],
            'diet_name' => $row['nombre_dieta'],
            
            'difficulty' => strtolower($row['dificultad'])
        ];
    }

    $response['success'] = true;
    $response['data'] = $mappedRecipes;

} catch (Exception $e) {
    error_log("API Error (get_recipes_feed.php): " . $e->getMessage());
    $response['message'] = 'Error al cargar las recetas.';
}

echo json_encode($response);
exit;
?>