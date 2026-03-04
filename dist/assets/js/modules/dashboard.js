import installmentService from '../InstallmentService.js';
import clientService from '../ClientService.js';
import paymentService from '../PaymentService.js';
import loanRequestService from '../LoanRequestService.js';
import loanService from '../LoanService.js';
import DateHelper from '../DateHelper.js';
import storage from '../StorageService.js';

export default class DashboardModule {
    // ── STATE ─────────────────────────────────────────────────────
    filters = { period: 'tudo', dateFrom: '', dateTo: '', city: 'all', status: 'todos', search: '' };
    data = { installments: [], clients: [], payments: [], requests: [], loans: [] };
    ui = { tab: 'a-vencer', view: 'operational', page: 1, perPage: 25 };
    _searchTimer = null;

    // ── INIT ──────────────────────────────────────────────────────
    async init() {
        this._exposeGlobals();
        await this.loadData();
        this._populateCities();
        this._renderAll();
        this.renderAsaasHealth();
    }

    _exposeGlobals() {
        window.dash_setPeriod = (p, el) => this.setPeriod(p, el);
        window.dash_applyCustomDate = () => this.applyCustomDate();
        window.dash_setCity = (v) => this.setFilter('city', v);
        window.dash_setStatus = (v) => this.setFilter('status', v);
        window.dash_onSearch = (v) => { clearTimeout(this._searchTimer); this._searchTimer = setTimeout(() => this.setFilter('search', v.trim().toLowerCase()), 300); };
        window.dash_clearFilters = () => this.clearFilters();
        window.dash_setTab = (t) => this.setTab(t);
        window.dash_toggleView = (m) => this.toggleView(m);
        window.dash_prevPage = () => { if (this.ui.page > 1) { this.ui.page--; this._renderTab(); } };
        window.dash_nextPage = () => { this.ui.page++; this._renderTab(); };
        window.dash_exportCSV = () => this.exportCSV();
        window.dash_toggleMobileFilters = () => document.getElementById('mobile-filter-drawer')?.classList.toggle('hidden');
        window.dash_openWhatsapp = (phone, name, amount, due) => {
            const msg = encodeURIComponent(`Olá ${name}! Lembrando do pagamento de R$${amount} com venc. ${due}. Qualquer dúvida, estamos à disposição!`);
            window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
        };
        window.dash_copyChargeMsg = (name, amount, due) => {
            const msg = `Olá ${name}! Sua parcela de R$${amount} venceu em ${due}. Por favor, entre em contato para regularizar.`;
            navigator.clipboard?.writeText(msg).catch(() => { });
        };
        window.dash_registerPayment = (id) => window.location.href = `?page=installments&highlight=${id}`;
        window.approvePendingProof = (id) => this._approveProof(id);
        window.rejectPendingProof = (id) => this._rejectProof(id);
    }

    // ── LOAD DATA ─────────────────────────────────────────────────
    async loadData() {
        try {
            await loanService.updateAllLoansStatus().catch(() => { });
            const [installments, clients, payments, requests, loans] = await Promise.all([
                installmentService.getAll(),
                clientService.getAll(),
                paymentService.getAll(),
                loanRequestService.getAll(),
                loanService.getAll()
            ]);
            this.data = { installments, clients, payments, requests, loans };
        } catch (e) { console.error('Dashboard loadData:', e); }
    }

    // ── DATE RANGE ────────────────────────────────────────────────
    _getRange() {
        if (this.filters.period === 'tudo') return { s: '', e: '' };
        const today = DateHelper.getTodayStr();
        const add = (d, n) => DateHelper.addDays(d, n);
        const p = this.filters.period;
        if (p === 'hoje') return { s: today, e: today };
        if (p === 'amanha') return { s: add(today, 1), e: add(today, 1) };
        if (p === '7dias') return { s: today, e: add(today, 7) };
        if (p === '30dias') return { s: today, e: add(today, 30) };
        if (p === 'ano') { const y = new Date().getFullYear(); return { s: `${y}-01-01`, e: `${y}-12-31` }; }
        if (p === 'personalizado') return { s: this.filters.dateFrom, e: this.filters.dateTo };
        // mes (default)
        const now = new Date();
        return {
            s: DateHelper.toLocalYYYYMMDD(new Date(now.getFullYear(), now.getMonth(), 1)),
            e: DateHelper.toLocalYYYYMMDD(new Date(now.getFullYear(), now.getMonth() + 1, 0))
        };
    }

    _inRange(dateStr, range) {
        if (!range.s && !range.e) return true; // 'tudo' — sem filtro de data
        if (!dateStr) return false;
        const d = DateHelper.toLocalYYYYMMDD(dateStr);
        return d >= range.s && d <= range.e;
    }

    _matchSearch(item) {
        if (!this.filters.search) return true;
        const q = this.filters.search;
        const c = item.client || this.data.clients.find(x => String(x.id) === String(item.clientId || item.client_id));
        const name = (c?.name || item.name || '').toLowerCase();
        const cpf = (c?.cpf || item.cpf || '').toLowerCase();
        const loan = item.loan || this.data.loans.find(l => String(l.id) === String(item.loanid || item.loanId));
        const code = (loan?.code || '').toLowerCase();
        return name.includes(q) || cpf.includes(q) || code.includes(q);
    }

    _matchCity(item) {
        if (this.filters.city === 'all') return true;
        const c = item.client || this.data.clients.find(x => String(x.id) === String(item.clientId || item.client_id));
        return c?.city === this.filters.city;
    }

    // ── FILTER SETS ───────────────────────────────────────────────
    _getOverdue() {
        return this.data.installments.filter(i => {
            const st = (i.status || '').toUpperCase();
            return (st === 'OVERDUE' || (st === 'PENDING' && DateHelper.isPast(i.dueDate))) && this._matchSearch(i) && this._matchCity(i);
        });
    }

    _getReceivable(range) {
        return this.data.installments.filter(i => {
            const st = (i.status || '').toUpperCase();
            if (st !== 'PENDING') return false;
            if (!DateHelper.isPast(i.dueDate) === false && st !== 'PENDING') return false;
            return this._inRange(i.dueDate, range) && this._matchSearch(i) && this._matchCity(i);
        }).filter(i => !DateHelper.isPast(i.dueDate));
    }

    _getPaid(range) {
        return this.data.payments.filter(p => this._inRange(p.paymentDate || p.createdAt, range) && this._matchSearch(p) && this._matchCity(p));
    }

    _getDue48h() {
        const today = DateHelper.getTodayStr();
        const in48 = DateHelper.addDays(today, 2);
        return this.data.installments.filter(i => {
            const st = (i.status || '').toUpperCase();
            if (st !== 'PENDING') return false;
            const d = DateHelper.toLocalYYYYMMDD(i.dueDate);
            return d >= today && d <= in48;
        });
    }

    // ── KPIs ──────────────────────────────────────────────────────
    _computeKPIs() {
        const range = this._getRange();
        const receivable = this._getReceivable(range);
        const overdue = this._getOverdue();
        const paid = this._getPaid(range);
        const due48h = this._getDue48h();

        const sum = (arr, f = 'installmentValue') => arr.reduce((s, i) => s + (parseFloat(i[f] || i.amount || 0) || 0), 0);
        const fmt = v => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const allPending = this.data.installments.filter(i => (i.status || '').toUpperCase() === 'PENDING' && !DateHelper.isPast(i.dueDate));
        const totalInstWithActive = new Set(allPending.map(i => i.clientId || i.client?.id)).size;

        // Ticket médio: usa pagamentos (campo amount) OU parcelas pagas (installmentValue)
        let avgBase = paid.filter(p => parseFloat(p.amount || 0) > 0);
        let avgVal = 0;
        if (avgBase.length > 0) {
            avgVal = avgBase.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) / avgBase.length;
        } else {
            // fallback: parcelas com status PAID no período
            const paidInst = this.data.installments.filter(i => (i.status || '').toUpperCase() === 'PAID' && this._inRange(i.dueDate || i.updatedAt, range));
            if (paidInst.length > 0) avgVal = paidInst.reduce((s, i) => s + (parseFloat(i.installmentValue || 0) || 0), 0) / paidInst.length;
        }

        return {
            receivable, overdue, paid, due48h,
            kpiReceivable: { v: fmt(sum(receivable)), c: receivable.length },
            kpiDue48h: { v: fmt(sum(due48h)), c: due48h.length },
            kpiOverdue: { v: fmt(sum(overdue)), c: overdue.length },
            kpiReceived: { v: fmt(sum(paid, 'amount')), c: paid.length },
            kpiAvgTicket: avgVal > 0 ? fmt(avgVal) : 'R$ —',
            kpiClients: totalInstWithActive
        };
    }

    // ── RENDER ALL ────────────────────────────────────────────────
    _renderAll() {
        this._renderHeader();
        this._renderKPIs();
        this._renderQuickActions();
        this._renderTab();
        this._renderRight();
        if (this.ui.view === 'executive') this._renderExecutive();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    _renderHeader() {
        const user = window.auth?.currentUser;
        if (user) {
            const name = (user.name || user.email || 'Usuário').split(' ')[0];
            document.querySelectorAll('.user-name-welcome').forEach(el => el.textContent = name);
        }
        // Company badge
        const badge = document.getElementById('dash-company-badge');
        if (badge && window.auth?.currentCompany?.name) {
            badge.textContent = window.auth.currentCompany.name;
            badge.classList.remove('hidden');
        }
        // Period label
        const lbl = document.getElementById('dash-period-label');
        if (lbl) {
            const r = this._getRange();
            const fmt = d => { if (!d) return ''; const [y, m, dy] = d.split('-'); return `${dy}/${m}/${y}`; };
            const labels = { tudo: 'Tudo', hoje: 'Hoje', amanha: 'Amanhã', '7dias': 'Próximos 7 Dias', '30dias': 'Próximos 30 Dias', mes: 'Este Mês', ano: 'Este Ano', personalizado: 'Personalizado' };
            lbl.textContent = labels[this.filters.period] || 'Tudo';
        }
    }

    _renderKPIs() {
        const kpis = this._computeKPIs();
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

        set('kpi-receivable', kpis.kpiReceivable.v);
        set('kpi-receivable-count', `${kpis.kpiReceivable.c} parcelas`);
        set('kpi-due48h', kpis.kpiDue48h.v);
        set('kpi-due48h-count', `${kpis.kpiDue48h.c} parcelas`);
        set('kpi-overdue', kpis.kpiOverdue.v);
        set('kpi-overdue-count', `${kpis.kpiOverdue.c} parcelas`);
        set('kpi-received', kpis.kpiReceived.v);
        set('kpi-received-count', `${kpis.kpiReceived.c} pagamentos`);
        set('kpi-avg-ticket', kpis.kpiAvgTicket);
        set('kpi-clients', kpis.kpiClients);

        // Badge urgente 48h
        const b48 = document.getElementById('kpi-due48h-badge');
        if (b48) b48.classList.toggle('hidden', kpis.kpiDue48h.c === 0);

        // Vencidos badge na tab
        const tv = document.getElementById('tab-badge-vencidos');
        if (tv && kpis.kpiOverdue.c > 0) { tv.textContent = kpis.kpiOverdue.c; tv.classList.remove('hidden'); }

        // Requests badge na tab
        const pending = this.data.requests.filter(r => r.status === 'pendente');
        const tr = document.getElementById('tab-badge-solicitacoes');
        if (tr && pending.length > 0) { tr.textContent = pending.length; tr.classList.remove('hidden'); }
        const prEl = document.getElementById('stat-pending-requests');
        if (prEl) prEl.textContent = pending.length;
    }

    // ── QUICK ACTIONS ─────────────────────────────────────────────
    _renderQuickActions() {
        const today = DateHelper.getTodayStr();
        const fmt = v => `R$ ${parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

        // Cobrar agora: top 3 vencidos mais antigos
        const overdue = this._getOverdue().sort((a, b) => DateHelper.toLocalYYYYMMDD(a.dueDate) < DateHelper.toLocalYYYYMMDD(b.dueDate) ? -1 : 1).slice(0, 3);
        const collectEl = document.getElementById('qa-collect-list');
        if (collectEl) {
            if (!overdue.length) {
                collectEl.innerHTML = `<div class="text-center py-4 text-slate-400 text-xs"><i data-lucide="check-circle" class="w-5 h-5 mx-auto mb-1 text-emerald-300"></i>Sem pendências críticas</div>`;
            } else {
                collectEl.innerHTML = overdue.map(i => {
                    const c = i.client || this.data.clients.find(x => String(x.id) === String(i.clientId));
                    const name = c?.name || 'Cliente';
                    const phone = c?.phone || '';
                    const val = fmt(i.installmentValue || i.amount);
                    const due = DateHelper.formatLocal(i.dueDate);
                    const days = DateHelper.getDiffDays(today, DateHelper.toLocalYYYYMMDD(i.dueDate));
                    return `<div class="flex items-center justify-between gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
                        <div class="min-w-0 flex-1">
                            <p class="text-xs font-black text-rose-900 truncate">${name}</p>
                            <p class="text-[10px] text-rose-500 font-bold">${val} · ${days}d atraso</p>
                        </div>
                        <div class="flex gap-1.5 flex-shrink-0">
                            ${phone ? `<button onclick="dash_openWhatsapp('${phone}','${name}','${val}','${due}')" class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all" title="WhatsApp"><i data-lucide="message-circle" class="w-3 h-3"></i></button>` : ''}
                            <button onclick="dash_copyChargeMsg('${name}','${val}','${due}')" class="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 transition-all" title="Copiar cobrança"><i data-lucide="copy" class="w-3 h-3"></i></button>
                        </div>
                    </div>`;
                }).join('');
            }
        }

        // Vencem hoje e amanhã
        const tomorrow = DateHelper.addDays(today, 1);
        const dueSoon = this.data.installments.filter(i => {
            const st = (i.status || '').toUpperCase();
            if (st !== 'PENDING') return false;
            const d = DateHelper.toLocalYYYYMMDD(i.dueDate);
            return d === today || d === tomorrow;
        }).slice(0, 3);
        const dueEl = document.getElementById('qa-due-list');
        if (dueEl) {
            if (!dueSoon.length) {
                dueEl.innerHTML = `<div class="text-center py-4 text-slate-400 text-xs"><i data-lucide="calendar-check" class="w-5 h-5 mx-auto mb-1 text-slate-200"></i>Nenhum vencimento próximo</div>`;
            } else {
                dueEl.innerHTML = dueSoon.map(i => {
                    const c = i.client || this.data.clients.find(x => String(x.id) === String(i.clientId));
                    const name = c?.name || 'Cliente';
                    const phone = c?.phone || '';
                    const val = fmt(i.installmentValue || i.amount);
                    const d = DateHelper.toLocalYYYYMMDD(i.dueDate);
                    const tag = d === today ? '<span class="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 rounded">HOJE</span>' : '<span class="bg-blue-100 text-blue-600 text-[9px] font-black px-1.5 rounded">AMANHÃ</span>';
                    return `<div class="flex items-center justify-between gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-1.5 mb-0.5">${tag}<p class="text-xs font-black text-slate-800 truncate">${name}</p></div>
                            <p class="text-[10px] text-amber-600 font-bold">${val}</p>
                        </div>
                        ${phone ? `<button onclick="dash_openWhatsapp('${phone}','${name}','${val}','${DateHelper.formatLocal(i.dueDate)}')" class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all flex-shrink-0"><i data-lucide="message-circle" class="w-3 h-3"></i></button>` : ''}
                    </div>`;
                }).join('');
            }
        }

        // Pendências
        const pendReqs = this.data.requests.filter(r => r.status === 'pendente');
        const pendProofs = this.data.installments.filter(i => i.proof && (i.status || '').toUpperCase() !== 'PAID');
        const pendEl = document.getElementById('qa-pending-list');
        const pendBadge = document.getElementById('qa-pending-badge');
        const total = pendReqs.length + pendProofs.length;
        if (pendBadge) { pendBadge.textContent = total; pendBadge.classList.toggle('hidden', total === 0); }
        if (pendEl) {
            if (!total) {
                pendEl.innerHTML = `<div class="text-center py-4 text-slate-400 text-xs"><i data-lucide="shield-check" class="w-5 h-5 mx-auto mb-1 text-emerald-300"></i>Tudo em ordem</div>`;
            } else {
                let html = '';
                if (pendReqs.length) html += `<div onclick="window.location.href='?page=loan_requests'" class="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors"><i data-lucide="file-text" class="w-4 h-4 text-indigo-600 flex-shrink-0"></i><div><p class="text-xs font-black text-indigo-900">${pendReqs.length} Solicitação(ões)</p><p class="text-[10px] text-indigo-500">Aguardando análise</p></div></div>`;
                if (pendProofs.length) html += `<div class="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100"><i data-lucide="upload" class="w-4 h-4 text-amber-600 flex-shrink-0"></i><div><p class="text-xs font-black text-amber-900">${pendProofs.length} Comprovante(s)</p><p class="text-[10px] text-amber-500">Aguardando aprovação</p></div></div>`;
                pendEl.innerHTML = html;
            }
        }
    }

    // ── TABS ──────────────────────────────────────────────────────
    setTab(tab) {
        this.ui.tab = tab;
        this.ui.page = 1;
        document.querySelectorAll('.dash-tab').forEach(btn => {
            const active = btn.getAttribute('data-tab') === tab;
            btn.classList.toggle('border-primary', active);
            btn.classList.toggle('text-primary', active);
            btn.classList.toggle('border-transparent', !active);
            btn.classList.toggle('text-slate-500', !active);
        });
        this._renderTab();
    }

    _renderTab() {
        const area = document.getElementById('tab-content-area');
        if (!area) return;

        let data = [];
        if (this.ui.tab === 'a-vencer') data = this._getReceivable(this._getRange());
        else if (this.ui.tab === 'vencidos') data = this._getOverdue();
        else if (this.ui.tab === 'pagos') data = this._getPaid(this._getRange());
        else if (this.ui.tab === 'clientes') data = this._getFilteredClients();
        else if (this.ui.tab === 'solicitacoes') data = this.data.requests.filter(r => this._matchSearch(r));

        // Sort
        if (this.ui.tab === 'vencidos') data.sort((a, b) => DateHelper.toLocalYYYYMMDD(a.dueDate) < DateHelper.toLocalYYYYMMDD(b.dueDate) ? -1 : 1);
        if (this.ui.tab === 'a-vencer') data.sort((a, b) => DateHelper.toLocalYYYYMMDD(a.dueDate) < DateHelper.toLocalYYYYMMDD(b.dueDate) ? -1 : 1);
        if (this.ui.tab === 'pagos') data.sort((a, b) => (b.paymentDate || b.createdAt) < (a.paymentDate || a.createdAt) ? -1 : 1);

        // Record count
        const rcEl = document.getElementById('tab-record-count');
        if (rcEl) { rcEl.textContent = `${data.length} registros`; rcEl.classList.remove('hidden'); }

        // Pagination
        const total = data.length, pages = Math.ceil(total / this.ui.perPage) || 1;
        if (this.ui.page > pages) this.ui.page = pages;
        const start = (this.ui.page - 1) * this.ui.perPage;
        const page = data.slice(start, start + this.ui.perPage);

        const pagEl = document.getElementById('tab-pagination');
        const prev = document.getElementById('btn-tab-prev');
        const next = document.getElementById('btn-tab-next');
        const info = document.getElementById('tab-page-info');
        if (pagEl) pagEl.classList.toggle('hidden', total <= this.ui.perPage);
        if (info) info.textContent = `Página ${this.ui.page} de ${pages}`;
        if (prev) prev.disabled = this.ui.page === 1;
        if (next) next.disabled = this.ui.page === pages;

        if (!page.length) {
            area.innerHTML = `<div class="flex flex-col items-center justify-center py-16 text-center"><div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3"><i data-lucide="inbox" class="w-6 h-6 text-slate-300"></i></div><h3 class="text-slate-700 font-black">Nenhum registro</h3><p class="text-slate-400 text-sm mt-1">Tente ajustar os filtros.</p></div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        const rows = page.map(item => this._buildRow(item));
        area.innerHTML = `<div class="divide-y divide-slate-50">${rows.join('')}</div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    _getFilteredClients() {
        return this.data.clients.filter(c => {
            if (!this._matchSearch(c)) return false;
            if (this.filters.city !== 'all' && c.city !== this.filters.city) return false;
            return true;
        });
    }

    _buildRow(item) {
        const fmt = v => `R$ ${parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        const tab = this.ui.tab;

        // CLIENTS tab
        if (tab === 'clientes') {
            const initials = (item.name || '?').charAt(0).toUpperCase();
            const activeInst = this.data.installments.filter(i => String(i.clientId || i.client?.id) === String(item.id) && (i.status || '').toUpperCase() === 'PENDING');
            const balance = activeInst.reduce((s, i) => s + (parseFloat(i.installmentValue || 0) || 0), 0);
            return `<div class="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">${initials}</div>
                    <div class="min-w-0">
                        <p class="text-sm font-black text-slate-800 truncate">${item.name}</p>
                        <p class="text-[10px] text-slate-400">${item.city || ''} ${item.phone ? '· ' + item.phone : ''}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4 ml-3">
                    <div class="text-right hidden sm:block">
                        <p class="text-xs font-black text-slate-700">${fmt(balance)}</p>
                        <p class="text-[10px] text-slate-400">${activeInst.length} parc. ativas</p>
                    </div>
                    <button onclick="window.location.href='?page=clients'" class="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100"><i data-lucide="arrow-right" class="w-4 h-4"></i></button>
                </div>
            </div>`;
        }

        // SOLICITAÇÕES tab
        if (tab === 'solicitacoes') {
            const c = this.data.clients.find(x => String(x.id) === String(item.clientId));
            const st = { pendente: 'bg-amber-100 text-amber-700', aprovado: 'bg-emerald-100 text-emerald-700', reprovado: 'bg-rose-100 text-rose-600' };
            const stLabel = { pendente: 'Pendente', aprovado: 'Aprovado', reprovado: 'Reprovado' };
            return `<div class="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group">
                <div class="min-w-0 flex-1">
                    <p class="text-sm font-black text-slate-800">${c?.name || 'Cliente'}</p>
                    <p class="text-[10px] text-slate-400">${DateHelper.formatLocal(item.createdAt || item.requestDate)}</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-sm font-black text-slate-700">${fmt(item.amount || item.requestedAmount)}</span>
                    <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${st[item.status] || 'bg-slate-100 text-slate-500'}">${stLabel[item.status] || item.status}</span>
                    <button onclick="window.location.href='?page=loan_requests'" class="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100"><i data-lucide="arrow-right" class="w-4 h-4"></i></button>
                </div>
            </div>`;
        }

        // PAGOS tab
        if (tab === 'pagos') {
            const inst = item.installment || this.data.installments.find(i => String(i.id) === String(item.installmentId));
            const c = this.data.clients.find(x => String(x.id) === String(item.clientId || (inst?.clientId) || inst?.client?.id)) || inst?.client || { name: 'Desconhecido' };
            const loan = this.data.loans.find(l => String(l.id) === String(inst?.loanid || inst?.loanId));
            return `<div class="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0"><i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i></div>
                    <div class="min-w-0">
                        <p class="text-sm font-black text-slate-800 truncate">${c.name}</p>
                        <p class="text-[10px] text-slate-400">Parc. ${inst?.number || '?'}/${loan?.numInstallments || '?'} · Pago ${DateHelper.formatLocal(item.paymentDate || item.createdAt)}</p>
                    </div>
                </div>
                <p class="text-sm font-black text-emerald-700 ml-3">${fmt(item.amount || inst?.installmentValue)}</p>
            </div>`;
        }

        // A VENCER e VENCIDOS
        const c = item.client || this.data.clients.find(x => String(x.id) === String(item.clientId));
        const loan = this.data.loans.find(l => String(l.id) === String(item.loanid || item.loanId));
        const st = (item.status || '').toUpperCase();
        const isLate = st === 'OVERDUE' || (st === 'PENDING' && DateHelper.isPast(item.dueDate));
        const isToday = !isLate && DateHelper.isToday(item.dueDate);
        const color = isLate ? 'rose' : (isToday ? 'amber' : 'blue');
        const days = isLate ? DateHelper.getDiffDays(DateHelper.getTodayStr(), DateHelper.toLocalYYYYMMDD(item.dueDate)) : 0;
        const phone = c?.phone || '';
        const name = c?.name || 'Cliente';
        const val = fmt(item.installmentValue || item.amount);
        const due = DateHelper.formatLocal(item.dueDate);

        return `<div class="flex items-center justify-between px-5 py-4 hover:bg-${color}-50 transition-colors group">
            <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="w-8 h-8 rounded-xl bg-${color}-100 flex items-center justify-center shrink-0">
                    <i data-lucide="${isLate ? 'alert-circle' : (isToday ? 'clock' : 'calendar')}" class="w-4 h-4 text-${color}-600"></i>
                </div>
                <div class="min-w-0">
                    <p class="text-sm font-black text-slate-800 truncate">${name}</p>
                    <p class="text-[10px] text-slate-400">Parc. ${item.number || '?'}/${loan?.numInstallments || '?'} · Venc. ${due}${isLate ? ` · <span class="text-rose-500 font-black">${days}d atraso</span>` : ''}</p>
                </div>
            </div>
            <div class="flex items-center gap-2 ml-3">
                <span class="text-sm font-black text-${color}-700 whitespace-nowrap">${val}</span>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${phone ? `<button onclick="dash_openWhatsapp('${phone}','${name}','${val}','${due}')" class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all" title="WhatsApp"><i data-lucide="message-circle" class="w-3.5 h-3.5"></i></button>` : ''}
                    <button onclick="dash_copyChargeMsg('${name}','${val}','${due}')" class="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-all" title="Copiar cobrança"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button>
                    <button onclick="dash_registerPayment(${item.id})" class="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all" title="Registrar pagamento"><i data-lucide="check" class="w-3.5 h-3.5"></i></button>
                </div>
            </div>
        </div>`;
    }

    // ── RIGHT PANEL ───────────────────────────────────────────────
    _renderRight() {
        this._renderPriorities();
        this._renderComprovantes();
        this._renderAIInsight();
    }

    _renderPriorities() {
        const el = document.getElementById('priorities-list');
        if (!el) return;
        const overdue = this._getOverdue().sort((a, b) => parseFloat(b.installmentValue || 0) - parseFloat(a.installmentValue || 0)).slice(0, 5);
        if (!overdue.length) {
            el.innerHTML = `<div class="text-center py-6 text-slate-300"><i data-lucide="shield-check" class="w-8 h-8 mx-auto mb-2"></i><p class="text-xs font-bold text-slate-400">Sem alertas críticos</p></div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }
        const today = DateHelper.getTodayStr();
        el.innerHTML = overdue.map(i => {
            const c = i.client || this.data.clients.find(x => String(x.id) === String(i.clientId));
            const days = DateHelper.getDiffDays(today, DateHelper.toLocalYYYYMMDD(i.dueDate));
            const val = parseFloat(i.installmentValue || i.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' });
            return `<div class="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-100">
                <div class="min-w-0">
                    <p class="text-xs font-black text-rose-900 truncate">${c?.name || 'Cliente'}</p>
                    <p class="text-[10px] text-rose-500">${val} · ${days}d atraso</p>
                </div>
                <span class="text-[9px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full ml-2 whitespace-nowrap">${days}d</span>
            </div>`;
        }).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    _renderComprovantes() {
        const card = document.getElementById('pending-proofs-card');
        const list = document.getElementById('pending-proofs-list');
        const count = document.getElementById('pending-proofs-count');
        if (!card || !list) return;
        const pending = this.data.installments.filter(i => i.proof && (i.status || '').toUpperCase() !== 'PAID');
        if (!pending.length) { card.classList.add('hidden'); return; }
        card.classList.remove('hidden');
        if (count) count.textContent = pending.length;
        list.innerHTML = pending.slice(0, 3).map(i => {
            const c = i.client || this.data.clients.find(x => String(x.id) === String(i.clientId)) || { name: 'Cliente' };
            const val = parseFloat(i.installmentValue || i.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            return `<div class="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p class="text-xs font-black text-amber-900">${c.name} · Parc. ${i.number}</p>
                <p class="text-[10px] text-amber-600 mb-2">R$ ${val}</p>
                <div class="flex gap-2">
                    <button onclick="approvePendingProof(${i.id})" class="flex-1 bg-amber-500 text-white text-[9px] font-black py-1.5 rounded-lg uppercase tracking-wider hover:bg-amber-600 transition-colors">Aprovar</button>
                    <button onclick="rejectPendingProof(${i.id})" class="text-[9px] font-black text-slate-400 px-2 hover:text-rose-500 transition-colors">Rejeitar</button>
                </div>
            </div>`;
        }).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    _renderAIInsight() {
        const el = document.getElementById('ai-insight-text');
        const btn = document.getElementById('action-plan-btn');
        const overdue = this._getOverdue();
        const rng = this._getRange();
        const rec = this._getReceivable(rng);
        const overdueVal = overdue.reduce((s, i) => s + (parseFloat(i.installmentValue || i.amount) || 0), 0);
        let text = '';
        if (overdue.length > 0) {
            text = `"Atenção: ${overdue.length} parcelas em atraso totalizando R$ ${overdueVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Priorize a cobrança dos mais antigos para minimizar perdas."`;
        } else if (rec.length > 0) {
            text = `"Ótimo! Sem atrasos. Foque na cobrança proativa: ${rec.length} parcela(s) a vencer no período."`;
        } else {
            text = `"Excelente cenário! Nenhuma pendência crítica no período selecionado. Bom momento para visualizar novos clientes."`;
        }
        if (el) el.textContent = text;
        if (btn) btn.onclick = () => window.location.href = overdue.length ? '?page=installments&status=atrasada' : '?page=installments';
    }

    // ── ASAAS HEALTH ──────────────────────────────────────────────
    async renderAsaasHealth() {
        const indicator = document.getElementById('asaas-health-indicator');
        const detail = document.getElementById('asaas-health-detail');
        const cfgBtn = document.getElementById('asaas-config-btn');
        if (!indicator) return;
        try {
            // Usa storage.getAdvanced (padrão StorageService, não storage.from())
            const rows = await storage.getAdvanced('company_integrations', {
                eq: { provider: 'asaas' },
                select: 'id,company_id,environment,is_enabled,last_test_ok'
            });
            const hasIntegration = Array.isArray(rows) && rows.length > 0;
            if (!hasIntegration) {
                indicator.innerHTML = `<div class="w-2 h-2 rounded-full bg-slate-300"></div><span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Não configurado</span>`;
                if (detail) detail.innerHTML = `<p class="text-[10px] text-slate-400">Integração ASAAS não configurada.</p>`;
                if (cfgBtn) cfgBtn.classList.remove('hidden');
            } else {
                const intg = rows[0];
                const ok = intg.last_test_ok || intg.lastTestOk;
                const env = intg.environment || 'sandbox';
                const color = ok ? 'emerald' : 'amber';
                const label = ok ? 'Online' : 'Atenção';
                indicator.innerHTML = `<div class="w-2 h-2 rounded-full bg-${color}-400 animate-pulse"></div><span class="text-[10px] font-black text-${color}-600 uppercase tracking-wider">${label}</span>`;
                if (detail) detail.innerHTML = `<p class="text-[10px] text-${color}-600 font-bold">${ok ? '✓ Integração ativa' : '⚠ Último teste falhou'}</p><p class="text-[10px] text-slate-400 mt-0.5">Ambiente: ${env === 'production' ? 'Produção' : 'Sandbox'}</p>`;
            }
        } catch (e) {
            console.warn('ASAAS health check:', e);
            indicator.innerHTML = `<div class="w-2 h-2 rounded-full bg-amber-400"></div><span class="text-[10px] font-black text-amber-600 uppercase tracking-wider">Atenção</span>`;
            if (detail) detail.innerHTML = `<p class="text-[10px] text-amber-600">Não foi possível verificar.</p>`;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ── EXECUTIVE VIEW ────────────────────────────────────────────
    _renderExecutive() {
        this._renderDailyChart();
        this._renderOverdueChart();
        this._renderTop5();
        this._renderForecast();
    }

    _renderDailyChart() {
        const el = document.getElementById('exec-chart-daily');
        if (!el) return;
        const today = DateHelper.getTodayStr();
        const days = Array.from({ length: 7 }, (_, i) => DateHelper.addDays(today, -6 + i));
        const fmt = d => { const [, m, dy] = d.split('-'); return `${dy}/${m}`; };
        const fmtV = v => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`;

        const maxV = Math.max(...days.map(d => {
            const rec = this.data.payments.filter(p => DateHelper.toLocalYYYYMMDD(p.paymentDate || p.createdAt) === d).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
            const due = this.data.installments.filter(i => (i.status || '').toUpperCase() === 'PENDING' && DateHelper.toLocalYYYYMMDD(i.dueDate) === d).reduce((s, i) => s + (parseFloat(i.installmentValue) || 0), 0);
            return Math.max(rec, due);
        }), 1);

        el.innerHTML = days.map(d => {
            const rec = this.data.payments.filter(p => DateHelper.toLocalYYYYMMDD(p.paymentDate || p.createdAt) === d).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
            const due = this.data.installments.filter(i => (i.status || '').toUpperCase() === 'PENDING' && DateHelper.toLocalYYYYMMDD(i.dueDate) === d).reduce((s, i) => s + (parseFloat(i.installmentValue) || 0), 0);
            const pw = Math.round((rec / maxV) * 100);
            const dw = Math.round((due / maxV) * 100);
            return `<div class="flex items-center gap-3"><span class="text-[10px] font-bold text-slate-400 w-10 text-right shrink-0">${fmt(d)}</span><div class="flex-1 space-y-1"><div class="h-2 rounded-full bg-emerald-100 overflow-hidden"><div class="h-full bg-emerald-400 rounded-full transition-all" style="width:${pw}%"></div></div><div class="h-2 rounded-full bg-blue-100 overflow-hidden"><div class="h-full bg-blue-300 rounded-full transition-all" style="width:${dw}%"></div></div></div><span class="text-[10px] font-black text-slate-600 w-16 text-right shrink-0">${fmtV(rec || due)}</span></div>`;
        }).join('');
    }

    _renderOverdueChart() {
        const el = document.getElementById('exec-chart-overdue');
        if (!el) return;
        const today = DateHelper.getTodayStr();
        const bands = [{ label: '0–3 dias', min: 0, max: 3, color: 'amber' }, { label: '4–7 dias', min: 4, max: 7, color: 'orange' }, { label: '8–15 dias', min: 8, max: 15, color: 'rose' }, { label: '16+ dias', min: 16, max: 9999, color: 'red' }];
        const overdue = this._getOverdue();
        const counts = bands.map(b => ({ ...b, n: overdue.filter(i => { const d = DateHelper.getDiffDays(today, DateHelper.toLocalYYYYMMDD(i.dueDate)); return d >= b.min && d <= b.max; }).length }));
        const maxN = Math.max(...counts.map(b => b.n), 1);

        el.innerHTML = counts.map(b => {
            const pct = Math.round((b.n / maxN) * 100);
            return `<div class="flex items-center gap-3"><span class="text-[10px] font-bold text-slate-400 w-16 shrink-0">${b.label}</span><div class="flex-1 h-4 rounded-full bg-${b.color}-100 overflow-hidden"><div class="h-full bg-${b.color}-400 rounded-full transition-all" style="width:${pct}%"></div></div><span class="text-xs font-black text-${b.color}-600 w-6 text-right">${b.n}</span></div>`;
        }).join('');
    }

    _renderTop5() {
        const el = document.getElementById('exec-top5');
        if (!el) return;
        const byClient = {};
        this._getOverdue().forEach(i => {
            const cid = i.clientId || i.client?.id;
            if (!byClient[cid]) byClient[cid] = { c: i.client || this.data.clients.find(x => String(x.id) === String(cid)), v: 0 };
            byClient[cid].v += parseFloat(i.installmentValue || i.amount || 0);
        });
        const top5 = Object.values(byClient).sort((a, b) => b.v - a.v).slice(0, 5);
        if (!top5.length) { el.innerHTML = `<p class="text-slate-400 text-sm text-center py-4">Sem inadimplentes</p>`; return; }
        const max = top5[0].v;
        el.innerHTML = top5.map((x, idx) => {
            const pct = Math.round((x.v / max) * 100);
            return `<div class="flex items-center gap-3"><span class="text-xs font-black text-slate-400 w-4">${idx + 1}</span><div class="flex-1"><p class="text-xs font-black text-slate-800 truncate mb-1">${x.c?.name || '—'}</p><div class="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full bg-rose-400 rounded-full" style="width:${pct}%"></div></div></div><span class="text-xs font-black text-rose-600 whitespace-nowrap">R$ ${x.v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>`;
        }).join('');
    }

    _renderForecast() {
        const el = document.getElementById('exec-forecast');
        if (!el) return;
        const today = DateHelper.getTodayStr();
        const fmt = v => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        const weeks = [
            { label: 'Esta semana', s: today, e: DateHelper.addDays(today, 7) },
            { label: 'Próximas 2 semanas', s: DateHelper.addDays(today, 8), e: DateHelper.addDays(today, 14) },
            { label: 'Próximos 30 dias', s: today, e: DateHelper.addDays(today, 30) }
        ];
        el.innerHTML = weeks.map(w => {
            const total = this.data.installments.filter(i => {
                const st = (i.status || '').toUpperCase(); if (st !== 'PENDING') return false;
                const d = DateHelper.toLocalYYYYMMDD(i.dueDate); return d >= w.s && d <= w.e;
            }).reduce((s, i) => s + (parseFloat(i.installmentValue) || 0), 0);
            return `<div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"><p class="text-xs font-bold text-slate-600">${w.label}</p><p class="text-sm font-black text-primary">${fmt(total)}</p></div>`;
        }).join('');
    }

    // ── FILTER ACTIONS ────────────────────────────────────────────
    setPeriod(period, el) {
        this.filters.period = period;
        this.ui.page = 1;
        document.querySelectorAll('.dash-period-btn').forEach(btn => {
            const active = btn.getAttribute('data-period') === period;
            btn.classList.toggle('bg-white', active);
            btn.classList.toggle('text-primary', active);
            btn.classList.toggle('shadow-sm', active);
            btn.classList.toggle('text-slate-500', !active);
        });
        const customBar = document.getElementById('custom-date-bar');
        if (customBar) customBar.classList.toggle('hidden', period !== 'personalizado');
        this._renderAll();
    }

    applyCustomDate() {
        this.filters.dateFrom = document.getElementById('date-from-bar')?.value || '';
        this.filters.dateTo = document.getElementById('date-to-bar')?.value || '';
        if (this.filters.dateFrom && this.filters.dateTo) {
            this.ui.page = 1;
            this._renderAll();
        }
    }

    setFilter(key, val) {
        this.filters[key] = val;
        this.ui.page = 1;
        this._renderAll();
    }

    clearFilters() {
        this.filters = { period: 'tudo', dateFrom: '', dateTo: '', city: 'all', status: 'todos', search: '' };
        this.ui.page = 1;
        // Reset UI controls
        document.querySelectorAll('.dash-period-btn').forEach(btn => {
            const active = btn.getAttribute('data-period') === 'tudo';
            btn.classList.toggle('bg-white', active);
            btn.classList.toggle('text-primary', active);
            btn.classList.toggle('shadow-sm', active);
            btn.classList.toggle('text-slate-500', !active);
        });
        const cityEl = document.getElementById('dash-city-filter');
        const statusEl = document.getElementById('dash-status-filter');
        const searchEl = document.getElementById('dash-search');
        if (cityEl) cityEl.value = 'all';
        if (statusEl) statusEl.value = 'todos';
        if (searchEl) searchEl.value = '';
        document.getElementById('custom-date-bar')?.classList.add('hidden');
        this._renderAll();
    }

    toggleView(mode) {
        this.ui.view = mode;
        const opEl = document.getElementById('view-operational');
        const exEl = document.getElementById('view-executive');
        const opBtn = document.getElementById('btn-view-operational');
        const exBtn = document.getElementById('btn-view-executive');
        if (opEl) opEl.classList.toggle('hidden', mode !== 'operational');
        if (exEl) exEl.classList.toggle('hidden', mode !== 'executive');
        [opBtn, exBtn].forEach(btn => {
            if (!btn) return;
            const active = btn.id.includes(mode);
            btn.classList.toggle('bg-white', active);
            btn.classList.toggle('text-primary', active);
            btn.classList.toggle('shadow-sm', active);
            btn.classList.toggle('text-slate-500', !active);
        });
        if (mode === 'executive') this._renderExecutive();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ── CITIES ────────────────────────────────────────────────────
    _populateCities() {
        const cities = [...new Set(this.data.clients.map(c => c.city).filter(Boolean))].sort();
        const html = '<option value="all">Todas Cidades</option>' + cities.map(c => `<option value="${c}">${c}</option>`).join('');
        ['dash-city-filter', 'dash-city-mobile'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = html;
        });
    }

    // ── EXPORT CSV ────────────────────────────────────────────────
    exportCSV() {
        let data = [];
        const rng = this._getRange();
        if (this.ui.tab === 'a-vencer') data = this._getReceivable(rng);
        else if (this.ui.tab === 'vencidos') data = this._getOverdue();
        else if (this.ui.tab === 'pagos') data = this._getPaid(rng);
        else if (this.ui.tab === 'clientes') data = this._getFilteredClients();

        if (!data.length) { alert('Nenhum dado para exportar.'); return; }

        const rows = [['Cliente', 'Vencimento', 'Valor', 'Status']];
        data.forEach(item => {
            const c = item.client || this.data.clients.find(x => String(x.id) === String(item.clientId)) || { name: '?' };
            const val = parseFloat(item.installmentValue || item.amount || 0).toFixed(2);
            rows.push([c.name, DateHelper.formatLocal(item.dueDate || item.paymentDate || ''), val, item.status || '']);
        });

        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `dashboard-${this.ui.tab}-${DateHelper.getTodayStr()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ── PROOF ACTIONS ─────────────────────────────────────────────
    async _approveProof(id) {
        if (!confirm('Aprovar pagamento e dar baixa na parcela?')) return;
        try {
            const inst = this.data.installments.find(i => String(i.id) === String(id));
            if (!inst) return;
            await paymentService.registerPayment({ installmentId: inst.id, amount: inst.installmentValue || inst.amount || 0, method: 'pix', notes: 'Aprovação de comprovante (Dashboard)', paymentDate: DateHelper.getTodayStr() });
            await this.loadData();
            this._renderAll();
        } catch { alert('Erro ao aprovar pagamento.'); }
    }

    async _rejectProof(id) {
        if (!confirm('Descartar comprovante?')) return;
        try {
            await installmentService.update(id, { proof: null });
            this.data.installments = this.data.installments.map(i => String(i.id) === String(id) ? { ...i, proof: null } : i);
            this._renderAll();
        } catch { alert('Erro ao rejeitar comprovante.'); }
    }
}
