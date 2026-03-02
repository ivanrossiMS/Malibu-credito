import storage from '../StorageService.js';
import billingService from '../BillingService.js';
import DateHelper from '../DateHelper.js';

class MasterBilling {
    constructor() {
        this.users = [];
        this.filteredUsers = [];
        this.currentUser = null;
        this.currentFilter = 'all';
    }

    async init() {
        console.log("Master Billing Module Initialized");
        await this.loadData();
        this.bindEvents();
    }

    async loadData() {
        // Obter todos os usuários com papel ADMIN
        const allUsers = await storage.getAll('users');
        this.users = allUsers.filter(u => u.role === 'admin' || u.role === 'ADMIN');

        // Para cada admin, garantir que as parcelas existam se ele já tiver acessado
        for (const user of this.users) {
            if (user.firstAccessAt) {
                await billingService.generateMissingInstallments(user);
            }
        }

        this.applyFilter(this.currentFilter);
        await this.renderStats();
    }

    async renderStats() {
        const total = this.users.length;
        const active = this.users.filter(u => u.accessEnabled).length;
        const pending = this.users.filter(u => !u.accessEnabled).length;

        let overdueCount = 0;
        for (const u of this.users) {
            if (await billingService.hasOverdueInstallment(u.id)) {
                overdueCount++;
            }
        }

        document.getElementById('stat-total-admins').textContent = total;
        document.getElementById('stat-active-admins').textContent = active;
        document.getElementById('stat-pending-admins').textContent = pending;
        document.getElementById('stat-overdue-admins').textContent = overdueCount;
    }

    async renderTable() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (this.filteredUsers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-8 py-10 text-center text-slate-400 font-medium">Nenhum administrador encontrado.</td></tr>`;
            return;
        }

        for (const user of this.filteredUsers) {
            const installments = await billingService.getUserInstallments(user.id);
            const overdue = installments.filter(i => i.status === 'VENCIDA');
            const hasOverdue = overdue.length > 0;

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50/50 transition-all group';

            tr.innerHTML = `
                <td class="px-8 py-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                            ${user.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div>
                            <p class="font-bold text-slate-700">${user.name}</p>
                            <p class="text-xs text-slate-400 font-medium">${user.email}</p>
                        </div>
                    </div>
                </td>
                <td class="px-8 py-5">
                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.accessEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}">
                        ${user.accessEnabled ? 'Liberado' : 'Pendente'}
                        ${user.accessOverride ? '<span class="ml-1 text-[8px] opacity-70">(Override)</span>' : ''}
                    </span>
                </td>
                <td class="px-8 py-5 text-sm">
                    <div class="flex flex-col gap-1">
                        ${hasOverdue
                    ? `<span class="text-rose-500 font-bold flex items-center gap-1"><i data-lucide="x-circle" class="w-3 h-3 text-rose-500"></i> ${overdue.length} Vencida(s)</span>`
                    : `<span class="text-emerald-500 font-bold flex items-center gap-1"><i data-lucide="check-circle-2" class="w-3 h-3 text-emerald-500"></i> Em Dia</span>`
                }
                    </div>
                </td>
                <td class="px-8 py-5 text-sm text-slate-500 font-medium">
                    ${user.firstAccessAt ? `Ativo desde ${DateHelper.formatLocal(user.firstAccessAt)}` : 'Aguardando 1º acesso'}
                </td>
                <td class="px-8 py-5 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button class="edit-admin-btn p-2 bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all" data-id="${user.id}" title="Editar">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button class="access-control-btn px-4 py-2 bg-indigo-600 text-white font-black rounded-xl text-[10px] uppercase shadow-lg shadow-indigo-100 hover:scale-105 transition-all" data-id="${user.id}">
                            Acesso
                        </button>
                        <button class="delete-admin-btn p-2 bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all" data-id="${user.id}" title="Excluir">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        }

        // Bind actions
        tbody.querySelectorAll('.edit-admin-btn').forEach(btn => {
            btn.onclick = async () => {
                const user = this.users.find(u => String(u.id) === String(btn.dataset.id));
                this.openEditModal(user);
            };
        });

        tbody.querySelectorAll('.access-control-btn').forEach(btn => {
            btn.onclick = async () => {
                const user = this.users.find(u => String(u.id) === String(btn.dataset.id));
                this.openUserDetail(user);
            };
        });

        tbody.querySelectorAll('.delete-admin-btn').forEach(btn => {
            btn.onclick = async () => this.deleteUserPermanently(btn.dataset.id);
        });

        lucide.createIcons();
    }

    async deleteUserPermanently(id) {
        const confirmMsg = "ATENÇÃO: Isso excluirá PERMANENTEMENTE o administrador e todos seus dados de cobrança.\n\nEsta ação não pode ser desfeita. Deseja continuar?";
        if (confirm(confirmMsg)) {
            try {
                // Cascata: Deletar parcelas
                const installments = await billingService.getUserInstallments(id);
                for (let inst of installments) {
                    await storage.delete('billing_installments', inst.id);
                }
                // Deletar usuário
                await storage.delete('users', id);
                alert("Administrador removido com sucesso.");
                await this.loadData();
            } catch (error) {
                console.error("Erro ao deletar admin:", error);
                alert("Erro ao excluir: " + error.message);
            }
        }
    }

    async openUserDetail(user) {
        this.currentUser = user;
        const modal = document.getElementById('user-detail-modal');

        document.getElementById('modal-user-name').textContent = user.name;
        document.getElementById('modal-user-email').textContent = user.email;
        document.getElementById('modal-user-initials').textContent = (user.name?.[0] || 'A').toUpperCase();

        this.updateAccessButtons();
        await this.renderInstallments();

        // Limpar form de geração
        document.getElementById('batch-gen-form-container').classList.add('hidden');
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('gen-first-due').value = today;

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
                <td class="px-6 py-4 text-right">
                    <button class="toggle-pay-btn text-indigo-600 hover:text-indigo-800 font-black text-xs uppercase tracking-wider" data-id="${inst.id}">
                        ${isPaid ? 'Desfazer' : 'Dar Baixa'}
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

                // Refresh modal and user state for auto-block/unblock
                this.currentUser = await storage.getById('users', this.currentUser.id);
                this.updateAccessButtons();
                await this.renderInstallments();
                await this.loadData();
            };
        });
    }

    async openEditModal(user) {
        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('edit-user-name').value = user.name;
        document.getElementById('edit-user-email').value = user.email;
        document.getElementById('edit-user-modal').classList.remove('hidden');
    }

    bindEvents() {
        document.getElementById('refresh-users').onclick = () => this.loadData();
        document.getElementById('close-modal').onclick = () => document.getElementById('user-detail-modal').classList.add('hidden');
        document.getElementById('toggle-access-enabled').onclick = () => this.toggleAccessEnabled();
        document.getElementById('toggle-access-override').onclick = () => this.toggleAccessOverride();

        // Batch Gen
        const genFormContainer = document.getElementById('batch-gen-form-container');
        document.getElementById('btn-show-gen-form').onclick = () => genFormContainer.classList.toggle('hidden');
        document.getElementById('btn-cancel-gen').onclick = () => genFormContainer.classList.add('hidden');

        document.getElementById('btn-confirm-gen').onclick = async () => {
            const count = parseInt(document.getElementById('gen-count').value);
            const amount = parseFloat(document.getElementById('gen-amount').value);
            const firstDue = document.getElementById('gen-first-due').value;

            if (!count || count <= 0) return alert("Quantidade inválida.");
            if (!amount || amount <= 0) return alert("Valor inválido.");
            if (!firstDue) return alert("Data de vencimento obrigatória.");

            try {
                const btn = document.getElementById('btn-confirm-gen');
                btn.disabled = true;
                btn.textContent = "GERANDO...";

                await billingService.generateMonthlyInstallments(this.currentUser, count, amount, firstDue);

                await this.renderInstallments();
                await this.loadData();

                genFormContainer.classList.add('hidden');
                alert(`${count} parcelas geradas com sucesso!`);
            } catch (error) {
                console.error("Erro ao gerar:", error);
                alert("Erro: " + error.message);
            } finally {
                const btn = document.getElementById('btn-confirm-gen');
                btn.disabled = false;
                btn.textContent = "GERAR PARCELAS";
            }
        };

        // Edit Form
        document.getElementById('close-edit-modal').onclick = () => document.getElementById('edit-user-modal').classList.add('hidden');
        document.getElementById('edit-user-form').onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-user-id').value;
            const user = await storage.getById('users', id);

            user.name = document.getElementById('edit-user-name').value;
            user.email = document.getElementById('edit-user-email').value;

            await storage.put('users', user);
            document.getElementById('edit-user-modal').classList.add('hidden');
            await this.loadData();
            alert('Dados atualizados!');
        };

        // Filters & Search
        document.getElementById('user-search').oninput = (e) => {
            const val = e.target.value.toLowerCase();
            this.filteredUsers = this.users.filter(u =>
                u.name?.toLowerCase().includes(val) || u.email?.toLowerCase().includes(val)
            );
            this.renderTable();
        };

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.onclick = () => this.applyFilter(btn.dataset.filter);
        });
    }

    async toggleAccessEnabled() {
        this.currentUser.accessEnabled = !this.currentUser.accessEnabled;
        if (this.currentUser.accessEnabled && !this.currentUser.firstAccessAt) {
            this.currentUser.firstAccessAt = new Date().toISOString();
        }
        await storage.put('users', this.currentUser);
        this.updateAccessButtons();
        await this.loadData();
    }

    async toggleAccessOverride() {
        this.currentUser.accessOverride = !this.currentUser.accessOverride;
        await storage.put('users', this.currentUser);
        this.updateAccessButtons();
        await this.loadData();
    }

    applyFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.dataset.filter === filter) btn.classList.add('active', 'bg-slate-100');
            else btn.classList.remove('active', 'bg-slate-100');
        });

        if (filter === 'all') {
            this.filteredUsers = this.users;
        } else if (filter === 'pending') {
            this.filteredUsers = this.users.filter(u => !u.accessEnabled);
        } else if (filter === 'overdue') {
            this.syncAndFilter('overdue');
            return;
        } else if (filter === 'paid') {
            this.syncAndFilter('paid');
            return;
        }

        this.renderTable();
    }

    async syncAndFilter(type) {
        const results = [];
        for (const u of this.users) {
            const hasOverdue = await billingService.hasOverdueInstallment(u.id);
            if (type === 'overdue' && hasOverdue) results.push(u);
            if (type === 'paid' && !hasOverdue) results.push(u);
        }
        this.filteredUsers = results;
        this.renderTable();
    }
}

export default MasterBilling;
