import storage from '../StorageService.js';
import auth from '../AuthService.js';
import companyService from '../CompanyService.js';
import DateHelper from '../DateHelper.js';

class MasterUsers {
    constructor() {
        this.userList = document.getElementById('master-user-list');
        this.companyFilter = document.getElementById('master-user-company-filter');
        this.roleFilter = document.getElementById('master-user-role-filter');
        this.searchField = document.getElementById('master-user-search');

        this.kpiTotal = document.getElementById('kpi-total-users');
        this.kpiAdmins = document.getElementById('kpi-total-admins');
        this.kpiActive = document.getElementById('kpi-total-active');
        this.kpiBlocked = document.getElementById('kpi-total-blocked');

        this.users = [];
        this.companies = [];
    }

    async init() {
        if (!this.userList) return;

        await this.loadInitialData();
        this.bindEvents();

        // Globals for row actions
        window.refreshUsers = () => this.loadUsers();
        window.masterToggleUserStatus = (id) => this.toggleStatus(id);
        window.masterToggleAdminAccess = (id) => this.toggleAdminAccess(id);
        window.masterChangeRole = (id) => this.changeRole(id);
        window.masterImpersonate = (id) => this.impersonateUser(id);
        window.masterDeleteUser = (id) => this.deleteUser(id);
    }

    async loadInitialData() {
        try {
            this.companies = await companyService.getAll();
            this.populateCompanyFilter();
            await this.loadUsers();
        } catch (error) {
            console.error("Master Users: Error loading initial data", error);
        }
    }

    populateCompanyFilter() {
        if (!this.companyFilter) return;
        const options = this.companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        this.companyFilter.innerHTML = `<option value="all">Todas as Empresas</option>${options}`;
    }

    async loadUsers() {
        try {
            // Master can see all users (StorageService should handle master email override)
            this.users = await storage.getAdvanced('users', {
                order: { column: 'createdAt', ascending: false }
            });
            this.applyFilters();
        } catch (error) {
            console.error("Master Users: Error loading users", error);
            this.userList.innerHTML = `<tr><td colspan="5" class="px-8 py-10 text-center text-rose-500 font-bold">Erro ao carregar banco de usuários.</td></tr>`;
        }
    }

    bindEvents() {
        const filters = [this.companyFilter, this.roleFilter, this.searchField];
        filters.forEach(f => {
            if (f) f.addEventListener('input', () => this.applyFilters());
        });
    }

    applyFilters() {
        const companyId = this.companyFilter.value;
        const role = this.roleFilter.value;
        const search = this.searchField.value.toLowerCase().trim();

        let filtered = [...this.users];

        if (companyId !== 'all') {
            const idInt = parseInt(companyId);
            filtered = filtered.filter(u => (u.company_id || u.companyId) === idInt);
        }

        if (role !== 'all') {
            filtered = filtered.filter(u => String(u.role).toUpperCase() === role.toUpperCase());
        }

        if (search) {
            filtered = filtered.filter(u =>
                (u.name && u.name.toLowerCase().includes(search)) ||
                (u.email && u.email.toLowerCase().includes(search))
            );
        }

        this.updateKPIs(this.users); // KPIs reflect total context or filtered? Usually total context of what master sees
        this.renderList(filtered);
    }

    updateKPIs(data) {
        if (!this.kpiTotal) return;

        const total = data.length;
        const admins = data.filter(u => ['ADMIN', 'MASTER'].includes(String(u.role).toUpperCase())).length;
        const active = data.filter(u => u.status === 'ativo').length;
        const blocked = data.filter(u => u.status === 'bloqueado').length;

        this.kpiTotal.textContent = total;
        this.kpiAdmins.textContent = admins;
        this.kpiActive.textContent = active;
        this.kpiBlocked.textContent = blocked;
    }

    renderList(data) {
        if (data.length === 0) {
            this.userList.innerHTML = `<tr><td colspan="5" class="px-8 py-20 text-center text-slate-400">Nenhum usuário encontrado.</td></tr>`;
            return;
        }

        this.userList.innerHTML = data.map(user => {
            const company = this.companies.find(c => c.id === (user.company_id || user.companyId)) || { name: 'Sistema' };
            const isAdmin = ['ADMIN', 'MASTER'].includes(String(user.role).toUpperCase());
            const roleLabel = isAdmin ? (user.role === 'MASTER' ? 'Master' : 'Admin') : 'Cliente';
            const roleClass = user.role === 'MASTER' ? 'bg-indigo-100 text-indigo-700' : (isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700');

            const statusClass = user.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
            const initials = user.name ? user.name.substring(0, 2).toUpperCase() : 'U';

            // Feature: Access Toggle for Admins
            const accessToggleHtml = (user.role === 'ADMIN' || user.role === 'admin') ? `
                <button onclick="masterToggleAdminAccess(${user.id})" class="p-3 rounded-2xl transition-all ${user.accessEnabled ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-100'}" title="${user.accessEnabled ? 'Bloquear Acesso Admin' : 'Habilitar Acesso Admin'}">
                    <i data-lucide="${user.accessEnabled ? 'lock-open' : 'lock'}" class="w-4 h-4"></i>
                </button>
            ` : '';

            return `
                <tr class="hover:bg-slate-50 transition-colors group">
                    <td class="px-8 py-5">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-400 text-sm shadow-inner group-hover:scale-110 transition-transform">
                                ${initials}
                            </div>
                            <div>
                                <div class="font-black text-slate-800 tracking-tight">${user.name}</div>
                                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">${user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-8 py-5 text-sm font-bold text-slate-600">
                        ${company.name}
                    </td>
                    <td class="px-8 py-5 text-center">
                        <span class="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${roleClass}">
                            ${roleLabel}
                        </span>
                    </td>
                    <td class="px-8 py-5 text-center">
                        <span class="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusClass}">
                            ${user.status}
                        </span>
                    </td>
                    <td class="px-8 py-5 text-right">
                        <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            ${accessToggleHtml}
                            
                            <button onclick="masterChangeRole(${user.id})" class="text-blue-600 hover:bg-blue-50 p-3 rounded-2xl transition-all" title="${isAdmin ? 'Tirar Admin' : 'Dar Admin'}">
                                <i data-lucide="${isAdmin ? 'user-minus' : 'shield-plus'}" class="w-4 h-4"></i>
                            </button>

                            <button onclick="masterImpersonate(${user.id})" class="text-indigo-600 hover:bg-indigo-50 p-3 rounded-2xl transition-all" title="Ver Painel">
                                <i data-lucide="eye" class="w-4 h-4"></i>
                            </button>

                            <button onclick="masterToggleUserStatus(${user.id})" class="text-amber-500 hover:bg-amber-50 p-3 rounded-2xl transition-all" title="${user.status === 'ativo' ? 'Bloquear Login' : 'Reativar Login'}">
                                <i data-lucide="${user.status === 'ativo' ? 'user-minus' : 'user-check'}" class="w-4 h-4"></i>
                            </button>

                            ${user.role !== 'MASTER' ? `
                                <button onclick="masterDeleteUser(${user.id})" class="text-rose-500 hover:bg-rose-50 p-3 rounded-2xl transition-all" title="Excluir Permanentemente">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        lucide.createIcons();
    }

    async toggleStatus(id) {
        const user = this.users.find(u => u.id === id);
        if (!user) return;

        const newStatus = user.status === 'ativo' ? 'bloqueado' : 'ativo';
        if (confirm(`Deseja alterar o status de ${user.name} para ${newStatus}?`)) {
            try {
                user.status = newStatus;
                await storage.put('users', user);
                await this.loadUsers();
            } catch (error) {
                alert("Erro ao atualizar status: " + error.message);
            }
        }
    }

    async changeRole(id) {
        const user = this.users.find(u => u.id === id);
        if (!user || user.role === 'MASTER') return;

        const isAdmin = ['ADMIN', 'admin'].includes(String(user.role).toLowerCase());
        const newRole = isAdmin ? 'user' : 'admin';
        const msg = isAdmin
            ? `Deseja remover as permissões administrativas de ${user.name}?`
            : `Deseja promover ${user.name} a Administrador?`;

        if (confirm(msg)) {
            try {
                user.role = newRole;
                // Se estiver promovendo, desabilita acesso admin até master liberar no cadeado (segurança adicional)
                if (newRole === 'admin') user.accessEnabled = false;

                await storage.put('users', user);
                await this.loadUsers();
                alert(`Usuário atualizado com sucesso para ${newRole === 'admin' ? 'Administrador' : 'Cliente'}.`);
            } catch (error) {
                alert("Erro ao atualizar cargo: " + error.message);
            }
        }
    }

    async toggleAdminAccess(id) {
        const user = this.users.find(u => u.id === id);
        if (!user) return;

        const newState = !user.accessEnabled;
        const msg = newState ? `Habilitar acesso do administrador ${user.name}?` : `Bloquear acesso do administrador ${user.name}?`;

        if (confirm(msg)) {
            try {
                user.accessEnabled = newState;
                await storage.put('users', user);
                await this.loadUsers();
            } catch (error) {
                alert("Erro ao atualizar acesso: " + error.message);
            }
        }
    }

    async impersonateUser(id) {
        const user = this.users.find(u => u.id === id);
        if (!user) return;

        if (confirm(`Acessar o sistema como "${user.name}"?`)) {
            try {
                await auth.impersonate(id);
            } catch (error) {
                alert("Erro ao assumir conta: " + error.message);
            }
        }
    }

    async deleteUser(id) {
        const user = this.users.find(u => u.id === id);
        if (!user) return;

        if (confirm(`ATENÇÃO: Excluir "${user.name}" removerá permanentemente seu acesso e todos os dados vinculados (clientes, empréstimos, faturas se for admin).\n\nDESEJA CONTINUAR?`)) {
            try {
                // Simplified delete - rely on DB Cascade or clean up profile
                const { data: clients } = await storage.supabase.from('clients').select('id').eq('user_id', id);
                if (clients && clients.length > 0) {
                    await storage.delete('clients', clients[0].id);
                }

                await storage.delete('users', id);
                await this.loadUsers();
                alert("Usuário excluído com sucesso.");
            } catch (error) {
                alert("Erro ao excluir usuário: " + error.message);
            }
        }
    }
}

export default MasterUsers;
