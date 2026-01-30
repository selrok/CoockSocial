-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 30-01-2026 a las 14:04:22
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `cooksocial`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias_receta`
--

CREATE TABLE `categorias_receta` (
  `id` int(11) NOT NULL,
  `nombre_categoria` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `categorias_receta`
--

INSERT INTO `categorias_receta` (`id`, `nombre_categoria`) VALUES
(4, 'Bebida'),
(2, 'Entrante'),
(1, 'Plato Principal'),
(3, 'Postre');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comentarios_receta`
--

CREATE TABLE `comentarios_receta` (
  `id` int(11) NOT NULL,
  `id_receta` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `contenido` text NOT NULL,
  `fecha_comentario` timestamp NULL DEFAULT current_timestamp(),
  `es_visible` tinyint(1) DEFAULT 1 COMMENT 'TRUE si visible, FALSE si oculto por moderación'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `comentarios_receta`
--

INSERT INTO `comentarios_receta` (`id`, `id_receta`, `id_usuario`, `contenido`, `fecha_comentario`, `es_visible`) VALUES
(1, 1, 8, 'Prueba 1', '2026-01-09 21:04:49', 1),
(9, 4, 7, 'Prueba 2', '2026-01-09 21:09:46', 0),
(10, 4, 7, 'Prueba 2', '2026-01-09 21:10:00', 1),
(11, 4, 6, 'Porque salen dos insercioneees', '2026-01-09 21:18:04', 1),
(12, 2, 5, 'Prueba 3', '2026-01-09 21:21:28', 1),
(17, 2, 9, 'Hola hola', '2026-01-19 19:11:12', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ingredientes_receta`
--

CREATE TABLE `ingredientes_receta` (
  `id` int(11) NOT NULL,
  `id_receta` int(11) NOT NULL,
  `descripcion_ingrediente` varchar(255) NOT NULL COMMENT 'Ej: "200g de harina", "1 pizca de sal"'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `ingredientes_receta`
--

INSERT INTO `ingredientes_receta` (`id`, `id_receta`, `descripcion_ingrediente`) VALUES
(1, 1, '400 gramos de harina de trigo'),
(2, 1, '200 ml de agua tibia'),
(3, 1, '2 cucharadas de aceite de oliva'),
(4, 1, '15 gramos de levadura fresca'),
(5, 1, '1 pizca de sal'),
(6, 1, 'Harina para la encimera (para que no se pegue)'),
(7, 2, '12 unidad(es)  Pan bao'),
(8, 2, '6 sobre(s)  Mayonesa'),
(9, 2, '2 sobre(s)  Sriracha'),
(10, 2, '2 unidad(es)  Pepino'),
(11, 2, '2 unidad(es)  Zanahoria'),
(12, 2, '40 gramo(s)  Cacahuetes salados'),
(13, 2, '500 gramo(s)  Carne de cerdo picada'),
(14, 2, '2 unidad(es)  Cebolla roja'),
(15, 2, '2 sobre(s)  Salsa de soja dulce'),
(16, 2, '1 pizca(s) Sal'),
(17, 2, '1 pizca(s) Pimienta'),
(18, 2, '4 cucharada(s)  Aceite de oliva'),
(19, 2, '6 cucharada(s)  Vinagre para encurtir'),
(20, 2, '2 cucharadita(s)  Sal para encurtir'),
(21, 3, '100 gramo(s)  Judías verdes'),
(22, 3, '1 unidad(es)  Brotes de espinacas'),
(23, 3, '1 unidad(es)  Puerro'),
(24, 3, '1 sobre(s)  Tomate concentrado'),
(25, 3, '1 paquete  Queso crema'),
(26, 3, '1 sobre(s)  Caldo vegetal'),
(27, 3, '1 sobre(s)  Tomillo seco'),
(28, 3, '390 gramo(s)  Judías blancas'),
(29, 3, '180 gramo(s)  Tofu'),
(30, 3, '1 sobre(s)  Pimentón ahumado'),
(31, 3, '1 sobre(s)  Salsa de soja'),
(32, 3, '1 pizca(s)  Sal y pimienta'),
(33, 3, '2 cucharada(s)  Aceite de oliva'),
(34, 3, '1 cucharadita(s)  Azúcar'),
(35, 3, '200 mililitro(s)  Agua'),
(36, 4, 'Mango'),
(37, 4, 'Queso fundente'),
(38, 4, 'Tortillas de trigo'),
(39, 4, 'Cilantro fresco o perejil al gusto'),
(40, 4, 'Pimienta negra molida al gusto'),
(41, 4, 'Especias al gusto tipo tajín o pimentón'),
(42, 4, 'Aceite de oliva virgen'),
(51, 10, 'Leche'),
(55, 9, 'berenjena'),
(56, 9, 'limón'),
(57, 9, 'sal');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `likes_receta`
--

CREATE TABLE `likes_receta` (
  `id_usuario` int(11) NOT NULL,
  `id_receta` int(11) NOT NULL,
  `fecha_like` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `likes_receta`
--

INSERT INTO `likes_receta` (`id_usuario`, `id_receta`, `fecha_like`) VALUES
(1, 2, '2026-01-25 01:12:21'),
(5, 3, '2026-01-23 20:54:48'),
(9, 3, '2026-01-23 20:54:48');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id` int(11) NOT NULL,
  `id_usuario_receptor` int(11) NOT NULL COMMENT 'Usuario que recibe la notificación',
  `tipo` enum('comentario','like','seguidor','sistema_moderacion') NOT NULL,
  `mensaje` text NOT NULL,
  `id_origen_contenido` int(11) DEFAULT NULL COMMENT 'ID del contenido relacionado (receta, comentario, usuario)',
  `tipo_origen_contenido` varchar(50) DEFAULT NULL COMMENT 'Tipo de contenido: "receta", "comentario", "usuario"',
  `enlace_relacionado` varchar(255) DEFAULT NULL COMMENT 'URL para redirigir al usuario',
  `leida` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 = no leída, 1 = leída',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pasos_preparacion`
--

CREATE TABLE `pasos_preparacion` (
  `id` int(11) NOT NULL,
  `id_receta` int(11) NOT NULL,
  `numero_paso` int(11) NOT NULL,
  `descripcion_paso` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `pasos_preparacion`
--

INSERT INTO `pasos_preparacion` (`id`, `id_receta`, `numero_paso`, `descripcion_paso`) VALUES
(1, 1, 1, '1.- Para hacer la masa de pizza italiana es muy sencillo. En un bol agregamos el aceite, el agua y la levadura. Mezclamos y seguidamente le añadimos la harina y la pizca de sal. Una vez que tengáis mas o menos mezclado todo en el bol lo pasamos a la encima para amasar bien.'),
(2, 1, 2, '2.- Ahora comienza el amasado. Ponemos un poco de harina en la encimera y tendremos que amasar como 3 o 4 minutos sin parar. Veremos que hemos terminado cuando la masa esté lisa totalmente, si se pega mucho le ponemos un poco de harina y seguimos hasta que quede lisa.'),
(3, 1, 3, '3.- Ahora una vez lista, la dejamos reposar durante 1 hora más o menos. Una vez reposada la partimos en dos y podemos hacer dos pizzas muy majas. La amasamos y estiramos. Ponemos los ingredientes y al horno. Listo!'),
(4, 2, 1, '¡Asegúrate de utilizar las cantidades indicadas a la izquierda para preparar tu receta! Retira los extremos del pepino y córtalo por la mitad a lo largo. Luego, corta en medias lunas de 0,5-1 cm. Pela la zanahoria y córtala por la mitad. Luego, haz láminas de la mitad de la zanahoria con un pelador. Pela la cebolla, divídela en dos y córtala en tiras finas.'),
(5, 2, 2, 'En un bol, agrega el pepino, la zanahoria, la cebolla, el vinagre de vino tinto y la sal para encurtir (ver cantidad en ingredientes de ambos). Remueve bien y deja reposar hasta el paso 4.\r\n\r\nSABÍAS QUE: Agregar sal a los alimentos extrae la humedad a través del proceso de ósmosis, útil para encurtir, ya que, al reducir la cantidad de agua, se mejora la textura y se previene el crecimiento bacteriano.'),
(6, 2, 3, 'Ralla la zanahoria restante y agrégala a un bol. Añade un chorrito de aceite, salpimienta y remueve. En un bol pequeño, mezcla la mayonesa y la sriracha. Con la base de un cazo, aplasta los cacahuetes en su propia bolsa para picarlos. Añade la mitad de los cacahuetes picados al bol con las verduras encurtidas.'),
(7, 2, 4, 'En una sartén, calienta un chorrito de aceite a fuego medio-alto. Agrega la carne picada de cerdo, salpimienta y cocina 4-5 min, desmenuzando con una espátula, hasta que se dore. Agrega la salsa de soja dulce y un chorrito de agua y cocina 1-2 min más, hasta que reduzca y la carne quede melosa.\r\n\r\nRECUERDA: Lávate las manos y los utensilios de cocina después de manipular carne cruda.'),
(8, 2, 5, 'Coloca los panes bao en un plato, sin que se toquen entre ellos, y calienta en el microondas entre 40 y 60 segundos a máxima potencia, hasta que queden tiernos y esponjosos.'),
(9, 2, 6, 'En el interior de cada pan bao, agrega carne picada, zanahoria rallada y cebolla encurtida al gusto. Añade encima mayonesa de sriracha y cacahuetes picados. Sirve los encurtidos restantes a un lado como acompañamiento.'),
(10, 3, 1, '¡Asegúrate de utilizar las cantidades indicadas a la izquierda para preparar tu receta! Seca el tofu con papel de cocina, presionando para eliminar la mayor humedad posible. Ralla la mitad del tofu. Corta el resto del tofu en dados de 1 cm. Retira las raíces y el extremo verde del puerro y deséchalos. En cortes diagonales, divide el puerro en trozos de 3-4 cm. Retira las puntas de las judías verdes y córtalas en tercios.'),
(11, 3, 2, 'En una sartén grande, calienta un chorrito de aceite a fuego medio. Agrega el tofu rallado, el pimentón ahumado y la salsa de soja y cocina 4-5 min, removiendo ocasionalmente, hasta que quede crujiente. Retira de la sartén cuando esté listo.'),
(12, 3, 3, 'En la sartén, calienta un chorrito de aceite a fuego medio. Agrega el tofu a dados, el puerro y las judías verdes, salpimienta y saltea 3-4 min, removiendo. Luego, cocina a fuego medio-alto 1-2 min más, hasta que las verduras y el tofu se doren.'),
(13, 3, 4, 'En la sartén, agrega el tomillo seco, el tomate concentrado, el queso crema y el azúcar (ver cantidad en ingredientes). Mezcla y cocina a fuego medio 1-2 min. Agrega el agua (ver cantidad en ingredientes) y el caldo vegetal en polvo, remueve y lleva a ebullición. Cuando hierva, baja a fuego medio, tapa la sartén y cocina 4-6 min, hasta que se reduzca.'),
(14, 3, 5, 'En la sartén, agrega casi todas las espinacas, reservando algunas para el emplatado, y cocina 1-2 min, hasta que reduzcan su tamaño. Finalmente, agrega las judías blancas y el líquido de su envase y cocina 3 min, removiendo para integrar.'),
(15, 3, 6, 'Cuando esté listo, prueba y rectifica de sal y pimienta. Sirve el guiso de judías con tofu y verduras en platos y agrega encima el tofu crujiente y las espinacas reservadas.'),
(16, 4, 1, 'Lavar y secar el mango; lavar y secar bien el cilantro y/o perejil. Cortar el mango en láminas finas y retirar la piel. Picar las hierbas.'),
(17, 4, 2, 'Extender una tortilla de harina de trigo en un plato o fuente y cubrir con queso abundantemente. Disponer en la mitad el mango superponiendo varias láminas ligeramente. Añadir especias, pimienta negra molida y las hierbas al gusto.'),
(18, 4, 3, 'Cerrar por la mitad con cuidado, reservar aparte y repetir el proceso con la otra tortilla de trigo.'),
(19, 4, 4, 'Engrasar ligeramente con aceite una sartén o plancha y calentar a fuego medio. Añadir las tortillas dobladas, presionando con suavidad, y cocinar por cada lado hasta que estén bien doradas y crujientes, con el queso fundido. Servir inmediatamente.'),
(26, 10, 1, 'vierte la leche en el vaso'),
(27, 10, 2, 'Metela al microondas'),
(30, 9, 1, 'pasito pa lante'),
(31, 9, 2, 'pasito pa tras');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recetas`
--

CREATE TABLE `recetas` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `id_categoria` int(11) DEFAULT NULL,
  `tiempo_preparacion_min` int(11) NOT NULL,
  `porciones` varchar(50) NOT NULL,
  `id_tipo_dieta` int(11) DEFAULT NULL,
  `dificultad` enum('facil','normal','dificil') NOT NULL,
  `visibilidad` enum('publica','privada') DEFAULT 'publica',
  `consejos_chef` text DEFAULT NULL,
  `fecha_publicacion` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `recetas`
--

INSERT INTO `recetas` (`id`, `id_usuario`, `titulo`, `descripcion`, `imagen_url`, `id_categoria`, `tiempo_preparacion_min`, `porciones`, `id_tipo_dieta`, `dificultad`, `visibilidad`, `consejos_chef`, `fecha_publicacion`) VALUES
(1, 1, 'Masa de pizza casera', 'Masa de pizza italiana es muy fácil de hacer', 'img/recipes/recipe_6942feaf33e5b.png', 1, 150, '8', 9, 'facil', 'publica', 'Para conseguir el amasado correcto te voy a dar estos consejos para tener una masa de pizza perfecta. Un buen amasado será importante para conseguir lo mejor de esta mezcla de ingredientes. Puedes usar un robot perfectamente, pero a mano siempre te sentirás mejor de prepararla.\r\n\r\nDebes sujetar el borde de la masa más cercano a ti con una mano y con la otra mano estira la masa y llévala tan lejos como puedas.\r\nEl siguiente paso será plegar la masa sobre si misma y enrollándola para hacer una bola.\r\nLe das la vuelta y vuelves a repetir por el borde opuesto. Repetimos todos los pasos tantas veces como sea necesario.', '2025-12-17 19:04:15'),
(2, 9, 'Baos de carne picada de cerdo', 'con encurtidos con mayonesa de sriracha y cacahuetes.', 'img/recipes/recipe_69447f04f01f3.jpg', 2, 80, '4', 1, 'facil', 'publica', '', '2025-12-18 22:24:04'),
(3, 8, 'Guiso de judías blancas con tofu crujiente', 'con puerro y judías verdes', 'img/recipes/recipe_694998b75ca0f.jpg', 1, 25, '1', 2, 'dificil', 'publica', 'Descubre esta receta de sabores tradicionales a la que incorporamos un concepto más novedoso, como es el tofu crujiente, preparado en la sartén y aderezado para emular el bacon. Además de su gran sabor, este plato es vegetariano, está listo en 25 minutos y te permite seguir una dieta equilibrada.', '2025-12-22 19:15:03'),
(4, 1, 'Quesadillas de mango', 'Receta fácil y rápida para cenar', NULL, 1, 10, '1', 2, 'facil', 'publica', '', '2025-12-30 13:03:15'),
(8, 8, 'Prueba', 'asdxs', NULL, 2, 25, '8', 16, 'normal', 'publica', NULL, '2026-01-28 00:03:53'),
(9, 1, 'Receta Editada', 'pasos e ingredientes', 'img/recipes/recipe_697bc76f693a5.png', 1, 40, '2', 1, 'dificil', 'publica', 'editado', '2026-01-28 00:16:12'),
(10, 1, 'Prueba de que sigue funcionando', 'si si', 'img/recipes/recipe_697bb8a6db743.jpg', 4, 2, '1', 2, 'facil', 'publica', 'mu bueno mu bueno', '2026-01-29 19:44:38');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recetas_guardadas`
--

CREATE TABLE `recetas_guardadas` (
  `id_usuario` int(11) NOT NULL,
  `id_receta` int(11) NOT NULL,
  `fecha_guardado` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `recetas_guardadas`
--

INSERT INTO `recetas_guardadas` (`id_usuario`, `id_receta`, `fecha_guardado`) VALUES
(1, 2, '2026-01-27 15:04:44'),
(9, 4, '2026-01-20 20:00:22');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes_comentario`
--

CREATE TABLE `reportes_comentario` (
  `id` int(11) NOT NULL,
  `id_comentario` int(11) NOT NULL,
  `id_receta_asociada` int(11) NOT NULL COMMENT 'ID de la receta para referencia rápida',
  `id_usuario_reportador` int(11) DEFAULT NULL COMMENT 'NULL si el reporte es anónimo',
  `fecha_reporte` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` enum('Pendiente','Revisado','Comentario Ocultado') NOT NULL DEFAULT 'Pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes_comentario`
--

INSERT INTO `reportes_comentario` (`id`, `id_comentario`, `id_receta_asociada`, `id_usuario_reportador`, `fecha_reporte`, `estado`) VALUES
(2, 17, 2, 1, '2026-01-24 00:01:51', 'Pendiente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes_receta`
--

CREATE TABLE `reportes_receta` (
  `id` int(11) NOT NULL,
  `id_receta` int(11) NOT NULL,
  `id_usuario_reportador` int(11) DEFAULT NULL,
  `fecha_reporte` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes_receta`
--

INSERT INTO `reportes_receta` (`id`, `id_receta`, `id_usuario_reportador`, `fecha_reporte`) VALUES
(2, 2, 1, '2026-01-25 19:04:15');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `nombre_rol` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `nombre_rol`) VALUES
(2, 'Administrador'),
(1, 'SuperAdministrador'),
(3, 'Usuario');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `seguidores`
--

CREATE TABLE `seguidores` (
  `id_usuario_seguidor` int(11) NOT NULL COMMENT 'El usuario que sigue',
  `id_usuario_seguido` int(11) NOT NULL COMMENT 'El usuario que es seguido',
  `fecha_seguimiento` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `seguidores`
--

INSERT INTO `seguidores` (`id_usuario_seguidor`, `id_usuario_seguido`, `fecha_seguimiento`) VALUES
(1, 4, '2026-01-27 23:18:26'),
(1, 9, '2026-01-28 14:01:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tickets_soporte`
--

CREATE TABLE `tickets_soporte` (
  `id` int(11) NOT NULL,
  `nombre_remitente` varchar(100) NOT NULL,
  `email_remitente` varchar(100) NOT NULL,
  `mensaje` text NOT NULL,
  `fecha_envio` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` enum('Pendiente','Solucionado') NOT NULL DEFAULT 'Pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `tickets_soporte`
--

INSERT INTO `tickets_soporte` (`id`, `nombre_remitente`, `email_remitente`, `mensaje`, `fecha_envio`, `estado`) VALUES
(1, 'prueba 2', 'pr2_4@gmail.com', 'Texto de prueba', '2025-05-28 19:28:36', 'Pendiente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_dieta_receta`
--

CREATE TABLE `tipos_dieta_receta` (
  `id` int(11) NOT NULL,
  `nombre_dieta` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `tipos_dieta_receta`
--

INSERT INTO `tipos_dieta_receta` (`id`, `nombre_dieta`) VALUES
(11, 'Alcalina'),
(12, 'Ayurvédica'),
(7, 'Baja en carbohidratos'),
(8, 'Baja en grasas'),
(14, 'Baja en sodio'),
(10, 'DASH (Para Hipertensos)'),
(4, 'Frutariana'),
(15, 'Hiperproteica'),
(16, 'Hipocalórica'),
(9, 'Mediterránea'),
(1, 'Omnívora'),
(5, 'Pescetariana'),
(17, 'Sin frutos secos'),
(6, 'Sin gluten'),
(13, 'Sin lactosa'),
(3, 'Vegana'),
(2, 'Vegetariana');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `name` varchar(70) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `username` varchar(70) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `seguidos` int(11) NOT NULL,
  `seguidores` int(11) NOT NULL,
  `password` varchar(70) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nombre_completo` varchar(100) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `id_rol` int(11) NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `username`, `email`, `password_hash`, `nombre_completo`, `avatar_url`, `bio`, `id_rol`, `fecha_registro`) VALUES
(1, 'sergisaiz', 'sergi1999.sc@gmail.com', '$2y$10$d9jEKHni6MioglWrQa//SehOoug7BmfR9S7UM/VVHcoMMBYwIfj/C', 'sergi', NULL, NULL, 1, '2025-05-26 20:44:35'),
(3, 'Maun2', 'Maun2000@gmail.com', '$2y$10$L7es8a/ND5sElizy5xYMi.VHlmXC96AxwMD6uW.c3e9PwP3128ex6', 'Manu Garcia', NULL, NULL, 3, '2025-05-26 21:08:22'),
(4, 'sercli99', 'sergi1999.sc@outlook.es', '$2y$10$lFEkmEVFWjvYDmslywI1wObL7wQ/yW/D9DLfhJRKccJq6XCiukTE2', 'Sergi Saiz', NULL, NULL, 3, '2025-05-27 18:40:46'),
(5, 'pr1_23', 'pr123@gmail.com', '$2y$10$bLwc2lbleKwjTDYOWfMpGeHj0cWVjh1TFMuJYe31CZEAKNNDjcj8m', 'prueba', NULL, NULL, 2, '2025-05-27 19:11:28'),
(6, 'pr2_4', 'pr2_4@gmail.com', '$2y$10$rFDyG0oBEQ75phT6cSMkAuus0DqL4hPFtvtJDmjzva8gp.ulCSvZu', 'prueba 2', NULL, NULL, 3, '2025-05-27 22:03:30'),
(7, 'pr3_W', 'pr3_W@gmail.com', '$2y$10$XTQ4wDQesMwuAH.9GBKTpeFHWTKGMFnmBq1kz3NBO8NQZgHBce0bq', 'prueba3', NULL, NULL, 3, '2025-05-28 02:26:37'),
(8, 'Pr3_pb', 'pb3@gmaill.com', '$2y$10$VSHhiA0gFCZ8fTS70XjqguN53bit5BetVzL.d.UhEujat98iF5UVi', 'Prueba tres', NULL, NULL, 3, '2025-05-31 10:38:49'),
(9, 'Prb7', 'Prb7@gmail.com', '$2y$10$CeAGXwV0dcx3960YEuylJ.GUQ13iwdt7UkT3rdvzefFynUSYKCkRK', 'Prueba 4', NULL, NULL, 3, '2025-12-08 19:09:49'),
(10, 'Prueba García García', 'pgg@gmail.com', '$2y$10$00zPvOBgBAeF0y.2XJnHvu15KGdTE2GXT9yI6OafLNS2FROfjiFBa', 'Prueba8', NULL, NULL, 3, '2026-01-15 19:48:17');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias_receta`
--
ALTER TABLE `categorias_receta`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre_categoria` (`nombre_categoria`);

--
-- Indices de la tabla `comentarios_receta`
--
ALTER TABLE `comentarios_receta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_receta` (`id_receta`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `ingredientes_receta`
--
ALTER TABLE `ingredientes_receta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_receta` (`id_receta`);

--
-- Indices de la tabla `likes_receta`
--
ALTER TABLE `likes_receta`
  ADD PRIMARY KEY (`id_usuario`,`id_receta`),
  ADD KEY `id_receta` (`id_receta`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_notificaciones_usuario_receptor_idx` (`id_usuario_receptor`);

--
-- Indices de la tabla `pasos_preparacion`
--
ALTER TABLE `pasos_preparacion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_receta_paso_unico` (`id_receta`,`numero_paso`);

--
-- Indices de la tabla `recetas`
--
ALTER TABLE `recetas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_categoria` (`id_categoria`),
  ADD KEY `id_tipo_dieta` (`id_tipo_dieta`);

--
-- Indices de la tabla `recetas_guardadas`
--
ALTER TABLE `recetas_guardadas`
  ADD PRIMARY KEY (`id_usuario`,`id_receta`),
  ADD KEY `fk_recetas_guardadas_receta_idx` (`id_receta`),
  ADD KEY `fk_recetas_guardadas_usuario_idx` (`id_usuario`);

--
-- Indices de la tabla `reportes_comentario`
--
ALTER TABLE `reportes_comentario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_reporte_unico_usuario_comentario` (`id_comentario`,`id_usuario_reportador`),
  ADD KEY `fk_reportescom_comentario_idx` (`id_comentario`),
  ADD KEY `fk_reportescom_receta_idx` (`id_receta_asociada`),
  ADD KEY `fk_reportescom_usuario_idx` (`id_usuario_reportador`);

--
-- Indices de la tabla `reportes_receta`
--
ALTER TABLE `reportes_receta`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_reporte_unico_usuario_receta` (`id_receta`,`id_usuario_reportador`),
  ADD KEY `fk_reportesrec_receta_idx` (`id_receta`),
  ADD KEY `fk_reportesrec_usuario_idx` (`id_usuario_reportador`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre_rol` (`nombre_rol`);

--
-- Indices de la tabla `seguidores`
--
ALTER TABLE `seguidores`
  ADD PRIMARY KEY (`id_usuario_seguidor`,`id_usuario_seguido`),
  ADD KEY `fk_seguidores_usuario_seguido_idx` (`id_usuario_seguido`);

--
-- Indices de la tabla `tickets_soporte`
--
ALTER TABLE `tickets_soporte`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `tipos_dieta_receta`
--
ALTER TABLE `tipos_dieta_receta`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre_dieta` (`nombre_dieta`);

--
-- Indices de la tabla `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `id_rol` (`id_rol`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias_receta`
--
ALTER TABLE `categorias_receta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `comentarios_receta`
--
ALTER TABLE `comentarios_receta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de la tabla `ingredientes_receta`
--
ALTER TABLE `ingredientes_receta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pasos_preparacion`
--
ALTER TABLE `pasos_preparacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT de la tabla `recetas`
--
ALTER TABLE `recetas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `reportes_comentario`
--
ALTER TABLE `reportes_comentario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `reportes_receta`
--
ALTER TABLE `reportes_receta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tickets_soporte`
--
ALTER TABLE `tickets_soporte`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tipos_dieta_receta`
--
ALTER TABLE `tipos_dieta_receta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `comentarios_receta`
--
ALTER TABLE `comentarios_receta`
  ADD CONSTRAINT `comentarios_receta_ibfk_1` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comentarios_receta_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `ingredientes_receta`
--
ALTER TABLE `ingredientes_receta`
  ADD CONSTRAINT `ingredientes_receta_ibfk_1` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `likes_receta`
--
ALTER TABLE `likes_receta`
  ADD CONSTRAINT `likes_receta_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `likes_receta_ibfk_2` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `fk_notificaciones_usuario_receptor` FOREIGN KEY (`id_usuario_receptor`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `pasos_preparacion`
--
ALTER TABLE `pasos_preparacion`
  ADD CONSTRAINT `pasos_preparacion_ibfk_1` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `recetas`
--
ALTER TABLE `recetas`
  ADD CONSTRAINT `recetas_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recetas_ibfk_2` FOREIGN KEY (`id_categoria`) REFERENCES `categorias_receta` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `recetas_ibfk_3` FOREIGN KEY (`id_tipo_dieta`) REFERENCES `tipos_dieta_receta` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `recetas_guardadas`
--
ALTER TABLE `recetas_guardadas`
  ADD CONSTRAINT `fk_recetas_guardadas_receta` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_recetas_guardadas_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `reportes_comentario`
--
ALTER TABLE `reportes_comentario`
  ADD CONSTRAINT `fk_reportescom_comentario` FOREIGN KEY (`id_comentario`) REFERENCES `comentarios_receta` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reportescom_receta` FOREIGN KEY (`id_receta_asociada`) REFERENCES `recetas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reportescom_usuario` FOREIGN KEY (`id_usuario_reportador`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `reportes_receta`
--
ALTER TABLE `reportes_receta`
  ADD CONSTRAINT `fk_reportesrec_receta` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reportesrec_usuario` FOREIGN KEY (`id_usuario_reportador`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `seguidores`
--
ALTER TABLE `seguidores`
  ADD CONSTRAINT `fk_seguidores_usuario_seguido` FOREIGN KEY (`id_usuario_seguido`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_seguidores_usuario_seguidor` FOREIGN KEY (`id_usuario_seguidor`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
