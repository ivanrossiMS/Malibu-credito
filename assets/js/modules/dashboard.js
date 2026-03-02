import installmentService from '../InstallmentService.js';
import clientService from '../ClientService.js';
import paymentService from '../PaymentService.js';
import loanRequestService from '../LoanRequestService.js';
import loanService from '../LoanService.js';
import DateHelper from '../DateHelper.js';

export default class DashboardModule {
    async init() {
        this.currentMetric = 'receivable';
        this.currentPeriod = 'hoje';
        this.customDateFrom = '';
        this.customDateTo = '';

        this.currentCity = 'all';

        this.installments = [];
        this.clients = [];
        this.payments = [];
        this.requests = [];
        this.loans = [];

        // Pagination limit
        this.listCurrentPage = 1;
        this.listItemsPerPage = 30;

        // Expose handlers to global scope for HTML inline calls
        window.selectMetric = (metric, el) => this.selectMetric(metric, el);
        window.selectPeriod = (period, el) => this.selectPeriod(period, el);
        window.toggleCustomDate = (el) => this.toggleCustomDate(el);
        window.applyCustomDate = () => this.applyCustomDate();
        window.selectCity = (city) => this.selectCity(city);

        window.approvePendingProof = (id) => this.approvePendingProof(id);
        window.rejectPendingProof = (id) => this.rejectPendingProof(id);

        window.prevDetailedPage = () => {
            if (this.listCurrentPage > 1) {
                this.listCurrentPage--;
                this.renderDetailedList();
            }
        };

        window.nextDetailedPage = () => {
            this.listCurrentPage++;
            this.renderDetailedList();
        };

        await this.loadData();
        this.renderStats();

        // Auto-select initial state
        const firstCard = document.querySelector('[data-metric="receivable"]');
        if (firstCard) this.selectMetric('receivable', firstCard);

        const defaultPeriodBtn = document.querySelector('[data-period="hoje"]');
        if (defaultPeriodBtn) this.selectPeriod('hoje', defaultPeriodBtn);

        this.bindEvents();
        this.setupRealtime();
    }

    async loadData() {
        // Run daily heuristic trigger silently in background before loading analytical lists for true precision
        await loanService.updateAllLoansStatus();

        // Injetar Skeletons (Tratamento Anti-Bloqueio Visual / Lazy UI)
        this.renderStatsSkeleton();

        try {
            // Paraleliza eficientemente as 5 requisições atômicas de carga primária do dashboard (Tempo = 1x a maior request)
            const [installments, clients, payments, requests, loans] = await Promise.all([
                installmentService.getAll(),
                clientService.getAll(),
                paymentService.getAll(),
                loanRequestService.getAll(),
                loanService.getAll()
            ]);

            this.installments = installments;
            this.clients = clients;
            this.payments = payments;
            this.requests = requests;
            this.loans = loans;
            this.populateCities();
        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error);
        }
    }

    renderStatsSkeleton() {
        // Mantém a experiência amigável na SPA antes dos dados chegarem do Banco (Prevenção Flash)
        const selectors = [
            'total-receivable', 'total-overdue', 'total-received', 'total-clients'
        ];

        selectors.forEach(id => {
            const el = document.getElementById(`stat-${id}`);
            if (el) el.innerHTML = `<div class="h-6 w-24 bg-slate-200 animate-pulse rounded"></div>`;
        });

        const listContainer = document.getElementById('details-list');
        if (listContainer) {
            listContainer.innerHTML = Array(5).fill(`
                <div class="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl animate-pulse">
                    <div class="flex gap-4 items-center">
                        <div class="w-12 h-12 bg-slate-100 rounded-xl"></div>
                        <div class="space-y-2"><div class="h-4 w-32 bg-slate-100 rounded"></div><div class="h-3 w-20 bg-slate-50 rounded"></div></div>
                    </div>
                </div>
            `).join('');
        }
    }

    renderStats() {
        const overdue = this.installments.filter(i => {
            const status = (i.status || '').toLowerCase();
            return status === 'atrasada' || (status === 'pendente' && DateHelper.isPast(i.dueDate));
        });
        this.renderCriticalAlertsSidebar(overdue);

        const totalClientsEl = document.getElementById('stat-total-clients');
        if (totalClientsEl) totalClientsEl.textContent = this.clients.length.toString();

        // Set current username securely to the view
        const user = window.auth ? window.auth.currentUser : null;
        if (user) {
            const displayName = user.name || user.email || 'Usuário';
            document.querySelectorAll('.user-name-welcome').forEach(el => el.textContent = displayName.split(' ')[0]);
        }

        this.renderPendingRequests();
        this.renderPendingProofs();
        this.updateCards();
    }

    renderPendingRequests() {
        const statRequests = document.getElementById('stat-pending-requests');
        if (statRequests) {
            const pending = this.requests.filter(r => r.status === 'pendente');
            statRequests.textContent = pending.length.toString();
        }
    }

    renderAIInsights() {
        // Encontrar parágrafo do insight
        const insightCard = document.querySelector('.bg-slate-900.shadow-2xl');
        if (!insightCard) return;
        const msgEl = insightCard.querySelector('p.italic');
        if (!msgEl) return;

        const receivableVars = this.getFilteredData('receivable');
        const overdueVars = this.getFilteredData('overdue');

        const overdueCount = overdueVars.length;
        const overdueValue = overdueVars.reduce((sum, i) => sum + (parseFloat(i.installmentValue || i.amount) || 0), 0);
        const recCount = receivableVars.length;

        let periodName = "neste período";
        if (this.currentPeriod === 'hoje') periodName = "de hoje";
        if (this.currentPeriod === 'amanha') periodName = "de amanhã";
        if (this.currentPeriod === 'ontem') periodName = "de ontem";
        if (this.currentPeriod === 'mes') periodName = "deste mês";

        let insightText = '';
        if (overdueCount > 0) {
            insightText = `"Atenção: Você tem ${overdueCount} parcelas filtradas em atraso totalizando R$ ${overdueValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Priorize a renegociação para manter a saúde do caixa."`;
        } else if (recCount > 0) {
            insightText = `"Otimize seu fluxo focando nas cobranças ${periodName}. Há ${recCount} parcela(s) aguardando liquidação neste intervalo."`;
        } else {
            insightText = `"Excelente cenário! O filtro ${periodName} não possui pendências ou atrasos críticos. É um ótimo momento para prospectar novos clientes."`;
        }

        msgEl.textContent = insightText;

        // Botão
        const actionBtn = document.getElementById('action-plan-btn');
        if (actionBtn) {
            actionBtn.onclick = () => {
                if (overdueCount > 0) {
                    window.location.href = '?page=installments&status=atrasada';
                } else if (recCount > 0) {
                    window.location.href = '?page=installments&status=pendente';
                } else {
                    window.location.href = '?page=clients';
                }
            };
        }
    }

    renderCriticalAlertsSidebar(overdue) {
        const container = document.getElementById('critical-alerts');
        if (!container) return;
        const top = overdue.sort((a, b) => parseFloat(b.installmentValue || b.amount || 0) - parseFloat(a.installmentValue || a.amount || 0)).slice(0, 3);

        if (top.length === 0) {
            container.innerHTML = `
                <div class="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <i data-lucide="shield-check" class="w-10 h-10 text-slate-300 mx-auto mb-3"></i>
                    <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Sem alertas críticos</p>
                </div>
            `;
            return;
        }

        container.innerHTML = top.map(i => {
            const todayStr = DateHelper.getTodayStr();
            const dueStr = DateHelper.toLocalYYYYMMDD(i.dueDate);
            const diffDays = DateHelper.getDiffDays(dueStr, todayStr);

            return `
            <div class="flex gap-4 items-start p-4 bg-rose-50 rounded-2xl border border-rose-100 cursor-pointer hover:bg-rose-100 transition-colors shadow-sm" onclick="window.location.href='?page=installments&status=atrasada&client_id=${i.loan?.clientId || i.clientId || i.client?.id || ''}'">
                <div class="bg-rose-100 p-2.5 rounded-xl text-rose-600 shadow-inner shrink-0"><i data-lucide="skull" class="w-5 h-5"></i></div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start mb-1">
                        <p class="text-sm font-black text-rose-900 truncate pr-2">${i.client?.name || 'Cliente Sem Nome'}</p>
                        <p class="text-sm font-black text-rose-700 whitespace-nowrap">R$ ${parseFloat(i.installmentValue || i.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    
                    <div class="flex items-center gap-2 mb-1">
                        <span class="bg-white/60 px-2 py-0.5 rounded text-[10px] font-bold text-rose-600 tracking-widest uppercase border border-rose-200 shadow-sm">
                            PARCELA ${i.number} / ${i.loan?.numInstallments || '?'}
                        </span>
                    </div>
                    
                    <div class="flex justify-between items-center text-[10px] font-bold text-rose-500 uppercase tracking-widest w-full">
                        <span class="flex items-center gap-1 opacity-80"><i data-lucide="calendar-x" class="w-3 h-3"></i> Vencido: ${DateHelper.formatLocal(i.dueDate)}</span>
                        <span class="flex items-center gap-1 bg-rose-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                           <i data-lucide="clock-4" class="w-3 h-3"></i> ${diffDays} DIAS ATRASO
                        </span>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        lucide.createIcons();
    }

    /* Handlers */
    selectMetric(metric, element) {
        this.currentMetric = metric;
        this.listCurrentPage = 1;

        // Update UI
        document.querySelectorAll('.filter-card').forEach(c => {
            c.classList.remove('ring-primary/50');
            c.classList.add('ring-transparent');
        });
        element.classList.remove('ring-transparent');
        element.classList.add('ring-primary/50');

        // Ocultar Div global de Períodos para a Base de Clientes (onde só a Cidade importa)
        const periodFiltersGroup = document.querySelector('.filter-period')?.closest('div');
        if (metric === 'clients') {
            if (periodFiltersGroup) periodFiltersGroup.style.display = 'none';
        } else {
            if (periodFiltersGroup) periodFiltersGroup.style.display = 'flex';
        }

        // Detail Filter Visibility Logic
        const filterSets = {
            'receivable': ['hoje', 'amanha', '7dias', 'mes', 'ano', 'personalizado'],
            'overdue': ['hoje', 'ontem', 'mes', 'ano', 'personalizado'],
            'received': ['hoje', 'ontem', 'mes', 'ano', 'personalizado'],
            'clients': []
        };

        const allowedPeriods = filterSets[metric] || [];

        document.querySelectorAll('.filter-period').forEach(btn => {
            const period = btn.getAttribute('data-period');
            if (allowedPeriods.includes(period)) {
                btn.style.display = 'flex';
            } else {
                btn.style.display = 'none';
            }
        });

        // Ensure a valid period is selected if the current one becomes hidden
        if (metric !== 'clients' && !allowedPeriods.includes(this.currentPeriod)) {
            const defaultPeriod = allowedPeriods[0] || 'hoje';
            const defaultBtn = document.querySelector(`.filter-period[data-period="${defaultPeriod}"]`);
            this.selectPeriod(defaultPeriod, defaultBtn);
        }

        // Update titles
        const titles = {
            'receivable': { t: 'A Receber', s: 'Valores aguardando pagamento' },
            'overdue': { t: 'Em Atraso', s: 'Status crítico de inadimplência' },
            'received': { t: 'Pagamentos Recebidos', s: 'Entradas consolidadas no caixa' },
            'clients': { t: 'Base de Clientes', s: 'Visão de perfis e cadastros' }
        };
        const titleEl = document.getElementById('detail-title');
        const subtitleEl = document.getElementById('detail-subtitle');
        if (titleEl) titleEl.textContent = titles[metric].t;
        if (subtitleEl) subtitleEl.textContent = titles[metric].s;

        this.renderDetailedList();
    }

    selectPeriod(period, element) {
        this.currentPeriod = period;
        this.listCurrentPage = 1;

        document.querySelectorAll('.filter-period').forEach(b => {
            b.classList.remove('bg-white', 'text-primary', 'shadow-sm');
            b.classList.add('text-slate-500');
        });

        if (element) {
            element.classList.remove('text-slate-500');
            element.classList.add('bg-white', 'text-primary', 'shadow-sm');
        }

        if (period !== 'personalizado') {
            document.getElementById('custom-date-container').classList.add('hidden');
            this.renderDetailedList();
            this.updateCards();
        }
    }

    toggleCustomDate(element) {
        this.selectPeriod('personalizado', element);
        document.getElementById('custom-date-container').classList.remove('hidden');
    }

    applyCustomDate() {
        this.customDateFrom = document.getElementById('date-from').value;
        this.customDateTo = document.getElementById('date-to').value;
        if (!this.customDateFrom || !this.customDateTo) {
            alert('Por favor, preencha ambas as datas!');
            return;
        }
        this.listCurrentPage = 1;
        this.renderDetailedList();
        this.updateCards();
    }

    populateCities() {
        const cityFilter = document.getElementById('city-filter');
        if (!cityFilter) return;

        const cities = [...new Set(this.clients.map(c => c.city).filter(Boolean))].sort();

        let html = '<option value="all">Todas Cidades</option>';
        cities.forEach(city => {
            html += `<option value="${city}">${city}</option>`;
        });

        cityFilter.innerHTML = html;
        cityFilter.value = this.currentCity;
    }

    selectCity(city) {
        this.currentCity = city;
        this.listCurrentPage = 1;
        this.renderDetailedList();
        this.updateCards();
    }

    getFilteredData(metric) {
        let baseData = [];
        if (metric === 'receivable') {
            baseData = this.installments.filter(i => i.status === 'PENDING');
        } else if (metric === 'overdue') {
            baseData = this.installments.filter(i => {
                const status = (i.status || '').toUpperCase(); // Ensure status is uppercase for comparison
                return status === 'OVERDUE' || (status === 'PENDING' && DateHelper.isPast(i.dueDate));
            });
        } else if (metric === 'received') {
            baseData = this.payments;
        } else if (metric === 'clients') {
            baseData = this.clients;
        }

        // Apply city filter
        let data = baseData;
        if (this.currentCity !== 'all') {
            data = data.filter(item => {
                if (metric === 'clients') {
                    return item.city === this.currentCity;
                } else {
                    let clientId = item.clientId;
                    if (!clientId && item.client && item.client.id) clientId = item.client.id; // handle nested client
                    if (!clientId && item.installment && item.installment.loan) clientId = item.installment.loan.clientId; // handle legacy nested payment structure
                    const c = this.clients.find(x => String(x.id) === String(clientId));
                    return c && c.city === this.currentCity;
                }
            });
        }

        if (metric === 'clients') {
            return data;
        }

        const todayStr = DateHelper.getTodayStr();
        const tomorrowStr = DateHelper.addDays(todayStr, 1);
        const yesterdayStr = DateHelper.addDays(todayStr, -1);

        let startFilter, endFilter;
        let actualPeriod = this.currentPeriod;

        if (actualPeriod === 'hoje') {
            startFilter = todayStr; endFilter = todayStr;
        } else if (actualPeriod === 'ontem') {
            startFilter = yesterdayStr; endFilter = yesterdayStr;
        } else if (actualPeriod === '3dias') {
            startFilter = DateHelper.addDays(todayStr, -3);
            endFilter = yesterdayStr;
        } else if (actualPeriod === 'amanha') {
            startFilter = tomorrowStr; endFilter = tomorrowStr;
        } else if (actualPeriod === '7dias') {
            startFilter = todayStr;
            endFilter = DateHelper.addDays(todayStr, 7);
        } else if (actualPeriod === 'mes') {
            const now = new Date();
            startFilter = DateHelper.toLocalYYYYMMDD(new Date(now.getFullYear(), now.getMonth(), 1));
            endFilter = DateHelper.toLocalYYYYMMDD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        } else if (actualPeriod === 'ano') {
            const now = new Date();
            startFilter = `${now.getFullYear()}-01-01`;
            endFilter = `${now.getFullYear()}-12-31`;
        } else if (actualPeriod === 'personalizado') {
            startFilter = this.customDateFrom;
            endFilter = this.customDateTo;
        }

        return data.filter(item => {
            let itemDateStr = metric === 'received' ? (item.paymentDate || item.createdAt) : item.dueDate;
            if (!itemDateStr) return false;
            const itemDateLocal = DateHelper.toLocalYYYYMMDD(itemDateStr);

            // Fix for overdue metric: it should show items up to today if we are in "Today" period
            // OR simply follow the period filters. The getFilteredData(overdue) already includes items where isPast(dueDate)
            return itemDateLocal >= startFilter && itemDateLocal <= endFilter;
        });
    }

    updateCards() {
        if (this.installments.length === 0 && this.payments.length === 0) return;

        const receivableData = this.getFilteredData('receivable');
        const overdueData = this.getFilteredData('overdue');
        const receivedData = this.getFilteredData('received');

        const receivableTotal = receivableData.reduce((sum, i) => sum + (parseFloat(i.installmentValue || i.amount) || 0), 0);
        const overdueTotal = overdueData.reduce((sum, i) => sum + (parseFloat(i.installmentValue || i.amount) || 0), 0);
        const receivedTotal = receivedData.reduce((sum, p) => sum + (parseFloat(p.amount || p.installmentValue) || 0), 0);

        // Puxa a base de clientes com o filtro atual (Cidade)
        const clientsData = this.getFilteredData('clients');
        const clientsTotal = clientsData.length;

        const recTodayEl = document.getElementById('stat-receivable-today');
        const overCountEl = document.getElementById('stat-overdue-count');
        const overTotalEl = document.getElementById('stat-overdue-total');
        const recMonthEl = document.getElementById('stat-received-month');
        const clientsTotalEl = document.getElementById('stat-total-clients');

        if (recTodayEl) recTodayEl.textContent = `R$ ${receivableTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (overTotalEl) overTotalEl.textContent = `R$ ${overdueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (recMonthEl) recMonthEl.textContent = `R$ ${receivedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (overCountEl) overCountEl.textContent = `${overdueData.length} parcelas`;
        if (clientsTotalEl) clientsTotalEl.textContent = clientsTotal;

        let periodLabel = 'ESTE MÊS';
        if (this.currentPeriod === 'hoje') periodLabel = 'HOJE';
        else if (this.currentPeriod === 'ontem') periodLabel = 'ONTEM';
        else if (this.currentPeriod === '3dias') periodLabel = 'ATÉ 3 DIAS';
        else if (this.currentPeriod === 'amanha') periodLabel = 'AMANHÃ';
        else if (this.currentPeriod === '7dias') periodLabel = '7 DIAS';
        else if (this.currentPeriod === 'mes') periodLabel = 'ESTE MÊS';
        else if (this.currentPeriod === 'ano') periodLabel = 'ESTE ANO';
        else if (this.currentPeriod === 'personalizado') periodLabel = 'CUSTOM';

        const badgeReceivable = document.getElementById('badge-receivable');
        const badgeOverdue = document.getElementById('badge-overdue');
        const badgeReceived = document.getElementById('badge-received');

        if (badgeReceivable) badgeReceivable.textContent = periodLabel;
        if (badgeOverdue) badgeOverdue.textContent = periodLabel;
        if (badgeReceived) {
            badgeReceived.textContent = (this.currentPeriod === 'personalizado') ? 'CUSTOM' : periodLabel;
        }

        // Executar Insight IA Baseado no array Filtrado
        this.renderAIInsights();
    }

    /* Render Logic engine */
    renderDetailedList() {
        const listEl = document.getElementById('detailed-results-list');
        if (!listEl) return;
        listEl.innerHTML = '<div class="text-center text-slate-400 py-10 font-bold">Processando...</div>';

        let data = this.getFilteredData(this.currentMetric);

        // 3. RENDER UI
        if (data.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-16 flex flex-col items-center justify-center gap-3">
                    <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-2">
                         <i data-lucide="inbox" class="w-8 h-8 text-slate-300"></i>
                    </div>
                    <h3 class="text-slate-800 font-black text-lg">Nenhum registro</h3>
                    <p class="text-slate-500 text-sm font-medium">Não há dados que correspondam a este filtro.</p>
                </div>
            `;
            lucide.createIcons();

            const paginationEl = document.getElementById('detailed-list-pagination');
            if (paginationEl) paginationEl.classList.add('hidden');
            return;
        }

        // Sort Data
        if (this.currentMetric !== 'clients') {
            data.sort((a, b) => {
                const dA = DateHelper.toLocalYYYYMMDD(a.paymentDate || a.createdAt || a.dueDate);
                const dB = DateHelper.toLocalYYYYMMDD(b.paymentDate || b.createdAt || b.dueDate);
                return this.currentMetric === 'received' ? (dB < dA ? -1 : 1) : (dA < dB ? -1 : 1);
            });
        }

        // Pagination logic
        const totalItems = data.length;
        const totalPages = Math.ceil(totalItems / this.listItemsPerPage) || 1;
        if (this.listCurrentPage > totalPages) this.listCurrentPage = totalPages;

        const startIdx = (this.listCurrentPage - 1) * this.listItemsPerPage;
        const pageItems = data.slice(startIdx, startIdx + this.listItemsPerPage);

        // Update pagination UI
        const paginationEl = document.getElementById('detailed-list-pagination');
        const prevBtn = document.getElementById('list-prev');
        const nextBtn = document.getElementById('list-next');
        const pageInfo = document.getElementById('list-page-info');

        if (paginationEl) {
            paginationEl.classList.remove('hidden');
            if (totalItems <= this.listItemsPerPage) {
                paginationEl.classList.add('hidden');
            } else {
                if (pageInfo) pageInfo.textContent = `Página ${this.listCurrentPage} de ${totalPages}`;
                if (prevBtn) prevBtn.disabled = this.listCurrentPage === 1;
                if (nextBtn) nextBtn.disabled = this.listCurrentPage === totalPages || totalItems === 0;
            }
        }

        let html = '';

        pageItems.forEach(item => {
            if (this.currentMetric === 'clients') {
                const cityDisplay = item.city ? ` - ${item.city}` : '';
                html += `
                    <div class="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 transition-colors shadow-sm">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm uppercase border border-primary/20 overflow-hidden shadow-sm shrink-0">
                                ${item.avatar ? `<img src="${item.avatar}" class="w-full h-full object-cover">` : (item.name ? item.name.charAt(0) : '?')}
                            </div>
                            <div>
                                <p class="text-sm font-bold text-slate-800">${item.name}<span class="text-slate-500 font-medium">${cityDisplay}</span></p>
                                <p class="text-xs text-slate-500">${item.phone || 'Sem telefone'}</p>
                            </div>
                        </div>
                        <button onclick="window.location.href='?page=clients'" class="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                            <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </button>
                    </div>
                `;
            } else if (this.currentMetric === 'received') {
                // ... logic to find inst and loan ...
                const inst = item.installment || this.installments.find(i => String(i.id) === String(item.installmentId || item.installment_id));
                const loanId = inst ? (inst.loanid || inst.loanId || (inst.loan && inst.loan.id)) : null;
                const loan = loanId ? this.loans.find(l => String(l.id) === String(loanId)) : (inst && inst.loan ? inst.loan : null);
                const cId = item.clientId || (item.client && item.client.id) || (loan && loan.clientId) || (inst && inst.client && inst.client.id);
                const c = this.clients.find(x => String(x.id) === String(cId)) || item.client || (inst && inst.client) || { name: 'Desconhecido', city: '' };

                const instNumber = inst ? inst.number : '?';
                const instTotal = loan ? loan.numInstallments : '?';

                const dtPaid = DateHelper.formatLocal(item.paymentDate || item.createdAt);
                const dtDue = DateHelper.formatLocal(inst?.dueDate);
                const cityDisplay = c.city ? ` - ${c.city}` : '';

                html += `
                    <div class="flex items-center justify-between p-4 bg-white rounded-2xl border border-emerald-100 transition-colors shadow-sm">
                        <div class="flex items-center gap-3">
                            <div class="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 shadow-inner shrink-0"><i data-lucide="check-circle" class="w-5 h-5"></i></div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-black text-emerald-900 truncate pr-2">${c.name || 'Cliente Sem Nome'}<span class="text-slate-500 font-medium ml-1">${cityDisplay}</span></p>
                                
                                <div class="flex items-center gap-2 mt-1 mb-1">
                                    <span class="bg-white/60 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-600 tracking-widest uppercase border border-emerald-200 shadow-sm">
                                        PARCELA ${instNumber} / ${instTotal}
                                    </span>
                                }
                                
                                <div class="flex items-center text-[10px] font-bold text-emerald-600/80 uppercase tracking-widest gap-3">
                                    <span class="flex items-center gap-1"><i data-lucide="calendar-check" class="w-3 h-3"></i> PAGO: ${dtPaid}</span>
                                    <span class="flex items-center gap-1 opacity-70"><i data-lucide="calendar-clock" class="w-3 h-3"></i> VENC: ${dtDue}</span>
                                </div>
                            </div>
                        </div>
                        <div class="text-right flex items-center gap-4">
                             <p class="text-sm font-black text-slate-900">R$ ${parseFloat(item.amount || item.installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                             <button onclick="window.location.href='?page=installments'" class="w-8 h-8 rounded-full bg-slate-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                <i data-lucide="arrow-right" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                `;
            } else {
                const c = item.client || this.clients.find(x => String(x.id) === String(item.clientId)) || { name: 'Desconhecido', city: '' };
                const dt = DateHelper.formatLocal(item.dueDate);
                const status = (item.status || '').toLowerCase();
                const isLate = status === 'overdue' || ((status === 'pending' || status === 'vendedora_pendente') && DateHelper.isPast(item.dueDate));
                const isToday = !isLate && (status === 'pending' || status === 'vencendo') && DateHelper.isToday(item.dueDate);

                const color = isLate ? 'rose' : (isToday ? 'amber' : 'blue');
                const icon = isLate ? 'alert-circle' : (isToday ? 'clock' : 'calendar-clock');

                const loan = this.loans.find(l => String(l.id) === String(item.loanid || item.loanId));
                const totalInstCount = loan ? loan.numInstallments : '?';
                const cityDisplay = c.city ? ` - ${c.city}` : '';

                html += `
                    <div class="flex items-center justify-between p-4 bg-white rounded-2xl border border-${color}-100 transition-all shadow-sm hover:shadow-md group">
                        <div class="flex items-center gap-3">
                            <div class="bg-${color}-50 p-2.5 rounded-xl text-${color}-600 shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                                <i data-lucide="${icon}" class="w-5 h-5"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-black text-slate-800 truncate pr-2 group-hover:text-${color}-700 transition-colors">
                                    ${c.name || 'Cliente Sem Nome'}<span class="text-slate-500 font-medium ml-1">${cityDisplay}</span>
                                </p>
                                
                                <div class="flex items-center gap-2 mt-1 mb-1">
                                    <span class="bg-${color}-50 px-2 py-0.5 rounded text-[10px] font-bold text-${color}-600 tracking-widest uppercase border border-${color}-100 shadow-sm">
                                        PARCELA ${item.number} / ${totalInstCount}
                                    </span>
                                </div>
                                
                                <div class="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest gap-3">
                                    <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3 text-${color}-500"></i> VENCMENTO: ${dt}</span>
                                </div>
                            </div>
                        </div>
                        <div class="text-right flex items-center gap-4">
                             <div class="flex flex-col items-end">
                                 <p class="text-sm font-black text-slate-900">R$ ${parseFloat(item.installmentValue || item.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                 <span class="text-[9px] font-black uppercase tracking-tighter text-${color}-500">${isLate ? 'Vencida' : (isToday ? 'Hoje' : 'Disponível')}</span>
                             </div>
                             <button onclick="window.location.href='?page=installments'" class="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-${color}-500 hover:text-white transition-all shadow-sm">
                                <i data-lucide="arrow-right" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                `;
            }
        });

        listEl.innerHTML = html;
        lucide.createIcons();
    }

    bindEvents() {
        const newLoanBtn = document.getElementById('new-loan-btn');
        if (newLoanBtn) {
            newLoanBtn.onclick = () => window.location.href = '?page=loans';
        }
    }

    renderPendingProofs() {
        const container = document.getElementById('pending-proofs-card');
        const listContainer = document.getElementById('pending-proofs-list');
        const countBadge = document.getElementById('pending-proofs-count');

        if (!container || !listContainer) return;

        // Filter installments that have proof and are not paid
        const pending = this.installments.filter(i => {
            const status = (i.status || '').toLowerCase();
            return i.proof && status !== 'paid'; // Changed 'paga' to 'paid'
        });

        if (pending.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        if (countBadge) countBadge.textContent = pending.length;

        listContainer.innerHTML = pending.map(i => {
            const client = i.client || this.clients.find(c => String(c.id) === String(i.loan?.clientId || i.clientId)) || { name: 'Cliente Desconhecido' };
            const amount = parseFloat(i.installmentValue || i.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const whatsappLink = `https://wa.me/55${(client.phone || '').replace(/\D/g, '')}`;

            return `
                <div class="p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50 hover:bg-amber-100/50 transition-all group">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-amber-600 border border-amber-100">
                                <i data-lucide="file-text" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <p class="text-sm font-black text-slate-900 truncate max-w-[150px]">${client.name}</p>
                                <p class="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Parcela ${i.number} • R$ ${amount}</p>
                                <div class="flex flex-col gap-0.5">
                                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                        <i data-lucide="calendar" class="w-2.5 h-2.5"></i> Vencimento: ${DateHelper.formatLocal(i.dueDate)}
                                    </p>
                                    <p class="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter flex items-center gap-1">
                                        <i data-lucide="clock" class="w-2.5 h-2.5"></i> Envio: ${DateHelper.formatLocal(i.updatedAt || i.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <a href="${whatsappLink}" target="_blank" class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm" title="Falar no WhatsApp">
                            <i data-lucide="message-circle" class="w-4 h-4"></i>
                        </a>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2">
                        <button data-id="${i.id}" class="view-pending-proof bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                            <i data-lucide="eye" class="w-3.5 h-3.5"></i> Ver
                        </button>
                        <button onclick="approvePendingProof(${i.id})" class="bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Aprovar
                        </button>
                    </div>
                    
                    <button onclick="rejectPendingProof(${i.id})" class="w-full mt-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors py-1">Descartar Comprovante</button>
                </div>
            `;
        }).join('');

        // Bind view events safely
        listContainer.querySelectorAll('.view-pending-proof').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const inst = this.installments.find(x => String(x.id) === String(id));
                if (inst && inst.proof) window.viewProof(inst.proof);
            };
        });

        lucide.createIcons();
    }

    async approvePendingProof(id) {
        if (!confirm('Deseja aprovar este pagamento e dar baixa na parcela?')) return;

        try {
            const inst = this.installments.find(i => String(i.id) === String(id));
            if (!inst) return;

            await paymentService.registerPayment({
                installmentId: inst.id,
                amount: inst.installmentValue || inst.amount || 0,
                method: 'pix',
                notes: 'Aprovação de comprovante enviado pelo cliente (Dashboard)',
                paymentDate: DateHelper.getTodayStr()
            });

            // Refresh data locally
            await this.loadData();
            this.renderStats();
            alert('Pagamento aprovado com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao aprovar pagamento.');
        }
    }

    async rejectPendingProof(id) {
        if (!confirm('Deseja descartar este comprovante? O cliente precisará enviar novamente.')) return;

        try {
            await installmentService.updateProof(id, null);
            await this.loadData();
            this.renderStats();
        } catch (error) {
            console.error(error);
            alert('Erro ao descartar comprovante.');
        }
    }
}

