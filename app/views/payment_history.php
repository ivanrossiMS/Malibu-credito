<?php
/**
 * Payment History View - ADMIN - Cockpit Financeiro
 */
?>
<div class="space-y-8 fade-in">
    <!-- Premium Welcome Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 class="text-3xl font-black tracking-tight text-slate-900 font-heading">
                Cockpit de <span class="gradient-text underline decoration-primary/20 decoration-8 underline-offset-4">Pagamentos</span>
            </h1>
            <p class="text-slate-500 font-medium">Controle total sobre o volume e a origem de cada recebimento.</p>
        </div>
        <div class="flex items-center gap-4">
            <button id="export-btn" class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-soft hover:shadow-premium hover:-translate-y-1 transition-all text-slate-600 group flex items-center gap-2">
                <i data-lucide="download" class="w-5 h-5 group-hover:text-primary transition-colors"></i>
                <span class="text-xs font-bold uppercase tracking-widest hidden sm:block">Exportar CSV</span>
            </button>
        </div>
    </div>

    <!-- Stats Cards: Financial Dashboard Architecture -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Card 1: Caixa Hoje -->
        <div class="premium-card p-6 overflow-hidden relative border-emerald-100/50">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div class="flex justify-between items-start mb-4 relative z-10">
                <div class="bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100">
                    <i data-lucide="wallet" class="w-6 h-6"></i>
                </div>
                <span id="badge-today" class="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-100 shadow-sm">HOJE</span>
            </div>
            <div class="relative z-10">
                <p id="label-today" class="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Pagamentos baixados</p>
                <h3 id="stat-today" class="text-3xl font-black text-emerald-600 tracking-tight">R$ 0,00</h3>
            </div>
        </div>

        <!-- Card 2: Acumulado do Mês -->
        <div class="premium-card p-6 overflow-hidden relative">
            <div class="flex justify-between items-start mb-4">
                <div class="bg-blue-50 text-blue-600 p-3 rounded-2xl border border-blue-100">
                    <i data-lucide="calendar-check-2" class="w-6 h-6"></i>
                </div>
                <span id="badge-month" class="bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-slate-200">TOTAL</span>
            </div>
            <div>
                <p class="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Acumulado do Período</p>
                <h3 id="stat-month" class="text-3xl font-black text-slate-900 tracking-tight">R$ 0,00</h3>
            </div>
        </div>
    </div>

    <!-- Filter Ribbon Layout -->
    <div class="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between relative z-20">
        <!-- Busca Global -->
        <div class="relative w-full md:w-1/3">
            <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
            <input type="text" id="filter-search" placeholder="Procurar por cliente..." 
                class="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-all font-medium text-slate-700">
        </div>

        <!-- Period Toggle Buttons -->
        <div class="flex flex-wrap items-center gap-2 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-200 md:ml-auto">
            <button class="filter-period text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all" data-period="hoje">Hoje</button>
            <button class="filter-period text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all" data-period="7dias">Há 7 dias</button>
            <button class="filter-period bg-white text-primary shadow-sm px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all" data-period="mes">Este Mês</button>
            <button class="filter-period text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all" data-period="ano">Ano</button>
            <button class="filter-period text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5" data-period="personalizado" id="btn-custom-date">
                <i data-lucide="calendar" class="w-3.5 h-3.5"></i> Custom
            </button>
        </div>
    </div>

    <!-- Custom Date Range (Hidden by default) -->
    <div id="custom-date-container" class="hidden flex-wrap items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
        <div class="flex items-center gap-3">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-widest">De:</label>
            <input type="date" id="date-from" class="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors">
        </div>
        <div class="flex items-center gap-3">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-widest">Até:</label>
            <input type="date" id="date-to" class="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors">
        </div>
        <button id="apply-custom-date" class="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold transition-all text-xs tracking-widest uppercase shadow-md shadow-primary/20">Aplicar Filtro</button>
    </div>

    <!-- Secondary Comboboxes -->
    <div class="flex flex-wrap items-center gap-4">
        <div class="relative min-w-[200px]">
            <i data-lucide="map-pin" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
            <select id="filter-city" class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm appearance-none font-bold text-slate-600 shadow-sm cursor-pointer">
                <option value="all">Todas as Cidades</option>
            </select>
            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
        </div>

        <div class="relative min-w-[200px]">
            <i data-lucide="wallet" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
            <select id="filter-method" class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm appearance-none font-bold text-slate-600 shadow-sm cursor-pointer">
                <option value="all">Todas as Fontes</option>
                <option value="pix">PIX</option>
            </select>
            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
        </div>

        <div class="flex-1"></div>
        <span id="list-counter" class="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">0 registros</span>
    </div>

    <!-- Professional Data Table -->
    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-slate-50/50 border-b border-slate-200">
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Pgto</th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parcela Ref.</th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fonte Pagadora</th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Líquido</th>
                    </tr>
                </thead>
                <tbody id="payment-history-list" class="divide-y divide-slate-100">
                    <!-- Loader fallback JS -->
                    <tr>
                        <td colspan="5" class="px-6 py-12 text-center text-slate-400 font-medium">Carregando transações corporativas...</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Pagination controls layout limit -->
        <div id="pagination-controls" class="hidden bg-slate-50/50 border-t border-slate-100 p-4 flex items-center justify-between">
            <span id="pagination-info" class="text-xs font-bold text-slate-400 uppercase tracking-widest">Página 1 de 1</span>
            <div class="flex gap-2">
                <button id="btn-prev-page" class="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm">
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                </button>
                <button id="btn-next-page" class="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm">
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    </div>
</div>
