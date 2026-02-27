import loanService from '../LoanService.js';
import clientService from '../ClientService.js';
import DateHelper from '../DateHelper.js';

export default class LoansModule {
    constructor() {
        this.allLoans = [];
        this.filteredLoans = [];
        this.sortConfig = { key: 'startDate', direction: 'desc' };
        this.allClients = [];
        this.clientsMap = new Map();
        this.filterConfig = {
            clientId: '',
            status: '',
            date: '',
            searchId: ''
        };
    }

    async init() {
        try {
            this.allLoans = await loanService.getAll();

            // Pre-fetch all clients for robust lookup fallback
            this.allClients = await clientService.getAll();
            this.clientsMap = new Map(this.allClients.map(c => [c.id, c]));

            this.filteredLoans = [...this.allLoans];

            await this.loadClientsSelect();
            await this.loadFilterClients();
            this.applyFilters();
            this.bindEvents();
        } catch (error) {
            console.error("Erro ao inicializar LoansModule:", error);
        }
    }

    async loadFilterClients() {
        const select = document.getElementById('filter-client');
        if (!select) return;

        const clients = await clientService.getAll();
        select.innerHTML = '<option value="">Todos os Clientes</option>' +
            clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    async loadClientsSelect() {
        const select = document.getElementById('clientId');
        if (!select) return;

        const clients = await clientService.getAll();
        select.innerHTML = '<option value="">Selecione um cliente...</option>' +
            clients.map(c => `<option value="${c.id}">${c.name} (${c.document || c.cpf_cnpj || c.cpf || 'Sem documento'})</option>`).join('');
    }

    async renderLoans(loansToRender = null) {
        const listContainer = document.getElementById('loans-list');
        if (!listContainer) return;

        const loans = loansToRender || this.filteredLoans;

        if (loans.length === 0) {
            listContainer.innerHTML = `
                <tr>
                    <td colspan="9" class="px-6 py-12 text-center text-slate-400">
                        <p>Nenhum empréstimo encontrado.</p>
                    </td>
                </tr>
            `;
            this.updateStats();
            return;
        }

        listContainer.innerHTML = loans.map(loan => {
            const requested = parseFloat(loan.amount) || 0;
            const numInstallments = parseInt(loan.numInstallments || loan.installmentsCount || 0);
            const installmentValue = parseFloat(loan.installmentValue || loan.installmentAmount || 0);

            const total = installmentValue * numInstallments;
            const interest = total - requested;

            // Robust client lookup with deep property inspection
            let client = loan.client;
            if (!client) {
                // Check every possible variation of client ID property
                const cid = loan.clientId || loan.clientid || loan.client_id || (loan.loan && (loan.loan.clientid || loan.loan.clientId));
                if (cid) {
                    client = this.clientsMap.get(parseInt(cid));
                }
            }

            const avatarHtml = client && client.avatar
                ? `<img src="${client.avatar}" class="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm shrink-0">`
                : `<div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">${client?.name ? client.name.charAt(0) : '?'}</div>`;

            return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 text-[10px] font-bold text-primary/70 uppercase tracking-tighter">${loan.loanCode || '---'}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        ${avatarHtml}
                        <span class="text-sm font-bold text-slate-900">${client?.name || 'Cliente não encontrado'}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm font-bold text-slate-900 text-right">R$ ${requested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="px-6 py-4 text-sm font-medium text-amber-600 text-right">R$ ${interest.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="px-6 py-4 text-sm font-black text-primary text-right">R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="px-6 py-4 text-sm text-slate-600">${numInstallments}x de R$ ${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span class="text-[10px] font-bold opacity-50 uppercase">${loan.frequency || 'mensal'}</span></td>
                <td class="px-6 py-4 text-sm text-slate-500">${DateHelper.formatLocal(loan.startDate)}</td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${this.getStatusClass(loan.status)}">
                        ${loan.status.toUpperCase()}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-1">
                        <button onclick="editLoan(${loan.id})" class="p-2 text-slate-400 hover:text-primary transition-all hover:bg-primary/5 rounded-lg" title="Editar">
                            <i data-lucide="edit-3" class="w-5 h-5"></i>
                        </button>
                        <button onclick="deleteLoan(${loan.id})" class="p-2 text-slate-400 hover:text-rose-600 transition-all hover:bg-rose-50 rounded-lg" title="Excluir">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');

        lucide.createIcons();
        this.updateStats();
    }

    updateStats() {
        if (!this.allLoans || !Array.isArray(this.allLoans)) return;

        // Portfolio Card
        const portfolioType = document.getElementById('stat-portfolio-type')?.value || 'ativo';
        let portfolioLoans = this.allLoans;
        if (portfolioType === 'ativo') {
            portfolioLoans = this.allLoans.filter(l => l.status === 'ativo');
        }
        const totalPortfolio = portfolioLoans.reduce((sum, l) => {
            const val = parseFloat(l.amount || l.installmentValue || l.installmentAmount) || 0;
            const count = parseInt(l.numInstallments || l.installmentsCount) || 0;
            return sum + (val * count);
        }, 0);

        // Contracts Card
        const contractsType = document.getElementById('stat-contracts-type')?.value || 'ativo';
        let contractsCount = this.allLoans.length;
        if (contractsType === 'ativo') {
            contractsCount = this.allLoans.filter(l => l.status === 'ativo').length;
        }

        // Status Card
        const statusType = document.getElementById('stat-status-type')?.value || 'quitado';
        const statusCount = this.allLoans.filter(l => l.status === statusType).length;

        // Update UI
        const portfolioEl = document.getElementById('stat-portfolio-value');
        const countEl = document.getElementById('stat-contracts-count');
        const statusCountEl = document.getElementById('stat-status-count');

        if (portfolioEl) portfolioEl.textContent = `R$ ${(totalPortfolio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (countEl) countEl.textContent = (contractsCount || 0).toString();
        if (statusCountEl) statusCountEl.textContent = (statusCount || 0).toString();
    }

    applyFilters() {
        const { clientId, status, date, searchId } = this.filterConfig;

        this.filteredLoans = this.allLoans.filter(loan => {
            const matchClient = !clientId || loan.clientId === parseInt(clientId);
            const matchStatus = !status || loan.status === status;
            const matchDate = !date || loan.startDate === date;
            const matchId = !searchId || (loan.loanCode && loan.loanCode.toLowerCase().includes(searchId.toLowerCase()));

            return matchClient && matchStatus && matchDate && matchId;
        });

        this.applySorting();
    }

    applySorting() {
        const { key, direction } = this.sortConfig;

        this.filteredLoans.sort((a, b) => {
            let valA, valB;

            switch (key) {
                case 'loanCode':
                    valA = a.loanCode || '';
                    valB = b.loanCode || '';
                    break;
                case 'clientName':
                    valA = a.client?.name || '';
                    valB = b.client?.name || '';
                    break;
                case 'amount':
                    valA = parseFloat(a.amount);
                    valB = parseFloat(b.amount);
                    break;
                case 'interest':
                    valA = (parseFloat(a.installmentValue) * parseInt(a.numInstallments)) - parseFloat(a.amount);
                    valB = (parseFloat(b.installmentValue) * parseInt(b.numInstallments)) - parseFloat(b.amount);
                    break;
                case 'total':
                    valA = parseFloat(a.installmentValue) * parseInt(a.numInstallments);
                    valB = parseFloat(b.installmentValue) * parseInt(b.numInstallments);
                    break;
                case 'startDate':
                    valA = new Date(a.startDate);
                    valB = new Date(b.startDate);
                    break;
                default:
                    return 0;
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        this.renderLoans();
    }

    getStatusClass(status) {
        status = String(status || '').toUpperCase();
        switch (status) {
            case 'ACTIVE':
            case 'ATIVO': return 'bg-amber-50 text-amber-600';
            case 'PAID':
            case 'QUITADO': return 'bg-emerald-50 text-emerald-600';
            case 'OVERDUE':
            case 'ATRASADO': return 'bg-rose-50 text-rose-600';
            case 'CANCELLED':
            case 'CANCELADO': return 'bg-slate-100 text-slate-500';
            default: return 'bg-slate-50 text-slate-500';
        }
    }

    bindEvents() {
        ['stat-portfolio-type', 'stat-contracts-type', 'stat-status-type'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.onchange = () => this.updateStats();
        });

        const addBtn = document.getElementById('add-loan-btn');
        const modal = document.getElementById('loan-modal');
        if (addBtn && modal) {
            addBtn.onclick = () => {
                document.getElementById('loan-form').reset();
                document.getElementById('loan-id').value = '';
                document.getElementById('modal-title-loan').textContent = 'Novo Contrato de Empréstimo';
                document.getElementById('status-container').style.display = 'none';
                modal.classList.remove('hidden');
                this.loadClientsSelect();
                this.calculatePreview();
            };
        }

        // Preview calculation
        const formInputs = ['amount', 'interestRate', 'numInstallments', 'interestType', 'frequency'];
        formInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.oninput = () => this.calculatePreview();
                if (input.tagName === 'SELECT') {
                    input.onchange = () => this.calculatePreview();
                }
            }
        });

        const form = document.getElementById('loan-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const loanId = document.getElementById('loan-id').value;
                const amount = parseFloat(document.getElementById('amount').value);
                const interestRate = parseFloat(document.getElementById('interestRate').value);
                const numInstallments = parseInt(document.getElementById('numInstallments').value);
                const interestType = document.getElementById('interestType').value;
                const frequency = document.getElementById('frequency').value;
                let installmentValue = 0;
                let totalAmount = 0;

                if (frequency === 'semanal') {
                    installmentValue = (amount / numInstallments) + interestRate;
                    totalAmount = installmentValue * numInstallments;
                } else {
                    totalAmount = amount + interestRate;
                    installmentValue = totalAmount / numInstallments;
                }

                const data = {
                    clientId: parseInt(document.getElementById('clientId').value),
                    amount,
                    interestRate,
                    interestType,
                    numInstallments,
                    installmentValue,
                    frequency,
                    startDate: document.getElementById('startDate').value,
                    notes: document.getElementById('notes').value
                };

                // Add status if modifying
                if (loanId) {
                    data.status = document.getElementById('loan-status').value;
                }

                try {
                    if (loanId) {
                        await loanService.updateLoan(parseInt(loanId), data);
                        alert("Empréstimo atualizado com sucesso!");
                    } else {
                        await loanService.createLoan(data);
                        alert("Empréstimo gerado com sucesso!");
                    }
                    modal.classList.add('hidden');
                    this.allLoans = await loanService.getAll();
                    this.applyFilters();
                } catch (error) {
                    alert(error.message);
                }
            };
        }

        window.editLoan = async (id) => {
            const loan = await loanService.getById(id);
            if (!loan) return;

            await this.loadClientsSelect(); // Injeta options ativamente para evitar seletion null

            document.getElementById('loan-id').value = loan.id;
            // Fix visual selection by forcing String and hunting nested ID properties if 'clientId' is nullified by the relation JOIN
            const targetClientId = loan.clientId || loan.client?.id || loan.clientid || '';
            document.getElementById('clientId').value = String(targetClientId);
            document.getElementById('amount').value = loan.amount;
            document.getElementById('interestRate').value = loan.interestRate;
            document.getElementById('interestType').value = loan.interestType || 'fixed';
            document.getElementById('numInstallments').value = loan.numInstallments;
            document.getElementById('frequency').value = loan.frequency || 'mensal';
            document.getElementById('startDate').value = loan.startDate;
            document.getElementById('notes').value = loan.notes || '';

            // Adjust modal for edit
            document.getElementById('modal-title-loan').textContent = 'Editar Empréstimo ' + (loan.loanCode || '');
            document.getElementById('status-container').style.display = 'block';
            document.getElementById('loan-status').value = loan.status;

            this.calculatePreview();
            modal.classList.remove('hidden');
        };

        window.deleteLoan = async (id) => {
            if (!confirm("⚠️ ATENÇÃO: Esta ação é permanente!\n\nDeseja realmente excluir este empréstimo e todas as suas parcelas associadas?")) {
                return;
            }

            try {
                await loanService.deleteLoan(id);
                alert("Empréstimo e parcelas excluídos com sucesso!");
                this.allLoans = await loanService.getAll();
                this.applyFilters();
            } catch (error) {
                alert("Erro ao excluir empréstimo: " + error.message);
            }
        };

        const filterClient = document.getElementById('filter-client');
        const filterStatus = document.getElementById('filter-status');
        const filterDate = document.getElementById('filter-date');
        const filterId = document.getElementById('filter-id');

        if (filterClient) filterClient.onchange = (e) => {
            this.filterConfig.clientId = e.target.value;
            this.applyFilters();
        };
        if (filterStatus) filterStatus.onchange = (e) => {
            this.filterConfig.status = e.target.value;
            this.applyFilters();
        };
        if (filterDate) filterDate.oninput = (e) => {
            this.filterConfig.date = e.target.value;
            this.applyFilters();
        };
        if (filterId) filterId.oninput = (e) => {
            this.filterConfig.searchId = e.target.value;
            this.applyFilters();
        };

        document.querySelectorAll('th.sortable').forEach(th => {
            th.onclick = () => {
                const key = th.dataset.sort;
                if (this.sortConfig.key === key) {
                    this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortConfig.key = key;
                    this.sortConfig.direction = 'asc';
                }

                document.querySelectorAll('th.sortable i').forEach(i => i.setAttribute('data-lucide', 'chevrons-up-down'));
                const icon = th.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', this.sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down');
                }
                lucide.createIcons();
                this.applySorting();
            };
        });

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.onclick = () => modal.classList.add('hidden');
        });
    }

    calculatePreview() {
        const amount = parseFloat(document.getElementById('amount').value) || 0;
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
        const numInstallments = parseInt(document.getElementById('numInstallments').value) || 0;
        const interestType = document.getElementById('interestType').value;

        if (amount > 0 && numInstallments > 0) {
            const frequency = document.getElementById('frequency').value;
            let installmentValue = 0;
            let totalAmount = 0;

            if (frequency === 'semanal') {
                installmentValue = (amount / numInstallments) + interestRate;
                totalAmount = installmentValue * numInstallments;
            } else {
                totalAmount = amount + interestRate;
                installmentValue = totalAmount / numInstallments;
            }

            const previewEl = document.getElementById('installment-preview');
            const totalPreviewEl = document.getElementById('total-preview');

            if (previewEl) previewEl.textContent = `R$ ${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            if (totalPreviewEl) totalPreviewEl.textContent = `R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            const previewEl = document.getElementById('installment-preview');
            const totalPreviewEl = document.getElementById('total-preview');

            if (previewEl) previewEl.textContent = 'R$ 0,00';
            if (totalPreviewEl) totalPreviewEl.textContent = 'R$ 0,00';
        }
    }
}

