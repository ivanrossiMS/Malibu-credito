<?php
/**
 * Installments View
 */
?>
<div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-3xl font-bold font-heading">Parcelas & Cobranças</h1>
            <p class="text-slate-500">Acompanhamento de vencimentos e régua de cobrança.</p>
        </div>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
        <button class="filter-status px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white flex items-center justify-center gap-1" data-status="todas">
            Todas <span class="count opacity-80 text-[10px] ml-1"></span>
        </button>
        <button class="filter-status px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center gap-1" data-status="pendente">
            Vence Hoje <span class="count opacity-60 text-[10px] ml-1"></span>
        </button>
        <button class="filter-status px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center gap-1" data-status="atrasada">
            Atrasadas <span class="count opacity-60 text-[10px] ml-1"></span>
        </button>
        <button class="filter-status px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center gap-1" data-status="avencer">
            A Vencer <span class="count opacity-60 text-[10px] ml-1"></span>
        </button>
        <button class="filter-status px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center gap-1" data-status="paga">
            Pagas <span class="count opacity-60 text-[10px] ml-1"></span>
        </button>
        
        <div class="relative min-w-[180px]">
            <i data-lucide="user" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
            <select id="client-filter" class="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm appearance-none font-bold text-slate-600">
                <option value="">Todos os Clientes</option>
            </select>
            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
        </div>

        <div class="relative min-w-[180px]">
            <i data-lucide="map-pin" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
            <select id="city-filter" class="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm appearance-none font-bold text-slate-600">
                <option value="">Todas as Cidades</option>
            </select>
            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
        </div>
        
        <div class="flex-1"></div>
        <div class="relative flex gap-2">
            <div class="relative">
                <i data-lucide="calendar" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                <select id="date-filter-type" class="pl-9 pr-8 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm appearance-none min-w-[140px] text-slate-600 font-bold font-sm">
                    <option value="">Qualquer data</option>
                    <option value="hoje">Hoje</option>
                    <option value="amanha">Amanhã</option>
                    <option value="7dias">Próximos 7 dias</option>
                    <option value="mes">Neste Mês</option>
                    <option value="ano">Neste Ano</option>
                    <option value="personalizado">Personalizado...</option>
                </select>
                <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            </div>
            <input type="date" id="date-filter-custom" class="hidden px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm text-slate-600 font-bold">
        </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead class="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors sortable" data-sort="loanCode">
                            <div class="flex items-center gap-1">Contrato <i data-lucide="chevrons-up-down" class="w-3 h-3"></i></div>
                        </th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors sortable" data-sort="dueDate">
                            <div class="flex items-center gap-1">Vencimento <i data-lucide="chevrons-up-down" class="w-3 h-3"></i></div>
                        </th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors sortable" data-sort="clientName">
                             <div class="flex items-center gap-1">Cliente <i data-lucide="chevrons-up-down" class="w-3 h-3"></i></div>
                        </th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors sortable" data-sort="city">
                             <div class="flex items-center gap-1">Cidade <i data-lucide="chevrons-up-down" class="w-3 h-3"></i></div>
                        </th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors sortable" data-sort="number">
                             <div class="flex items-center gap-1">Parcela <i data-lucide="chevrons-up-down" class="w-3 h-3"></i></div>
                        </th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors sortable" data-sort="amount">
                             <div class="flex items-center gap-1">Valor <i data-lucide="chevrons-up-down" class="w-3 h-3"></i></div>
                        </th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors sortable" data-sort="paidAt">
                             <div class="flex items-center gap-1">Pagamento <i data-lucide="chevrons-up-down" class="w-3 h-3"></i></div>
                        </th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors sortable" data-sort="status">
                             <div class="flex items-center gap-1">Status <i data-lucide="chevrons-up-down" class="w-3 h-3"></i></div>
                        </th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Cobrança</th>
                    </tr>
                </thead>
                <tbody id="installments-list" class="divide-y divide-slate-50">
                    <!-- Loaded via JS -->
                </tbody>
            </table>
        </div>
        
        <!-- Pagination Controls -->
        <div id="pagination-controls" class="hidden px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span id="pagination-info" class="text-xs font-bold text-slate-500 uppercase tracking-widest">Página 1 de 1</span>
            <div class="flex gap-2">
                <button id="btn-prev-page" class="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-primary hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                </button>
                <button id="btn-next-page" class="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-primary hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Proof Viewer Modal -->
<div id="proof-viewer-modal" class="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[250] hidden flex items-center justify-center p-4 md:p-10">
    <div class="relative w-full max-w-5xl h-full flex flex-col items-center justify-center">
        <button class="close-proof-modal absolute -top-12 right-0 text-white hover:text-rose-400 transition-all flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
            <span>Fechar Visualização</span>
            <i data-lucide="x" class="w-8 h-8"></i>
        </button>
        <div id="proof-display" class="w-full h-full rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center">
            <!-- Content injected via JS (img or iframe) -->
        </div>
    </div>
</div>

<!-- Edit Installment Modal -->
<div id="edit-installment-modal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[250] hidden flex items-center justify-center p-4 md:p-10">
    <div class="bg-white rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        <!-- Premium Header -->
        <div class="bg-slate-900 p-8 relative overflow-hidden flex-shrink-0">
            <div class="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl"></div>
            <div class="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl"></div>
            <div class="relative z-10 flex justify-between items-center text-white">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30 border border-white/10 shrink-0">
                        <i data-lucide="edit-3" class="w-6 h-6 text-white"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-black font-heading tracking-tight">Editar Parcela</h3>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Valores, Prazos e Status</p>
                    </div>
                </div>
                <button type="button" class="close-edit-installment group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-rose-500 border border-white/10 transition-all">
                    <i data-lucide="x" class="w-4 h-4 text-slate-300 group-hover:text-white transition-colors"></i>
                </button>
            </div>
        </div>

        <div class="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
            <form id="edit-installment-form" class="space-y-6">
                <input type="hidden" id="edit-inst-id">
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-2">Vencimento Original</label>
                        <div class="relative opacity-60">
                            <i data-lucide="calendar" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                            <input type="date" id="edit-inst-date-original" readonly tabindex="-1"
                                   class="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none text-sm font-bold text-slate-500 cursor-not-allowed">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-2">Novo Vencimento</label>
                        <div class="relative">
                            <i data-lucide="calendar-clock" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary"></i>
                            <input type="date" id="edit-inst-date-new"
                                   class="w-full pl-11 pr-4 py-3 bg-white border border-primary/30 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-800 shadow-sm">
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase mb-2">Valor da Parcela</label>
                    <div class="relative">
                        <i data-lucide="dollar-sign" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                        <input type="number" step="0.01" id="edit-inst-amount" required
                               class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-800 shadow-sm">
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase mb-2">Status da Parcela</label>
                    <div class="relative">
                        <i data-lucide="activity" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                        <select id="edit-inst-status" required class="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-800 appearance-none cursor-pointer shadow-sm">
                            <option value="pendente">Vence Hoje</option>
                            <option value="avencer">A Vencer</option>
                            <option value="atrasada">Atrasada</option>
                            <option value="paga">Paga / Baixada</option>
                        </select>
                        <i data-lucide="chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></i>
                    </div>
                </div>
                
                <div id="edit-inst-method-container" class="hidden transition-all duration-300">
                    <label class="block text-[10px] font-black text-slate-400 uppercase mb-2">Método de Pagamento</label>
                    <div class="relative">
                        <i data-lucide="wallet" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500"></i>
                        <select id="edit-inst-method" class="w-full pl-11 pr-10 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm font-bold appearance-none cursor-pointer shadow-sm">
                            <option value="pix" selected>PIX</option>
                            <option value="dinheiro">Dinheiro In-Loco</option>
                            <option value="transferencia">Transferência</option>
                            <option value="cartao">Cartão / Maquininha</option>
                        </select>
                        <i data-lucide="chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none"></i>
                    </div>
                </div>
            </form>
        </div>
        <div class="p-6 border-t border-slate-100 bg-white flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0">
            <button type="button" class="close-edit-installment w-full sm:w-auto px-6 py-3.5 sm:py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-xs uppercase tracking-widest shrink-0">Cancelar</button>
            <button type="submit" form="edit-installment-form" class="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 rounded-xl font-black bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                <i data-lucide="save" class="w-4 h-4"></i>
                Salvar Alterações
            </button>
        </div>
    </div>
</div>

