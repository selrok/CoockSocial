<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es'); // O tu localhost
header('Access-Control-Allow-Methods: GET');

require_once __DIR__ . '/../config/db_connection.php';

$response = ['success' => false, 'data' => [], 'message' => ''];

try {
    if (!$pdo) {
        throw new Exception("Error de conexión a la base de datos.");
    }

    // Consulta para obtener las categorías
    $sql = "SELECT id, nombre_categoria FROM categorias_receta ORDER BY nombre_categoria ASC";
    $stmt = $pdo->query($sql);
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($categories) {
        $response['success'] = true;
        $response['data'] = $categories;
    } else {
        $response['message'] = 'No se encontraron categorías.';
    }

} catch (Exception $e) {
    error_log("API Error (get_categories.php): " . $e->getMessage());
    $response['message'] = 'Error al obtener categorías.';
}

echo json_encode($response);
exit;
?>