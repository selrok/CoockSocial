// TFG/js/admin.js

$(document).ready(function() {
    console.log("admin.js: DOM listo. Esperando guardián...");

    let currentAdminUser = null;
    let localData = { recipes: [], users: [], commentReports: [], supportTickets: [], diets: [] };
    
    // Variables de estado
    let currentReport = null; 
    let currentTicket = null;
    
    // --- ESTADO DE ORDENACIÓN ---
    let sortState = {
        column: '',
        direction: 'asc', // 'asc' o 'desc'
        key: '' // 'recipes', 'users', etc.
    };

    // Modales
    const modals = {};

    // --- ENTRADA ---
    $(document).on('authGuardAdminPassed', function(event, adminData) {
        if (window.adminPageInitialized) return;
        window.adminPageInitialized = true;
        currentAdminUser = adminData;
        console.log("admin.js: Inicializando para", currentAdminUser.username);

        initModals();
        loadDashboardData();
        setupEvents();
    });

    function initModals() {
        const ids = [
            'confirmDeleteModal', 'confirmRoleChangeModal', 
            'superAdminWarningModal', 'permissionDeniedModal',
            'viewCommentReportModal', 'viewSupportTicketModal',
            'confirmHideReportedCommentModal'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if(el) modals[id] = new bootstrap.Modal(el);
        });
    }

    function loadDashboardData() {
        AdminService.getAllData().done(function(res) {
            if (res.success) {
                localData = res.data;
                renderAllTables();
            } else {
                console.error("Error cargando datos: " + res.message);
            }
        }).fail(() => console.error("Error red admin"));
    }

    function loadAll() {
        loadDashboardData(); // Reutilizamos para recargar todo
    }

    function renderAllTables() {
        // Filtrar datos usando los inputs de búsqueda actuales
        const termR = $('#recipeSearch').val().toLowerCase();
        const termU = $('#userSearch').val().toLowerCase();
        const termC = $('#commentReportSearch').val().toLowerCase();
        const termS = $('#supportTicketSearch').val().toLowerCase();
        const termD = $('#dietSearch').val().toLowerCase();

        renderRecipes(filterData(localData.recipes, termR));
        renderUsers(filterData(localData.users, termU));
        renderCommentReports(filterData(localData.commentReports, termC));
        renderSupportTickets(filterData(localData.supportTickets, termS));
        renderDiets(filterData(localData.diets, termD));
    }

    // Helper para filtrar arrays de objetos
    function filterData(array, term) {
        if (!term) return array;
        return array.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(term)));
    }

    // --- RENDERIZADORES ---
    function renderRecipes(recipes) {
        const $t = $('#recipeTableBody').empty();
        if(!recipes || !recipes.length) return $t.html('<tr><td colspan="7" class="text-center p-3 text-muted">No hay recetas.</td></tr>');
        
        recipes.forEach(r => {
            const dateStr = new Date(r.date).toLocaleDateString();
            const badgeClass = r.status === 'publica' ? 'bg-success' : 'bg-secondary';
            const reportsCount = parseInt(r.reports) || 0;
            // Badge rojo si tiene reportes
            const reportBadge = reportsCount > 0 
                ? `<span class="badge bg-danger rounded-pill">${reportsCount}</span>` 
                : '<i class="bi bi-check-circle text-success"></i>';
            
            // Opción extra para limpiar denuncias si > 0
            const clearOption = reportsCount > 0 
                ? `<li><a class="dropdown-item text-warning action-btn" href="#" data-action="clear_reports" data-id="${r.id}" data-name="${escapeHTML(r.titulo)}"><i class="bi bi-eraser me-2"></i>Limpiar Denuncias</a></li>` 
                : '';

            $t.append(`
                <tr>
                    <td class="fw-bold">${r.id}</td>
                    <td>${escapeHTML(r.titulo)}</td>
                    <td><a href="profile.html?userId=${r.authorId}" target="_blank" class="text-decoration-none">${escapeHTML(r.author)}</a></td>
                    <td>${dateStr}</td>
                    <td><span class="badge ${badgeClass}">${r.status}</span></td>
                    <td class="text-center">${reportBadge}</td>
                    <td class="text-end">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown"><i class="fas fa-ellipsis-h"></i></button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="recipe.html?id=${r.id}" target="_blank"><i class="bi bi-eye me-2"></i>Ver Receta</a></li>
                                ${clearOption}
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger action-btn" href="#" data-action="delete" data-type="recipe" data-id="${r.id}" data-name="${escapeHTML(r.titulo)}"><i class="bi bi-trash me-2"></i>Eliminar</a></li>
                            </ul>
                        </div>
                    </td>
                </tr>`);
        });
    }

    function renderUsers(users) {
        const $t = $('#userTableBody').empty();
        if(!users || !users.length) return $t.html('<tr><td colspan="6" class="text-center p-3 text-muted">No hay usuarios.</td></tr>');
        
        const ROLE_NAMES = {1:'SuperAdministrador', 2:'Administrador', 3:'Usuario'};
        const ROLE_BADGES = {1:'bg-danger', 2:'bg-primary', 3:'bg-secondary'};

        users.forEach(u => {
            const roleName = ROLE_NAMES[u.id_rol] || 'Desconocido';
            const badge = ROLE_BADGES[u.id_rol] || 'bg-light text-dark';
            
            const myRol = parseInt(currentAdminUser.id_rol);
            const targetRol = parseInt(u.id_rol);
            const canEdit = (myRol < targetRol); 
            const isSelf = (parseInt(u.id) === parseInt(currentAdminUser.user_id));
            const isDisabled = (!canEdit || isSelf) ? 'disabled' : '';

            const isChecked = (targetRol === 1 || targetRol === 2) ? 'checked' : '';

            $t.append(`
                <tr>
                    <td class="fw-bold">${u.id}</td>
                    <td>${escapeHTML(u.username)}</td>
                    <td>${escapeHTML(u.email)}</td>
                    <td>${formatDate(u.joindate)}</td>
                    <td><span class="badge ${badge}">${roleName}</span></td>
                    <td class="text-center">
                        <div class="form-check form-switch d-inline-block">
                            <input class="form-check-input role-switch" type="checkbox" 
                                data-id="${u.id}" data-username="${escapeHTML(u.username)}" data-rol="${targetRol}"
                                ${isChecked} ${isDisabled}>
                        </div>
                    </td>
                    <td class="text-end">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown" ${isDisabled}><i class="fas fa-ellipsis-h"></i></button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="profile.html?userId=${u.id}" target="_blank"><i class="bi bi-person me-2"></i>Ver Perfil</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger action-btn" href="#" data-action="delete" data-type="user" data-id="${u.id}" data-name="${escapeHTML(u.username)}"><i class="bi bi-trash me-2"></i>Eliminar</a></li>
                            </ul>
                        </div>
                    </td>
                </tr>`);
        });
    }

    function renderCommentReports(reports) {
        const $t = $('#commentReportsTableBody').empty();
        if(!reports || !reports.length) return $t.html('<tr><td colspan="5" class="text-center p-3 text-muted">Sin reportes pendientes.</td></tr>');
        
        reports.forEach(r => {
            let statusBadge = 'bg-secondary';
            if(r.status === 'Pendiente') statusBadge = 'bg-warning text-dark';
            else if(r.status === 'Revisado') statusBadge = 'bg-success';
            else if(r.status === 'Comentario Ocultado') statusBadge = 'bg-danger';

            $t.append(`
                <tr>
                    <td><a href="recipe.html?id=${r.recipeId}" target="_blank">${escapeHTML(r.recipeTitle)}</a></td>
                    <td>${escapeHTML(r.username)}</td>
                    <td><span class="badge ${statusBadge}">${r.status}</span></td>
                    <td>${formatDate(r.reportDate)}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-primary action-btn" 
                                data-action="view_report" 
                                data-id="${r.id}">
                            <i class="bi bi-eye"></i> Detalles
                        </button>
                    </td>
                </tr>`);
        });
    }

    function renderSupportTickets(tickets) {
        const $t = $('#supportTicketsTableBody').empty();
        if(!tickets || !tickets.length) return $t.html('<tr><td colspan="5" class="text-center p-3 text-muted">Sin tickets.</td></tr>');

        tickets.forEach(t => {
            const statusBadge = t.status === 'Pendiente' ? 'bg-warning text-dark' : 'bg-success';
            const dateStr = t.submissionDate ? new Date(t.submissionDate).toLocaleDateString() : 'N/A';
            
            $t.append(`
                <tr>
                    <td>${escapeHTML(t.name)}</td>
                    <td><a href="mailto:${escapeHTML(t.email)}">${escapeHTML(t.email)}</a></td>
                    <td><span class="badge ${statusBadge}">${t.status}</span></td>
                    <td>${dateStr}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-primary action-btn" 
                                data-action="view_ticket" 
                                data-id="${t.id}">
                             <i class="bi bi-eye"></i> Ver
                        </button>
                    </td>
                </tr>`);
        });
    }
    
    function renderDiets(diets) {
        const $t = $('#dietTableBody').empty();
        if(!diets || !diets.length) return $t.html('<tr><td colspan="3" class="text-center text-muted">No hay dietas.</td></tr>');
    
        diets.forEach(d => {
            $t.append(`
                <tr>
                    <td>${d.id}</td>
                    <td>${escapeHTML(d.nombre_dieta)}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-danger action-btn" data-action="delete" data-type="diet" data-id="${d.id}" data-name="${escapeHTML(d.nombre_dieta)}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>`);
        });
    }

    // --- FUNCIÓN DE ORDENACIÓN (SORTING CLIENT-SIDE) ---
    function handleSort(key, column, $header) {
        const data = localData[key];
        if (!data || data.length === 0) return;

        // Alternar dirección
        const isAsc = (sortState.key === key && sortState.column === column && sortState.direction === 'asc');
        sortState.direction = isAsc ? 'desc' : 'asc';
        sortState.column = column;
        sortState.key = key;

        // Reset de iconos en la tabla actual
        $header.closest('thead').find('i.bi').attr('class', 'bi ms-1 text-muted');

        // Aplicar ordenación al array
        data.sort((a, b) => {
            let valA = a[column], valB = b[column];

            // Manejo de nulos
            if (valA == null) valA = '';
            if (valB == null) valB = '';

            // Comparación por tipo
            if (!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') {
                // Numérico
                return sortState.direction === 'asc' ? valA - valB : valB - valA;
            } else {
                // String o Fecha
                return sortState.direction === 'asc' 
                    ? String(valA).localeCompare(String(valB)) 
                    : String(valB).localeCompare(String(valA));
            }
        });

        // Actualizar icono en el header clicado
        const iconClass = sortState.direction === 'asc' ? 'bi-caret-up-fill text-orange' : 'bi-caret-down-fill text-orange';
        $header.find('i.bi').attr('class', 'bi ' + iconClass + ' ms-1');

        renderAllTables();
    }

    // --- EVENTOS ---
    function setupEvents() {
        // Buscadores
        $('#recipeSearch, #userSearch, #commentReportSearch, #supportTicketSearch, #dietSearch').on('input', function() {
            renderAllTables();
        });

        // Click en cabeceras para Ordenar (Delegación)
        $(document).on('click', 'th.sortable', function() {
            const $th = $(this);
            const column = $th.data('column');
            const paneId = $th.closest('.tab-pane').attr('id');
            
            // Mapeo de ID de pestaña a clave de localData
            const tabToKey = {
                'recipes': 'recipes',
                'users': 'users',
                'comment-reports': 'commentReports',
                'support-tickets': 'supportTickets',
                'diets': 'diets'
            };

            handleSort(tabToKey[paneId], column, $th);
        });

        // Click en Botones de Acción (Delegación)
        $(document).on('click', '.action-btn', function(e) {
            e.preventDefault();
            const $btn = $(this);
            const action = $btn.data('action');
            const id = $btn.data('id');
            const type = $btn.data('type');
            const name = $btn.data('name');

            if (action === 'delete') {
                window.pendingDelete = { id, type, name };
                $('#deleteItemName').text(`${name} (${type})`);
                modals['confirmDeleteModal'].show();
            }
            else if (action === 'view_report') {
                currentReport = localData.commentReports.find(x => x.id == id);
                let reportComentDate = new Date(currentReport.reportDate).toLocaleDateString();
                if(currentReport) {
                    $('#reportDetailRecipeTitle').text(currentReport.recipeTitle);
                    $('#reportDetailRecipeLink').attr('href', 'recipe.html?id='+currentReport.recipeId);
                    $('#reportDetailUserLink').text(currentReport.username).attr('href', 'profile.html?userId='+currentReport.userId);
                    $('#reportDetailDate').text(reportComentDate);
                    $('#reportDetailCommentContent').text(currentReport.commentContent);
                    $('#reportDetailStatus').text(currentReport.status);
                    $('#viewReportedCommentOriginalLink').attr('href', 'recipe.html?id='+currentReport.recipeId);
                    
                    const isPending = currentReport.status === 'Pendiente';
                    $('#markCommentReportAsReviewedBtn, #hideReportedCommentActionBtn')
                        .prop('disabled', !isPending).data('id', id);

                    modals['viewCommentReportModal'].show();
                }
            }
            else if (action === 'view_ticket') {
                currentTicket = localData.supportTickets.find(x => x.id == id);
                let soporteFecha = new Date(currentTicket.submissionDate).toLocaleDateString();
                if(currentTicket) {
                    $('#ticketDetailName').text(currentTicket.name);
                    $('#ticketDetailEmail').text(currentTicket.email).attr('href', 'mailto:'+currentTicket.email);
                    $('#ticketDetailDate').text(soporteFecha);
                    $('#ticketDetailStatus').text(currentTicket.status);
                    $('#ticketDetailMessage').text(currentTicket.message);
                    $('#markTicketAsSolvedBtn').data('id', id).prop('disabled', currentTicket.status === 'Solucionado');
                    modals['viewSupportTicketModal'].show();
                }
            }
            else if (action === 'clear_reports') {
                if(confirm(`¿Limpiar todas las denuncias de "${name}"?`)) {
                    AdminService.performAction({ action: 'clear_reports', id: id }).done(loadAll);
                }
            }
        });

        // Confirmar Borrado SECUENCIAL para asegurar Notificación
        $('#confirmDeleteBtn').off('click').click(function() {
            const d = window.pendingDelete;
            if(!d) return;

            const executeDelete = () => {
                AdminService.performAction({ action: 'delete_'+d.type, id: d.id }).done(() => {
                    modals['confirmDeleteModal'].hide();
                    loadAll();
                });
            };

            if (d.type === 'recipe' && typeof window.NotificationHelper !== 'undefined') {
                const recipeTarget = localData.recipes.find(r => r.id == d.id);
                if (recipeTarget && recipeTarget.authorId) {
                    const prom = window.NotificationHelper.send(recipeTarget.authorId, 'baneo_receta', d.id);
                    if (prom && prom.done) {
                        prom.done(executeDelete);
                    } else { executeDelete(); }
                } else { executeDelete(); }
            } else { executeDelete(); }
        });

        // Cambio de Rol
        $(document).on('change', '.role-switch', function() {
            const $s = $(this);
            const currentRol = parseInt($s.data('rol')); 
            const targetRol = $s.is(':checked') ? 2 : 3;

            window.pendingRole = { id: $s.data('id'), role_id: targetRol, name: $s.data('username'), el: $s, old_rol: currentRol };
            $('#roleChangeUserName').text(window.pendingRole.name);
            $('#roleChangeNewRole').text(targetRol === 2 ? 'Administrador' : 'Usuario');
            modals['confirmRoleChangeModal'].show();
        });

        $('#confirmRoleChangeBtn').off('click').click(function() {
             const pr = window.pendingRole;
             AdminService.performAction({ action: 'change_role', id: pr.id, role_id: pr.role_id }).done(() => {
                window.pendingRole = null; 
                modals['confirmRoleChangeModal'].hide();
                loadAll();
             });
        });

        document.getElementById('confirmRoleChangeModal').addEventListener('hidden.bs.modal', function () {
             if (window.pendingRole) {
                 const shouldBeChecked = (window.pendingRole.old_rol === 2);
                 window.pendingRole.el.prop('checked', shouldBeChecked);
                 window.pendingRole = null; 
             }
        });

        $('#markTicketAsSolvedBtn').off('click').click(function() {
            AdminService.performAction({ action: 'solve_ticket', id: $(this).data('id') }).done(() => {
                 modals['viewSupportTicketModal'].hide(); loadAll();
            });
        });

        $('#markCommentReportAsReviewedBtn').off('click').click(function() {
            AdminService.performAction({ action: 'review_report', id: $(this).data('id') }).done(() => {
                 modals['viewCommentReportModal'].hide(); loadAll();
            });
        });

        $('#hideReportedCommentActionBtn').off('click').click(function() {
            const rid = $(this).data('id');
            modals['viewCommentReportModal'].hide();
            $('#finalHideReportedCommentBtn').data('id', rid);
            $('#hideReportedCommentModalBodyText').html('¿Ocultar este comentario?');
            modals['confirmHideReportedCommentModal'].show();
        });

        $('#finalHideReportedCommentBtn').off('click').click(function() {
            const rid = $(this).data('id');
            const executeHide = () => {
                AdminService.performAction({ action: 'hide_comment', id: rid }).done(() => {
                     modals['confirmHideReportedCommentModal'].hide();
                     loadAll();
                });
            };

            if (typeof window.NotificationHelper !== 'undefined') {
                const reportTarget = localData.commentReports.find(c => c.id == rid);
                if (reportTarget && reportTarget.userId) {
                    const prom = window.NotificationHelper.send(reportTarget.userId, 'baneo_comentario', reportTarget.recipeId);
                    if (prom && prom.done) {
                        prom.done(executeHide);
                    } else { executeHide(); }
                } else { executeHide(); }
            } else { executeHide(); }
        });
        
        $('#addDietForm').off('submit').submit(function(e) {
            e.preventDefault();
            const n = $('#newDietName').val().trim();
            if(n) AdminService.performAction({ action: 'add_diet', nombre: n }).done(() => {
                $('#newDietName').val(''); loadAll();
            });
        });
    }

    function formatDate(str) { 
        if(!str) return 'N/A'; 
        return new Date(str).toLocaleDateString(); 
    }
    
    function escapeHTML(str) { 
        if(!str) return ''; 
        return $('<div>').text(String(str)).html(); 
    }
});