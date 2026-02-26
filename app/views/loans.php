<?php
/**
 * Loans View
 */
?>
<div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-3xl font-bold font-heading">Empréstimos</h1>
            <p class="text-slate-500">Contratos ativos e histórico de empréstimos.</p>
        </div>
        <button id="add-loan-btn" class="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all font-bold flex items-center gap-2">
            <i data-lucide="plus-circle" class="w-5 h-5"></i>
            <span>Novo Empréstimo</span>
        </button>
    </div>

    <!-- Stats for Loans: Modern Colorful Design -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Card 1: Carteira Ativa / Valor Total -->
        <div class="bg-gradient-to-br from-emerald-500 to-primary p-6 rounded-[2rem] shadow-xl shadow-emerald-500/20 relative group overflow-hidden transition-all hover:scale-[1.02] border border-white/10">
            <div class="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-transform group-hover:scale-110"></div>
            <div class="relative z-10 flex flex-col h-full justify-between">
                <div class="relative inline-block w-full mb-4">
                    <select id="stat-portfolio-type" class="text-emerald-50/90 text-xs font-black tracking-widest uppercase bg-transparent border-none p-0 pr-6 cursor-pointer outline-none focus:ring-0 appearance-none w-auto max-w-full">
                        <option value="ativo" class="text-slate-800">Carteira Ativa</option>
                        <option value="total" class="text-slate-800">Valor Total</option>
                    </select>
                    <i data-lucide="chevron-down" class="w-4 h-4 text-emerald-100 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                </div>
                <div>
                    <h3 id="stat-portfolio-value" class="text-3xl font-black text-white tracking-tight drop-shadow-sm">R$ 0,00</h3>
                </div>
            </div>
        </div>

        <!-- Card 2: Contratos Ativos / Total -->
        <div class="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-6 rounded-[2rem] shadow-xl shadow-violet-500/20 relative group overflow-hidden transition-all hover:scale-[1.02] border border-white/10">
            <div class="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-transform group-hover:scale-110"></div>
            <div class="relative z-10 flex flex-col h-full justify-between">
                <div class="relative inline-block w-full mb-4">
                    <select id="stat-contracts-type" class="text-fuchsia-50/90 text-xs font-black tracking-widest uppercase bg-transparent border-none p-0 pr-6 cursor-pointer outline-none focus:ring-0 appearance-none w-auto max-w-full">
                        <option value="ativo" class="text-slate-800">Contratos Ativos</option>
                        <option value="total" class="text-slate-800">Total de Contratos</option>
                    </select>
                    <i data-lucide="chevron-down" class="w-4 h-4 text-fuchsia-100 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                </div>
                <div>
                    <h3 id="stat-contracts-count" class="text-3xl font-black text-white tracking-tight drop-shadow-sm">0</h3>
                </div>
            </div>
        </div>

        <!-- Card 3: Status Count -->
        <div class="bg-gradient-to-br from-amber-500 to-orange-500 p-6 rounded-[2rem] shadow-xl shadow-amber-500/20 relative group overflow-hidden transition-all hover:scale-[1.02] border border-white/10">
            <div class="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-transform group-hover:scale-110"></div>
            <div class="relative z-10 flex flex-col h-full justify-between">
                <div class="relative inline-block w-full mb-4">
                    <select id="stat-status-type" class="text-amber-50/90 text-xs font-black tracking-widest uppercase bg-transparent border-none p-0 pr-6 cursor-pointer outline-none focus:ring-0 appearance-none w-auto max-w-full">
                        <option value="quitado" class="text-slate-800">Contratos Quitados</option>
                        <option value="atrasado" class="text-slate-800">Contratos Atrasados</option>
                    </select>
                    <i data-lucide="chevron-down" class="w-4 h-4 text-amber-100 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                </div>
                <div>
                    <h3 id="stat-status-count" class="text-3xl font-black text-white tracking-tight drop-shadow-sm">0</h3>
                </div>
            </div>
        </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Cliente</label>
                <select id="filter-client" class="w-full px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-primary outline-none transition-all">
                    <option value="">Todos os Clientes</option>
                </select>
            </div>
            <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Status</label>
                <select id="filter-status" class="w-full px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-primary outline-none transition-all">
                    <option value="">Todos os Status</option>
                    <option value="ativo">Ativo</option>
                    <option value="quitado">Quitado</option>
                    <option value="atrasado">Atrasado</option>
                </select>
            </div>
            <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Data</label>
                <input type="date" id="filter-date" class="w-full px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-primary outline-none transition-all">
            </div>
            <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Contrato (ID)</label>
                <input type="text" id="filter-id" placeholder="Ex: MAL-..." class="w-full px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:ring-2 focus:ring-primary outline-none transition-all">
            </div>
        </div>
    </div>

    <!-- Loans Table -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead class="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors sortable" data-sort="loanCode">
                            <div class="flex items-center gap-1">ID <i data-lucide="chevrons-up-down" class="w-3 h-3"></i></div>
                        </th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors sortable" data-sort="clientName">
                             <div class="flex items-center gap-1">Cliente <i data-lucide="chevrons-up-down" class="w-3 h-3"></i></div>
                        </th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:text-primary transition-colors sortable" data-sort="amount">
                            <div class="flex items-center justify-end gap-1">Solicitado <i data-lucide="chevrons-up-down" class="w-3 h-3"></i></div>
                        </th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:text-primary transition-colors sortable" data-sort="interest">
                            <div class="flex items-center justify-end gap-1">Juros <i data-lucide="chevrons-up-down" class="w-3 h-3"></i></div>
                        </th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:text-primary transition-colors sortable" data-sort="total">
                            <div class="flex items-center justify-end gap-1">Total <i data-lucide="chevrons-up-down" class="w-3 h-3"></i></div>
                        </th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Parcelas</th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors sortable" data-sort="startDate">
                            <div class="flex items-center gap-1">1ª Parcela <i data-lucide="chevrons-up-down" class="w-3 h-3"></i></div>
                        </th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors sortable" data-sort="status">
                            <div class="flex items-center gap-1">Status <i data-lucide="chevrons-up-down" class="w-3 h-3"></i></div>
                        </th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                </thead>
                <tbody id="loans-list" class="divide-y divide-slate-50">
                    <!-- Loaded via JS -->
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Add Loan Modal -->
<div id="loan-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] hidden flex items-center justify-center p-4 sm:p-6">
    <div class="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden scale-95 transition-transform duration-300 flex flex-col max-h-[100dvh] sm:max-h-[90vh]">
        
        <!-- Header fixo modernizado com glassmorphism -->
        <div class="bg-slate-900 p-8 relative overflow-hidden flex-shrink-0">
            <!-- Decorative blobs -->
            <div class="absolute top-0 right-0 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl -mr-16 -mt-16"></div>
            
            <div class="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-4 text-white">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-primary-dark flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-white/10 shrink-0">
                        <i data-lucide="file-signature" class="w-7 h-7 text-white"></i>
                    </div>
                    <div>
                        <h2 id="modal-title-loan" class="text-2xl font-black font-heading tracking-tight">Novo Contrato</h2>
                        <p class="text-xs font-medium text-slate-300 mt-1 uppercase tracking-widest">Simulação e Emissão</p>
                    </div>
                </div>
                <!-- Premium Close Button -->
                <button type="button" class="close-modal group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-500/30 border border-white/10 transition-all duration-300 transform hover:scale-105">
                    <i data-lucide="x" class="w-4 h-4 text-slate-300 group-hover:text-white transition-colors"></i>
                </button>
            </div>
        </div>

        <!-- Formulário Rolável -->
        <div class="flex-1 flex flex-col overflow-hidden bg-slate-50">
            <form id="loan-form" class="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6">
            <input type="hidden" id="loan-id">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-1">
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Selecionar Cliente</label>
                    <select id="clientId" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all">
                        <option value="">Carregando clientes...</option>
                    </select>
                </div>
                <div class="md:col-span-1" id="status-container" style="display: none;">
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Status do Empréstimo</label>
                    <select id="loan-status" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all font-bold">
                        <option value="ativo">Ativo</option>
                        <option value="quitado">Quitado</option>
                        <option value="atrasado">Atrasado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Valor do Empréstimo (R$)</label>
                    <input type="number" step="0.01" id="amount" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="0,00">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Juros</label>
                    <div class="flex gap-2">
                        <input type="number" step="0.01" id="interestRate" required class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="0.00">
                        <select id="interestType" class="w-20 px-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-600 outline-none">
                            <option value="fixed" selected>R$</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Número de Parcelas</label>
                    <input type="number" id="numInstallments" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="12">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Frequência de pagamento</label>
                    <select id="frequency" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all">
                        <option value="mensal">Mensal</option>
                        <option value="semanal">Semanal</option>
                        <option value="diario">Diário</option>
                    </select>
                    <div class="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <p class="text-[10px] text-blue-600 font-medium leading-relaxed">
                            <i data-lucide="info" class="w-3 h-3 inline-block mr-1"></i>
                            <strong>Mensal/Diário:</strong> Juros somados ao total e divididos.<br>
                            <strong>Semanal:</strong> Valor dividido + Juros em cada parcela.
                        </p>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Data da 1ª Parcela</label>
                    <input type="date" id="startDate" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all">
                </div>
                <div class="md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div class="flex justify-between items-center pb-3 border-b border-slate-200 border-dashed">
                        <span class="text-sm font-bold text-slate-600">Valor Estimado da Parcela:</span>
                        <span class="text-lg font-black text-slate-800" id="installment-preview">R$ 0,00</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-bold text-slate-600">Total (Capital + Juros):</span>
                        <span class="text-xl font-black text-primary" id="total-preview">R$ 0,00</span>
                    </div>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Observações (Opcional)</label>
                    <textarea id="notes" rows="2" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all"></textarea>
                </div>
            </div>
            </form>
            <div class="p-6 bg-white border-t border-slate-100 shrink-0 flex flex-col sm:flex-row justify-end gap-3 mt-auto rounded-b-[2rem] z-10">
                <button type="button" class="close-modal w-full sm:w-auto px-8 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all text-sm flex items-center justify-center">
                    CANCELAR
                </button>
                <button type="button" onclick="document.getElementById('loan-form').requestSubmit()" class="w-full sm:flex-1 sm:max-w-[300px] py-3.5 bg-gradient-to-r from-emerald-500 to-primary-dark hover:from-emerald-600 hover:to-primary text-white font-black rounded-2xl shadow-xl shadow-emerald-500/30 transition-all text-sm flex items-center justify-center gap-2">
                    <i data-lucide="check-circle" class="w-5 h-5"></i>
                    SALVAR CONTRATO
                </button>
            </div>
        </div>
    </div>
</div>
