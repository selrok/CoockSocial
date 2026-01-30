<?php

// Establecer la cabecera para indicar que la respuesta será JSON
header('Content-Type: application/json');

// Incluir el archivo de conexión a la base de datos
// La ruta asume que 'api' está en la raíz y 'config' también. Ajusta si es necesario.
require_once __DIR__ . '/../config/db_connection.php'; // $pdo

$response = ['success' => false, 'data' => [], 'message' => ''];

// El try-catch de db_connection.php ya maneja errores de conexión iniciales.
// Si $pdo no se estableció, el script ya habría terminado con die() allí.
// Sin embargo, podemos añadir una comprobación por si acaso.
if (!$pdo) {
    // Esto no debería alcanzarse si db_connection.php funciona como se espera
    $response['message'] = 'Error crítico: No se pudo establecer conexión con la base de datos.';
    echo json_encode($response);
    exit;
}

try {
    $sql = "SELECT id, nombre_dieta FROM tipos_dieta_receta ORDER BY nombre_dieta ASC";
    $stmt = $pdo->query($sql);
    
    $dietTypes = $stmt->fetchAll(); // PDO::FETCH_ASSOC es el modo por defecto gracias a $pdo_options

    if ($dietTypes) {
        $response['success'] = true;
        $response['data'] = $dietTypes;
    } else {
        // No es necesariamente un error si la tabla está vacía
        $response['success'] = true; 
        $response['message'] = 'No se encontraron tipos de dieta.';
    }

} catch (PDOException $e) {
    // En un entorno de producción, registra el error en un archivo de log
    error_log("API Error (get_diet_types.php): " . $e->getMessage());
    $response['message'] = 'Error al obtener los tipos de dieta.';
}

// Devolver la respuesta como JSON
echo json_encode($response);
exit;
?>