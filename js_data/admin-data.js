// js_data/admin-data.js
const mockAdminData = {
    recipes: [
        { id: 1, title: "Paella Valenciana", author: "María R.", date: "2024-06-10", status: "Publicado", reports: 0 },
        { id: 2, title: "Tiramisú Clásico", author: "Luca R.", date: "2024-06-09", status: "Oculto", reports: 3 },
        { id: 3, title: "Tacos al Pastor", author: "Carlos H.", date: "2024-06-08", status: "Publicado", reports: 1 },
        { id: 4, title: "Fideuá", author: "Luca R.", date: "2025-03-08", status: "Publicado", reports: 0 },
        { id: 5, title: "Sushi Variado", author: "Yuki T.", date: "2024-06-07", status: "Publicado", reports: 0 },
        { id: 6, title: "Ratatouille", author: "Sophie D.", date: "2024-06-06", status: "Oculto", reports: 5 },
        { id: 7, title: "Ceviche Peruano", author: "Diego M.", date: "2024-06-05", status: "Publicado", reports: 0 },
        { id: 8, title: "Baklava Turco", author: "Fatma Y.", date: "2024-06-04", status: "Oculto", reports: 0 },
        { id: 9, title: "Pizza Margarita", author: "Giovanni R.", date: "2024-06-03", status: "Publicado", reports: 2 },
        { id: 10, title: "Biryani Indio", author: "Aditi S.", date: "2024-06-02", status: "Publicado", reports: 0 },
    ],
    users: [
    { id: 1, username: "super_admin_main", email: "super_admin_main@dominio.com", joindate: "2024-01-01", role: "SuperAdministrador" },
    { id: 5, username: "super_admin_sec", email: "super_admin_sec@dominio.com", joindate: "2024-04-05", role: "SuperAdministrador" },
    { id: 2, username: "admin_luca", email: "luca.rossi@dominio.com", joindate: "2024-02-20", role: "Administrador" },
    { id: 6, username: "admin_sophie", email: "sophie.dubois@dominio.com", joindate: "2024-05-01", role: "Administrador" },
    { id: 3, username: "user_maria", email: "maria.rodriguez@dominio.com", joindate: "2024-01-15", role: "Usuario" },
    { id: 4, username: "user_carlos", email: "carlos.hernandez@dominio.com", joindate: "2024-03-10", role: "Usuario" },
],
    commentReports: [
        { id: 1, recipeId: 1, recipeTitle: "Paella Valenciana", userId: 3, username: "user_maria", commentId: "commentXYZ_paella", commentContent: "Este comentario es ofensivo y no aporta nada. Deberían revisarlo urgentemente porque es muy malo.", reportDate: "2024-07-01", status: "Pendiente" },
        { id: 2, recipeId: 2, recipeTitle: "Tiramisú Clásico", userId: 4, username: "user_carlos", commentId: "commentABC_tiramisu", commentContent: "Spam puro, enlace a sitio externo para vender cosas raras.", reportDate: "2024-07-02", status: "Revisado" },
        { id: 3, recipeId: 1, recipeTitle: "Paella Valenciana", userId: 2, username: "admin_luca", commentId: "comment123_paella", commentContent: "Contiene información falsa sobre los ingredientes, podría ser peligroso para alérgicos.", reportDate: "2024-07-03", status: "Pendiente" }
    ],
    supportTickets: [ 
        { id: 1, name: "Ana Pérez", email: "ana.perez@example.com", message: "No puedo subir la foto de mi receta, me da un error desconocido. ¿Podrían ayudarme?", submissionDate: "2024-07-10", status: "Pendiente" },
        { id: 2, name: "Juan García", email: "juan.g@example.com", message: "Me gustaría sugerir una nueva categoría para 'Cocina Molecular'. ¡Gracias!", submissionDate: "2024-07-09", status: "Solucionado" },
        { id: 3, name: "Laura M.", email: "laura.m@example.com", message: "Un usuario ha copiado mi receta textualmente. ¿Qué puedo hacer?", submissionDate: "2024-07-11", status: "Pendiente" }
    ]
};