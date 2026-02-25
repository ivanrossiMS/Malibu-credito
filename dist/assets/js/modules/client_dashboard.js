import storage from '../StorageService.js';
import auth from '../AuthService.js';
import clientService from '../ClientService.js';
import loanService from '../LoanService.js';
import installmentService from '../InstallmentService.js';
import notificationService from '../NotificationService.js';
import paymentService from '../PaymentService.js';

export default class ClientDashboardModule {
    async init() {
        if (!auth.isAuthenticated()) return;

        this.client = await this.getCurrentClient();
        if (!this.client) {
            console.error("Client record not found for user.");
            return;
        }

        this.currentFilter = 'pendente';
        this.currentPage = 1;
        this.itemsPerPage = 15;

        await this.renderDashboard();
        this.bindGlobalEvents();
    }

    async getCurrentClient() {
        const clients = await storage.getAll('clients');
        return clients.find(c => c.userId === auth.currentUser.id) ||
            clients.find(c => c.email === auth.currentUser.email);
    }

    async renderDashboard() {
        const loans = (await loanService.getAll()).filter(l => String(l.clientId) === String(this.client.id));
        const installments = (await installmentService.getAll()).filter(i => i.loan && String(i.loan.clientId) === String(this.client.id));

        // Also fetch payments to cross-reference proofs
        const allPayments = await paymentService.getAll();
        this.clientPayments = allPayments.filter(p => {
            if (String(p.clientId) === String(this.client.id)) return true;
            if (p.client && String(p.client.id) === String(this.client.id)) return true;
            if (p.loan && String(p.loan.clientId) === String(this.client.id)) return true;
            return false;
        });

        // Calculate Totals
        const totalLoaned = loans.reduce((sum, l) => sum + (parseFloat(l.installmentValue || 0) * parseInt(l.numInstallments || 0)), 0);
        const totalPaid = installments.filter(i => i.status === 'paga').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
        const balanceDue = installments.filter(i => i.status !== 'paga').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

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

        // Check if onboarding is needed
        if (!this.client.cpf_cnpj || this.client.cpf_cnpj === 'null' || this.client.cpf_cnpj === '') {
            this.showOnboarding();
        }

        lucide.createIcons();
    }

    renderInstallmentsTable() {
        const listBody = document.getElementById('client-installments');
        if (!listBody) return;

        let filtered = this.installments || [];

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        filtered = filtered.filter(inst => {
            const due = new Date(inst.dueDate);
            due.setHours(0, 0, 0, 0);

            const isPaga = inst.status === 'paga' || inst.status === 'pago';
            const isLate = inst.status === 'atrasado' || inst.status === 'em atraso' || inst.status === 'atrasada' || (!isPaga && due < now);

            if (this.currentFilter === 'paga') return isPaga;
            if (this.currentFilter === 'vencida') return isLate && !isPaga;
            if (this.currentFilter === 'pendente') return !isPaga && !isLate;
            return true;
        });

        // Ordenação inteligente baseada no filtro
        filtered.sort((a, b) => {
            if (this.currentFilter === 'paga') return new Date(b.dueDate) - new Date(a.dueDate);
            return new Date(a.dueDate) - new Date(b.dueDate);
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
                const dueStr = new Date(inst.dueDate); dueStr.setHours(0, 0, 0, 0);
                const isLateVisual = (inst.status !== 'paga' && inst.status !== 'pago') && dueStr < now;
                const displayStatus = isLateVisual ? 'VENCIDA' : inst.status;
                const statusClass = isLateVisual ? 'bg-rose-50 text-rose-600 border border-rose-100' : this.getStatusClass(inst.status);

                return `
                    <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td class="px-8 py-5 text-sm font-black text-slate-900 border-l-2 border-transparent group-hover:border-primary">${inst.loan ? inst.loan.loanCode : '---'}</td>
                        <td class="px-8 py-5 text-sm font-medium text-slate-700 text-center">#${inst.number}</td>
                        <td class="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">${this.formatDate(inst.dueDate)}</td>
                        <td class="px-8 py-5 text-sm font-black text-emerald-600">${this.formatCurrency(inst.amount)}</td>
                        <td class="px-8 py-5">
                            <span class="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusClass}">
                                ${displayStatus}
                            </span>
                        </td>
                        <td class="px-8 py-5 text-right flex justify-end">
                            <div class="flex items-center gap-2">
                                <label class="cursor-pointer p-2 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all relative shadow-sm hover:shadow-md" title="Anexar Comprovante">
                                    <i data-lucide="${inst.proof ? 'check-circle' : 'paperclip'}" class="w-4 h-4 ${inst.proof ? 'text-emerald-500' : ''}"></i>
                                    <input type="file" class="hidden proof-upload" data-id="${inst.id}" accept="image/*,application/pdf" />
                                </label>
                                <button onclick="sendReceiptToWhatsApp('${inst.id}')" class="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:scale-110 active:scale-95 transition-transform shadow-sm" title="Enviar via WhatsApp">
                                    <i data-lucide="message-circle" class="w-4 h-4"></i>
                                </button>
                                ${inst.proof ? `
                                    <button class="p-2 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 hover:scale-110 active:scale-95 transition-all view-proof shadow-sm" data-id="${inst.id}" title="Ver Comprovante">
                                        <i data-lucide="eye" class="w-4 h-4"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Bind upload proof events
            listBody.querySelectorAll('.proof-upload').forEach(input => {
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    const id = e.target.getAttribute('data-id');
                    if (file) {
                        try {
                            const b64 = await this.fileToBase64(file);
                            await installmentService.updateProof(id, b64);
                            alert("Comprovante anexado!");
                            await this.renderDashboard();
                        } catch (err) {
                            alert("Erro: " + err.message);
                        }
                    }
                };
            });

            // Bind view proof events
            listBody.querySelectorAll('.view-proof').forEach(btn => {
                btn.onclick = () => {
                    const id = btn.getAttribute('data-id');
                    const inst = this.installments.find(i => String(i.id) === String(id));
                    let proof = inst?.proof;
                    if (!proof && this.clientPayments) {
                        const pay = this.clientPayments.find(p => String(p.installmentId) === String(id));
                        proof = pay?.proof;
                    }
                    if (proof) this.showProofModal(proof);
                    else alert("Comprovante ausente.");
                };
            });
        }
    }

    async renderNotifications() {
        const list = document.getElementById('notifications-list');
        const badge = document.getElementById('notification-badge');
        if (!list) return;

        const notifications = (await notificationService.getAllForClient(this.client.id))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        const localNowMidnight = new Date(year, now.getMonth(), now.getDate());

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
        const overdue = active.filter(i => i.dueDate < todayStr)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        // B. Today
        const todayItems = active.filter(i => i.dueDate === todayStr);

        // C. Next Upcoming
        const upcoming = active.filter(i => i.dueDate > todayStr)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

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
            const diffDays = Math.ceil(Math.abs(localNowMidnight - new Date(oldest.dueDate + 'T00:00:00')) / (1000 * 60 * 60 * 24));
            lines.push(`<span class="text-rose-400 font-bold">⚠️ ${overdue.length} ${overdue.length === 1 ? 'PARCELA ATRASADA' : 'PARCELAS ATRASADAS'}</span> (há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'})`);
        }

        // Today Info
        if (todayItems.length > 0) {
            lines.push(`<span class="text-amber-400 font-bold">🗓️ VENCE HOJE:</span> ${todayItems.length} ${todayItems.length === 1 ? 'parcela' : 'parcelas'}`);
        }

        // Next Info
        if (upcoming.length > 0) {
            const next = upcoming[0];
            lines.push(`<span class="text-indigo-300 font-bold">📅 PRÓXIMA PARCELA:</span> ${this.formatDate(next.dueDate)} (${this.formatCurrency(next.amount)})`);
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
                if (proof) this.showProofModal(proof);
            };
        });

        lucide.createIcons();
    }

    bindGlobalEvents() {
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

        // WhatsApp Receipt
        window.sendReceiptToWhatsApp = async (id) => {
            const installments = (await installmentService.getAll()).filter(i => i.loan && i.loan.clientId === this.client.id);
            const inst = installments.find(i => i.id == id);
            if (!inst) return;

            const phone = "5511999999999"; // Exemplo
            const msg = encodeURIComponent(
                `Olá, aqui é o cliente *${this.client.name}*.\n\n` +
                `Estou enviando o comprovante de pagamento da parcela:\n` +
                `📌 *ID Contrato:* ${inst.loan.loanCode}\n` +
                `📌 *Parcela:* #${inst.number}\n` +
                `📌 *Vencimento:* ${this.formatDate(inst.dueDate)}\n` +
                `📌 *Valor:* ${this.formatCurrency(inst.amount)}\n\n` +
                `Segue em anexo o comprovante.`
            );
            window.open(`https://wa.me/${phone}?text=${msg}`);
        };

        // Navigation for Extrato is handled purely by HTML <a> href -> ?page=client_payments

        // Proof Viewer Close
        document.querySelectorAll('.close-proof-modal').forEach(btn => {
            btn.onclick = () => {
                const modal = document.getElementById('proof-viewer-modal');
                if (modal) modal.classList.add('hidden');
            };
        });

        window.showProofModal = (proof) => this.showProofModal(proof);
    }

    showProofModal(proof) {
        const modal = document.getElementById('proof-viewer-modal');
        const display = document.getElementById('proof-display');
        if (!modal || !display) return;

        // Reset and show loader
        display.innerHTML = '<div class="text-white flex flex-col items-center gap-4"><i data-lucide="loader-2" class="w-12 h-12 animate-spin opacity-20"></i><p class="text-xs font-semibold uppercase tracking-widest">Carregando visualização...</p></div>';
        lucide.createIcons();

        setTimeout(() => {
            display.innerHTML = '';

            const isBase64 = typeof proof === 'string' && proof.startsWith('data:');
            const isImage = isBase64 ? proof.startsWith('data:image/') : (typeof proof === 'string' && proof.match(/\.(jpeg|jpg|gif|png)$/i) != null);

            if (isImage) {
                const img = document.createElement('img');
                img.src = proof;
                img.className = 'max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-fade-in ring-1 ring-white/10';
                display.appendChild(img);
            } else {
                const iframe = document.createElement('iframe');
                iframe.src = proof;
                iframe.className = 'w-full h-full border-none rounded-2xl bg-white animate-fade-in shadow-2xl';
                display.appendChild(iframe);
            }
        }, 400);

        modal.classList.remove('hidden');
        lucide.createIcons();
    }

    formatDateTime(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    formatCurrency(val) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    }

    getStatusClass(status) {
        switch (status) {
            case 'paga':
            case 'pago': return 'bg-emerald-50 text-emerald-600';
            case 'atrasada':
            case 'atrasado': return 'bg-rose-50 text-rose-600';
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
