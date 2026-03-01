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
            tr.className = 'hover:bg-slate-50/50 transition-all cursor-pointer group';
            tr.onclick = () => this.openUserDetail(user);

            tr.innerHTML = `
                <td class="px-8 py-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
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
                    ? `<span class="text-rose-500 font-bold flex items-center gap-1"><i data-lucide="x-circle" class="w-3 h-3"></i> ${overdue.length} Vencida(s)</span>`
                    : `<span class="text-emerald-500 font-bold flex items-center gap-1"><i data-lucide="check-circle-2" class="w-3 h-3"></i> Em Dia</span>`
                }
                    </div>
                </td>
                <td class="px-8 py-5 text-sm text-slate-500 font-medium">
                    ${user.firstAccessAt ? `Ativo desde ${DateHelper.formatLocal(user.firstAccessAt)}` : 'Aguardando 1º acesso'}
                </td>
                <td class="px-8 py-5">
                    <div class="flex items-center gap-2">
                        <button class="p-2 bg-slate-100 text-slate-400 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                            <i data-lucide="chevron-right" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        }
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
            btnEnabled.className = btnEnabled.className.replace('bg-primary', 'bg-rose-500');
            statusText.textContent = 'LIBERADO';
            statusText.className = 'text-sm font-black text-emerald-600';
        } else {
            btnEnabled.textContent = 'LIBERAR ACESSO';
            btnEnabled.className = btnEnabled.className.replace('bg-rose-500', 'bg-primary');
            statusText.textContent = 'BLOQUEADO';
            statusText.className = 'text-sm font-black text-rose-600';
        }

        if (user.accessOverride) {
            btnOverride.textContent = 'DESATIVAR OVERRIDE';
            btnOverride.className = btnOverride.className.replace('bg-slate-300 text-slate-600', 'bg-amber-400 text-amber-900');
        } else {
            btnOverride.textContent = 'ATIVAR OVERRIDE';
            btnOverride.className = btnOverride.className.replace('bg-amber-400 text-amber-900', 'bg-slate-300 text-slate-600');
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

        // Bind toggle buttons
        tbody.querySelectorAll('.toggle-pay-btn').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                const inst = installments.find(i => String(i.id) === String(id));
                if (inst.status === 'PAGA') {
                    await billingService.undoPayment(id);
                } else {
                    await billingService.markAsPaid(id);
                }
                await this.renderInstallments();
                await this.loadData(); // Update table and stats
            };
        });
    }

    async toggleAccessEnabled() {
        this.currentUser.accessEnabled = !this.currentUser.accessEnabled;

        // Se estiver habilitando pela primeira vez, marca first_access_at
        if (this.currentUser.accessEnabled && !this.currentUser.firstAccessAt) {
            this.currentUser.firstAccessAt = new Date().toISOString();
            // Gera logo as parcelas
            await billingService.generateMissingInstallments(this.currentUser);
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
            // Este filtro requer check assíncrono, vamos tratar na renderização ou pre-processar
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

    bindEvents() {
        document.getElementById('refresh-users').onclick = () => this.loadData();

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

        document.getElementById('close-modal').onclick = () => {
            document.getElementById('user-detail-modal').classList.add('hidden');
        };

        document.getElementById('toggle-access-enabled').onclick = () => this.toggleAccessEnabled();
        document.getElementById('toggle-access-override').onclick = () => this.toggleAccessOverride();

        document.getElementById('generate-installments').onclick = async () => {
            await billingService.generateMissingInstallments(this.currentUser);
            await this.renderInstallments();
            await this.loadData();
        };
    }
}

export default MasterBilling;
