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

        this.bindEvents();
        this.renderUsers();
    }

    async renderUsers() {
        const listContainer = document.getElementById('users-list');
        if (!listContainer) return;

        const allUsers = await storage.getAll('users');
        let users;

        const adminRoles = ['ADMIN', 'MASTER'];
        const isLoggedMaster = auth.isMaster();

        if (this.currentTab === 'admin') {
            users = allUsers.filter(u => adminRoles.includes(String(u.role).toUpperCase()));
            if (!isLoggedMaster) {
                // Filtro já aplicado pelo StorageService (company_id), 
                // apenas removemos o próprio master daqui para admins comuns se houver
                users = users.filter(u => String(u.role).toUpperCase() !== 'MASTER');
            }
        } else {
            // Filtro por status e garantindo que não pegue admins nas outras abas
            users = allUsers.filter(u =>
                (u.status === this.currentTab) &&
                !adminRoles.includes(String(u.role).toUpperCase())
            );
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

            let billingCols = ``;

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
            if (confirm('Você será levado ao painel deste cliente para visualizar seus dados. Deseja continuar?')) {
                try {
                    await auth.impersonate(id);
                } catch (error) {
                    alert('Erro ao acessar conta: ' + error.message);
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
