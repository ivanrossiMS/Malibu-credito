<?php
/**
 * Meus Pagamentos View - CLIENT
 */
?>
<div class="space-y-10 pb-12 fade-in">
    <!-- Premium Header with Gradient and Personal Stats -->
    <div class="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-slate-900 rounded-[3rem] p-10 md:p-14 text-white shadow-premium">
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div class="space-y-3">
                <span class="inline-block px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md">Amortizações</span>
                <h1 class="text-4xl md:text-5xl font-black font-heading tracking-tighter">Meus Pagamentos</h1>
                <p class="text-white/60 font-medium text-lg max-w-md">Gerencie seu histórico completo de liquidações e recibos digitais.</p>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:flex lg:gap-8">
                <div class="bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 border border-white/10 shadow-inner group hover:bg-white/10 transition-all duration-500">
                    <p class="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">Total Amortizado</p>
                    <h3 id="client-stat-total" class="text-3xl font-black tracking-tighter group-hover:scale-105 transition-transform">R$ 0,00</h3>
                </div>
                <div class="bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 border border-white/10 shadow-inner group hover:bg-white/10 transition-all duration-500">
                    <p id="client-stat-period-label" class="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">Pagos este mês</p>
                    <h3 id="client-stat-period-value" class="text-3xl font-black tracking-tighter group-hover:scale-105 transition-transform">0</h3>
                </div>
            </div>
        </div>
        
        <!-- Premium Decoration Blobs -->
        <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-primary-light/10 rounded-full blur-[100px] animate-pulse"></div>
        <div class="absolute -left-20 -top-20 w-80 h-80 bg-emerald-400/5 rounded-full blur-[100px] animate-pulse" style="animation-delay: 2s"></div>
    </div>

    <!-- Main List Container -->
    <div class="premium-card p-4">
        <div class="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-50">
            <div>
                <h2 class="text-2xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
                    <i data-lucide="history" class="w-7 h-7 text-primary"></i>
                    Últimas Transações
                </h2>
                <p class="text-slate-400 text-sm font-medium mt-1">Filtragem avançada de registros</p>
            </div>
            
            <div class="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                <div class="relative flex-1 lg:flex-none">
                    <i data-lucide="search" class="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                    <input type="text" id="client-search-input" placeholder="Buscar ID ou valor..." class="pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-bold text-slate-700 transition-all w-full lg:w-64 placeholder:text-slate-400">
                </div>
                
                <div class="flex items-center gap-3">
                    <select id="client-sort-by" class="px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-primary/5 outline-none text-xs font-black uppercase tracking-widest text-slate-600 transition-all cursor-pointer hover:bg-slate-100 appearance-none pr-12 relative">
                        <option value="date-desc">Recentes</option>
                        <option value="date-asc">Antigos</option>
                        <option value="value-desc">Maior Valor</option>
                    </select>

                    <select id="client-filter-period" class="px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-primary/5 outline-none text-xs font-black uppercase tracking-widest text-slate-600 transition-all cursor-pointer hover:bg-slate-100 appearance-none pr-12 relative">
                        <option value="all">Histórico</option>
                        <option value="today">Hoje</option>
                        <option value="month" selected>Mês</option>
                        <option value="year">Ano</option>
                    </select>
                </div>
                
                <button id="client-export-btn" class="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all">
                    <i data-lucide="share-2" class="w-4 h-4"></i>
                    Exportar
                </button>
            </div>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                        <th class="px-10 py-7 cursor-pointer hover:bg-slate-50/50 transition-colors group" data-sort="createdAt">
                            <div class="flex items-center gap-2">Data & Hora <i data-lucide="arrow-down-up" class="w-3 h-3 opacity-0 group-hover:opacity-100"></i></div>
                        </th>
                        <th class="px-10 py-7 cursor-pointer hover:bg-slate-50/50 transition-colors group" data-sort="loanCode">
                            <div class="flex items-center gap-2">Contrato <i data-lucide="arrow-down-up" class="w-3 h-3 opacity-0 group-hover:opacity-100"></i></div>
                        </th>
                        <th class="px-10 py-7 text-center cursor-pointer hover:bg-slate-50/50 transition-colors group" data-sort="number">
                            <div class="flex items-center justify-center gap-2">Parc. <i data-lucide="arrow-down-up" class="w-3 h-3 opacity-0 group-hover:opacity-100"></i></div>
                        </th>
                        <th class="px-10 py-7 text-center">Método</th>
                        <th class="px-10 py-7 cursor-pointer hover:bg-slate-50/50 transition-colors group" data-sort="amount">
                            <div class="flex items-center gap-2">Valor <i data-lucide="arrow-down-up" class="w-3 h-3 opacity-0 group-hover:opacity-100"></i></div>
                        </th>
                        <th class="px-10 py-7 text-right">Comprovante</th>
                    </tr>
                </thead>
                <tbody id="client-payments-list" class="divide-y divide-slate-50">
                    <!-- Loaded via JS -->
                    <tr>
                        <td colspan="6" class="px-10 py-32 text-center">
                            <div class="flex flex-col items-center gap-4 opacity-30">
                                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center animate-spin">
                                    <i data-lucide="loader-2" class="w-8 h-8 text-primary"></i>
                                </div>
                                <p class="text-xs font-black uppercase tracking-widest">Sincronizando registros...</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
</div>


