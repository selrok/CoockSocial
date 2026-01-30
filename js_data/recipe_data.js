// js/recipe-data.js

// SIMULACIÓN DE DATOS DE LA RECETA (COMO SI VINIERAN DEL BACKEND)
// En una aplicación real, obtendrías esto de una API, probablemente basado en un ID de receta en la URL.
const mockRecipeData = {
    id: '123',
    title: "Paella Valenciana",
    description: "Auténtica paella valenciana con pollo, conejo y verduras.",
    imageUrl: "https://images.unsplash.com/photo-1515516969-d4008cc6241a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
    author: {
        id: 'MariaRdz',
        name: "María Rodríguez",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
        profileLink: "profile.html?userId=chefMariaRdz" // Enlace al perfil del autor
    },
    publishDate: "2024-06-10", // Formato YYYY-MM-DD
    prepTime: "45 minutos",
    servings: "4 personas",
    difficulty: "Media", // Podría ser 'Fácil', 'Media', 'Difícil'
    isFavorite: true, // Si el usuario actual la tiene como favorita
    isFollowingAuthor: false, // Si el usuario actual sigue al autor
    likesCount: 128,
    userHasLiked: false, // Si el usuario actual le ha dado like
    // Simulación de si el usuario actual es el autor de la receta (para mostrar botones de editar/eliminar)
    currentUserIsAuthor: true, // Cambia a false para probar cómo se ve para otros usuarios

    ingredients: [
        "400g de arroz bomba",
        "1 pollo troceado",
        "1 conejo troceado",
        "200g de judías verdes",
        "200g de garrofón",
        "1 tomate rallado",
        "Azafrán",
        "Aceite de oliva",
        "Sal",
        "Agua"
    ],
    preparationSteps: [
        "Calienta el aceite en una paella y sofríe el pollo y el conejo hasta que estén dorados.",
        "Añade las judías verdes y el garrofón, y sofríe durante unos minutos más.",
        "Incorpora el tomate rallado y cocina hasta que el agua se haya evaporado.",
        "Añade el arroz y remueve para que se impregne bien con el aceite y los sabores.",
        "Vierte el agua caliente (el doble de volumen que de arroz) y añade el azafrán y la sal.",
        "Cocina a fuego fuerte durante 10 minutos, luego baja el fuego y cocina 8 minutos más.",
        "Deja reposar la paella tapada durante 5 minutos antes de servir."
    ],
    chefTips: "Para lograr el auténtico sabor valenciano, es importante usar arroz bomba y cocinar la paella en un recipiente ancho y poco profundo. El socarrat, la capa crujiente que se forma en el fondo, es muy apreciado y se considera el alma de una buena paella."
};

// Simulación de comentarios para esta receta
const mockRecipeComments = [
    { id: 'comment1', recipeId: '123', username: 'ComilónFeliz', content: '¡Esta paella se ve increíble! Definitivamente la probaré.', timestamp: '2023-10-26T10:00:00Z' },
    { id: 'comment2', recipeId: '123', username: 'ChefPrincipiante', content: 'Gracias por la receta, muy bien explicada.', timestamp: '2023-10-26T11:30:00Z' },
    { id: 'comment4', recipeId: '123', username: 'AmanteDelArroz', content: 'Un consejo: un poco de romero fresco al final le da un toque especial.', timestamp: '2023-10-27T09:15:00Z' }
];