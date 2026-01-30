<?php

// Definir rutas absolutas a las carpetas de imágenes
// __DIR__ es '.../TFG/api', así que subimos un nivel para ir a 'img'
define('DIR_BASE_IMG', __DIR__ . '/../img/');
define('URL_BASE_IMG', 'img/'); 

function uploadImage($file, $type) {
    // 1. Configuración según el tipo
    $folder = '';
    if ($type === 'avatar') {
        $folder = 'avatars/';
    } elseif ($type === 'recipe') {
        $folder = 'recipes/';
    } else {
        return ['success' => false, 'message' => 'Tipo de imagen no válido.'];
    }

    $targetDir = DIR_BASE_IMG . $folder;

    // Crear carpeta si no existe (por seguridad)
    if (!file_exists($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    // 2. Validaciones básicas
    // Comprobar si hubo error en la subida
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'message' => 'Error al subir el archivo (Código: ' . $file['error'] . ').'];
    }

    // Comprobar extensión (primera barrera)
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    $fileInfo = pathinfo($file['name']);
    $extension = strtolower($fileInfo['extension']);

    if (!in_array($extension, $allowedExtensions)) {
        return ['success' => false, 'message' => 'Formato no válido. Solo JPG, JPEG, PNG y WEBP.'];
    }

    try {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'No se pudo verificar el tipo de archivo.'];
    }
    
    $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!in_array($mime, $allowedMimeTypes)) {
        return ['success' => false, 'message' => 'El archivo no es una imagen válida (MIME incorrecto).'];
    }

    // Comprobar tamaño (Ej: Máximo 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        return ['success' => false, 'message' => 'La imagen es demasiado grande (Máx 5MB).'];
    }

    // 3. Generar nombre único (Hashing)
    // Usamos uniqid + time para evitar colisiones
    $newFileName = uniqid($type . '_') . '.' . $extension;
    $targetFilePath = $targetDir . $newFileName;

    // 4. Mover el archivo
    if (move_uploaded_file($file['tmp_name'], $targetFilePath)) {
        return [
            'success' => true, 
            'path' => URL_BASE_IMG . $folder . $newFileName,
            'message' => 'Imagen subida correctamente.'
        ];
    } else {
        return ['success' => false, 'message' => 'Error al guardar el archivo en el servidor.'];
    }
}

    //Función "Helper" para borrar una imagen del servidor.

function deleteImage($dbPath) {
    if (empty($dbPath)) {
        return true; 
    }

    // Convertir ruta relativa web a ruta absoluta de sistema
    $absolutePath = __DIR__ . '/../' . $dbPath;

    if (file_exists($absolutePath)) {
        return unlink($absolutePath);
    }
    
    return true; 
}

/**
 * Función "Helper" para reemplazar una imagen.
 * Borra la vieja y sube la nueva.
 */
function replaceImage($newFile, $type, $oldDbPath) {
    // 1. Subir la nueva primero
    $uploadResult = uploadImage($newFile, $type);

    if ($uploadResult['success']) {
        // 2. Si la subida fue bien, borramos la vieja
        if (!empty($oldDbPath)) {
            deleteImage($oldDbPath);
        }
        return $uploadResult;
    } else {
        // Si falla la subida, devolvemos el error y NO borramos la vieja
        return $uploadResult;
    }
}
?>