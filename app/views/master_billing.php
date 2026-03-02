<?php
/**
 * Master Billing View
 * Full control over company monthly fees
 */
?>
<div class="space-y-8">
    <!-- Header Area -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-3xl font-black text-slate-800 font-heading tracking-tight">Faturamento Master</h1>
            <p class="text-slate-500 font-medium">Controle total de mensalidades e recebíveis de todas as empresas.</p>
        </div>
        <div class="flex items-center gap-3">
            <button onclick="refreshBilling()" class="bg-white hover:bg-slate-50 text-slate-600 font-bold py-3 px-6 rounded-2xl border border-slate-200 shadow-sm transition-all flex items-center gap-2 active:scale-95">
                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                <span class="text-sm">Atualizar</span>
            </button>
        </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Total Recebido -->
        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all group overflow-hidden relative">
            <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div class="flex items-start justify-between relative z-10">
                <div class="space-y-4">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-500 group-hover:scale-110 transition-all duration-500">
                        <i data-lucide="trending-up" class="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Recebido</p>
                        <h3 class="text-3xl font-black text-slate-800 tracking-tight" id="kpi-total-paid">R$ 0,00</h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pendente -->
        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all group overflow-hidden relative">
            <div class="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div class="flex items-start justify-between relative z-10">
                <div class="space-y-4">
                    <div class="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 group-hover:bg-amber-500 group-hover:scale-110 transition-all duration-500">
                        <i data-lucide="clock" class="w-6 h-6 text-amber-600 group-hover:text-white transition-colors"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">A Receber / Vencido</p>
                        <h3 class="text-3xl font-black text-slate-800 tracking-tight" id="kpi-total-pending">R$ 0,00</h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- Este Mês -->
        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group overflow-hidden relative">
            <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div class="flex items-start justify-between relative z-10">
                <div class="space-y-4">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-500 group-hover:scale-110 transition-all duration-500">
                        <i data-lucide="calendar" class="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Previsão Este Mês</p>
                        <h3 class="text-3xl font-black text-slate-800 tracking-tight" id="kpi-this-month">R$ 0,00</h3>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Filters & List -->
    <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <!-- List Header -->
        <div class="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <i data-lucide="list" class="w-6 h-6 text-white"></i>
                </div>
                <div>
                    <h2 class="text-xl font-black text-slate-800 tracking-tight">Detalhamento de Mensalidades</h2>
                    <p class="text-slate-500 text-xs font-bold uppercase tracking-widest">Gestão Global</p>
                </div>
            </div>

            <!-- Global Company Filter & Date Range -->
            <div class="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-1.5 shadow-sm">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Período:</span>
                    <input type="date" id="master-date-from" class="bg-transparent border-none outline-none font-bold text-slate-700 text-xs">
                    <span class="text-slate-300">/</span>
                    <input type="date" id="master-date-to" class="bg-transparent border-none outline-none font-bold text-slate-700 text-xs">
                </div>

                <div class="relative w-full md:w-56">
                    <i data-lucide="filter" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                    <select id="master-company-filter" class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 appearance-none">
                        <option value="all">Todas as Empresas</option>
                    </select>
                </div>
                <div class="relative w-full md:w-44">
                    <i data-lucide="check-circle" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                    <select id="master-status-filter" class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 appearance-none">
                        <option value="all">Todos Status</option>
                        <option value="A_VENCER">A Vencer</option>
                        <option value="VENCIDA">Vencidas</option>
                        <option value="PAGA">Pagas</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Table Area -->
        <div class="flex-1 overflow-x-auto overflow-y-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50/50">
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">Empresa / Administrador</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 text-center">Referência</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 text-center">Vencimento</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 text-right">Valor</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 text-center">Status</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody id="master-billing-list" class="divide-y divide-slate-50">
                    <!-- Billing items will be loaded here -->
                    <tr>
                        <td colspan="6" class="px-8 py-20 text-center">
                            <div class="flex flex-col items-center gap-4">
                                <div class="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center animate-pulse">
                                    <i data-lucide="loader-2" class="w-8 h-8 text-slate-200 animate-spin"></i>
                                </div>
                                <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando faturamento global...</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
