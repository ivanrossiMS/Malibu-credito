import storage from '../StorageService.js';
import auth from '../AuthService.js';
import clientService from '../ClientService.js';
import loanService from '../LoanService.js';
import installmentService from '../InstallmentService.js';
import notificationService from '../NotificationService.js';
import paymentService from '../PaymentService.js';
import DateHelper from '../DateHelper.js';

export default class ClientDashboardModule {
    async init() {
        if (!auth.isAuthenticated()) return;

        this.client = await clientService.getByUserId(auth.currentUser.id);
        if (!this.client) {
            // Fallback for extreme cases (email search)
            this.client = await this.getCurrentClient();
        }

        if (!this.client) {
            console.error("Client record not found for user.");
            return;
        }

        this.currentFilter = 'todas';
        this.currentPage = 1;
        this.itemsPerPage = 15;

        // Global Handlers
        window.sendReceiptToWhatsApp = (id) => this.sendReceiptToWhatsApp(id);

        await this.renderDashboard();
        this.bindGlobalEvents();
    }

    async getCurrentClient() {
        const clients = await storage.getAll('clients');
        return clients.find(c => c.userId === auth.currentUser.id) ||
            clients.find(c => c.email === auth.currentUser.email);
    }

    async renderDashboard() {
        const allLoans = await loanService.getAll();
        const loans = allLoans.filter(l => String(l.clientId || l.clientid) === String(this.client.id));

        const allInstallments = await installmentService.getAll();
        const installments = allInstallments.filter(i => i.loan && String(i.loan.clientId || i.loan.clientid) === String(this.client.id));

        // Also fetch payments to cross-reference proofs
        const allPayments = await paymentService.getAll();
        this.clientPayments = allPayments.filter(p => {
            const pClientId = p.clientId || p.clientid || (p.client && p.client.id) || (p.loan && (p.loan.clientId || p.loan.clientid));
            return String(pClientId) === String(this.client.id);
        });

        // Calculate Totals
        const totalLoaned = loans.reduce((sum, l) => sum + (parseFloat(l.installmentValue || l.installment_value || l.amount || 0) * parseInt(l.numInstallments || l.installments || 0)), 0);
        const totalPaid = installments.filter(i => i.status === 'paga').reduce((sum, i) => sum + parseFloat(i.installmentValue || i.installment_amount || i.amount || 0), 0);
        const balanceDue = installments.filter(i => i.status !== 'paga').reduce((sum, i) => sum + parseFloat(i.installmentValue || i.installment_amount || i.amount || 0), 0);

        // Update UI Cards
        if (document.getElementById('total-loaned')) document.getElementById('total-loaned').textContent = this.formatCurrency(totalLoaned);
        if (document.getElementById('total-paid')) document.getElementById('total-paid').textContent = this.formatCurrency(totalPaid);
        if (document.getElementById('balance-due')) document.getElementById('balance-due').textContent = this.formatCurrency(balanceDue);

        // Render Notifications
        await this.renderNotifications();

        // Render Financial Insight
        this.renderFinancialInsight(installments);

        // Store installments globally for pagination/filters
        this.installments = installments;

        // Render Installments List
        this.renderInstallmentsTable();

        // Check if onboarding is needed (Disabled by Admin request)
        // if (!this.client.cpf_cnpj || this.client.cpf_cnpj === 'null' || this.client.cpf_cnpj === '') {
        //     this.showOnboarding();
        // }

        lucide.createIcons();
    }

    setupRealtime() {
        // Subscribe to changes to refresh dashboard automatically
        this.realtimeChannel = installmentService.subscribe(this.client.id, async (payload) => {
            console.log("Dashboard Realtime Sync:", payload);
            await this.loadData();
            this.renderStats();
            this.renderInstallments();
        });
    }

    async renderInstallments() {
        // This method is called by setupRealtime, it should re-render the installments table
        // For now, we can just call renderDashboard to refresh everything.
        // In a more optimized scenario, we would only re-render the specific components affected.
        await this.renderDashboard();
    }

    async loadData() {
        // This method is called by setupRealtime, it should reload all necessary data
        const allLoans = await loanService.getAll();
        this.loans = allLoans.filter(l => String(l.clientId || l.clientid) === String(this.client.id));

        const allInstallments = await installmentService.getAll();
        this.installments = allInstallments.filter(i => i.loan && String(i.loan.clientId || i.loan.clientid) === String(this.client.id));

        const allPayments = await paymentService.getAll();
        this.clientPayments = allPayments.filter(p => {
            const pClientId = p.clientId || p.clientid || (p.client && p.client.id) || (p.loan && (p.loan.clientId || p.loan.clientid));
            return String(pClientId) === String(this.client.id);
        });
    }

    renderStats() {
        // Recalculate and update UI Cards
        const totalLoaned = this.loans.reduce((sum, l) => sum + (parseFloat(l.installmentValue || l.installment_value || l.amount || 0) * parseInt(l.numInstallments || l.installments || 0)), 0);
        const totalPaid = this.installments.filter(i => i.status === 'paga').reduce((sum, i) => sum + parseFloat(i.installmentValue || i.installment_amount || i.amount || 0), 0);
        const balanceDue = this.installments.filter(i => i.status !== 'paga').reduce((sum, i) => sum + parseFloat(i.installmentValue || i.installment_amount || i.amount || 0), 0);

        if (document.getElementById('total-loaned')) document.getElementById('total-loaned').textContent = this.formatCurrency(totalLoaned);
        if (document.getElementById('total-paid')) document.getElementById('total-paid').textContent = this.formatCurrency(totalPaid);
        if (document.getElementById('balance-due')) document.getElementById('balance-due').textContent = this.formatCurrency(balanceDue);
    }

    renderInstallmentsTable() {
        const listBody = document.getElementById('client-installments');
        if (!listBody) return;

        let filtered = this.installments || [];

        const todayStr = DateHelper.getTodayStr();

        filtered = filtered.filter(inst => {
            const isPaga = inst.status === 'paga' || inst.status === 'pago';
            const isLate = !isPaga && DateHelper.isPast(inst.dueDate);

            if (this.currentFilter === 'todas') return true;
            if (this.currentFilter === 'paga') return isPaga;
            if (this.currentFilter === 'vencida') return isLate;
            if (this.currentFilter === 'pendente') return !isPaga && !isLate;
            return true;
        });

        // Ordenação inteligente baseada no filtro
        filtered.sort((a, b) => {
            const dateA = DateHelper.toLocalYYYYMMDD(a.dueDate);
            const dateB = DateHelper.toLocalYYYYMMDD(b.dueDate);
            if (this.currentFilter === 'paga') return (dateB < dateA ? -1 : 1);
            return (dateA < dateB ? -1 : 1);
        });

        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const startIdx = (this.currentPage - 1) * this.itemsPerPage;
        const pageItems = filtered.slice(startIdx, startIdx + this.itemsPerPage);

        // UI Controls Update
        const pageInfo = document.getElementById('installments-page-info');
        if (pageInfo) pageInfo.textContent = `Página ${this.currentPage} de ${totalPages}`;

        const prevBtn = document.getElementById('installments-prev');
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;

        const nextBtn = document.getElementById('installments-next');
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages || totalItems === 0;

        if (pageItems.length === 0) {
            listBody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Nenhuma parcela encontrada nesta categoria.</td></tr>`;
        } else {
            listBody.innerHTML = pageItems.map(inst => {
                return `
                    <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td class="px-8 py-5 text-sm font-black text-slate-900 border-l-2 border-transparent group-hover:border-primary">${inst.loan ? inst.loan.loanCode : '---'}</td>
                        <td class="px-8 py-5 text-sm font-medium text-slate-700 text-center">#${inst.number}</td>
                        <td class="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">${this.formatDate(inst.dueDate)}</td>
                        <td class="px-8 py-5 text-sm font-black text-emerald-600">${this.formatCurrency(inst.installmentValue || inst.amount)}</td>
                        <td class="px-8 py-5">
                        <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${this.getStatusClass(inst.status)}">
                            ${this.translateStatus(inst.status)}
                        </span>
                    </td>
                    <td class="px-8 py-5 text-right">
                        ${inst.status === 'PAID' ? `
                            <button onclick="window.sendReceiptToWhatsApp(${inst.id})" class="p-2.5 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all group" title="Enviar comprovante">
                                <i data-lucide="share-2" class="w-4 h-4"></i>
                            </button>
                        ` : `
                            <button onclick="window.location.href='?page=client_payments'" class="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                Pagar
                            </button>
                        `}
                    </td>
                </tr>
            `;
            }).join('');

            // Bind upload proof events (removed as per instruction)
            // Bind view proof events (removed as per instruction)
        }
    }

    async renderNotifications() {
        const list = document.getElementById('notifications-list');
        const badge = document.getElementById('notification-badge');
        if (!list) return;

        const notifications = (await notificationService.getAllForClient(this.client.id))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const unreadCount = notifications.filter(n => !n.read).length;

        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        if (notifications.length === 0) {
            list.innerHTML = '<div class="p-8 text-center text-slate-400 text-xs">Sem notificações no momento.</div>';
            return;
        }

        list.innerHTML = notifications.map(n => `
            <div class="p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-indigo-50/30' : ''}" onclick="this.dataset.id='${n.id}'; markNotifyRead(this)">
                <div class="flex gap-3">
                    <div class="bg-primary/10 p-2 rounded-lg shrink-0">
                        <i data-lucide="${n.icon || 'bell'}" class="w-4 h-4 text-primary"></i>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-900">${n.title}</p>
                        <p class="text-[10px] text-slate-500 leading-tight mt-0.5">${n.message}</p>
                        <p class="text-[9px] text-slate-400 mt-2 font-medium">${this.formatDateTime(n.createdAt)}</p>
                    </div>
                </div>
            </div>
        `).join('');

        window.markNotifyRead = async (el) => {
            const id = parseInt(el.dataset.id);
            await notificationService.markAsRead(id);
            await this.renderNotifications();
        };

        lucide.createIcons();
    }

    renderFinancialInsight(installments) {
        const titleEl = document.getElementById('insight-title');
        const msgEl = document.getElementById('insight-message');
        if (!titleEl) return;

        // --- 1. LOCAL DATE NORMALIZATION ---
        const todayStr = DateHelper.getTodayStr();
        const localNowMidnight = DateHelper.getLocalDate(todayStr);

        // Filter valid active installments
        const active = installments.filter(i =>
            !['paga', 'pago', 'cancelada', 'cancelado'].includes(i.status) && i.dueDate
        );

        if (active.length === 0) {
            titleEl.textContent = "Limite disponível! 💰";
            msgEl.textContent = "Você não tem parcelas pendentes no momento. Que tal aproveitar sua boa pontuação para simular um novo empréstimo?";
            return;
        }

        // --- 2. DATA AGGREGATION ---

        // A. Overdue
        const overdue = active.filter(i => DateHelper.isPast(i.dueDate))
            .sort((a, b) => DateHelper.toLocalYYYYMMDD(a.dueDate) < DateHelper.toLocalYYYYMMDD(b.dueDate) ? -1 : 1);

        // B. Today
        const todayItems = active.filter(i => DateHelper.isToday(i.dueDate));

        // C. Next Upcoming
        const upcoming = active.filter(i => DateHelper.isFuture(i.dueDate))
            .sort((a, b) => DateHelper.toLocalYYYYMMDD(a.dueDate) < DateHelper.toLocalYYYYMMDD(b.dueDate) ? -1 : 1);

        // --- 3. CONSTRUCTING THE AGGREGATED VIEW ---
        titleEl.textContent = "Resumo Financeiro 📊";

        let lines = [];
        let insightPhrase = "";

        // Insight Phrase Logic
        if (overdue.length > 0) {
            insightPhrase = "💡 *Evite o bloqueio do seu empréstimo regularizando suas pendências hoje mesmo!*";
        } else if (todayItems.length > 0) {
            insightPhrase = "💡 *Não esqueça de pagar sua parcela hoje para manter seu bônus de bônus de pontualidade!*";
        } else {
            insightPhrase = "💡 *Parabéns pelo controle! Continue assim para aumentar seu limite em breve.*";
        }

        // Overdue Info
        if (overdue.length > 0) {
            const oldest = overdue[0];
            const diffDays = DateHelper.getDiffDays(oldest.dueDate, todayStr);
            lines.push(`<span class="text-rose-400 font-bold">⚠️ ${overdue.length} ${overdue.length === 1 ? 'PARCELA ATRASADA' : 'PARCELAS ATRASADAS'}</span> (há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'})`);
        }

        // Today Info
        if (todayItems.length > 0) {
            lines.push(`<span class="text-amber-400 font-bold">🗓️ VENCE HOJE:</span> ${todayItems.length} ${todayItems.length === 1 ? 'parcela' : 'parcelas'}`);
        }

        // Next Info
        if (upcoming.length > 0) {
            const next = upcoming[0];
            const nextVal = parseFloat(next.installmentValue || next.installment_value || next.amount || 0);
            lines.push(`<span class="text-indigo-300 font-bold">📅 PRÓXIMA PARCELA:</span> ${this.formatDate(next.dueDate)} (${this.formatCurrency(nextVal)})`);
        }

        // Render with breaks and phrase
        msgEl.innerHTML = `
            <div class="space-y-2 mt-2">
                ${lines.join('<br>')}
                <p class="mt-4 pt-4 border-t border-white/10 text-slate-400 italic font-medium">
                    ${insightPhrase}
                </p>
            </div>
        `;
    }

    sendReceiptToWhatsApp(id) {
        const inst = this.installments.find(i => String(i.id) === String(id));
        if (!inst) return;

        const userName = document.querySelector('.user-name')?.textContent || 'Cliente';
        const amount = parseFloat(inst.installmentValue || inst.amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const date = this.formatDate(inst.dueDate);
        const contract = inst.loan?.loanCode || '---';

        const msg = `Olá! Sou o(a) *${userName}*.\n\nEnviei o comprovante da *parcela #${inst.number}* do contrato *${contract}*.\n\n*Valor:* ${amount}\n*Vencimento:* ${date}\n\nFavor confirmar o recebimento!`;

        // Using a generic link since admin phone is not configured
        const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    }

    async renderExtrato() {
        const list = document.getElementById('extrato-list');
        if (!list) return;

        if (this.clientPayments.length === 0) {
            list.innerHTML = '<tr><td colspan="5" class="px-6 py-12 text-center text-slate-400">Nenhum pagamento registrado ainda.</td></tr>';
            return;
        }

        list.innerHTML = this.clientPayments.map(p => `
            <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4 text-xs text-slate-600 font-medium">${this.formatDate(p.createdAt)}</td>
                <td class="px-6 py-4 text-sm font-bold text-slate-900">${this.formatCurrency(p.amount)}</td>
                <td class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">${p.method || 'PIX'}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 uppercase tracking-widest">Confirmado</span>
                </td>
                <td class="px-6 py-4">
                    ${(p.installment?.proof || p.proof) ? `
                        <button class="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary transition-all view-extrato-proof" data-id="${p.id}">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                    ` : '---'}
                </td>
            </tr>
        `).join('');

        // Bind proof viewing events
        list.querySelectorAll('.view-extrato-proof').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const payment = this.clientPayments.find(p => String(p.id) === String(id));
                const proof = payment?.installment?.proof || payment?.proof;
                if (proof) window.viewProof(proof);
            };
        });

        lucide.createIcons();
    }

    bindEvents() {
        // Dropdown Filter
        const filterEl = document.getElementById('client-dashboard-filter');
        if (filterEl) {
            filterEl.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.currentPage = 1; // Reset page on filter
                this.renderInstallmentsTable();
            });
        }

        // Pagination Prev
        const prevBtn = document.getElementById('installments-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderInstallmentsTable();
                }
            });
        }

        // Pagination Next
        const nextBtn = document.getElementById('installments-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                // Limit checking done in renderInstallmentsTable
                this.currentPage++;
                this.renderInstallmentsTable();
            });
        }

        // Notification bell toggle
        const bell = document.getElementById('notification-bell');
        const dropdown = document.getElementById('notifications-dropdown');
        if (bell) {
            bell.onclick = (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
            };
        }

        document.addEventListener('click', () => {
            if (dropdown) dropdown.classList.add('hidden');
        });

        // Mark all read
        const markAllBtn = document.getElementById('mark-all-read');
        if (markAllBtn) {
            markAllBtn.onclick = async (e) => {
                e.stopPropagation();
                await notificationService.markAllAsRead(this.client.id);
                await this.renderNotifications();
            };
        }

        // PIX Copy
        const copyBtn = document.getElementById('copy-pix');
        if (copyBtn) {
            copyBtn.onclick = () => {
                const pixKey = "00020126360014BR.GOV.BCB.PIX0114000000000000005204000053039865802BR5915Malibu Credito6009Sao Paulo62070503***6304E2B1";
                navigator.clipboard.writeText(pixKey);
                alert("Chave PIX copiada!");
            };
        }
    }

    formatDateTime(dateStr) {
        return DateHelper.formatLocal(dateStr) + ' às ' + DateHelper.getLocalDate(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    formatCurrency(val) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }

    formatDate(dateStr) {
        return DateHelper.formatLocal(dateStr);
    }

    translateStatus(status) {
        switch (status) {
            case 'PAID': return 'Paga';
            case 'OVERDUE': return 'Atrasada';
            default: return 'Pendente';
        }
    }

    getStatusClass(status) {
        switch (status) {
            case 'PAID': return 'bg-emerald-50 text-emerald-600';
            case 'OVERDUE': return 'bg-rose-50 text-rose-600';
            default: return 'bg-amber-50 text-amber-600';
        }
    }

    async fileToBase64(file) {
        if (!file) return null;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    showOnboarding() {
        const modal = document.getElementById('onboarding-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        document.getElementById('ob-name').value = this.client.name;
        this.setupFilePreview('ob-doc-id', 'preview-id');
        this.setupFilePreview('ob-doc-residence', 'preview-residence');
        const form = document.getElementById('onboarding-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i><span>Salvando...</span>';
            lucide.createIcons();
            try {
                const docId = await this.fileToBase64(document.getElementById('ob-doc-id').files[0]);
                const docResidence = await this.fileToBase64(document.getElementById('ob-doc-residence').files[0]);
                const updatedClient = {
                    ...this.client,
                    name: document.getElementById('ob-name').value,
                    cpf_cnpj: document.getElementById('ob-cpf').value,
                    phone: document.getElementById('ob-phone').value,
                    city: document.getElementById('ob-city').value,
                    street: document.getElementById('ob-address').value,
                    doc_id_img: docId,
                    doc_residence_img: docResidence,
                    status: 'ativo'
                };
                await clientService.save(updatedClient);
                this.client = updatedClient;
                modal.classList.add('hidden');
                await this.renderDashboard();
                alert("Cadastro finalizado com sucesso!");
            } catch (error) {
                alert("Erro ao salvar: " + error.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Salvar e Começar</span><i data-lucide="arrow-right" class="w-6 h-6"></i>';
                lucide.createIcons();
            }
        };
    }

    setupFilePreview(inputId, previewId) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        input.onchange = () => {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.innerHTML = `<img src="${e.target.result}" class="h-full w-full object-cover">`;
                    preview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        };
    }
}
