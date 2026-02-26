<?php
/**
 * Admin - Loan Requests View
 */
?>
<div class="space-y-10 fade-in">
    <!-- Premium Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="mb-2 animate-slide-up">
            <h1 class="text-4xl font-black text-slate-900 tracking-tight font-heading">Aprovações</h1>
            <p class="text-slate-500 font-medium text-lg">Central de análise e controle de solicitações.</p>
        </div>
    </div>

    <!-- Cards de Resumo -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style="animation-delay: 100ms;">
        <!-- Card: Pendentes -->
        <div class="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex items-center gap-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <i data-lucide="clock" class="w-7 h-7"></i>
            </div>
            <div>
                <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Aguardando Análise</p>
                <div class="flex items-baseline gap-2">
                    <h3 class="text-3xl font-black text-slate-800 tracking-tight" id="card-pendente-count">0</h3>
                    <span class="text-sm font-bold text-slate-400" id="card-pendente-amount">R$ 0,00</span>
                </div>
            </div>
        </div>

        <!-- Card: Aprovados -->
        <div class="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex items-center gap-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                <i data-lucide="check-circle" class="w-7 h-7"></i>
            </div>
            <div>
                <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Aprovado</p>
                <div class="flex items-baseline gap-2">
                    <h3 class="text-3xl font-black text-slate-800 tracking-tight" id="card-aprovado-count">0</h3>
                    <span class="text-sm font-bold text-slate-400" id="card-aprovado-amount">R$ 0,00</span>
                </div>
            </div>
        </div>

        <!-- Card: Negados -->
        <div class="bg-white rounded-3xl p-6 shadow-premium border border-slate-100 flex items-center gap-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div class="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <i data-lucide="x-circle" class="w-7 h-7"></i>
            </div>
            <div>
                <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Recusados (Histórico)</p>
                <div class="flex items-baseline gap-2">
                    <h3 class="text-3xl font-black text-slate-800 tracking-tight" id="card-negado-count">0</h3>
                    <span class="text-sm font-bold text-slate-400" id="card-negado-amount">R$ 0,00</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Filtros (Tabs) -->
    <div class="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 animate-slide-up" style="animation-delay: 200ms;">
        <button class="filter-tab active px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all bg-slate-800 text-white shadow-md" data-tab="todos">
            Todos
        </button>
        <button class="filter-tab px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all bg-white text-slate-500 border border-slate-200 hover:bg-slate-50" data-tab="pendente">
            Pendentes
        </button>
        <button class="filter-tab px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all bg-white text-slate-500 border border-slate-200 hover:bg-slate-50" data-tab="aprovado">
            Aprovados
        </button>
        <button class="filter-tab px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all bg-white text-slate-500 border border-slate-200 hover:bg-slate-50" data-tab="rejeitado">
            Negados
        </button>
    </div>

    <!-- Requests Table: Premium Finish -->
    <div class="premium-card overflow-hidden animate-slide-up" style="animation-delay: 300ms;">
        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50/50 border-b border-slate-100">
                        <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data Solicitação</th>
                        <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Proponente</th>
                        <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Cidade</th>
                        <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Valor Base</th>
                        <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Valor C/ Juros</th>
                        <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Plano Pretendido</th>
                        <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                        <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Decisão</th>
                    </tr>
                </thead>
                <tbody id="requests-list" class="divide-y divide-slate-50">
                    <!-- Row templates in JS should also be updated if found -->
                    <tr>
                        <td colspan="6" class="px-8 py-32 text-center">
                            <div class="flex flex-col items-center gap-4 opacity-30">
                                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center animate-spin">
                                    <i data-lucide="loader-2" class="w-8 h-8 text-primary"></i>
                                </div>
                                <p class="text-xs font-black uppercase tracking-widest">Sincronizando fila de análise...</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Approval Modal -->
<div id="approval-modal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] hidden flex items-center justify-center p-4 sm:p-6">
    <div class="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[90vh]">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h2 class="text-xl font-bold font-heading">Aprovar Solicitação</h2>
            <button type="button" class="close-modal p-2 rounded-xl hover:bg-slate-100 text-slate-400 focus:outline-none">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
        </div>
        <form id="approval-form" class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            <input type="hidden" id="req-id">
            
            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                    <p class="text-base font-bold text-slate-900" id="req-client-name">---</p>
                </div>
                <div class="text-right">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total com Juros</p>
                    <p class="text-xl font-black text-primary" id="req-total-preview-display">R$ 0,00</p>
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div class="col-span-2 md:col-span-1">
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Valor (R$)</label>
                    <input type="number" step="0.01" id="req-amount" required class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Juros</label>
                    <div class="flex gap-1">
                        <input type="number" step="0.01" id="req-interest" required value="3.5" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold">
                        <select id="req-interest-type" class="w-14 px-1 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-600 outline-none text-xs">
                            <option value="fixed" selected>R$</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Parcelas</label>
                    <input type="number" id="req-installments" required class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Frequência de pagamento</label>
                    <select id="req-frequency" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold">
                        <option value="mensal">Mensal</option>
                        <option value="semanal">Semanal</option>
                        <option value="diario">Diário</option>
                    </select>
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Data da 1ª Parcela</label>
                    <input type="date" id="req-startDate" required class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold">
                </div>
            </div>
            <div class="pt-6 flex justify-end gap-3 shrink-0 mt-2 border-t border-slate-100">
                <button type="button" class="close-modal px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
                <button type="submit" class="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2.5 rounded-xl shadow-lg shadow-emerald-200 transition-all font-bold">Aprovar e Gerar Contrato</button>
            </div>
        </form>
    </div>
</div>
