import paymentService from '../PaymentService.js';
import clientService from '../ClientService.js';
import installmentService from '../InstallmentService.js';
import loanService from '../LoanService.js';

export default class PaymentHistoryModule {
    constructor() {
        this.allPayments = [];
        this.filteredPayments = [];
        this.clientsCache = [];
        this.installmentsCache = [];

        // Pagination
        this.currentPage = 1;
        this.itemsPerPage = 15;

        // Filters
        this.currentPeriod = 'mes';
        this.customDateFrom = '';
        this.customDateTo = '';
        this.currentCity = 'all';
        this.currentMethod = 'all';
        this.searchTerm = '';
    }

    async init() {
        await this.loadData();
        this.populateComboboxes();
        this.bindEvents();

        // Auto select period "mes" visually
        const mesBtn = document.querySelector('.filter-period[data-period="mes"]');
        if (mesBtn) {
            this.selectPeriod('mes', mesBtn);
        } else {
            this.applyFilters();
        }
    }

    async loadData() {
        try {
            this.clientsCache = await clientService.getAll();
            this.installmentsCache = await installmentService.getAll();
            this.loansCache = await loanService.getAll();
            const payments = await paymentService.getAll();

            // Enrich payments with client, city and installment info
            this.allPayments = payments.map(p => {
                let clientId = p.clientId;
                if (!clientId && p.client && p.client.id) clientId = p.client.id;
                else if (!clientId && typeof p.client === 'string') clientId = p.client;

                // fallback to installment client match
                let inst = this.installmentsCache.find(i => String(i.id) === String(p.installmentId));
                if (!clientId && inst && inst.client) clientId = inst.client.id;

                const clientObj = this.clientsCache.find(c => String(c.id) === String(clientId));
                const refId = inst ? (inst.loanid || inst.loanId) : null;
                const loanObj = refId ? this.loansCache.find(l => String(l.id) === String(refId)) : null;

                return {
                    ...p,
                    clientObj: clientObj || null,
                    city: clientObj?.city || 'Desconhecida',
                    installmentObj: inst || null,
                    loanObj: loanObj || null
                };
            });

        } catch (error) {
            console.error("Erro ao carregar histórico geral:", error);
        }
    }

    populateComboboxes() {
        const cityFilter = document.getElementById('filter-city');
        if (cityFilter) {
            const cities = [...new Set(this.clientsCache.map(c => c.city).filter(Boolean))].sort();
            cityFilter.innerHTML = '<option value="all">Todas as Cidades</option>' +
                cities.map(city => `<option value="${city}">${city}</option>`).join('');
            cityFilter.value = this.currentCity;
        }
    }

    bindEvents() {
        const searchInput = document.getElementById('filter-search');
        const cityFilter = document.getElementById('filter-city');
        const methodFilter = document.getElementById('filter-method');
        const exportBtn = document.getElementById('export-btn');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.currentPage = 1;
                this.applyFilters();
            });
        }

        if (cityFilter) {
            cityFilter.addEventListener('change', (e) => {
                this.currentCity = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
            });
        }

        if (methodFilter) {
            methodFilter.addEventListener('change', (e) => {
                this.currentMethod = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
            });
        }

        // Period Buttons
        document.querySelectorAll('.filter-period').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = btn.dataset.period;
                this.selectPeriod(period, btn);
            });
        });

        // Custom Date apply
        const applyCustomBtn = document.getElementById('apply-custom-date');
        if (applyCustomBtn) {
            applyCustomBtn.addEventListener('click', () => {
                this.customDateFrom = document.getElementById('date-from').value;
                this.customDateTo = document.getElementById('date-to').value;
                if (!this.customDateFrom || !this.customDateTo) {
                    alert('Preencha as datas "De" e "Até".');
                    return;
                }
                this.currentPage = 1;
                this.applyFilters();
            });
        }

        // Pagination
        const prevBtn = document.getElementById('btn-prev-page');
        const nextBtn = document.getElementById('btn-next-page');

        if (prevBtn) {
            prevBtn.onclick = () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderTable();
                }
            };
        }
        if (nextBtn) {
            nextBtn.onclick = () => {
                this.currentPage++;
                this.renderTable();
            };
        }

        if (exportBtn) {
            exportBtn.onclick = () => this.exportCSV();
        }
    }

    selectPeriod(period, element) {
        this.currentPeriod = period;

        // UI Reset
        document.querySelectorAll('.filter-period').forEach(b => {
            b.classList.remove('bg-white', 'text-primary', 'shadow-sm');
            b.classList.add('text-slate-500');
        });

        if (element) {
            element.classList.remove('text-slate-500');
            element.classList.add('bg-white', 'text-primary', 'shadow-sm');
        }

        const customContainer = document.getElementById('custom-date-container');
        if (period === 'personalizado') {
            customContainer.classList.remove('hidden');
        } else {
            customContainer.classList.add('hidden');
            this.currentPage = 1;
            this.applyFilters();
        }
    }

    applyFilters() {
        // Build Date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startFilter = null;
        let endFilter = null;

        if (this.currentPeriod === 'hoje') {
            startFilter = today; endFilter = today;
        } else if (this.currentPeriod === '7dias') {
            startFilter = new Date(today); startFilter.setDate(startFilter.getDate() - 7);
            endFilter = today;
        } else if (this.currentPeriod === 'mes') {
            startFilter = new Date(today.getFullYear(), today.getMonth(), 1);
            endFilter = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else if (this.currentPeriod === 'ano') {
            startFilter = new Date(today.getFullYear(), 0, 1);
            endFilter = new Date(today.getFullYear(), 11, 31);
        } else if (this.currentPeriod === 'personalizado' && this.customDateFrom && this.customDateTo) {
            startFilter = new Date(this.customDateFrom + 'T00:00:00');
            endFilter = new Date(this.customDateTo + 'T00:00:00');
        }

        this.filteredPayments = this.allPayments.filter(p => {
            if (!p.createdAt) return false;

            // Search Filter
            const matchesSearch = !this.searchTerm ||
                (p.clientObj?.name || '').toLowerCase().includes(this.searchTerm) ||
                (p.clientObj?.cpf || '').includes(this.searchTerm) ||
                (p.city || '').toLowerCase().includes(this.searchTerm);

            // City Filter
            const matchesCity = this.currentCity === 'all' || p.city === this.currentCity;

            // Method Filter
            const pMethod = (p.method || 'pix').toLowerCase();
            const matchesMethod = this.currentMethod === 'all' || pMethod === this.currentMethod.toLowerCase();

            // Date Filter
            let matchesDate = true;
            if (startFilter && endFilter) {
                const pDateObj = new Date(p.createdAt);
                const pDate = new Date(pDateObj.getFullYear(), pDateObj.getMonth(), pDateObj.getDate());
                matchesDate = (pDate >= startFilter && pDate <= endFilter);
            }

            return matchesSearch && matchesCity && matchesMethod && matchesDate;
        });

        // Always sort by newest first
        this.filteredPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        this.updateStats();
        this.renderTable();
    }

    updateStats() {
        const totalAmount = this.filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const count = this.filteredPayments.length;

        // Update UI Text dynamic
        let badgeText = "HOJE";
        let labelText = "Pagamentos baixados";

        switch (this.currentPeriod) {
            case 'hoje': badgeText = "HOJE"; labelText = "Pagamentos baixados (Hoje)"; break;
            case '7dias': badgeText = "HÁ 7 DIAS"; labelText = "Pagamentos baixados (Seman.)"; break;
            case 'mes': badgeText = "MÊS"; labelText = "Pagamentos baixados (Mês)"; break;
            case 'ano': badgeText = "ANO"; labelText = "Pagamentos baixados (Ano)"; break;
            case 'personalizado': badgeText = "CUSTOM"; labelText = "Pagamentos baixados (Custom)"; break;
        }

        const elToday = document.getElementById('stat-today');
        const elMonth = document.getElementById('stat-month');
        const elListCount = document.getElementById('list-counter');
        const elBadgeToday = document.getElementById('badge-today');
        const elBadgeMonth = document.getElementById('badge-month');
        const elLabelToday = document.getElementById('label-today');

        if (elBadgeToday) elBadgeToday.textContent = badgeText;
        if (elLabelToday) elLabelToday.textContent = labelText;
        if (elBadgeMonth) elBadgeMonth.textContent = badgeText;

        // Current UI specification requested that both cards show filtered total
        if (elToday) elToday.textContent = `R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (elMonth) elMonth.textContent = `R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        if (elListCount) elListCount.textContent = `${count} registros encontrados`;
    }

    renderTable() {
        const container = document.getElementById('payment-history-list');
        const controls = document.getElementById('pagination-controls');
        const info = document.getElementById('pagination-info');
        const prevBtn = document.getElementById('btn-prev-page');
        const nextBtn = document.getElementById('btn-next-page');

        if (!container) return;

        const totalItems = this.filteredPayments.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;
        if (this.currentPage > totalPages) this.currentPage = totalPages;

        if (totalItems === 0) {
            container.innerHTML = `<tr><td colspan="5" class="px-6 py-12 text-center text-slate-400 font-medium">Nenhum pagamento registrado no período ou filtro selecionado.</td></tr>`;
            if (controls) controls.classList.add('hidden');
            lucide.createIcons();
            return;
        }

        if (controls && info && prevBtn && nextBtn) {
            controls.classList.remove('hidden');
            info.textContent = `Página ${this.currentPage} de ${totalPages}`;
            prevBtn.disabled = this.currentPage <= 1;
            nextBtn.disabled = this.currentPage >= totalPages;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const pageItems = this.filteredPayments.slice(startIndex, startIndex + this.itemsPerPage);

        container.innerHTML = pageItems.map(p => {
            const date = new Date(p.createdAt);

            let totalInst = '?';
            if (p.loanObj) {
                totalInst = p.loanObj.numInstallments;
            } else if (p.installmentObj && p.installmentObj.loan && p.installmentObj.loan.numInstallments) {
                totalInst = p.installmentObj.loan.numInstallments;
            } else if (p.installmentObj && p.installmentObj.installmentsCount) {
                totalInst = p.installmentObj.installmentsCount;
            }

            const instInfo = p.installmentObj ? `P ${p.installmentObj.number}/${totalInst}` : 'P ---';

            const methodColors = {
                'pix': 'text-teal-600 bg-teal-50 border-teal-100',
                'cartao': 'text-blue-600 bg-blue-50 border-blue-100',
                'transferencia': 'text-purple-600 bg-purple-50 border-purple-100',
                'dinheiro': 'text-emerald-600 bg-emerald-50 border-emerald-100',
                'default': 'text-teal-600 bg-teal-50 border-teal-100'
            };

            const pMethod = (p.method || 'pix').toLowerCase();
            const methodClass = methodColors[pMethod] || methodColors['default'];
            const methodIcon = pMethod === 'pix' ? 'zap' : (pMethod === 'cartao' ? 'credit-card' : (pMethod === 'transferencia' ? 'arrow-right-left' : 'banknote'));

            return `
                <tr class="hover:bg-slate-50 transition-all group">
                    <td class="px-6 py-4">
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-slate-900">${date.toLocaleDateString('pt-BR')}</span>
                            <span class="text-[10px] text-slate-400 uppercase font-bold">${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-xs text-primary border border-primary/20 overflow-hidden shadow-sm shrink-0">
                                ${p.clientObj?.avatar ? `<img src="${p.clientObj.avatar}" class="w-full h-full object-cover">` : (p.clientObj?.name?.charAt(0) || 'S')}
                            </div>
                            <div class="flex flex-col">
                                <span class="text-sm font-bold text-slate-800">${p.clientObj?.name || 'Sistema'}</span>
                                <span class="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                                    <i data-lucide="map-pin" class="w-3 h-3"></i> ${p.city}
                                </span>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="text-xs font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">${instInfo}</span>
                    </td>
                    <td class="px-6 py-4">
                        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${methodClass} shadow-sm">
                            <i data-lucide="${methodIcon}" class="w-3.5 h-3.5"></i>
                            <span class="text-[10px] font-black uppercase tracking-widest">${pMethod}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <span class="text-base font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm">
                            R$ ${parseFloat(p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        lucide.createIcons();
    }

    exportCSV() {
        if (this.filteredPayments.length === 0) return alert("Sem dados para exportar no filtro atual.");
        const headers = ["Data", "Hora", "Cliente", "Cidade", "Parcela", "Forma", "Valor"];
        const rows = this.filteredPayments.map(p => {
            const date = new Date(p.createdAt);

            let totalInst = '?';
            if (p.loanObj) {
                totalInst = p.loanObj.numInstallments;
            } else if (p.installmentObj && p.installmentObj.loan && p.installmentObj.loan.numInstallments) {
                totalInst = p.installmentObj.loan.numInstallments;
            } else if (p.installmentObj && p.installmentObj.installmentsCount) {
                totalInst = p.installmentObj.installmentsCount;
            }

            const instInfo = p.installmentObj ? `P ${p.installmentObj.number}/${totalInst}` : 'N/A';
            return [
                date.toLocaleDateString('pt-BR'),
                date.toLocaleTimeString('pt-BR'),
                p.clientObj?.name || 'Sistema',
                p.city,
                instInfo,
                p.method || 'pix',
                p.amount.toString().replace('.', ',')
            ];
        });
        const csv = [headers, ...rows].map(row => row.join(";")).join("\n");
        const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_pagamentos_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
}
