// js_data/index-data.js

const mockIndexData = {
    allRecipes: [
        {
            id: "paella-valenciana",
            title: "Paella Valenciana Auténtica",
            author: "María García",
            authorId: "maria-garcia",
            image: "https://images.unsplash.com/photo-1515516969-d4008cc6241a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
            likes: 530,
            time: "45 min",
            timeInMinutes: 45,
            publishDate: "2025-05-15T10:00:00Z",
            category: "main", 
            diet: 1, 
            difficulty: "normal"
        },
        {
            id: "tiramisu-clasico",
            title: "Tiramisú Clásico Italiano",
            author: "Luca Rossi",
            authorId: "luca-rossi",
            image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1035&q=80",
            likes: 1420,
            time: "30 min",
            timeInMinutes: 30,
            publishDate: "2024-07-15T14:30:00Z",
            category: "dessert", 
            diet: 2, 
            difficulty: "facil"
        },
        {
            id: "tacos-al-pastor",
            title: "Tacos al Pastor Caseros",
            author: "Carlos Hernández",
            authorId: "carlos-hernandez",
            image: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1194&q=80",
            likes: 285,
            time: "1 hora",
            timeInMinutes: 60,
            publishDate: "2024-07-01T08:00:00Z",
            category: "main", 
            diet: 1, 
            difficulty: "normal"
        },
        {
            id: "acai-bowl",
            title: "Bowl de Açaí Energizante",
            author: "Ana Silva",
            authorId: "ana-silva",
            image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
            likes: 950, 
            time: "15 min",
            timeInMinutes: 15,
            publishDate: "2024-07-18T09:00:00Z",
            category: "dessert",
            diet: 3, 
            difficulty: "facil"
        },
        {
            id: "ramen-casero",
            title: "Ramen Casero Reconfortante",
            author: "Kenji Yamamoto",
            authorId: "kenji-yamamoto",
            image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80",
            likes: 720, 
            time: "2 horas",
            timeInMinutes: 120,
            publishDate: "2024-07-16T12:00:00Z",
            category: "main", 
            diet: 1, 
            difficulty: "dificil"
        },
        {
            id: "poke-salmon",
            title: "Poke Bowl de Salmón Fresco",
            author: "Emily Chen",
            authorId: "emily-chen",
            image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80",
            likes: 680, 
            time: "25 min",
            timeInMinutes: 25,
            publishDate: "2024-07-17T18:00:00Z",
            category: "main", 
            diet: 1, 
            difficulty: "facil"
        },
        {
            id: "poke-salmon",
            title: "Poke Bowl de Salmón Fresco",
            author: "Emily Chen",
            authorId: "emily-chen",
            image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80",
            likes: 680, 
            time: "25 min",
            timeInMinutes: 25,
            publishDate: "2025-05-26T18:00:00Z",
            category: "main", 
            diet: 1, 
            difficulty: "facil"
        },
        {
            id: "gazpacho-andaluz",
            title: "Gazpacho Andaluz Refrescante",
            author: "Sofía Martínez",
            authorId: "sofia-martinez",
            image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
            likes: 410,
            time: "10 min",
            timeInMinutes: 10,
            publishDate: "2025-05-19T11:00:00Z",
            category: "dessert",
            diet: 3,
            difficulty: "facil"
        }       
    ],
    chefs: [
        { id: "maria-garcia", name: "María Rodríguez", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80", followers: "50K" },
        { id: "luca-rossi", name: "Luca Rossi", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80", followers: "35K" },
        { id: "emily-chen", name: "Emily Chen", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80", followers: "28K" },
        { id: "emily-chen", name: "Emily Chen", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80", followers: "28K" }
    ]
};