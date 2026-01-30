// TFG/js/admin.js
/**
 * admin.js
 * --------
 * Script principal para el Panel de Administración (admin.html).
 * Se encarga de renderizar tablas de datos, manejar eventos de la interfaz
 * y aplicar lógica de permisos basada en el rol del administrador.
 * 
 * Dependencias: jQuery, Bootstrap JS, js/data/admin-data.js, js/redirect/auth-guard-admin.js
 */
$(document).ready(function() {
    console.log("admin.js: DOM listo. Esperando evento 'authGuardAdminPassed'.");

    // --- Variables de estado del script ---
    let currentAdminUser = null; // Almacena los datos del admin autenticado.
    window.adminPageInitialized = false; // Bandera para evitar inicialización múltiple.

    // --- PUNTO DE ENTRADA PRINCIPAL: Esperar la confirmación del guardián ---
    $(document).on('authGuardAdminPassed', function(event, adminData) {
        if (window.adminPageInitialized) {
            console.warn("admin.js: La página ya fue inicializada. Ignorando evento duplicado.");
            return;
        }
        console.log("admin.js: 'authGuardAdminPassed' RECIBIDO. Inicializando panel para:", adminData);
        currentAdminUser = adminData;
        window.adminPageInitialized = true;
        initAdminPage(currentAdminUser);
    });

    // --- FALLBACK DE SEGURIDAD ---
    setTimeout(function() {
        if (!window.adminPageInitialized && $('#adminTabsContent').length) {
            console.warn("admin.js: Timeout. No se recibió 'authGuardAdminPassed'. Mostrando error.");
            $('main.container').first().html(
                `<div class="alert alert-danger mt-4" role="alert"><h4><i class="fas fa-exclamation-triangle me-2"></i>Acceso Denegado</h4><p>No se pudo verificar tu autorización. <a href="logReg.html#login" class="alert-link">Inicia sesión</a> como administrador.</p><a href="index.html" class="btn btn-secondary mt-2">Volver al inicio</a></div>`
            );
        }
    }, 3500);

    // --- VARIABLES GLOBALES DEL MÓDULO ---
    let recipeData = [],
        userData = [],
        commentReportData = [],
        supportTicketData = [];
    let currentSort = { column: '', direction: 'asc', tableId: '' };

    let confirmRoleChangeModal, confirmDeleteModal, superAdminWarningModal,
        permissionDeniedModal, viewCommentReportModal, viewSupportTicketModal,
        confirmHideReportedCommentModal, confirmClearRecipeReportsModal;

    let currentUserToChangeRole = null,
        itemToDelete = null,
        currentReportToView = null,
        currentTicketToView = null,
        reportedCommentToManageInfo = null,
        recipeToClearReportsInfo = null;

    const ROLE_MAP = { 1: 'SuperAdministrador', 2: 'Administrador', 3: 'Usuario' };
    const ROLE_HIERARCHY = { 'SuperAdministrador': 3, 'Administrador': 2, 'Usuario': 1 };

    /**
     * Orquesta la inicialización completa de la página de administración.
     */
    function initAdminPage(loggedInAdminData) {
        console.log("admin.js: initAdminPage() para admin:", loggedInAdminData.username);
        const currentAdminRoleName = ROLE_MAP[loggedInAdminData.id_rol] || 'Desconocido';

        if (typeof mockAdminData === 'undefined') {
            displayErrorInAllTables("Error crítico: Faltan datos de ejemplo (mockAdminData).");
            return;
        }

        recipeData = (mockAdminData.recipes || []).map(r => ({ ...r, reports: Number(r.reports) || 0 }));
        userData = (mockAdminData.users || []).map(u => ({ ...u, roleName: ROLE_MAP[u.id_rol] || u.role || 'Usuario' }));
        commentReportData = mockAdminData.commentReports || [];
        supportTicketData = mockAdminData.supportTickets || [];

        initializeModals();
        renderAllTables(currentAdminRoleName);
        setupEventListeners(currentAdminRoleName);
        initialTableMessages();

        $('#adminPageTitle').text(`Panel de Administración - Rol: ${escapeHTML(currentAdminRoleName)}`);
        $('#adminPageSubtitle').text(`Bienvenido, ${escapeHTML(loggedInAdminData.username)}.`);
        console.log("admin.js: Página de admin completamente inicializada.");
    }

    /**
     * Inicializa todas las instancias de modales de Bootstrap.
     */
    function initializeModals() {
        console.log("admin.js: Inicializando instancias de modales...");
        const getModalInstance = (id) => {
            const el = document.getElementById(id);
            if (el) return new bootstrap.Modal(el);
            console.error(`Admin.js: Elemento HTML para modal #${id} NO ENCONTRADO.`);
            return null;
        };
        confirmRoleChangeModal = getModalInstance('confirmRoleChangeModal');
        confirmDeleteModal = getModalInstance('confirmDeleteModal');
        superAdminWarningModal = getModalInstance('superAdminWarningModal');
        permissionDeniedModal = getModalInstance('permissionDeniedModal');
        viewCommentReportModal = getModalInstance('viewCommentReportModal');
        viewSupportTicketModal = getModalInstance('viewSupportTicketModal');
        confirmHideReportedCommentModal = getModalInstance('confirmHideReportedCommentModal');
        confirmClearRecipeReportsModal = getModalInstance('confirmClearRecipeReportsModal');
    }

    /**
     * Muestra un mensaje de error en todas las tablas.
     */
    function displayErrorInAllTables(message) {
        ['recipeTableBody', 'userTableBody', 'commentReportsTableBody', 'supportTicketsTableBody'].forEach(id => {
            const $el = $('#' + id);
            let colspan = (id.includes('Comment') || id.includes('Support')) ? 6 : 7;
            if ($el.length) $el.html(`<tr><td colspan="${colspan}" class="text-center t-danger p-3"><text>${escapeHTML(message)}</text></td></tr>`);
        });
    }

    /**
     * Llama a todas las funciones `render...` para poblar las tablas.
     */
    function renderAllTables(currentAdminRoleName) {
        renderRecipes(recipeData);
        renderUsers(userData, currentAdminRoleName);
        renderCommentReports(commentReportData);
        renderSupportTickets(supportTicketData);
    }

    // --- FUNCIONES DE RENDERIZADO ---

    function renderRecipes(recipes) {
        const $tbody = $('#recipeTableBody'); if (!$tbody.length) return; $tbody.empty();
        if (!recipes.length) { $tbody.html('<tr><td colspan="7" class="text-center text-muted p-3">No hay recetas para mostrar.</td></tr>'); return; }
        recipes.forEach(recipe => {
            const reportCount = Number(recipe.reports) || 0;
            const reportIndicatorClass = reportCount > 0 ? 't-danger fw-bold' : 'text-success';
            const reportIndicatorContent = reportCount > 0 ? reportCount : '<i class="bi bi-check-circle-fill"></i>';
            const reportActionsHTML = reportCount > 0 ? `<li><a class="dropdown-item clear-recipe-reports-btn" href="#" data-item-id="${recipe.id}" data-item-name="${escapeHTML(recipe.title)}"><i class="bi bi-bookmark-check-fill me-2"></i>Limpiar Denuncias</a></li>` : '';
            const tr = `
                <tr>
                    <td class="fw-semibold">${recipe.id}</td>
                    <td>${escapeHTML(recipe.title)}</td>
                    <td><a href="profile.html?userId=${recipe.authorId}" target="_blank">${escapeHTML(recipe.author)}</a></td>
                    <td>${formatDate(recipe.date)}</td>
                    <td><span class="badge ${getStatusBadgeClass(recipe.status)}">${escapeHTML(recipe.status)}</span></td>
                    <td class="text-center"><span class="report-indicator ${reportIndicatorClass}" title="${reportCount} denuncia${reportCount !== 1 ? 's' : ''}">${reportIndicatorContent}</span></td>
                    <td class="text-end">
                        <div class="dropdown"><button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown"><i class="fas fa-ellipsis-h"></i></button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="recipe.html?id=${recipe.id}" target="_blank"><i class="bi bi-eye-fill me-2"></i>Ver</a></li>
                                ${reportActionsHTML}
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item t-danger delete-item-btn" href="#" data-item-id="${recipe.id}" data-item-name="${escapeHTML(recipe.title)}" data-item-type="recipe"><i class="bi bi-trash-fill me-2"></i>Eliminar</a></li>
                            </ul>
                        </div>
                    </td>
                </tr>`;
            $tbody.append(tr);
        });
    }

    function renderUsers(users, currentAdminRoleName) {
        const $tbody = $('#userTableBody'); if (!$tbody.length) return; $tbody.empty();
        if (!users.length) { $tbody.html('<tr><td colspan="7" class="text-center text-muted p-3">No hay usuarios para mostrar.</td></tr>'); return; }
        const loggedInAdminRoleLevel = ROLE_HIERARCHY[currentAdminRoleName] || 0;
        users.forEach(user => {
            const targetUserRoleName = user.roleName;
            const targetUserRoleLevel = ROLE_HIERARCHY[targetUserRoleName] || 0;
            let switchDisabled = '', actionButtonDisabled = '';
            if (targetUserRoleName === 'SuperAdministrador' || (targetUserRoleName === 'Administrador' && loggedInAdminRoleLevel < ROLE_HIERARCHY['SuperAdministrador']) || (loggedInAdminRoleLevel <= targetUserRoleLevel && currentAdminRoleName !== 'SuperAdministrador')) {
                switchDisabled = 'disabled';
                actionButtonDisabled = 'disabled';
            }
            const isTargetCheckedForAdmin = targetUserRoleName === 'Administrador';
            const switchId = `roleSwitch-${user.id}`;
            const deleteActionHtml = !actionButtonDisabled ? `<li><hr class="dropdown-divider"></li><li><a class="dropdown-item t-danger delete-item-btn" href="#" data-item-id="${user.id}" data-item-name="${escapeHTML(user.username)}" data-item-type="user"><i class="bi bi-trash-fill me-2"></i>Eliminar</a></li>` : '';
            const tr = `
                <tr>
                    <td class="fw-semibold">${user.id}</td>
                    <td>${escapeHTML(user.username)}</td>
                    <td><a href="mailto:${escapeHTML(user.email)}">${escapeHTML(user.email)}</a></td>
                    <td>${formatDate(user.joindate)}</td>
                    <td><span class="badge ${getRoleBadgeClass(targetUserRoleName)}">${escapeHTML(targetUserRoleName)}</span></td>
                    <td class="text-center"><div class="form-check form-switch d-inline-block" title="${switchDisabled?'Permiso denegado':(isTargetCheckedForAdmin?'Quitar rol Admin':'Hacer Admin')}"><input class="form-check-input role-switch" type="checkbox" role="switch" id="${switchId}" data-user-id="${user.id}" data-username="${escapeHTML(user.username)}" data-current-role="${targetUserRoleName}" ${isTargetCheckedForAdmin?'checked':''} ${switchDisabled}></div></td>
                    <td class="text-end"><div class="dropdown"><button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" ${actionButtonDisabled}><i class="fas fa-ellipsis-h"></i></button><ul class="dropdown-menu dropdown-menu-end"><li><a class="dropdown-item" href="profile.html?userId=${user.id}" target="_blank"><i class="bi bi-person-circle me-2"></i>Ver perfil</a></li>${deleteActionHtml}</ul></div></td>
                </tr>`;
            $tbody.append(tr);
        });
    }

    function renderCommentReports(reports) {
        const $tbody = $('#commentReportsTableBody'); if (!$tbody.length) return; $tbody.empty();
        if (!reports.length) { $tbody.html('<tr><td colspan="6" class="text-center text-muted p-3">No hay reportes de comentarios.</td></tr>'); return; }
        reports.forEach(report => {
            const tr = `
                <tr>
                    <td><a href="recipe.html?id=${report.recipeId}#comment-${report.commentId}" target="_blank" title="${escapeHTML(report.recipeTitle)}">${escapeHTML(report.recipeTitle.substring(0,30))}${report.recipeTitle.length>30?'...':''}</a></td>
                    <td><a href="profile.html?userId=${report.userId}" target="_blank">${escapeHTML(report.username)}</a></td>
                    <td class="comment-content-cell" title="${escapeHTML(report.commentContent)}">${escapeHTML(report.commentContent.substring(0,50))}${report.commentContent.length>50?'...':''}</td>
                    <td>${formatDate(report.reportDate)}</td>
                    <td><span class="badge ${getReportStatusBadgeClass(report.status)}">${escapeHTML(report.status)}</span></td>
                    <td class="text-end"><button class="btn btn-sm btn-outline-primary view-comment-report-btn" data-report-id="${report.id}" title="Ver reporte"><i class="bi bi-eye-fill me-1"></i>Detalles</button></td>
                </tr>`;
            $tbody.append(tr);
        });
    }

    function renderSupportTickets(tickets) {
        const $tbody = $('#supportTicketsTableBody'); if (!$tbody.length) return; $tbody.empty();
        if (!tickets.length) { $tbody.html('<tr><td colspan="6" class="text-center text-muted p-3">No hay tickets de soporte.</td></tr>'); return; }
        tickets.forEach(ticket => {
            const tr = `
                <tr>
                    <td>${escapeHTML(ticket.name)}</td>
                    <td><a href="mailto:${escapeHTML(ticket.email)}">${escapeHTML(ticket.email)}</a></td>
                    <td class="support-message-cell" title="${escapeHTML(ticket.message)}">${escapeHTML(ticket.message.substring(0,50))}${ticket.message.length>50?'...':''}</td>
                    <td>${formatDate(ticket.submissionDate)}</td>
                    <td><span class="badge ${getSupportTicketStatusBadgeClass(ticket.status)} support-ticket-status-${ticket.id}">${escapeHTML(ticket.status)}</span></td>
                    <td class="text-end"><button class="btn btn-sm btn-outline-primary view-support-ticket-btn" data-ticket-id="${ticket.id}" title="Ver ticket"><i class="bi bi-eye-fill me-1"></i>Ver</button></td>
                </tr>`;
            $tbody.append(tr);
        });
    }

    /**
     * Configura todos los manejadores de eventos.
     */
    function setupEventListeners(currentAdminRoleName) {
        const loggedInAdminRoleLevel = ROLE_HIERARCHY[currentAdminRoleName] || 0;

        // --- Evento general de click para todas las acciones delegadas ---
        $('#adminTabsContent').off('click.adminactions').on('click.adminactions', function(event) {
            const $target = $(event.target);
            const $viewCommentReportBtn = $target.closest('.view-comment-report-btn');
            const $viewSupportTicketBtn = $target.closest('.view-support-ticket-btn');
            const $deleteBtn = $target.closest('.delete-item-btn');
            const $clearRecipeReportsBtn = $target.closest('.clear-recipe-reports-btn');
            
            // <-- CAMBIO CLAVE: Ya no se usa parseInt() aquí, se pasa el valor como string.
            if ($viewCommentReportBtn.length) { event.preventDefault(); handleViewCommentReport($viewCommentReportBtn.data('report-id')); return; }
            if ($viewSupportTicketBtn.length) { event.preventDefault(); handleViewSupportTicket($viewSupportTicketBtn.data('ticket-id')); return; }
            if ($deleteBtn.length) { event.preventDefault(); handleDeleteItem($deleteBtn, loggedInAdminRoleLevel, currentAdminRoleName); return; }
            if ($clearRecipeReportsBtn.length) { event.preventDefault(); handleClearRecipeReports($clearRecipeReportsBtn); return; }
        });

        // Listeners para Búsqueda y Ordenación
        $('#adminTabsContent').off('click.sort').on('click.sort', '.sortable', function() { sortTable($(this).data('column'), $(this).closest('table').find('tbody').attr('id')); });
        $('#recipeSearch').off('input.search').on('input.search', function(){ renderRecipes(recipeData.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes($(this).val().toLowerCase())))); });
        $('#userSearch').off('input.search').on('input.search', function(){ renderUsers(userData.filter(u => Object.values(u).some(v => String(v).toLowerCase().includes($(this).val().toLowerCase()))), currentAdminRoleName); });
        $('#commentReportSearch').off('input.search').on('input.search', function(){ renderCommentReports(commentReportData.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes($(this).val().toLowerCase())))); });
        $('#supportTicketSearch').off('input.search').on('input.search', function(){ renderSupportTickets(supportTicketData.filter(t => Object.values(t).some(v => String(v).toLowerCase().includes($(this).val().toLowerCase())))); });
        
        // Listener para el Switch de Roles
        $('#userTableBody').off('change.role').on('change.role', '.role-switch', function() { handleChangeRole($(this), loggedInAdminRoleLevel, currentAdminRoleName); });

        // Listeners para botones DENTRO de los modales
        $('#confirmRoleChangeBtn').off('click.role').on('click.role', handleConfirmChangeRole);
        $('#confirmRoleChangeModal').off('hidden.bs.modal.role').on('hidden.bs.modal.role', handleCancelChangeRole);
        $('#confirmDeleteBtn').off('click.delete').on('click.delete', handleConfirmDelete);
        $('#hideReportedCommentActionBtn').off('click.report').on('click.report', handleHideComment);
        $('#finalHideReportedCommentBtn').off('click.report').on('click.report', handleConfirmHideComment);
        $('#markCommentReportAsReviewedBtn').off('click.report').on('click.report', handleMarkReportAsReviewed);
        $('#markTicketAsSolvedBtn').off('click.ticket').on('click.ticket', handleMarkTicketAsSolved);
        $('#finalClearRecipeReportsBtn').off('click.recipe').on('click.recipe', handleConfirmClearRecipeReports);
    }
    
    // --- MANEJADORES DE ACCIONES ESPECÍFICAS ---

    /** Maneja la apertura del modal para ver un reporte de comentario. */
    function handleViewCommentReport(reportId) {
        // <-- CAMBIO CLAVE: Comparamos el `reportId` (string) con `r.id` (que también es string)
        currentReportToView = commentReportData.find(r => String(r.id) === String(reportId));
        if (currentReportToView) {
            $('#reportDetailRecipeTitle').text(currentReportToView.recipeTitle);
            $('#reportDetailRecipeLink').attr('href', `recipe.html?id=${currentReportToView.recipeId}#comment-${currentReportToView.commentId}`);
            $('#reportDetailUsername').text(currentReportToView.username);
            $('#reportDetailUserLink').attr('href', `profile.html?userId=${currentReportToView.userId}`);
            $('#reportDetailDate').text(formatDate(currentReportToView.reportDate));
            $('#reportDetailStatus').text(currentReportToView.status).attr('class', `badge ${getReportStatusBadgeClass(currentReportToView.status)}`);
            $('#reportDetailCommentContent').text(currentReportToView.commentContent);
            const isPending = currentReportToView.status?.toLowerCase() === 'pendiente';
            $('#markCommentReportAsReviewedBtn').data('report-id', currentReportToView.id).prop('disabled', !isPending);
            $('#hideReportedCommentActionBtn').data({'report-id': currentReportToView.id, 'comment-id': currentReportToView.commentId}).prop('disabled', !isPending);
            $('#viewReportedCommentOriginalLink').attr('href', `recipe.html?id=${currentReportToView.recipeId}#comment-${currentReportToView.commentId}`);
            if (viewCommentReportModal) viewCommentReportModal.show(); else console.error("Instancia del modal de reportes de comentarios no existe.");
        } else { console.warn(`No se encontró reporte con ID ${reportId}.`); }
    }

    /** Maneja la apertura del modal para ver un ticket de soporte. */
    function handleViewSupportTicket(ticketId) {
        // <-- CAMBIO CLAVE: Comparamos el `ticketId` (string) con `t.id` (que también es string)
        currentTicketToView = supportTicketData.find(t => String(t.id) === String(ticketId));
        if (currentTicketToView) {
            $('#ticketDetailName').text(currentTicketToView.name);
            $('#ticketDetailEmail').text(currentTicketToView.email).attr('href', `mailto:${currentTicketToView.email}`);
            $('#ticketDetailDate').text(formatDate(currentTicketToView.submissionDate));
            $('#ticketDetailStatus').text(currentTicketToView.status).attr('class', `badge ${getSupportTicketStatusBadgeClass(currentTicketToView.status)}`);
            $('#ticketDetailMessage').text(currentTicketToView.message);
            $('#markTicketAsSolvedBtn').data('ticket-id', currentTicketToView.id).prop('disabled', currentTicketToView.status === 'Solucionado');
            if (viewSupportTicketModal) viewSupportTicketModal.show(); else console.error("Instancia del modal de tickets de soporte no existe.");
        } else { console.warn(`No se encontró ticket con ID ${ticketId}.`); }
    }

    function handleDeleteItem($deleteBtn, loggedInAdminRoleLevel, currentAdminRoleName) {
        const itemId = parseInt($deleteBtn.data('item-id'));
        const itemName = $deleteBtn.data('item-name');
        const itemType = $deleteBtn.data('item-type');
        if (itemType === 'user') {
            const userToDel = userData.find(u => u.id === itemId);
            if (!userToDel) return;
            const userToDelRole = userToDel.roleName;
            if (userToDelRole === 'SuperAdministrador') { showPermissionDeniedModal("SuperAdmin no se elimina."); return; }
            if (loggedInAdminRoleLevel <= (ROLE_HIERARCHY[userToDelRole] || 0) && currentAdminRoleName !== 'SuperAdministrador') { showPermissionDeniedModal("No puedes eliminar un usuario de rango igual o superior."); return; }
        }
        itemToDelete = { itemId, itemName, itemType };
        $('#deleteItemName').text(`${itemType === 'recipe' ? 'la receta' : itemType === 'user' ? 'el usuario' : 'el elemento'} "${escapeHTML(itemName)}"`);
        if (confirmDeleteModal) confirmDeleteModal.show();
    }
    
    function handleClearRecipeReports($clearBtn) {
        recipeToClearReportsInfo = { recipeId: parseInt($clearBtn.data('item-id')), recipeName: $clearBtn.data('item-name') };
        $('#clearRecipeReportsName').text(recipeToClearReportsInfo.recipeName);
        if (confirmClearRecipeReportsModal) confirmClearRecipeReportsModal.show();
    }
    
    function handleChangeRole($switchElement, loggedInAdminRoleLevel, currentAdminRoleName) {
        const targetUserId = parseInt($switchElement.data('user-id'));
        const targetUser = userData.find(u => u.id === targetUserId);
        if (!targetUser) return;
        const targetUserCurrentRole = targetUser.roleName;
        const targetUserRoleLevel = ROLE_HIERARCHY[targetUserCurrentRole] || 0;
        if (targetUserCurrentRole === 'SuperAdministrador') { if (superAdminWarningModal) superAdminWarningModal.show(); $switchElement.prop('checked', true); return; }
        if (loggedInAdminRoleLevel <= targetUserRoleLevel && currentAdminRoleName !== 'SuperAdministrador') { showPermissionDeniedModal("No puedes modificar un rol igual o superior."); $switchElement.prop('checked', (targetUserCurrentRole === 'Administrador')); return; }
        const newRole = $switchElement.is(':checked') ? 'Administrador' : 'Usuario';
        currentUserToChangeRole = { userId: targetUserId, userName: targetUser.username, newRole, oldRole: targetUserCurrentRole, switchElement: $switchElement[0] };
        $('#roleChangeUserName').text(currentUserToChangeRole.userName);
        $('#roleChangeNewRole').text(currentUserToChangeRole.newRole);
        if (confirmRoleChangeModal) confirmRoleChangeModal.show();
    }

    function handleConfirmChangeRole() {
        if (currentUserToChangeRole) {
            const userIndex = userData.findIndex(u => u.id === currentUserToChangeRole.userId);
            if (userIndex !== -1) {
                userData[userIndex].roleName = currentUserToChangeRole.newRole;
                const newRoleId = Object.keys(ROLE_MAP).find(k => ROLE_MAP[k] === currentUserToChangeRole.newRole);
                if (newRoleId) userData[userIndex].id_rol = parseInt(newRoleId);
                renderUsers(userData, currentAdminUser ? (ROLE_MAP[currentAdminUser.id_rol] || 'Desconocido') : null);
            }
            if (confirmRoleChangeModal) confirmRoleChangeModal.hide();
        }
    }

    function handleCancelChangeRole() {
        if (currentUserToChangeRole?.switchElement) {
            const originalCheckedState = (currentUserToChangeRole.oldRole === 'Administrador');
            $(currentUserToChangeRole.switchElement).prop('checked', originalCheckedState);
        }
        currentUserToChangeRole = null;
    }
    
    function handleConfirmDelete() {
        if (itemToDelete) {
            const adminRole = currentAdminUser ? (ROLE_MAP[currentAdminUser.id_rol] || 'Desconocido') : null;
            if (itemToDelete.itemType === 'recipe') {
                recipeData = recipeData.filter(r => r.id !== itemToDelete.itemId);
                renderRecipes(recipeData);
            } else if (itemToDelete.itemType === 'user') {
                userData = userData.filter(u => u.id !== itemToDelete.itemId);
                renderUsers(userData, adminRole);
            }
            if (confirmDeleteModal) confirmDeleteModal.hide();
            itemToDelete = null;
        }
    }

    function handleHideComment() {
        if (currentReportToView) {
            reportedCommentToManageInfo = { reportId: currentReportToView.id, commentId: currentReportToView.commentId, recipeTitle: currentReportToView.recipeTitle, action: 'hide' };
            $('#hideReportedCommentModalBodyText').html(`¿Seguro que quieres <strong>ocultar</strong> el comentario en "<strong>${escapeHTML(reportedCommentToManageInfo.recipeTitle)}</strong>"?`);
            if (viewCommentReportModal) viewCommentReportModal.hide();
            if (confirmHideReportedCommentModal) confirmHideReportedCommentModal.show();
        }
    }
    
    function handleConfirmHideComment() {
        if (reportedCommentToManageInfo?.action === 'hide') {
            handleReportAction(reportedCommentToManageInfo.reportId, "Comentario Ocultado");
            if (confirmHideReportedCommentModal) confirmHideReportedCommentModal.hide();
            reportedCommentToManageInfo = null;
        }
    }
    
    function handleMarkReportAsReviewed() {
        if (currentReportToView) {
            handleReportAction(currentReportToView.id, 'Revisado');
        }
    }
    
    function handleMarkTicketAsSolved() {
        const ticketId = parseInt($(this).data('ticket-id'));
        if (ticketId) {
            const ticketIndex = supportTicketData.findIndex(t => t.id === ticketId);
            if (ticketIndex !== -1) {
                supportTicketData[ticketIndex].status = "Solucionado";
                renderSupportTickets(supportTicketData);
            }
            $(this).prop('disabled', true);
            $('#viewSupportTicketModal #ticketDetailStatus').text("Solucionado").attr('class', `badge ${getSupportTicketStatusBadgeClass("Solucionado")}`);
        }
    }
    
    function handleConfirmClearRecipeReports() {
        if (recipeToClearReportsInfo) {
            const recipeIndex = recipeData.findIndex(r => r.id === recipeToClearReportsInfo.recipeId);
            if (recipeIndex !== -1) recipeData[recipeIndex].reports = 0;
            renderRecipes(recipeData);
            if (confirmClearRecipeReportsModal) confirmClearRecipeReportsModal.hide();
            recipeToClearReportsInfo = null;
        }
    }

    // --- FUNCIONES HELPER ---

    function handleReportAction(reportId, newStatus) {
        // <-- CAMBIO CLAVE: Comparamos como strings
        const reportIndex = commentReportData.findIndex(r => String(r.id) === String(reportId));
        if (reportIndex !== -1) {
            commentReportData[reportIndex].status = newStatus;
            renderCommentReports(commentReportData);
        }
        if (viewCommentReportModal && $(viewCommentReportModal._element).hasClass('show')) {
            viewCommentReportModal.hide();
        }
        currentReportToView = null;
    }
    
    function showPermissionDeniedModal(message = "No permitido.") { $('#permissionDeniedMessage').text(message);
        if (permissionDeniedModal) permissionDeniedModal.show();
     }
    function formatDate(dateStr) { if (!dateStr) return 'N/A';
        try { const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('es-ES',
                {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
        } catch (e) { 
            return dateStr;
        }
    }
    function getStatusBadgeClass(status) { return status === 'Publicado' ? 'bg-success text-white' : 'bg-warning text-dark'; }
    function getRoleBadgeClass(role) { switch (String(role)) { case 'SuperAdministrador': return 'bg-danger text-white'; case 'Administrador': return 'bg-primary text-white'; default: return 'bg-secondary text-white'; } }
    function getReportStatusBadgeClass(status) { switch (status?.toLowerCase()) { case 'pendiente': return 'bg-warning text-dark'; case 'revisado': return 'bg-success text-white'; case 'ignorado': return 'bg-secondary text-white'; case 'comentario ocultado': return 'bg-danger text-white'; default: return 'bg-light text-dark'; } }
    function getSupportTicketStatusBadgeClass(status) { switch (status?.toLowerCase()) { case 'pendiente': return 'bg-warning text-dark'; case 'solucionado': return 'bg-success text-white'; default: return 'bg-light text-dark'; } }
    function escapeHTML(str) { if (str == null) return ''; return $('<div>').text(String(str)).html(); }

    function sortTable(column, tableBodyId) {
        if (!tableBodyId) {
            console.warn("sortTable: tableBodyId no provisto.");
            return;
        }
        const oldTableId = currentSort.tableId;

        // Corregido: ¤tSort.tableId -> && currentSort.tableId
        // Corregido: ¤tSort.direction -> && currentSort.direction
        if (currentSort.column === column && currentSort.tableId === tableBodyId && currentSort.direction === 'asc') {
            currentSort.direction = 'desc';
        } else {
            currentSort.direction = 'asc';
        }
        currentSort.column = column;
        currentSort.tableId = tableBodyId;

        updateSortIcons(oldTableId);

        let dataToSort, renderFn;
        const adminRoleForRender = currentAdminUser ? (ROLE_MAP[currentAdminUser.id_rol] || 'Desconocido') : null;

        switch (tableBodyId) {
            case 'recipeTableBody': dataToSort = [...(recipeData || [])]; renderFn = renderRecipes; break;
            case 'userTableBody': dataToSort = [...(userData || [])]; renderFn = (data) => renderUsers(data, adminRoleForRender); break;
            case 'commentReportsTableBody': dataToSort = [...(commentReportData || [])]; renderFn = renderCommentReports; break;
            case 'supportTicketsTableBody': dataToSort = [...(supportTicketData || [])]; renderFn = renderSupportTickets; break;
            default: console.error(`sortTable: Tipo de tabla '${tableBodyId}' desconocido.`); return;
        }

        dataToSort.sort((a, b) => {
            let valA = a[column], valB = b[column];
            if (valA == null) valA = '';
            if (valB == null) valB = '';

            const dateCols = ['date', 'joindate', 'reportDate', 'submissionDate'];
            const numCols = ['reports', 'id'];

            if (numCols.includes(column)) { valA = parseFloat(valA) || 0; valB = parseFloat(valB) || 0; }
            else if (dateCols.includes(column)) { valA = new Date(valA).getTime() || 0; valB = new Date(valB).getTime() || 0; }
            else if (typeof valA === 'string' && typeof valB === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }

            if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
        renderFn(dataToSort);
    }

    function updateSortIcons(prevTableIdCleanup = null) {
        // Limpiar iconos de la tabla previamente ordenada, si es diferente
        if (prevTableIdCleanup && prevTableIdCleanup !== currentSort.tableId && document.getElementById(prevTableIdCleanup)) {
            const $prevPane = $(`#${prevTableIdCleanup}`).closest('.tab-pane');
            if ($prevPane.length) $prevPane.find('.sortable i').removeClass('fa-sort-up fa-sort-down text-primary').addClass('fa-sort text-muted');
        }
        // Limpiar iconos de la tabla actual (para todas las columnas)
        if (currentSort.tableId && document.getElementById(currentSort.tableId)) {
            const $currentPane = $(`#${currentSort.tableId}`).closest('.tab-pane');
            if ($currentPane.length) $currentPane.find('.sortable i').removeClass('fa-sort-up fa-sort-down text-primary').addClass('fa-sort text-muted');
        }
        // Aplicar icono a la columna activa en la tabla actual
        // Corregido: ¤tSort.column -> && currentSort.column
        if (currentSort.tableId && currentSort.column && document.getElementById(currentSort.tableId)) {
            const $activePane = $(`#${currentSort.tableId}`).closest('.tab-pane');
            const $activeIcon = $activePane.find(`.sortable[data-column="${currentSort.column}"] i`);
            if ($activeIcon.length) $activeIcon.removeClass('fa-sort text-muted').addClass(`fa-sort-${currentSort.direction === 'asc' ? 'up' : 'down'} text-primary`);
        }
    }
    function initialTableMessages() {
        const createMessageRow = (colspan, message) => `<tr><td colspan="${colspan}" class="text-center text-muted p-3">${escapeHTML(message)}</td></tr>`;
        const messages = { 
            r: "Cargando o no hay recetas...",
            u: "Cargando o no hay usuarios...",
            cR: "Cargando o no hay reportes...",
            sT: "Cargando o no hay tickets..."
        };
        if (!recipeData.length) $('#recipeTableBody').html(createMessageRow(7, messages.r));
        if (!userData.length) $('#userTableBody').html(createMessageRow(7, messages.u));
        if (!commentReportData.length) $('#commentReportsTableBody').html(createMessageRow(6, messages.cR));
        if (!supportTicketData.length) $('#supportTicketsTableBody').html(createMessageRow(6, messages.sT));
    }
});