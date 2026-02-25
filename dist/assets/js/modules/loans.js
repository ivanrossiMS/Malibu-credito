import loanService from '../LoanService.js';
import clientService from '../ClientService.js';

export default class LoansModule {
    constructor() {
        this.allLoans = [];
        this.filteredLoans = [];
        this.sortConfig = { key: 'startDate', direction: 'desc' };
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
            clients.map(c => `<option value="${c.id}">${c.name} (${c.cpf_cnpj})</option>`).join('');
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

            return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 text-[10px] font-bold text-primary/70 uppercase tracking-tighter">${loan.loanCode || '---'}</td>
                <td class="px-6 py-4 text-sm font-bold text-slate-900">${loan.client?.name || 'Cliente não encontrado'}</td>
                <td class="px-6 py-4 text-sm font-bold text-slate-900 text-right">R$ ${requested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="px-6 py-4 text-sm font-medium text-amber-600 text-right">R$ ${interest.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="px-6 py-4 text-sm font-black text-primary text-right">R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="px-6 py-4 text-sm text-slate-600">${numInstallments}x de R$ ${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="px-6 py-4 text-sm text-slate-500">${new Date(loan.startDate).toLocaleDateString('pt-BR')}</td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${this.getStatusClass(loan.status)}">
                        ${loan.status.toUpperCase()}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick="editLoan(${loan.id})" class="p-2 text-slate-400 hover:text-primary transition-colors">
                        <i data-lucide="edit-3" class="w-5 h-5"></i>
                    </button>
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
            const val = parseFloat(l.installmentValue || l.installmentAmount) || 0;
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
        switch (status) {
            case 'ativo': return 'bg-amber-50 text-amber-600';
            case 'quitado': return 'bg-emerald-50 text-emerald-600';
            case 'atrasado': return 'bg-rose-50 text-rose-600';
            case 'cancelado': return 'bg-slate-100 text-slate-500';
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

                let totalInterest = 0;
                if (interestType === 'percent') {
                    totalInterest = amount * (interestRate / 100) * numInstallments;
                } else {
                    totalInterest = interestRate;
                }

                const totalAmount = amount + totalInterest;
                const installmentValue = totalAmount / numInstallments;

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

            document.getElementById('loan-id').value = loan.id;
            document.getElementById('clientId').value = loan.clientId;
            document.getElementById('amount').value = loan.amount;
            document.getElementById('interestRate').value = loan.interestRate;
            document.getElementById('interestType').value = loan.interestType || 'percent';
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
            let totalInterest = 0;
            if (interestType === 'percent') {
                totalInterest = amount * (interestRate / 100) * numInstallments;
            } else {
                totalInterest = interestRate;
            }

            const totalAmount = amount + totalInterest;
            const installmentValue = totalAmount / numInstallments;

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

