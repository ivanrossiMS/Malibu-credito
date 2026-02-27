import clientService from '../ClientService.js';
import loanService from '../LoanService.js';
import installmentService from '../InstallmentService.js';
import auth from '../AuthService.js';
import loanRequestService from '../LoanRequestService.js';
import DateHelper from '../DateHelper.js';

export default class ClientLoansModule {
    constructor() {
        this.clientLoans = [];
        this.currentClient = null;
    }

    async init() {
        if (!auth.isAuthenticated()) return;

        try {
            this.currentClient = await clientService.getByUserId(auth.currentUser.id);
            if (!this.currentClient) return;

            await this.loadData();
            this.renderStats();
            this.renderTable();
            this.bindEvents();
        } catch (error) {
            console.error("Erro no módulo de empréstimos do cliente:", error);
        }
    }

    async loadData() {
        const allLoans = await loanService.getAll();
        const clientActiveLoans = allLoans.filter(loan => String(loan.clientId || loan.clientid) === String(this.currentClient.id));

        const allRequests = await loanRequestService.getAll();
        const clientRequests = allRequests.filter(req =>
            String(req.clientId || req.clientid) === String(this.currentClient.id) &&
            req.status === 'pendente'
        );



        this.clientLoans = combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    getLoanStatusClass(status) {
        switch (status) {
            case 'ativo': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
            case 'quitado': return 'bg-slate-100 text-slate-500 border border-slate-200';
            case 'em atraso': return 'bg-rose-50 text-rose-600 border border-rose-100';
            case 'rejeitado': return 'bg-rose-50 text-rose-600 border border-rose-100';
            case 'pendente': return 'bg-amber-50 text-amber-600 border border-amber-100';
            default: return 'bg-slate-50 text-slate-600 border border-slate-100';
        }
    }

    renderStats() {
        // Só contabiliza empréstimos REAIS (ignorando solicitações na contagem do card) e que estão ativos ou em atraso.
        const activeLoans = this.clientLoans.filter(l => !l.isRequest && (l.status === 'ativo' || l.status === 'em atraso'));

        let activeTotal = 0;
        activeLoans.forEach(l => {
            const numInstallments = parseInt(l.numInstallments || l.installmentsCount || l.installments || 0);
            const installmentValue = parseFloat(l.installmentValue || l.installmentAmount || 0);
            activeTotal += (installmentValue * numInstallments);
        });

        const elTotal = document.getElementById('client-loans-total');
        if (elTotal) elTotal.textContent = `R$ ${activeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const elCount = document.getElementById('client-loans-count');
        if (elCount) elCount.textContent = activeLoans.length;

        // Próxima parcela (apenas representativa no mockup ou calculada das parcelas depois)
        const elNext = document.getElementById('client-loans-next');
        if (elNext) {
            elNext.textContent = activeLoans.length > 0 ? "Ver Parcelas" : "Nenhuma pendente";
        }
    }

    renderTable() {
        const container = document.getElementById('client-loans-list');
        if (!container) return;

        if (this.clientLoans.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="px-8 py-24 text-center">
                        <div class="flex flex-col items-center gap-4 text-slate-300">
                             <div class="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                                <i data-lucide="folder-open" class="w-10 h-10"></i>
                             </div>
                             <p class="text-sm font-bold">Você não possui contratos de empréstimo.</p>
                             <a href="?page=client_loan_request" class="px-6 py-2 mt-2 bg-primary text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:shadow-lg transition-all">Solicitar Novo</a>
                        </div>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = this.clientLoans.map(loan => {
            const date = new Date(loan.createdAt);
            const statusClass = this.getLoanStatusClass(loan.status);

            const numInstallments = parseInt(loan.numInstallments || loan.installmentsCount || loan.installments || 0);

            let totalDisplay = '';
            let installmentDisplay = '';
            let actionHtml = '';

            if (loan.isRequest) {
                totalDisplay = `<span class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Calculado na aprovação</span>`;
                installmentDisplay = `${numInstallments}x (${loan.frequency === 'diaria' ? 'Diário' : 'Mensal'})`;
                actionHtml = `
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">${loan.status}</span>
                        ${loan.status === 'pendente' ? `

                                <i data-lucide="trash-2" class="w-5 h-5"></i>
                            </button>
                        ` : ''}
                    </div>
                `;
            } else {
                const installmentValue = parseFloat(loan.installmentValue || loan.installmentAmount || 0);
                const totalComJuros = installmentValue * numInstallments;
                totalDisplay = `<span class="text-sm font-black text-emerald-600">R$ ${totalComJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
                installmentDisplay = `${numInstallments}x de R$ ${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                actionHtml = `
                    <button data-id="${loan.id}" class="view-loan-installments w-10 h-10 bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary hover:scale-110 active:scale-90 transition-all shadow-sm" title="Ver Parcelas">
                        <i data-lucide="list" class="w-5 h-5"></i>
                    </button>`;
            }

            return `
                <tr class="hover:bg-slate-50/50 transition-all group">
                    <td class="px-8 py-6">
                        <div class="flex flex-col">
                            <span class="text-sm font-black ${loan.isRequest ? 'text-slate-500' : 'text-slate-900'}">${loan.loanCode || '---'}</span>
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">${DateHelper.formatLocal(loan.createdAt)}</span>
                        </div>
                    </td>
                    <td class="px-8 py-6">
                        <span class="text-xs font-bold text-slate-700">R$ ${parseFloat(loan.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                    <td class="px-8 py-6">
                        ${totalDisplay}
                        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">${installmentDisplay}</div>
                    </td>
                    <td class="px-8 py-6">
                        <span class="px-4 py-1.5 rounded-[10px] text-[10px] font-black uppercase tracking-widest ${statusClass}">
                            ${loan.status}
                        </span>
                    </td>
                    <td class="px-8 py-6 text-right flex justify-end">
                        ${actionHtml}
                    </td>
                </tr>
            `;
        }).join('');

        lucide.createIcons();
    }

    async openInstallmentsModal(loanId) {
        const modal = document.getElementById('loan-installments-modal');
        const listContainer = document.getElementById('modal-installments-list');
        const loanCodeEl = document.getElementById('modal-loan-code');

        const loan = this.clientLoans.find(l => String(l.id) === String(loanId));
        if (!loan || !modal || !listContainer) return;

        loanCodeEl.textContent = loan.loanCode;
        listContainer.innerHTML = '<tr><td colspan="4" class="text-center py-10"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto text-primary"></i></td></tr>';
        lucide.createIcons();
        modal.classList.remove('hidden');

        try {
            const allInstallments = await installmentService.getAll();
            const installments = allInstallments.filter(i => String(i.loanid || i.loanId) === String(loanId));

            // Sort by number
            installments.sort((a, b) => parseInt(a.number) - parseInt(b.number));

            if (installments.length === 0) {
                listContainer.innerHTML = '<tr><td colspan="4" class="text-center py-10 text-slate-500 font-medium">Nenhuma parcela encontrada.</td></tr>';
                document.getElementById('modal-total-pago').textContent = 'R$ 0,00';
                document.getElementById('modal-total-aberto').textContent = 'R$ 0,00';
                return;
            }

            let totalPago = 0;
            let totalAberto = 0;

            listContainer.innerHTML = installments.map(inst => {
                const date = new Date(inst.dueDate);
                let statusClass = 'bg-slate-100 text-slate-500';
                let statusText = inst.status;
                const amountValue = parseFloat(inst.installmentValue);

                if (inst.status === 'pendente' || inst.status === 'em atraso' || inst.status === 'atrasada') {
                    totalAberto += amountValue;

                    if (inst.status === 'pendente') {
                        // Check if pending is actually overdue
                        if (DateHelper.isPast(inst.dueDate)) {
                            statusClass = 'bg-rose-50 text-rose-600 border border-rose-100';
                            statusText = 'em atraso';
                        } else {
                            statusClass = 'bg-amber-50 text-amber-600 border border-amber-100';
                        }
                    } else {
                        statusClass = 'bg-rose-50 text-rose-600 border border-rose-100';
                    }
                } else if (inst.status === 'paga' || inst.status === 'pago') {
                    totalPago += amountValue;
                    statusClass = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                }

                return `
                    <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td class="px-8 py-4 font-bold text-slate-700">${inst.number}</td>
                        <td class="px-8 py-4 text-sm font-medium text-slate-600">${DateHelper.formatLocal(inst.dueDate)}</td>
                        <td class="px-8 py-4 font-black text-emerald-600">R$ ${amountValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="px-8 py-4">
                            <span class="px-3 py-1.5 rounded-[10px] text-[10px] font-black uppercase tracking-widest ${statusClass}">
                                ${statusText}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');

            // Populando os marcadores visuais no topo do Modal
            document.getElementById('modal-total-pago').textContent = `R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            document.getElementById('modal-total-aberto').textContent = `R$ ${totalAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } catch (error) {
            console.error(error);
            listContainer.innerHTML = '<tr><td colspan="4" class="text-center py-10 text-rose-500 font-medium">Erro ao carregar parcelas.</td></tr>';
        }
    }

    async cancelRequest(requestId) {
        if (!confirm("Deseja realmente cancelar esta solicitação de empréstimo? Esta ação não pode ser desfeita.")) {
            return;
        }

        try {
            await loanRequestService.delete(requestId);
            alert("Solicitação cancelada com sucesso.");
            await this.init(); // Refresh data and view
        } catch (error) {
            alert("Erro ao cancelar solicitação: " + error.message);
        }
    }

    bindEvents() {
        // Cancelar Solicitação
        document.querySelectorAll('.cancel-loan-request').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const reqId = btn.getAttribute('data-id');
                this.cancelRequest(reqId);
            };
        });

        // Abrir Modal de Parcelas
        document.querySelectorAll('.view-loan-installments').forEach(btn => {
            btn.addEventListener('click', () => {
                const loanId = btn.getAttribute('data-id');
                this.openInstallmentsModal(loanId);
            });
        });

        // Fechar Modal
        const closeModalBtn = document.getElementById('close-installments-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                document.getElementById('loan-installments-modal').classList.add('hidden');
            });
        }

        // Campo de busca simples e offline no Grid
        const searchInput = document.getElementById('client-search-loans');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const rows = document.querySelectorAll('#client-loans-list tr[class*="group"]');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(query) ? '' : 'none';
                });
            });
        }
    }
}
