<div class="fade-in" id="dash-root">

  <!-- ═══ HEADER ═══════════════════════════════════════════════ -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <div class="flex items-center gap-3 flex-wrap">
        <h1 class="text-3xl font-black tracking-tight text-slate-900">
          Olá, <span class="user-name-welcome gradient-text">Usuário</span>! 👋
        </h1>
        <span id="dash-company-badge" class="hidden bg-primary/10 text-primary text-[11px] font-black px-3 py-1 rounded-full border border-primary/20 uppercase tracking-wider"></span>
      </div>
      <p class="text-slate-500 text-sm font-medium mt-1">Resumo e ações do período selecionado — <span id="dash-period-label" class="text-primary font-bold">Este Mês</span></p>
    </div>
    <div class="flex items-center gap-2 flex-wrap">
      <button onclick="dash_exportCSV()" class="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm">
        <i data-lucide="download" class="w-4 h-4"></i> <span class="hidden sm:inline">Exportar</span>
      </button>
      <button onclick="window.location.href='?page=clients'" class="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm">
        <i data-lucide="user-plus" class="w-4 h-4 text-primary"></i> Novo Cliente
      </button>
      <button id="new-loan-btn" onclick="window.location.href='?page=loans'" class="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:scale-95">
        <i data-lucide="plus-circle" class="w-4 h-4"></i> Novo Empréstimo
      </button>
    </div>
  </div>

  <!-- ═══ GLOBAL FILTER BAR (sticky) ═════════════════════════ -->
  <div class="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 -mx-6 px-4 py-3 mb-8">
    <!-- Desktop filters -->
    <div class="hidden lg:flex items-center gap-3 flex-wrap">
      <!-- Period buttons -->
      <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
        <button onclick="dash_setPeriod('tudo', this)" data-period="tudo" class="dash-period-btn px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all bg-white text-primary shadow-sm flex items-center gap-1"><i data-lucide="infinity" class="w-3 h-3"></i> Tudo</button>
        <button onclick="dash_setPeriod('hoje', this)" data-period="hoje" class="dash-period-btn px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all text-slate-500 hover:bg-white">Hoje</button>
        <button onclick="dash_setPeriod('amanha', this)" data-period="amanha" class="dash-period-btn px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all text-slate-500 hover:bg-white">Amanhã</button>
        <button onclick="dash_setPeriod('7dias', this)" data-period="7dias" class="dash-period-btn px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all text-slate-500 hover:bg-white">7 Dias</button>
        <button onclick="dash_setPeriod('30dias', this)" data-period="30dias" class="dash-period-btn px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all text-slate-500 hover:bg-white">30 Dias</button>
        <button onclick="dash_setPeriod('mes', this)" data-period="mes" class="dash-period-btn px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all text-slate-500 hover:bg-white">Mês</button>
        <button onclick="dash_setPeriod('ano', this)" data-period="ano" class="dash-period-btn px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all text-slate-500 hover:bg-white">Ano</button>
        <button onclick="dash_setPeriod('personalizado', this)" data-period="personalizado" class="dash-period-btn flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all text-slate-500 hover:bg-white"><i data-lucide="calendar" class="w-3 h-3"></i>Custom</button>
      </div>

      <!-- Custom date inputs -->
      <div id="custom-date-bar" class="hidden flex items-center gap-2">
        <input type="date" id="date-from-bar" class="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-primary">
        <span class="text-slate-400 text-xs font-bold">→</span>
        <input type="date" id="date-to-bar" class="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-primary">
        <button onclick="dash_applyCustomDate()" class="bg-primary text-white text-xs font-black px-3 py-1.5 rounded-lg">OK</button>
      </div>

      <!-- Divider -->
      <div class="w-px h-6 bg-slate-200"></div>

      <!-- City -->
      <div class="relative flex items-center">
        <i data-lucide="map-pin" class="w-3.5 h-3.5 text-primary absolute left-2.5 pointer-events-none"></i>
        <select id="dash-city-filter" onchange="dash_setCity(this.value)" class="pl-7 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-black uppercase text-slate-600 outline-none focus:border-primary appearance-none cursor-pointer min-w-[130px]">
          <option value="all">Todas Cidades</option>
        </select>
        <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none"></i>
      </div>

      <!-- Status -->
      <div class="relative flex items-center">
        <i data-lucide="filter" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none"></i>
        <select id="dash-status-filter" onchange="dash_setStatus(this.value)" class="pl-7 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-black uppercase text-slate-600 outline-none focus:border-primary appearance-none cursor-pointer min-w-[120px]">
          <option value="todos">Todos</option>
          <option value="a-vencer">A Vencer</option>
          <option value="vencidos">Vencidos</option>
          <option value="pagos">Pagos</option>
        </select>
        <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none"></i>
      </div>

      <!-- Clear -->
      <button onclick="dash_clearFilters()" class="flex items-center gap-1 text-[11px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-wider transition-colors px-2">
        <i data-lucide="x" class="w-3.5 h-3.5"></i> Limpar
      </button>
    </div>

    <!-- Mobile: compact filter row -->
    <div class="flex lg:hidden items-center gap-3">
      <button onclick="dash_toggleMobileFilters()" class="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl text-xs font-black text-slate-600 transition-colors">
        <i data-lucide="sliders-horizontal" class="w-4 h-4"></i> Filtros
        <span id="dash-filter-count" class="hidden bg-primary text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">0</span>
      </button>
    </div>
  </div>

  <!-- ═══ KPI ROW (6 cards) ══════════════════════════════════ -->
  <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
    <!-- A Receber -->
    <div class="premium-card p-5 cursor-pointer group hover:-translate-y-1 transition-all active:scale-95 relative overflow-hidden" onclick="dash_setTab('a-vencer')">
      <div class="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
      <div class="flex items-center justify-between mb-3 relative z-10">
        <div class="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
          <i data-lucide="trending-up" class="w-4 h-4 text-blue-600"></i>
        </div>
      </div>
      <div class="relative z-10">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">A Receber</p>
        <h3 id="kpi-receivable" class="text-xl font-black text-slate-900 tracking-tight">R$ 0,00</h3>
        <p id="kpi-receivable-count" class="text-[10px] text-slate-400 font-bold mt-0.5">0 parcelas</p>
      </div>
    </div>

    <!-- Vencendo 48h -->
    <div class="premium-card p-5 cursor-pointer group hover:-translate-y-1 transition-all active:scale-95 border-amber-100/60 relative overflow-hidden" onclick="dash_setTab('a-vencer')">
      <div class="absolute inset-0 bg-amber-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
      <div class="flex items-center justify-between mb-3 relative z-10">
        <div class="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
          <i data-lucide="clock" class="w-4 h-4 text-amber-600"></i>
        </div>
        <span id="kpi-due48h-badge" class="hidden bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">URGENTE</span>
      </div>
      <div class="relative z-10">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vencem 48h</p>
        <h3 id="kpi-due48h" class="text-xl font-black text-amber-600 tracking-tight">R$ 0,00</h3>
        <p id="kpi-due48h-count" class="text-[10px] text-amber-500 font-bold mt-0.5">0 parcelas</p>
      </div>
    </div>

    <!-- Em Atraso -->
    <div class="premium-card p-5 cursor-pointer group hover:-translate-y-1 transition-all active:scale-95 border-rose-100/60 relative overflow-hidden" onclick="dash_setTab('vencidos')">
      <div class="absolute inset-0 bg-rose-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
      <div class="flex items-center justify-between mb-3 relative z-10">
        <div class="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform">
          <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-600"></i>
        </div>
      </div>
      <div class="relative z-10">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Em Atraso</p>
        <h3 id="kpi-overdue" class="text-xl font-black text-rose-600 tracking-tight">R$ 0,00</h3>
        <p id="kpi-overdue-count" class="text-[10px] text-rose-500 font-bold mt-0.5">0 parcelas</p>
      </div>
    </div>

    <!-- Total Recebido -->
    <div class="premium-card p-5 cursor-pointer group hover:-translate-y-1 transition-all active:scale-95 border-emerald-100/60 relative overflow-hidden" onclick="dash_setTab('pagos')">
      <div class="absolute inset-0 bg-emerald-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
      <div class="flex items-center justify-between mb-3 relative z-10">
        <div class="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
          <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
        </div>
      </div>
      <div class="relative z-10">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recebido</p>
        <h3 id="kpi-received" class="text-xl font-black text-emerald-600 tracking-tight">R$ 0,00</h3>
        <p id="kpi-received-count" class="text-[10px] text-emerald-500 font-bold mt-0.5">0 pagamentos</p>
      </div>
    </div>

    <!-- Ticket Médio -->
    <div class="premium-card p-5 group hover:-translate-y-1 transition-all relative overflow-hidden">
      <div class="absolute inset-0 bg-violet-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
      <div class="flex items-center justify-between mb-3 relative z-10">
        <div class="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform">
          <i data-lucide="receipt" class="w-4 h-4 text-violet-600"></i>
        </div>
      </div>
      <div class="relative z-10">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket Médio</p>
        <h3 id="kpi-avg-ticket" class="text-xl font-black text-slate-900 tracking-tight">R$ 0,00</h3>
        <p class="text-[10px] text-slate-400 font-bold mt-0.5">por parcela</p>
      </div>
    </div>

    <!-- Clientes Ativos -->
    <div class="premium-card p-5 cursor-pointer group hover:-translate-y-1 transition-all active:scale-95 relative overflow-hidden" onclick="dash_setTab('clientes')">
      <div class="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
      <div class="flex items-center justify-between mb-3 relative z-10">
        <div class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <i data-lucide="users" class="w-4 h-4 text-primary"></i>
        </div>
      </div>
      <div class="relative z-10">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clientes Ativos</p>
        <h3 id="kpi-clients" class="text-xl font-black text-slate-900 tracking-tight">0</h3>
        <p id="kpi-clients-sub" class="text-[10px] text-slate-400 font-bold mt-0.5">com parcelas</p>
      </div>
    </div>
  </div>

  <!-- ═══ AÇÃO RÁPIDA ═══════════════════════════════════════ -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
    <!-- Cobrar Agora -->
    <div class="premium-card p-6 border-rose-100/50 bg-gradient-to-br from-white to-rose-50/30">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
            <i data-lucide="zap" class="w-4 h-4 text-rose-600"></i>
          </div>
          <div>
            <h3 class="text-sm font-black text-slate-900">Cobrar Agora</h3>
            <p class="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Top vencidas</p>
          </div>
        </div>
        <button onclick="dash_setTab('vencidos')" class="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-wider">Ver todas →</button>
      </div>
      <div id="qa-collect-list" class="space-y-3">
        <div class="text-center py-4 text-slate-400 text-xs">
          <i data-lucide="check-circle" class="w-5 h-5 mx-auto mb-1 text-emerald-300"></i>
          Sem pendências críticas
        </div>
      </div>
    </div>

    <!-- Vencem Hoje/Amanhã -->
    <div class="premium-card p-6 border-amber-100/50 bg-gradient-to-br from-white to-amber-50/30">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <i data-lucide="clock-4" class="w-4 h-4 text-amber-600"></i>
          </div>
          <div>
            <h3 class="text-sm font-black text-slate-900">Vencem em Breve</h3>
            <p class="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Hoje e amanhã</p>
          </div>
        </div>
        <button onclick="dash_setTab('a-vencer')" class="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-wider">Ver todas →</button>
      </div>
      <div id="qa-due-list" class="space-y-3">
        <div class="text-center py-4 text-slate-400 text-xs">
          <i data-lucide="calendar-check" class="w-5 h-5 mx-auto mb-1 text-slate-200"></i>
          Nenhum vencimento próximo
        </div>
      </div>
    </div>

    <!-- Solicitações de Empréstimo -->
    <div class="premium-card p-6 border-indigo-100/50 bg-gradient-to-br from-white to-indigo-50/30">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
            <i data-lucide="file-text" class="w-4 h-4 text-indigo-600"></i>
          </div>
          <div>
            <h3 class="text-sm font-black text-slate-900">Solicitações</h3>
            <p class="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Novas solicitações</p>
          </div>
        </div>
        <span id="qa-requests-badge" class="hidden bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">0</span>
      </div>
      <div id="qa-requests-list" class="space-y-2">
        <div class="text-center py-4 text-slate-400 text-xs">
          <i data-lucide="check-circle" class="w-5 h-5 mx-auto mb-1 text-emerald-300"></i>
          Sem solicitações pendentes
        </div>
      </div>
      <button onclick="window.location.href='?page=loan_requests'" class="w-full mt-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black py-2.5 rounded-xl text-[10px] tracking-widest uppercase transition-all">
        Ver todas solicitações →
      </button>
    </div>
  </div>

  <!-- ═══ VIEW TOGGLE + CONTENT ════════════════════════════ -->
  <div class="flex items-center justify-between mb-5">
    <div class="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
      <button id="btn-view-operational" onclick="dash_toggleView('operational')" class="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider bg-white text-primary shadow-sm transition-all">
        <i data-lucide="layout-dashboard" class="w-3.5 h-3.5"></i> Operacional
      </button>
      <button id="btn-view-executive" onclick="dash_toggleView('executive')" class="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-white/60 transition-all">
        <i data-lucide="bar-chart-2" class="w-3.5 h-3.5"></i> Executivo
      </button>
    </div>
    <div id="tab-record-count" class="text-xs font-bold text-slate-400 hidden"></div>
  </div>

  <!-- ═══ OPERATIONAL VIEW ═════════════════════════════════ -->
  <div id="view-operational" class="grid grid-cols-1 lg:grid-cols-3 gap-8">

    <!-- LEFT: TABS + TABLE -->
    <div class="lg:col-span-2 premium-card overflow-hidden">
      <!-- Tabs header -->
      <div class="flex items-center gap-0 border-b border-slate-100 overflow-x-auto">
        <button onclick="dash_setTab('a-vencer')" data-tab="a-vencer" class="dash-tab flex-shrink-0 px-5 py-4 text-xs font-black uppercase tracking-wider border-b-2 border-primary text-primary transition-all">
          A Vencer
        </button>
        <button onclick="dash_setTab('vencidos')" data-tab="vencidos" class="dash-tab flex-shrink-0 px-5 py-4 text-xs font-black uppercase tracking-wider border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition-all">
          Vencidos <span id="tab-badge-vencidos" class="hidden ml-1 bg-rose-100 text-rose-600 text-[9px] px-1.5 py-0.5 rounded-full font-black"></span>
        </button>
        <button onclick="dash_setTab('pagos')" data-tab="pagos" class="dash-tab flex-shrink-0 px-5 py-4 text-xs font-black uppercase tracking-wider border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition-all">
          Pagos
        </button>
        <button onclick="dash_setTab('clientes')" data-tab="clientes" class="dash-tab flex-shrink-0 px-5 py-4 text-xs font-black uppercase tracking-wider border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition-all">
          Clientes
        </button>
        <button onclick="dash_setTab('solicitacoes')" data-tab="solicitacoes" class="dash-tab flex-shrink-0 px-5 py-4 text-xs font-black uppercase tracking-wider border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition-all">
          Solicitações <span id="tab-badge-solicitacoes" class="hidden ml-1 bg-indigo-100 text-indigo-600 text-[9px] px-1.5 py-0.5 rounded-full font-black"></span>
        </button>
      </div>

      <!-- Table content -->
      <div id="tab-content-area" class="min-h-[400px] max-h-[550px] overflow-y-auto custom-scrollbar">
        <!-- Filled by JS -->
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <i data-lucide="loader-2" class="w-6 h-6 text-slate-300 animate-spin"></i>
          </div>
          <p class="text-slate-400 text-sm font-bold">Carregando dados...</p>
        </div>
      </div>

      <!-- Pagination -->
      <div id="tab-pagination" class="hidden border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50/50">
        <button onclick="dash_prevPage()" id="btn-tab-prev" class="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i> Anterior
        </button>
        <span id="tab-page-info" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Página 1 de 1</span>
        <button onclick="dash_nextPage()" id="btn-tab-next" class="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Próxima <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>

    <!-- RIGHT: PRIORITIES + ASAAS + AI ═══════════════════ -->
    <div class="space-y-5">

      <!-- PRIORIDADES -->
      <div class="premium-card p-6 border-rose-100/30">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
          <h2 class="text-base font-black text-slate-900">Prioridades</h2>
        </div>
        <div id="priorities-list" class="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          <div class="text-center py-8 text-slate-300">
            <i data-lucide="shield-check" class="w-8 h-8 mx-auto mb-2"></i>
            <p class="text-xs font-bold text-slate-400">Sem alertas críticos</p>
          </div>
        </div>
        <button onclick="window.location.href='?page=installments&status=atrasada'" class="w-full mt-4 bg-white border border-slate-200 text-slate-600 font-black py-2.5 rounded-xl text-[10px] tracking-widest uppercase hover:bg-slate-50 transition-all shadow-sm">
          Ver todas parcelas vencidas →
        </button>
      </div>


      <!-- COMPROVANTES PENDENTES -->
      <div id="pending-proofs-card" class="premium-card p-6 border-amber-100/30 hidden">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <h3 class="text-sm font-black text-slate-900">Comprovantes</h3>
          </div>
          <span id="pending-proofs-count" class="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full">0</span>
        </div>
        <div id="pending-proofs-list" class="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-1"></div>
      </div>

      <!-- SOLICITAÇÕES -->
      <div onclick="window.location.href='?page=loan_requests'" class="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden">
        <div class="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        <div class="flex justify-between items-center mb-4 relative z-10">
          <div class="bg-white/20 p-2 rounded-xl border border-white/20">
            <i data-lucide="bell-ring" class="w-4 h-4 text-white"></i>
          </div>
          <div class="bg-emerald-400 text-emerald-900 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">Ação</div>
        </div>
        <div class="relative z-10">
          <p class="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">Solicitações de Empréstimo</p>
          <h3 id="stat-pending-requests" class="text-3xl font-black text-white tracking-tight">0</h3>
        </div>
      </div>

      <!-- INSIGHT IA (recolhível) -->
      <div class="bg-slate-900 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
        <div class="relative z-10">
          <div class="flex items-center justify-between gap-3 mb-4">
            <div class="flex items-center gap-2">
              <div class="bg-primary/20 p-1.5 rounded-lg border border-primary/20">
                <i data-lucide="sparkles" class="w-3.5 h-3.5 text-primary"></i>
              </div>
              <h3 class="font-black text-white text-xs uppercase tracking-widest">Insight IA</h3>
            </div>
            <button onclick="this.closest('.bg-slate-900').querySelector('#ai-insight-body').classList.toggle('hidden')" class="text-white/30 hover:text-white/70 transition-colors">
              <i data-lucide="chevron-down" class="w-4 h-4"></i>
            </button>
          </div>
          <div id="ai-insight-body">
            <p id="ai-insight-text" class="text-slate-300 text-xs leading-relaxed mb-4 font-medium italic">
              "Carregando análise do período..."
            </p>
            <button id="action-plan-btn" class="w-full bg-white/5 border border-white/10 hover:bg-primary text-white hover:border-primary px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all">
              Ver Plano Estratégico
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ EXECUTIVE VIEW ════════════════════════════════════ -->
  <div id="view-executive" class="hidden space-y-6">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Chart 1: Recebido vs A Receber (7 dias) -->
      <div class="premium-card p-6">
        <h3 class="text-sm font-black text-slate-900 mb-1">Caixa — Últimos 7 dias</h3>
        <p class="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-5">Recebido vs. A Receber por dia</p>
        <div id="exec-chart-daily" class="space-y-3"></div>
        <div class="flex items-center gap-4 mt-4">
          <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded bg-emerald-400"></div><span class="text-[10px] font-bold text-slate-500">Recebido</span></div>
          <div class="flex items-center gap-1.5"><div class="w-3 h-3 rounded bg-blue-300"></div><span class="text-[10px] font-bold text-slate-500">A Receber</span></div>
        </div>
      </div>

      <!-- Chart 2: Vencidos por faixa -->
      <div class="premium-card p-6">
        <h3 class="text-sm font-black text-slate-900 mb-1">Inadimplência por Faixa</h3>
        <p class="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-5">Dias em atraso</p>
        <div id="exec-chart-overdue" class="space-y-3"></div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Top 5 clientes em aberto -->
      <div class="premium-card p-6">
        <h3 class="text-sm font-black text-slate-900 mb-5">Top 5 — Maior Saldo em Aberto</h3>
        <div id="exec-top5" class="space-y-3"></div>
      </div>

      <!-- Previsão 30 dias -->
      <div class="premium-card p-6 bg-gradient-to-br from-white to-slate-50/50">
        <h3 class="text-sm font-black text-slate-900 mb-1">Previsão de Caixa</h3>
        <p class="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-5">Próximos 30 dias</p>
        <div id="exec-forecast" class="space-y-4"></div>
      </div>
    </div>
  </div>

  <!-- ═══ MOBILE FILTER DRAWER ══════════════════════════════ -->
  <div id="mobile-filter-drawer" class="fixed inset-0 z-[200] hidden" onclick="if(event.target===this) dash_toggleMobileFilters()">
    <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"></div>
    <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
      <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
      <h3 class="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
        <i data-lucide="sliders-horizontal" class="w-5 h-5 text-primary"></i> Filtros
      </h3>

      <div class="space-y-5">
        <!-- Período mobile -->
        <div>
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Período</label>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="dash_setPeriod('hoje')" data-period-mobile="hoje" class="dash-period-mobile-btn px-3 py-2.5 rounded-xl text-xs font-black border border-slate-200 hover:border-primary hover:text-primary transition-all">Hoje</button>
            <button onclick="dash_setPeriod('amanha')" data-period-mobile="amanha" class="dash-period-mobile-btn px-3 py-2.5 rounded-xl text-xs font-black border border-slate-200 hover:border-primary hover:text-primary transition-all">Amanhã</button>
            <button onclick="dash_setPeriod('7dias')" data-period-mobile="7dias" class="dash-period-mobile-btn px-3 py-2.5 rounded-xl text-xs font-black border border-slate-200 hover:border-primary hover:text-primary transition-all">7 Dias</button>
            <button onclick="dash_setPeriod('30dias')" data-period-mobile="30dias" class="dash-period-mobile-btn px-3 py-2.5 rounded-xl text-xs font-black border border-slate-200 hover:border-primary hover:text-primary transition-all">30 Dias</button>
            <button onclick="dash_setPeriod('mes')" data-period-mobile="mes" class="dash-period-mobile-btn px-3 py-2.5 rounded-xl text-xs font-black border border-primary text-primary transition-all">Mês</button>
            <button onclick="dash_setPeriod('ano')" data-period-mobile="ano" class="dash-period-mobile-btn px-3 py-2.5 rounded-xl text-xs font-black border border-slate-200 hover:border-primary hover:text-primary transition-all">Ano</button>
          </div>
        </div>

        <!-- Cidade mobile -->
        <div>
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cidade</label>
          <select id="dash-city-mobile" onchange="dash_setCity(this.value)" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-primary appearance-none">
            <option value="all">Todas as Cidades</option>
          </select>
        </div>

        <!-- Status mobile -->
        <div>
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status</label>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="dash_setStatus('todos')" data-status-mobile="todos" class="dash-status-mobile-btn px-3 py-2.5 rounded-xl text-xs font-black border border-primary text-primary transition-all">Todos</button>
            <button onclick="dash_setStatus('a-vencer')" data-status-mobile="a-vencer" class="dash-status-mobile-btn px-3 py-2.5 rounded-xl text-xs font-black border border-slate-200 hover:border-primary hover:text-primary transition-all">A Vencer</button>
            <button onclick="dash_setStatus('vencidos')" data-status-mobile="vencidos" class="dash-status-mobile-btn px-3 py-2.5 rounded-xl text-xs font-black border border-slate-200 hover:border-primary hover:text-primary transition-all">Vencidos</button>
            <button onclick="dash_setStatus('pagos')" data-status-mobile="pagos" class="dash-status-mobile-btn px-3 py-2.5 rounded-xl text-xs font-black border border-slate-200 hover:border-primary hover:text-primary transition-all">Pagos</button>
          </div>
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button onclick="dash_clearFilters(); dash_toggleMobileFilters()" class="flex-1 py-3 border border-slate-200 rounded-2xl text-xs font-black text-slate-600 uppercase tracking-wider">Limpar</button>
        <button onclick="dash_toggleMobileFilters()" class="flex-1 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider">Aplicar</button>
      </div>
    </div>
  </div>

</div>
