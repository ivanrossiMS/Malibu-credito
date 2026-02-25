import storage from '../StorageService.js';
import auth from '../AuthService.js';

export default class UsersModule {
    async init() {
        this.currentTab = 'pendente';
        this.renderUsers();
        this.bindEvents();
    }

    async renderUsers() {
        const listContainer = document.getElementById('users-list');
        if (!listContainer) return;

        const allUsers = await storage.getAll('users');

        let users;
        if (this.currentTab === 'admin') {
            users = allUsers.filter(u => u.role === 'admin');
        } else {
            users = allUsers.filter(u => u.status === this.currentTab && u.role !== 'admin');
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

        listContainer.innerHTML = users.map(user => {
            const initials = user.name ? user.name.substring(0, 2).toUpperCase() : 'U';
            const avatarHtml = user.avatar
                ? `<img src="${user.avatar}" alt="${user.name}" class="w-10 h-10 rounded-xl object-cover shadow-sm">`
                : `<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-inner">${initials}</div>`;

            return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                        ${avatarHtml}
                        <span class="font-bold text-slate-900">${user.name}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">${user.email}</td>
                <td class="px-6 py-4 text-sm text-slate-500">${new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2">
                        ${this.getActionButtons(user)}
                    </div>
                </td>
            </tr>
            `;
        }).join('');

        lucide.createIcons();
    }

    getActionButtons(user) {
        if (user.role === 'admin') {
            return `
                <button onclick="demoteUser(${user.id})" class="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">Remover Admin</button>
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
                <button onclick="updateUserStatus(${user.id}, 'bloqueado')" class="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">Bloquear</button>
            `;
        } else {
            return `
                <button onclick="updateUserStatus(${user.id}, 'ativo')" class="text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">Reativar</button>
            `;
        }
    }

    bindEvents() {
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
    }
}
