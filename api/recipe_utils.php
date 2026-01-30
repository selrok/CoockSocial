<?php

require_once __DIR__ . '/image_helper.php';

/**
 * Procesa, valida y estructura los datos del formulario de receta.
 * 
 * @param array $postData Los datos $_POST.
 * @param array $filesData Los datos $_FILES.
 * @param string|null $oldImagePath Ruta de la imagen anterior (solo para edición).
 * @return array Datos limpios y listos para la BD o lanza Exception.
 * @throws Exception Si hay errores de validación.
 */
function processRecipeFormData($postData, $filesData, $oldImagePath = null) {
    // 1. Recoger y sanitizar datos básicos
    $titulo = trim($postData['titulo'] ?? '');
    $descripcion = trim($postData['descripcion'] ?? '');
    $tiempo = (int)($postData['tiempo_preparacion_min'] ?? 0);
    $porciones = trim($postData['porciones'] ?? '');
    $id_categoria = (int)($postData['id_categoria'] ?? 0);
    $id_tipo_dieta = (int)($postData['id_tipo_dieta'] ?? 0);
    $dificultad = strtolower(trim($postData['dificultad'] ?? ''));
    $visibilidad = trim($postData['visibilidad'] ?? 'publica');
    $consejos = trim($postData['consejos_chef'] ?? '');

    // 2. Validaciones obligatorias
    if (empty($titulo) || empty($descripcion) || $tiempo <= 0 || empty($porciones)) {
        throw new Exception("Faltan campos obligatorios (título, descripción, tiempo o porciones).");
    }
    if ($id_categoria <= 0 || $id_tipo_dieta <= 0) {
        throw new Exception("Debes seleccionar una categoría y un tipo de dieta válidos.");
    }
    $dificultades_validas = ['facil', 'normal', 'dificil']; 
    if (!in_array($dificultad, $dificultades_validas)) {
        throw new Exception("Dificultad no válida.");
    }

    // 3. Procesar Arrays (Ingredientes y Pasos)
    // Nota: FormData envía arrays simples si se usan nombres como ingredientes[]
    $ingredientes = $postData['ingredientes'] ?? [];
    $pasos = $postData['pasos'] ?? [];

    if (!is_array($ingredientes) || count($ingredientes) === 0) {
        throw new Exception("Debes añadir al menos un ingrediente.");
    }
    if (!is_array($pasos) || count($pasos) === 0) {
        throw new Exception("Debes añadir al menos un paso.");
    }

    // Limpiar arrays de valores vacíos
    $ingredientes = array_filter(array_map('trim', $ingredientes));
    $pasos = array_filter(array_map('trim', $pasos));

    // 4. Gestión de Imagen
    $finalImagePath = $oldImagePath; // Por defecto mantenemos la que había (para edit)

    // Si hay una nueva imagen subida
    if (isset($filesData['imagen_url']) && $filesData['imagen_url']['error'] === UPLOAD_ERR_OK) {
        if ($oldImagePath) {
            // Modo Edición: Reemplazar
            $imgResult = replaceImage($filesData['imagen_url'], 'recipe', $oldImagePath);
        } else {
            // Modo Creación: Subir nueva
            $imgResult = uploadImage($filesData['imagen_url'], 'recipe');
        }

        if (!$imgResult['success']) {
            throw new Exception("Error con la imagen: " . $imgResult['message']);
        }
        $finalImagePath = $imgResult['path'];
    }

    // 5. Devolver array estructurado
    return [
        'titulo' => $titulo,
        'descripcion' => $descripcion,
        'tiempo_preparacion_min' => $tiempo,
        'porciones' => $porciones,
        'id_categoria' => $id_categoria,
        'id_tipo_dieta' => $id_tipo_dieta,
        'dificultad' => $dificultad,
        'visibilidad' => $visibilidad,
        'consejos_chef' => $consejos,
        'imagen_url' => $finalImagePath,
        'ingredientes' => $ingredientes,
        'pasos' => $pasos
    ];
}
?>