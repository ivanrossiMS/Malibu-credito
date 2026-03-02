import storage from '../StorageService.js';
import auth from '../AuthService.js';
import clientService from '../ClientService.js';
import loanService from '../LoanService.js';
import DateHelper from '../DateHelper.js';
import billingService from '../BillingService.js';

export default class UsersModule {
    async init() {
        this.currentTab = 'ativo';
        this.adminFilter = 'all';
        this.isMaster = auth.isMaster();
        this.bindEvents();

        if (this.isMaster) {
            this.injectBillingModal();
            this.bindEditModal();
        }

        this.renderUsers();
    }

    async renderUsers() {
        const listContainer = document.getElementById('users-list');
        if (!listContainer) return;

        const allUsers = await storage.getAll('users');
        let users;

        const adminRoles = ['admin', 'ADMIN', 'MASTER'];
        const isLoggedMaster = auth.isMaster();

        // Master UI Toggles
        if (isLoggedMaster && this.currentTab === 'admin') {
            document.getElementById('master-stats-row')?.classList.remove('hidden');
            document.getElementById('admin-mini-filters')?.classList.remove('hidden');
            await this.renderMasterStats();
        } else {
            document.getElementById('master-stats-row')?.classList.add('hidden');
            document.getElementById('admin-mini-filters')?.classList.add('hidden');
        }

        if (this.currentTab === 'admin') {
            users = allUsers.filter(u => adminRoles.includes(String(u.role).toUpperCase()) || adminRoles.includes(u.role));
            if (!isLoggedMaster) {
                // Esconder MASTER por role ou por email fixo
                users = users.filter(u =>
                    String(u.role).toUpperCase() !== 'MASTER' &&
                    u.email !== 'ivanrossi@outlook.com'
                );
            }

            // Aplicar sub-filtros de admin para MASTER
            if (isLoggedMaster && this.adminFilter !== 'all') {
                const results = [];
                for (const u of users) {
                    const installments = await billingService.getUserInstallments(u.id);
                    const hasOverdue = installments.some(i => i.status === 'VENCIDA');

                    if (this.adminFilter === 'pending' && !u.accessEnabled) results.push(u);
                    if (this.adminFilter === 'overdue' && hasOverdue) results.push(u);
                }
                users = results;
            }
        } else {
            users = allUsers.filter(u => u.status === this.currentTab && !adminRoles.includes(u.role));
        }

        if (users.length === 0) {
            listContainer.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-12 text-center text-slate-400">
                        <p>Nenhum usuário ${this.currentTab} encontrado.</p>
                    </td>
                </tr>
            `;
            return;
        }

        const rows = [];
        for (const user of users) {
            const initials = user.name ? user.name.substring(0, 2).toUpperCase() : 'U';
            const avatarHtml = user.avatar
                ? `<img src="${user.avatar}" alt="${user.name}" class="w-10 h-10 rounded-xl object-cover shadow-sm">`
                : `<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-inner">${initials}</div>`;

            let billingCols = '';
            if (this.isMaster && this.currentTab === 'admin') {
                const installments = await billingService.getUserInstallments(user.id);
                const hasOverdue = installments.some(i => i.status === 'VENCIDA');

                billingCols = `
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase ${user.accessEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}">
                            ${user.accessEnabled ? 'Liberado' : 'Pendente'}
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase ${hasOverdue ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}">
                            ${hasOverdue ? 'Em Atraso' : 'Em Dia'}
                        </span>
                    </td>
                `;
            } else if (this.isMaster) {
                billingCols = `<td class="px-6 py-4">--</td><td class="px-6 py-4">--</td>`;
            }

            rows.push(`
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                        ${avatarHtml}
                        <span class="font-bold text-slate-900">${user.name}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">${user.email}</td>
                ${billingCols}
                <td class="px-6 py-4 text-sm text-slate-500">${DateHelper.formatLocal(user.createdAt)}</td>
                <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-1">
                        ${this.getActionButtons(user)}
                    </div>
                </td>
            </tr>
            `);
        }

        listContainer.innerHTML = rows.join('');

        lucide.createIcons();
    }

    getActionButtons(user) {
        const isAdmin = user.role === 'admin' || user.role === 'ADMIN' || user.role === 'MASTER';
        if (isAdmin) {
            if (user.role === 'MASTER') return '';

            let masterActions = '';
            if (this.isMaster) {
                masterActions = `
                    <button onclick="openEditUser(${user.id})" class="text-slate-500 hover:bg-slate-100 p-1.5 rounded-lg transition-all" title="Editar"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                    <button onclick="openAccessControl(${user.id})" class="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all">Acesso</button>
                    <button onclick="deleteUserPermanently(${user.id})" class="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-all" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                `;
            }

            return `
                <div class="flex items-center gap-1">
                    ${masterActions}
                    <button onclick="demoteUser(${user.id})" class="text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">Remover Admin</button>
                </div>
            `;
        } else if (user.status === 'pendente') {
            return `
                <button onclick="updateUserStatus(${user.id}, 'ativo')" class="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all">Aprovar</button>
                <button onclick="updateUserStatus(${user.id}, 'rejeitado')" class="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-600 transition-all">Rejeitar</button>
            `;
        } else if (user.status === 'ativo') {
            return `
                <button onclick="loginAsUser(${user.id})" class="text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all mr-2 flex items-center gap-1"><i data-lucide="log-in" class="w-3 h-3"></i> Acessar Cliente</button>
                <button onclick="promoteUser(${user.id})" class="text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all mr-2">Promover a Admin</button>
                <button onclick="updateUserStatus(${user.id}, 'bloqueado')" class="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all mr-2">Bloquear</button>
                <button onclick="deleteUserPermanently(${user.id})" class="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">Excluir</button>
            `;
        } else {
            return `
                <button onclick="updateUserStatus(${user.id}, 'ativo')" class="text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">Reativar</button>
            `;
        }
    }

    bindEvents() {
        console.log("Binding users page events...");

        window.deleteUserPermanently = async (id) => {
            console.log("Delete called for ID:", id);

            if (id === auth.currentUser?.id) {
                alert("Você não pode excluir sua própria conta.");
                return;
            }

            const confirmMsg = "ATENÇÃO: Isso excluirá PERMANENTEMENTE o usuário, seu perfil de cliente, todos os empréstimos, parcelas e pagamentos vinculados.\n\nEsta ação não pode ser desfeita. Deseja continuar?";

            if (confirm(confirmMsg)) {
                try {
                    // 1. Find the client profile linked to this user
                    const clients = await clientService.getAll();
                    const client = clients.find(c => String(c.userId || c.user_id) === String(id));

                    if (client) {
                        // 2. Cascade delete loans (this handles installments and payments)
                        const loans = await loanService.getAll();
                        const clientLoans = loans.filter(l => String(l.clientId || l.clientid || l.client_id) === String(client.id));

                        for (let loan of clientLoans) {
                            await loanService.deleteLoan(loan.id);
                        }

                        // 3. Delete the client profile
                        await storage.delete('clients', client.id);
                    }

                    // 4. Delete the user record
                    await storage.delete('users', id);

                    alert("Usuário e todos os dados vinculados foram removidos com sucesso.");
                    this.renderUsers();
                } catch (error) {
                    console.error("Erro na exclusão em cascata:", error);
                    alert("Erro ao realizar exclusão em cascata: " + error.message);
                }
            }
        };

        document.querySelectorAll('.user-tab').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.user-tab').forEach(b => {
                    b.classList.remove('text-primary', 'border-b-2', 'border-primary');
                    b.classList.add('text-slate-400');
                });
                btn.classList.add('text-primary', 'border-b-2', 'border-primary');
                btn.classList.remove('text-slate-400');
                this.currentTab = btn.dataset.tab;
                this.renderUsers();
            };
        });

        window.updateUserStatus = async (id, status) => {
            if (confirm(`Deseja alterar o status do usuário para ${status}?`)) {
                const user = await storage.getById('users', id);
                user.status = status;
                await storage.put('users', user);
                this.renderUsers();
            }
        };

        window.promoteUser = async (id) => {
            if (confirm('Este usuário passará a ter acesso total ao Painel Administrativo. Confirmar?')) {
                const user = await storage.getById('users', id);
                user.role = 'admin';
                await storage.put('users', user);
                this.renderUsers();
                alert('Usuário promovido com sucesso.');
            }
        };

        window.demoteUser = async (id) => {
            if (confirm('Este usuário perderá o acesso ao Painel Administrativo. Confirmar?')) {
                const user = await storage.getById('users', id);
                user.role = 'user';
                await storage.put('users', user);
                this.renderUsers();
                alert('Acesso administrativo removido com sucesso.');
            }
        };

        window.loginAsUser = async (id) => {
            if (confirm('Você será levado ao painel deste cliente para visualizar seus dados. Deseja continuar?')) {
                try {
                    await auth.impersonate(id);
                } catch (error) {
                    alert('Erro ao acessar conta: ' + error.message);
                }
            }
        };

        window.openAccessControl = async (id) => {
            const user = await storage.getById('users', id);
            this.openUserDetail(user);
        };

        window.openEditUser = async (id) => {
            const user = await storage.getById('users', id);
            this.openEditModal(user);
        };

        // Admin Filters Bind
        document.querySelectorAll('.admin-filter-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active', 'ring-2', 'ring-primary/20'));
                btn.classList.add('active', 'ring-2', 'ring-primary/20');
                this.adminFilter = btn.dataset.filter;
                this.renderUsers();
            };
        });
    }

    async renderMasterStats() {
        const allUsers = await storage.getAll('users');
        const admins = allUsers.filter(u => ['admin', 'ADMIN', 'MASTER'].includes(u.role));

        let active = 0;
        let overdue = 0;
        let totalRevenue = 0;

        for (const admin of admins) {
            if (admin.accessEnabled) active++;
            const installments = await billingService.getUserInstallments(admin.id);
            if (installments.some(i => i.status === 'VENCIDA')) overdue++;

            totalRevenue += installments.filter(i => i.status === 'PAGA').reduce((sum, i) => sum + i.amount, 0);
        }

        document.getElementById('stat-total').textContent = admins.length;
        document.getElementById('stat-active').textContent = active;
        document.getElementById('stat-overdue').textContent = overdue;
        document.getElementById('stat-revenue').textContent = `R$ ${totalRevenue.toFixed(2)}`;
    }

    bindEditModal() {
        const modal = document.getElementById('edit-user-modal');
        const form = document.getElementById('edit-user-form');
        const close = document.getElementById('close-edit-modal');

        if (!form) return;

        close.onclick = () => modal.classList.add('hidden');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-user-id').value;
            const user = await storage.getById('users', id);

            user.name = document.getElementById('edit-user-name').value;
            user.email = document.getElementById('edit-user-email').value;

            await storage.put('users', user);
            modal.classList.add('hidden');
            this.renderUsers();
            alert('Dados do administrador atualizados!');
        };
    }

    openEditModal(user) {
        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('edit-user-name').value = user.name;
        document.getElementById('edit-user-email').value = user.email;
        document.getElementById('edit-user-modal').classList.remove('hidden');
    }

    injectBillingModal() {
        const container = document.getElementById('user-billing-modal-container');
        if (!container) return;

        container.innerHTML = `
            <div id="user-detail-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] hidden flex items-center justify-center p-4">
                <div class="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
                    <div class="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div class="flex items-center gap-5">
                            <div class="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-200" id="modal-user-initials">--</div>
                            <div>
                                <h2 class="text-2xl font-black text-slate-800 font-heading" id="modal-user-name">Carregando...</h2>
                                <p class="text-slate-500 font-medium text-sm" id="modal-user-email">email@exemplo.com</p>
                            </div>
                        </div>
                        <button id="close-modal" class="p-3 hover:bg-slate-200 rounded-2xl transition-all">
                            <i data-lucide="x" class="w-6 h-6 text-slate-500"></i>
                        </button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                                <h3 class="font-black text-slate-800 flex items-center gap-2"><i data-lucide="shield-check" class="w-5 h-5 text-primary"></i> Status de Acesso</h3>
                                <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div><p class="text-xs font-bold text-slate-500 uppercase">Acesso Geral</p><p class="text-sm font-black" id="modal-access-text">BLOQUEADO</p></div>
                                    <button id="toggle-access-enabled" class="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all text-xs">LIBERAR</button>
                                </div>
                                <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div><p class="text-xs font-bold text-slate-500 uppercase">Override Manual</p><p class="text-xs text-slate-400">Permite acesso mesmo c/ dívida</p></div>
                                    <button id="toggle-access-override" class="px-6 py-2 bg-slate-300 text-slate-600 font-bold rounded-xl hover:scale-105 transition-all text-xs">ATIVAR</button>
                                </div>
                            </div>
                            <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                                <h3 class="font-black text-slate-800 flex items-center gap-2"><i data-lucide="credit-card" class="w-5 h-5 text-indigo-500"></i> Resumo Financeiro</h3>
                                <div class="grid grid-cols-2 gap-4 h-full">
                                    <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <p class="text-[10px] font-black text-emerald-600 uppercase">Total Pago</p>
                                        <p class="text-xl font-black text-emerald-700" id="modal-total-paid">R$ 0,00</p>
                                    </div>
                                    <div class="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                        <p class="text-[10px] font-black text-rose-600 uppercase">Em Aberto</p>
                                        <p class="text-xl font-black text-rose-700" id="modal-total-pending">R$ 0,00</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <h3 class="font-black text-slate-800 flex items-center gap-2 text-lg"><i data-lucide="calendar" class="w-6 h-6 text-slate-400"></i> Histórico de Mensalidades</h3>
                                <button id="generate-installments" class="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline flex items-center gap-2"><i data-lucide="plus-circle" class="w-4 h-4"></i> Gerar Faltantes</button>
                            </div>
                            <div class="border border-slate-100 rounded-3xl overflow-hidden">
                                <table class="w-full text-left border-collapse">
                                    <thead class="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <tr><th class="px-6 py-4">Competência</th><th class="px-6 py-4">Vencimento</th><th class="px-6 py-4">Valor</th><th class="px-6 py-4">Status</th><th class="px-6 py-4">Ação</th></tr>
                                    </thead>
                                    <tbody id="modal-installments-body" class="divide-y divide-slate-50 text-sm"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('close-modal').onclick = () => document.getElementById('user-detail-modal').classList.add('hidden');
        document.getElementById('toggle-access-enabled').onclick = () => this.toggleAccessEnabled();
        document.getElementById('toggle-access-override').onclick = () => this.toggleAccessOverride();
        document.getElementById('generate-installments').onclick = async () => {
            const count = prompt("Quantas mensalidades deseja gerar para este administrador?", "1");
            if (count && !isNaN(count) && parseInt(count) > 0) {
                try {
                    await billingService.generateMonthlyInstallments(this.currentUser, parseInt(count));
                    await this.renderInstallments();
                    await this.renderUsers();
                    alert(`${count} mensalidade(s) gerada(s) com sucesso!`);
                } catch (error) {
                    console.error("Erro ao gerar mensalidades:", error);
                    alert("Erro ao gerar mensalidades: " + error.message);
                }
            }
        };

        lucide.createIcons();
    }

    async openUserDetail(user) {
        this.currentUser = user;
        const modal = document.getElementById('user-detail-modal');

        document.getElementById('modal-user-name').textContent = user.name;
        document.getElementById('modal-user-email').textContent = user.email;
        document.getElementById('modal-user-initials').textContent = (user.name?.[0] || 'A').toUpperCase();

        this.updateAccessButtons();
        await this.renderInstallments();

        modal.classList.remove('hidden');
    }

    updateAccessButtons() {
        const user = this.currentUser;
        const btnEnabled = document.getElementById('toggle-access-enabled');
        const btnOverride = document.getElementById('toggle-access-override');
        const statusText = document.getElementById('modal-access-text');

        if (user.accessEnabled) {
            btnEnabled.textContent = 'REVOGAR ACESSO';
            btnEnabled.className = "px-6 py-2 bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-200 hover:scale-105 transition-all text-xs";
            statusText.textContent = 'LIBERADO';
            statusText.className = 'text-sm font-black text-emerald-600';
        } else {
            btnEnabled.textContent = 'LIBERAR ACESSO';
            btnEnabled.className = "px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all text-xs";
            statusText.textContent = 'BLOQUEADO';
            statusText.className = 'text-sm font-black text-rose-600';
        }

        if (user.accessOverride) {
            btnOverride.textContent = 'DESATIVAR OVERRIDE';
            btnOverride.className = "px-6 py-2 bg-amber-400 text-amber-900 font-bold rounded-xl hover:scale-105 transition-all text-xs";
        } else {
            btnOverride.textContent = 'ATIVAR OVERRIDE';
            btnOverride.className = "px-6 py-2 bg-slate-300 text-slate-600 font-bold rounded-xl hover:scale-105 transition-all text-xs";
        }
    }

    async renderInstallments() {
        const installments = await billingService.getUserInstallments(this.currentUser.id);
        const tbody = document.getElementById('modal-installments-body');
        tbody.innerHTML = '';

        let paidTotal = 0;
        let pendingTotal = 0;

        installments.forEach(inst => {
            const tr = document.createElement('tr');
            const isPaid = inst.status === 'PAGA';
            const isOverdue = inst.status === 'VENCIDA';

            if (isPaid) paidTotal += inst.amount;
            else pendingTotal += inst.amount;

            tr.innerHTML = `
                <td class="px-6 py-4 font-bold text-slate-700">${inst.competenceMonth}</td>
                <td class="px-6 py-4 text-slate-500">${DateHelper.formatLocal(inst.dueDate)}</td>
                <td class="px-6 py-4 font-black">R$ ${inst.amount.toFixed(2)}</td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isPaid ? 'bg-emerald-100 text-emerald-600' : (isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500')}">
                        ${inst.status}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <button class="toggle-pay-btn text-indigo-600 hover:text-indigo-800 font-bold text-xs" data-id="${inst.id}">
                        ${isPaid ? 'Desfazer' : 'Marcar Paga'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('modal-total-paid').textContent = `R$ ${paidTotal.toFixed(2)}`;
        document.getElementById('modal-total-pending').textContent = `R$ ${pendingTotal.toFixed(2)}`;

        tbody.querySelectorAll('.toggle-pay-btn').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                const inst = installments.find(i => String(i.id) === String(id));
                if (inst.status === 'PAGA') await billingService.undoPayment(id);
                else await billingService.markAsPaid(id);
                await this.renderInstallments();
                await this.renderUsers();
            };
        });
    }

    async toggleAccessEnabled() {
        this.currentUser.accessEnabled = !this.currentUser.accessEnabled;
        if (this.currentUser.accessEnabled && !this.currentUser.firstAccessAt) {
            this.currentUser.firstAccessAt = new Date().toISOString();
            await billingService.generateMissingInstallments(this.currentUser);
        }
        await storage.put('users', this.currentUser);
        this.updateAccessButtons();
        await this.renderUsers();
    }

    async toggleAccessOverride() {
        this.currentUser.accessOverride = !this.currentUser.accessOverride;
        await storage.put('users', this.currentUser);
        this.updateAccessButtons();
        await this.renderUsers();
    }
}
