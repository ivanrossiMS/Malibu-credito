import paymentService from '../PaymentService.js';
import clientService from '../ClientService.js';
import installmentService from '../InstallmentService.js';
import auth from '../AuthService.js';

export default class ClientPaymentsModule {
    constructor() {
        this.payments = [];
        this.filteredPayments = [];
        this.currentClient = null;
        this.sortConfig = { key: 'createdAt', direction: 'desc' };
    }

    async init() {
        if (!auth.isAuthenticated()) return;

        try {
            this.currentClient = await clientService.getByUserId(auth.currentUser.id);
            if (!this.currentClient) return;

            await this.loadData();
            this.bindEvents();
            this.applyFilters();
        } catch (error) {
            console.error("Erro no módulo de pagamentos do cliente:", error);
        }
    }

    async loadData() {
        const allPayments = await paymentService.getAll();
        const allInstallments = await installmentService.getAll();

        // 1. Filter payments for this client
        const clientPayments = allPayments.filter(p => {
            if (String(p.clientId) === String(this.currentClient.id)) return true;
            if (p.client && String(p.client.id) === String(this.currentClient.id)) return true;
            if (p.loan && String(p.loan.clientId) === String(this.currentClient.id)) return true;
            return false;
        });

        // 2. Filter paid installments for this client that DON'T have a payment record yet
        const paymentInstallmentIds = new Set(clientPayments.map(p => String(p.installmentId)).filter(id => id !== 'undefined' && id !== 'null'));

        const missingPaymentsFromInstallments = allInstallments.filter(i => {
            if (i.status !== 'paga') return false;

            const isMyInstallment = String(i.clientId) === String(this.currentClient.id) ||
                (i.client && String(i.client.id) === String(this.currentClient.id)) ||
                (i.loan && String(i.loan.clientId) === String(this.currentClient.id));

            if (!isMyInstallment) return false;

            return !paymentInstallmentIds.has(String(i.id));
        }).map(i => ({
            id: 'legacy-' + i.id,
            installmentId: i.id,
            amount: i.amount,
            createdAt: i.paidAt || i.dueDate, // Use paidAt if available
            method: 'pix',
            notes: 'Registro histórico de parcela paga',
            loan: i.loan,
            client: i.client,
            installment: i
        }));

        // 3. Merge both sources
        this.payments = [...clientPayments, ...missingPaymentsFromInstallments];
    }

    bindEvents() {
        const periodFilter = document.getElementById('client-filter-period');
        const customDateInput = document.getElementById('client-filter-date');
        const customDateContainer = document.getElementById('custom-date-container');
        const searchInput = document.getElementById('client-search-input');
        const sortBySelect = document.getElementById('client-sort-by');
        const exportBtn = document.getElementById('client-export-btn');

        if (periodFilter) {
            periodFilter.onchange = () => {
                if (periodFilter.value === 'custom') {
                    customDateContainer?.classList.remove('hidden');
                } else {
                    customDateContainer?.classList.add('hidden');
                }
                this.applyFilters();
            };
        }

        if (customDateInput) {
            customDateInput.onchange = () => this.applyFilters();
        }

        if (searchInput) {
            searchInput.oninput = () => this.applyFilters();
        }

        if (sortBySelect) {
            sortBySelect.onchange = () => {
                const parts = sortBySelect.value.split('-');
                this.sortConfig.key = parts[0] === 'date' ? 'createdAt' : 'amount';
                this.sortConfig.direction = parts[1];
                this.applyFilters();
            };
        }

        if (exportBtn) exportBtn.onclick = () => this.exportCSV();

        // Header Sort Clicks
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const key = th.getAttribute('data-sort');
                if (this.sortConfig.key === key) {
                    this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortConfig.key = key;
                    this.sortConfig.direction = 'desc';
                }
                this.applyFilters();
            });
        });

        // Close proof modal
        document.querySelectorAll('.close-proof-modal').forEach(btn => {
            btn.onclick = () => {
                const modal = document.getElementById('proof-viewer-modal');
                if (modal) modal.classList.add('hidden');
            };
        });
    }

    applyFilters() {
        const period = document.getElementById('client-filter-period')?.value || 'all';
        const specificDate = document.getElementById('client-filter-date')?.value;
        const searchQuery = document.getElementById('client-search-input')?.value.toLowerCase() || '';

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        this.filteredPayments = this.payments.filter(p => {
            // Period Filter
            const pDate = new Date(p.createdAt);
            const pDateStr = p.createdAt.split('T')[0];

            let dateMatch = true;
            if (period === 'today') dateMatch = pDateStr === today;
            else if (period === 'month') dateMatch = pDate >= startOfMonth;
            else if (period === 'year') dateMatch = pDate >= startOfYear;
            else if (period === 'custom' && specificDate) dateMatch = pDateStr === specificDate;

            if (!dateMatch) return false;

            // Search Filter (ID or Amount)
            if (searchQuery) {
                const loanCode = (p.loan?.loanCode || '').toLowerCase();
                const amount = String(p.amount);
                const method = (p.method || '').toLowerCase();
                if (!loanCode.includes(searchQuery) && !amount.includes(searchQuery) && !method.includes(searchQuery)) {
                    return false;
                }
            }

            return true;
        });

        // Dynamic Sorting
        this.filteredPayments.sort((a, b) => {
            const { key, direction } = this.sortConfig;
            let valA, valB;

            switch (key) {
                case 'createdAt':
                    valA = new Date(a.createdAt);
                    valB = new Date(b.createdAt);
                    break;
                case 'amount':
                    valA = a.amount;
                    valB = b.amount;
                    break;
                case 'loanCode':
                    valA = (a.loan?.loanCode || '').toLowerCase();
                    valB = (b.loan?.loanCode || '').toLowerCase();
                    break;
                case 'method':
                    valA = (a.method || '').toLowerCase(); // Actually always PIX now, but keeping for data consistency
                    valB = (b.method || '').toLowerCase();
                    break;
                case 'number':
                    valA = parseInt(a.installment?.number || 0);
                    valB = parseInt(b.installment?.number || 0);
                    break;
                case 'proof':
                    valA = (a.installment?.proof || a.proof) ? 1 : 0;
                    valB = (b.installment?.proof || b.proof) ? 1 : 0;
                    break;
                default:
                    return 0;
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        this.renderTable();
        this.updateStats();
    }

    renderTable() {
        const container = document.getElementById('client-payments-list');
        if (!container) return;

        // Update Sort Icons
        document.querySelectorAll('th[data-sort] span[class^="sort-icon-"]').forEach(span => {
            const key = span.className.replace('sort-icon-', '').split(' ')[0];
            if (this.sortConfig.key === key) {
                span.classList.remove('opacity-0');
                span.classList.add('opacity-100', 'text-primary');
                span.innerHTML = `<i data-lucide="chevron-${this.sortConfig.direction === 'asc' ? 'up' : 'down'}" class="w-3 h-3"></i>`;
            } else {
                span.classList.add('opacity-0');
                span.classList.remove('opacity-100', 'text-primary');
                span.innerHTML = `<i data-lucide="chevron-down" class="w-3 h-3"></i>`;
            }
        });

        if (this.filteredPayments.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="px-8 py-24 text-center">
                        <div class="flex flex-col items-center gap-4 text-slate-300">
                             <div class="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                                <i data-lucide="receipt" class="w-10 h-10"></i>
                             </div>
                             <p class="text-sm font-bold">Você ainda não possui pagamentos correspondentes.</p>
                        </div>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = this.filteredPayments.map(p => {
            const date = new Date(p.createdAt);
            return `
                <tr class="hover:bg-slate-50/50 transition-all group">
                    <td class="px-8 py-6">
                        <div class="flex flex-col">
                            <span class="text-sm font-black text-slate-900">${date.toLocaleDateString('pt-BR')}</span>
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </td>
                    <td class="px-8 py-6">
                        <div class="flex items-center gap-2">
                             <div class="w-2 h-2 rounded-full bg-primary/30"></div>
                             <span class="text-xs font-mono font-bold text-slate-500 uppercase tracking-tighter">${p.loan ? p.loan.loanCode : 'REF-' + String(p.loanid || p.loanId || '').substring(0, 4)}</span>
                        </div>
                    </td>
                    <td class="px-8 py-6">
                        <div class="flex items-center gap-2">
                             <span class="text-sm font-bold text-slate-700">${p.installment?.number || '--'}</span>
                             <span class="text-xs text-slate-400 font-medium lowercase">de</span>
                             <span class="text-sm font-bold text-slate-700">${p.loan?.numInstallments || '--'}</span>
                        </div>
                    </td>
                    <td class="px-8 py-6">
                        <div class="flex justify-center">
                            <span class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-teal-50 text-teal-600 border border-teal-100">
                                PIX
                            </span>
                        </div>
                    </td>
                    <td class="px-8 py-6">
                         <span class="text-lg font-black text-emerald-600">R$ ${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                    <td class="px-8 py-6 text-right">
                        ${(p.installment?.proof || p.proof) ? `
                            <button class="w-10 h-10 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:scale-110 active:scale-90 transition-all view-proof" data-id="${p.id}" title="Ver Comprovante">
                                <i data-lucide="eye" class="w-5 h-5"></i>
                            </button>
                        ` : `
                            <div class="w-10 h-10 bg-slate-50 text-slate-300 border border-slate-100 rounded-2xl flex items-center justify-center opacity-50" title="Sem comprovante">
                                <i data-lucide="file-x" class="w-5 h-5"></i>
                            </div>
                        `}
                    </td>
                </tr>
            `;
        }).join('');

        // Bind view proof events with safer selector
        container.querySelectorAll('.view-proof').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const payment = this.filteredPayments.find(p => String(p.id) === String(id));
                const proof = payment?.installment?.proof || payment?.proof;
                if (proof) {
                    this.showProofModal(proof);
                } else {
                    alert("Comprovante não encontrado para este pagamento.");
                }
            });
        });

        lucide.createIcons();
    }

    updateStats() {
        const period = document.getElementById('client-filter-period')?.value || 'all';
        const dateVal = document.getElementById('client-filter-date')?.value;
        const totalPaid = this.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        const periodAmount = this.filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const periodCount = this.filteredPayments.length;

        // Update Label
        const labelEl = document.getElementById('client-stat-period-label');
        if (labelEl) {
            let text = 'Pagamentos';
            if (period === 'today') text = 'Pagos hoje';
            else if (period === 'month') text = 'Pagos este mês';
            else if (period === 'year') text = 'Pagos este ano';
            else if (period === 'custom') {
                const formatted = dateVal ? new Date(dateVal + 'T00:00:00').toLocaleDateString('pt-BR') : '...';
                text = `Pagos em ${formatted}`;
            }
            else text = 'Total no histórico';
            labelEl.textContent = text;
        }

        const totalEl = document.getElementById('client-stat-total');
        if (totalEl) totalEl.textContent = `R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const valueEl = document.getElementById('client-stat-period-value');
        if (valueEl) {
            valueEl.textContent = `R$ ${periodAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }

    getMethodStyle(method) {
        switch (method?.toLowerCase()) {
            case 'pix': return 'bg-teal-50 text-teal-600 border border-teal-100';
            case 'cartao': return 'bg-blue-50 text-blue-600 border border-blue-100';
            case 'transferencia': return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
            default: return 'bg-amber-50 text-amber-600 border border-amber-100';
        }
    }

    showProofModal(proof) {
        const modal = document.getElementById('proof-viewer-modal');
        const display = document.getElementById('proof-display');
        if (!modal || !display) return;

        display.innerHTML = '<div class="text-white flex flex-col items-center gap-4"><i data-lucide="loader-2" class="w-12 h-12 animate-spin opacity-20"></i><p>Carregando arquivo...</p></div>';
        lucide.createIcons();

        setTimeout(() => {
            display.innerHTML = '';

            // Robust check for base64 or URL
            const isBase64 = typeof proof === 'string' && proof.startsWith('data:');
            const isImage = isBase64 ? proof.startsWith('data:image/') : (typeof proof === 'string' && proof.match(/\.(jpeg|jpg|gif|png)$/i) != null);

            if (isImage) {
                const img = document.createElement('img');
                img.src = proof;
                img.className = 'max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-fade-in';
                display.appendChild(img);
            } else {
                const iframe = document.createElement('iframe');
                iframe.src = proof;
                iframe.className = 'w-full h-full border-none rounded-xl bg-white animate-fade-in';
                display.appendChild(iframe);
            }
        }, 300);

        modal.classList.remove('hidden');
        lucide.createIcons();
    }

    exportCSV() {
        if (this.filteredPayments.length === 0) return alert("Sem dados.");
        const headers = ["Data", "Contrato", "Parcela", "Metodo", "Valor"];
        const rows = this.filteredPayments.map(p => [
            new Date(p.createdAt).toLocaleDateString('pt-BR'),
            p.loan?.loanCode || '',
            `${p.installment?.number || '--'} de ${p.loan?.numInstallments || '--'}`,
            'PIX',
            p.amount.toString().replace('.', ',')
        ]);
        const csv = [headers, ...rows].map(row => row.join(";")).join("\n");
        const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `meus_pagamentos_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
}

