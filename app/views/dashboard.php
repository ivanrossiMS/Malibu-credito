<div class="space-y-10 fade-in">
    <!-- Premium Welcome Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
            <h1 class="text-4xl font-black tracking-tight text-slate-900 font-heading">
                Olá, <span class="user-name gradient-text underline decoration-primary/20 decoration-8 underline-offset-4">Usuário</span>! 👋
            </h1>
            <p class="text-slate-500 font-medium">Confira o pulso financeiro do seu negócio agora.</p>
        </div>
        <div class="flex items-center gap-4">
            <button class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-soft hover:shadow-premium hover:-translate-y-1 transition-all text-slate-600 group">
                <i data-lucide="download" class="w-5 h-5 group-hover:text-primary transition-colors"></i>
            </button>
            <button id="new-loan-btn" class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-[1.5rem] shadow-xl shadow-blue-500/20 transition-all font-black flex items-center gap-3 hover:-translate-y-1 active:scale-95">
                <i data-lucide="plus-circle" class="w-6 h-6"></i>
                <span>Novo Empréstimo</span>
            </button>
        </div>
    </div>

    <!-- Stats Grid: Floating Glass Look -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Metric 1: Income -->
        <div class="premium-card p-8 group overflow-hidden relative cursor-pointer filter-card ring-2 ring-transparent transition-all hover:-translate-y-1 active:scale-95" data-metric="receivable" onclick="selectMetric('receivable', this)">
            <div class="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <div class="flex justify-between items-start mb-6 relative z-10">
                <div class="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/10 transition-transform group-hover:scale-110 duration-500">
                    <i data-lucide="trending-up" class="w-7 h-7 text-blue-600"></i>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <span id="badge-receivable" class="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-blue-100">ESTE MÊS</span>
                </div>
            </div>
            <div class="relative z-10">
                <p class="text-slate-500 text-xs font-black uppercase tracking-widest mb-1 opacity-70">A Receber</p>
                <h3 id="stat-receivable-today" class="text-3xl font-black text-slate-900 tracking-tight">R$ 0,00</h3>
            </div>
        </div>

        <!-- Metric 2: Overdue -->
        <div class="premium-card p-8 group overflow-hidden relative border-rose-100/50 cursor-pointer filter-card ring-2 ring-transparent transition-all hover:-translate-y-1 active:scale-95" data-metric="overdue" onclick="selectMetric('overdue', this)">
            <div class="absolute inset-0 bg-rose-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <div class="flex justify-between items-start mb-6 relative z-10">
                <div class="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/10 transition-transform group-hover:scale-110 duration-500">
                    <i data-lucide="alert-triangle" class="w-7 h-7 text-rose-500"></i>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <span id="badge-overdue" class="bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-rose-100">ESTE MÊS</span>
                    <span id="stat-overdue-count" class="text-[9px] font-bold text-rose-600 uppercase tracking-widest">0 parcelas</span>
                </div>
            </div>
            <div class="relative z-10">
                <p class="text-slate-500 text-xs font-black uppercase tracking-widest mb-1 opacity-70">Em Atraso</p>
                <h3 id="stat-overdue-total" class="text-3xl font-black text-rose-600 tracking-tight">R$ 0,00</h3>
            </div>
        </div>

        <!-- Metric 3: Monthly -->
        <div class="premium-card p-8 group overflow-hidden relative border-emerald-100/50 cursor-pointer filter-card ring-2 ring-transparent transition-all hover:-translate-y-1 active:scale-95" data-metric="received" onclick="selectMetric('received', this)">
            <div class="absolute inset-0 bg-emerald-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <div class="flex justify-between items-start mb-6 relative z-10">
                <div class="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/10 transition-transform group-hover:scale-110 duration-500">
                    <i data-lucide="check-circle-2" class="w-7 h-7 text-emerald-600"></i>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <span id="badge-received" class="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-100">ESTE MÊS</span>
                </div>
            </div>
            <div class="relative z-10">
                <p class="text-slate-500 text-xs font-black uppercase tracking-widest mb-1 opacity-70">Total Recebido</p>
                <h3 id="stat-received-month" class="text-3xl font-black text-slate-900 tracking-tight">R$ 0,00</h3>
            </div>
        </div>

        <!-- Metric 4: Clients -->
        <div class="premium-card p-8 group overflow-hidden relative cursor-pointer filter-card ring-2 ring-transparent transition-all hover:-translate-y-1 active:scale-95" data-metric="clients" onclick="selectMetric('clients', this)">
            <div class="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <div class="flex justify-between items-start mb-6 relative z-10">
                <div class="bg-primary/10 p-4 rounded-2xl border border-primary/10 transition-transform group-hover:scale-110 duration-500">
                    <i data-lucide="users" class="w-7 h-7 text-primary"></i>
                </div>
            </div>
            <div class="relative z-10">
                <p class="text-slate-500 text-xs font-black uppercase tracking-widest mb-1 opacity-70">Base de Clientes</p>
                <h3 id="stat-total-clients" class="text-3xl font-black text-slate-900 tracking-tight">0</h3>
            </div>
        </div>
    </div>

    <!-- Charts and Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <!-- Main Chart Area: Premium Analytics -->
        <div class="lg:col-span-2 premium-card flex flex-col p-10 overflow-hidden bg-white">
            <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                <div>
                    <h2 class="text-2xl font-black text-slate-900 tracking-tight font-heading" id="detail-title">Detalhamento Financeiro</h2>
                    <p class="text-slate-500 font-medium text-sm" id="detail-subtitle">Selecione um card acima para ver os detalhes</p>
                </div>

                <!-- Date Filter Bar -->
                <div class="flex flex-wrap items-center gap-3">
                    <div class="flex flex-wrap items-center gap-2 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-200">
                        <button class="filter-period bg-white text-primary shadow-sm px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all" data-period="hoje" onclick="selectPeriod('hoje', this)">Hoje</button>
                        <button class="filter-period text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all" data-period="ontem" onclick="selectPeriod('ontem', this)">Ontem</button>
                        <button class="filter-period text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all" data-period="amanha" onclick="selectPeriod('amanha', this)">Amanhã</button>
                        <button class="filter-period text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all" data-period="7dias" onclick="selectPeriod('7dias', this)">7 Dias</button>
                        <button class="filter-period text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all" data-period="mes" onclick="selectPeriod('mes', this)">Mês</button>
                        <button class="filter-period text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all" data-period="ano" onclick="selectPeriod('ano', this)">Ano</button>
                        <button class="filter-period text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5" data-period="personalizado" onclick="toggleCustomDate(this)">
                            <i data-lucide="calendar" class="w-3.5 h-3.5"></i> Custom
                        </button>
                    </div>
                    
                    <div class="bg-slate-50/80 p-1.5 rounded-2xl border border-slate-200 flex items-center h-[42px]">
                        <div class="flex items-center justify-center w-8 h-8 rounded-xl bg-white shadow-soft text-slate-400">
                            <i data-lucide="map-pin" class="w-4 h-4 text-primary"></i>
                        </div>
                        <select id="city-filter" onchange="selectCity(this.value)" class="bg-transparent border-none text-xs font-black uppercase tracking-widest text-slate-600 outline-none px-3 cursor-pointer w-[140px] truncate">
                            <option value="all">Todas Cidades</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Custom Date Inputs (Hidden by default) -->
            <div id="custom-date-container" class="hidden flex-wrap items-center gap-4 mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
                <div class="flex items-center gap-3">
                    <label class="text-xs font-bold text-slate-500 uppercase tracking-widest">De:</label>
                    <input type="date" id="date-from" class="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors">
                </div>
                <div class="flex items-center gap-3">
                    <label class="text-xs font-bold text-slate-500 uppercase tracking-widest">Até:</label>
                    <input type="date" id="date-to" class="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors">
                </div>
                <button onclick="applyCustomDate()" class="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold transition-all text-xs tracking-widest uppercase">Aplicar</button>
            </div>

            <!-- Detailed List Content -->
            <div class="flex-1 flex flex-col min-h-[400px]">
                <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4 max-h-[600px]">
                    <div id="detailed-results-list" class="space-y-3">
                        <!-- Default State -->
                        <div class="text-center py-16 flex flex-col items-center justify-center gap-3">
                            <div class="w-16 h-16 rounded-2xl bg-slate-100 shadow-sm flex items-center justify-center mb-2">
                                 <i data-lucide="mouse-pointer-click" class="w-8 h-8 text-slate-300"></i>
                            </div>
                            <h3 class="text-slate-800 font-black text-lg">Pronto para detalhar</h3>
                            <p class="text-slate-500 text-sm font-medium">Clique em um dos cards superiores para carregar a lista completa de clientes referentes àquela métrica.</p>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div id="detailed-list-pagination" class="mt-auto flex items-center justify-between border-t border-slate-100 pt-6 hidden">
                    <button id="list-prev" onclick="prevDetailedPage()" class="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><i data-lucide="chevron-left" class="w-4 h-4"></i> Anterior</button>
                    <span id="list-page-info" class="text-xs font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">Página 1 de 1</span>
                    <button id="list-next" onclick="nextDetailedPage()" class="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">Próxima <i data-lucide="chevron-right" class="w-4 h-4"></i></button>
                </div>
            </div>
        </div>

        <!-- Sidebar Activity/Alerts -->
        <div class="space-y-8">
            <div class="premium-card p-8 border-rose-100/30">
                <div class="mb-8">
                    <div class="flex items-center gap-3">
                        <div class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                        <h2 class="text-xl font-black text-slate-900 tracking-tight">Alertas Críticos</h2>
                    </div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 ml-5">Vencidos há mais de 5 dias</p>
                </div>
                <div id="critical-alerts" class="space-y-4">
                    <div class="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                        <i data-lucide="shield-check" class="w-10 h-10 text-slate-300 mx-auto mb-3"></i>
                        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Sem alertas críticos</p>
                    </div>
                </div>
                <button onclick="window.location.href='?page=installments&status=atrasada'" class="w-full mt-8 bg-white border border-slate-200 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-50 transition-all text-xs tracking-widest uppercase hover:-translate-y-1 shadow-soft">Ver Todas Parcelas Vencidas</button>
            </div>

            <!-- New Requests CTA -->
            <div onclick="window.location.href='?page=loan_requests'" class="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] shadow-premium hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden">
                <div class="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div class="flex justify-between items-start mb-6 relative z-10">
                    <div class="bg-white/20 p-3.5 rounded-2xl border border-white/20">
                        <i data-lucide="bell-ring" class="w-6 h-6 text-white"></i>
                    </div>
                    <div class="bg-emerald-400 text-emerald-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Ação Necessária</div>
                </div>
                <div class="relative z-10">
                    <p class="text-white/70 text-xs font-black uppercase tracking-widest mb-1">Novas Solicitações de Empréstimos</p>
                    <h3 id="stat-pending-requests" class="text-4xl font-black text-white tracking-tight">0</h3>
                </div>
            </div>

            <!-- IA Assistant Card -->
            <div class="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="bg-primary/20 p-2 rounded-xl border border-primary/20">
                            <i data-lucide="sparkles" class="w-4 h-4 text-primary"></i>
                        </div>
                        <h3 class="font-black text-white text-sm uppercase tracking-widest">Insight IA Malibu</h3>
                    </div>
                    <p class="text-slate-300 text-sm leading-relaxed mb-6 font-medium italic">
                        "Otimize seu dia focando nas cobranças de hoje. Há 12 parcelas vencendo com alta probabilidade de retorno."
                    </p>
                    <button id="action-plan-btn" class="w-full bg-white/5 border border-white/10 hover:bg-primary text-white hover:border-primary px-4 py-3.5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all shadow-inner">Ver Plano Estratégico</button>
                </div>
                <div class="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                    <i data-lucide="cpu" class="w-40 h-40 text-white group-hover:rotate-12 transition-transform duration-1000"></i>
                </div>
            </div>
        </div>
    </div>
</div>
