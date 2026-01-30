// js_data/profile-data.js

const mockProfileData = {
    user: {
        username: "chef_maria_pro",
        fullName: "María Rodríguez",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
        bio: "Chef especializada en cocina mediterránea con 15 años de experiencia. Amante de los sabores frescos y las recetas tradicionales con un toque moderno. Comparto mis creaciones para inspirar a otros a disfrutar del arte de cocinar.",
        stats: {
            following: 245,
            followers: 3500,
            recipes: 5 // Número de recetas publicadas por este usuario
        },
        isOwnProfile: true, // true si es el perfil del usuario logueado, false si es de otro
        isFollowing: true // true si el usuario logueado sigue a ESTE perfil (relevante si isOwnProfile es false)
    },
    // Recetas publicadas POR ESTE USUARIO
    // Añadimos 'id', 'time' y 'visibility' (public/private)
    publishedRecipes: [
        {
            id: "paella-valenciana-chefmaria",
            title: "Paella Valenciana Especial de María",
            image: "https://images.unsplash.com/photo-1515516969-d4008cc6241a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
            likes: 128,
            time: "50 min",
            visibility: "public" // 'public' o 'private'
        },
        {
            id: "gazpacho-andaluz-chefmaria",
            title: "Gazpacho Andaluz Refrescante",
            image: "https://images.unsplash.com/photo-1590165482129-1b8b27698780?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
            likes: 95,
            time: "20 min",
            visibility: "public"
        },
        {
            id: "tortilla-espanola-chefmaria",
            title: "Tortilla Española Jugosa",
            image: "https://images.unsplash.com/photo-1607118750694-1469a22ef45b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
            likes: 112,
            time: "30 min",
            visibility: "private" // Ejemplo de receta privada
        }
    ],
    // Recetas guardadas POR ESTE USUARIO (de otros autores)
    // Añadimos 'id' y 'time'
    savedRecipes: [
        {
            id: "tiramisu-clasico-luca", // ID de la receta original
            title: "Tiramisú Clásico",
            author: "Luca Rossi",
            authorId: "luca-rossi",
            image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1035&q=80",
            likes: 156,
            time: "35 min"
        },
        {
            id: "ramen-casero-kenji",
            title: "Ramen Casero",
            author: "Kenji Yamamoto",
            authorId: "kenji-yamamoto",
            image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80",
            likes: 203,
            time: "1h 45min"
        }
    ]
};