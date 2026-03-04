import storage from '../StorageService.js';
import auth from '../AuthService.js';
import clientService from '../ClientService.js';
import loanService from '../LoanService.js';
import DateHelper from '../DateHelper.js';
import billingService from '../BillingService.js';

export default class UsersModule {
    async init() {
        this.currentTab = 'ativo';
        this.searchQuery = '';
        this.isMaster = auth.isMaster();
        this.allUsers = [];
        this.bindEvents();
        window.usersModule = this; // expoem para oninput inline
        await this.renderUsers();
    }

    async renderUsers() {
        const listContainer = document.getElementById('users-list');
        const emptyEl = document.getElementById('users-empty');
        if (!listContainer) return;

        const adminRoles = ['ADMIN', 'MASTER'];
        this.allUsers = await storage.getAll('users');
        const allUsers = this.allUsers;

        // Update stat cards
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        set('stat-users-active', allUsers.filter(u => u.status === 'ativo' && !adminRoles.includes(String(u.role).toUpperCase())).length);
        set('stat-users-blocked', allUsers.filter(u => u.status === 'bloqueado' && !adminRoles.includes(String(u.role).toUpperCase())).length);
        set('stat-users-admin', allUsers.filter(u => adminRoles.includes(String(u.role).toUpperCase()) && u.email !== 'ivanrossi@outlook.com').length);
        set('stat-users-rejected', allUsers.filter(u => u.status === 'rejeitado').length);

        let users;
        if (this.currentTab === 'admin') {
            users = allUsers.filter(u => adminRoles.includes(String(u.role).toUpperCase()));
            users = users.filter(u => u.email !== 'ivanrossi@outlook.com' && String(u.role).toUpperCase() !== 'MASTER');
        } else {
            users = allUsers.filter(u =>
                (u.status === this.currentTab) &&
                !adminRoles.includes(String(u.role).toUpperCase())
            );
        }

        // Apply search
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            users = users.filter(u => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
        }

        if (users.length === 0) {
            listContainer.innerHTML = `<tr><td colspan="6" class="py-2"></td></tr>`;
            if (emptyEl) emptyEl.classList.remove('hidden');
            return;
        }
        if (emptyEl) emptyEl.classList.add('hidden');

        const roleLabel = role => {
            const r = String(role || '').toUpperCase();
            if (r === 'MASTER') return `<span class="bg-violet-100 text-violet-700 text-[9px] font-black px-2 py-0.5 rounded-full">MASTER</span>`;
            if (r === 'ADMIN') return `<span class="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-full">ADMIN</span>`;
            return `<span class="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-full">USUÁRIO</span>`;
        };
        const statusDot = status => {
            if (status === 'ativo') return `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>`;
            if (status === 'bloqueado') return `<span class="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block"></span>`;
            if (status === 'rejeitado') return `<span class="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block"></span>`;
            return `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>`;
        };

        const rows = [];
        for (const user of users) {
            const initials = user.name ? user.name.substring(0, 2).toUpperCase() : 'U';
            const avatarHtml = user.avatar
                ? `<img src="${user.avatar}" alt="${user.name}" class="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0">`
                : `<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-inner shrink-0">${initials}</div>`;

            rows.push(`
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        ${avatarHtml}
                        <div>
                            <div class="flex items-center gap-1.5 mb-0.5">
                                ${statusDot(user.status)}
                                <span class="font-black text-slate-900 text-sm">${user.name || 'Sem nome'}</span>
                            </div>
                            <span class="text-[10px] text-slate-400 sm:hidden">${user.email}</span>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">${user.email}</td>
                <td class="px-6 py-4 hidden md:table-cell">${roleLabel(user.role)}</td>
                <td class="px-6 py-4 text-xs text-slate-500 hidden lg:table-cell">${user.cargo || user.position || '—'}</td>
                <td class="px-6 py-4 text-xs text-slate-400 hidden md:table-cell">${DateHelper.formatLocal(user.createdAt)}</td>
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

    filterBySearch(query) {
        this.searchQuery = (query || '').trim();
        this.renderUsers();
    }

    getActionButtons(user) {
        const isAdmin = user.role === 'admin' || user.role === 'ADMIN' || user.role === 'MASTER';
        if (isAdmin) {
            if (user.role === 'MASTER') return '';

            let masterActions = '';
            if (this.isMaster) {
                masterActions = `
                    <button onclick="deleteUserPermanently(${user.id})" class="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-all" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                `;
            }

            return `
                <div class="flex items-center gap-1">
                    ${this.isMaster ? `<button onclick="loginAsUser(${user.id})" class="text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all mr-2 flex items-center gap-1"><i data-lucide="log-in" class="w-3 h-3"></i> Acessar Painel</button>` : ''}
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
                <button onclick="resetUserPassword(${user.id})" class="text-slate-500 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all mr-2" title="Redefinir Senha"><i data-lucide="key" class="w-3 h-3"></i></button>
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

        // Tab binding
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

        window.promoteUser = async (id) => this.promoteUser(id);

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
            if (confirm('Deseja acessar o painel deste usuário? Você será redirecionado para a visão dele.')) {
                try {
                    await auth.impersonate(id);
                } catch (error) {
                    alert('Erro ao acessar conta: ' + error.message);
                }
            }
        };

        window.resetUserPassword = async (id) => {
            const user = await storage.getById('users', id);
            if (!user) return;

            if (confirm(`Deseja gerar uma nova senha aleatória para ${user.name}?`)) {
                try {
                    const newPass = Math.random().toString(36).slice(-8);
                    user.password = newPass;
                    await storage.put('users', user);
                    alert(`Senha redefinida com sucesso!\n\nNova senha: ${newPass}\n\nEnvie esta senha para o cliente.`);
                } catch (error) {
                    alert("Erro ao redefinir senha: " + error.message);
                }
            }
        };
    }

    async promoteUser(id) {
        if (confirm('Este usuário passará a ter acesso ao Painel Administrativo. Confirmar?')) {
            const user = await storage.getById('users', id);
            user.role = 'admin';
            user.accessEnabled = false; // Começa bloqueado até o master liberar
            await storage.put('users', user);
            this.renderUsers();
            alert('Candidato promovido! Agora o Master deve liberar o acesso em "Controle de Acessos".');
        }
    }
}
