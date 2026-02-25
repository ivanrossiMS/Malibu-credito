<?php
/**
 * Meus Empréstimos View - CLIENT
 */
?>
<div class="space-y-10 pb-12 fade-in">
    <!-- Premium Header -->
    <div class="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-primary-dark rounded-[3rem] p-10 md:p-14 text-white shadow-premium">
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div class="space-y-3">
                <span class="inline-block px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md">MEUS CONTRATOS</span>
                <h1 class="text-4xl md:text-5xl font-black font-heading tracking-tighter">Empréstimos</h1>
                <p class="text-white/60 font-medium text-lg max-w-md">Gerencie os limites, parcelas e acompanhe o status dos seus contratos ativos conosco.</p>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:flex lg:gap-8">
                <!-- Total Ativo -->
                <div class="bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 border border-white/10 shadow-inner group hover:bg-white/10 transition-all duration-500">
                    <p class="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">Total Ativo</p>
                    <h3 id="client-loans-total" class="text-3xl font-black tracking-tighter text-emerald-400 group-hover:scale-105 transition-transform">R$ 0,00</h3>
                </div>
                <!-- Contratos Qtde -->
                <div class="bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 border border-white/10 shadow-inner group hover:bg-white/10 transition-all duration-500">
                    <p class="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">Contratos</p>
                    <h3 id="client-loans-count" class="text-3xl font-black tracking-tighter group-hover:scale-105 transition-transform">0</h3>
                </div>
                <!-- Próxima Parcela -->
                <div class="bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 border border-white/10 shadow-inner group hover:bg-white/10 transition-all duration-500">
                    <p class="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">Status Parcelas</p>
                    <h3 id="client-loans-next" class="text-lg mt-2 font-bold tracking-tighter text-white/80">...</h3>
                </div>
            </div>
        </div>
        
        <!-- Decoration -->
        <div class="absolute -right-20 -top-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
        <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" style="animation-delay: 2s"></div>
    </div>

    <!-- Toolbar & List -->
    <div class="premium-card p-4">
        <div class="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-50">
            <div>
                <h2 class="text-2xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
                    <i data-lucide="hand-coins" class="w-7 h-7 text-primary"></i>
                    Sua Carteira
                </h2>
                <p class="text-slate-400 text-sm font-medium mt-1">Visão geral dos empréstimos contratados</p>
            </div>
            
            <div class="flex items-center gap-4 w-full lg:w-auto">
                <div class="relative flex-1 lg:flex-none">
                    <i data-lucide="search" class="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                    <input type="text" id="client-search-loans" placeholder="Buscar contrato..." class="pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none text-sm font-bold text-slate-700 transition-all w-full lg:w-64 placeholder:text-slate-400">
                </div>
                <a href="?page=client_loan_request" class="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_10px_40px_-10px_rgba(13,148,136,0.5)] hover:shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    Solicitar
                </a>
            </div>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                        <th class="px-8 py-7">Contrato / Data</th>
                        <th class="px-8 py-7">Valor Solicitado</th>
                        <th class="px-8 py-7">Total (com Juros)</th>
                        <th class="px-8 py-7">Status</th>
                        <th class="px-8 py-7 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody id="client-loans-list" class="divide-y divide-slate-50">
                    <tr>
                        <td colspan="5" class="px-10 py-32 text-center">
                            <div class="flex flex-col items-center gap-4 opacity-30">
                                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center animate-spin">
                                    <i data-lucide="loader-2" class="w-8 h-8 text-primary"></i>
                                </div>
                                <p class="text-xs font-black uppercase tracking-widest">Sincronizando contratos...</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Modal de Parcelas -->
<div id="loan-installments-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] hidden flex items-center justify-center p-4 sm:p-6 fade-in">
    <div class="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[90vh]">
        <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 relative shrink-0">
            <div>
                <h3 class="text-2xl font-black text-slate-900 tracking-tight">Parcelas do Contrato</h3>
                <p id="modal-loan-code" class="text-primary font-bold text-sm mt-1 uppercase tracking-widest">MAL-</p>
            </div>

            <button id="close-installments-modal" class="w-10 h-10 shrink-0 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
        </div>
        <div class="p-0 overflow-y-auto custom-scrollbar flex-1">
            <table class="w-full text-left">
                <thead class="bg-slate-50 sticky top-0 shadow-sm">
                    <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th class="px-8 py-4">Nº</th>
                        <th class="px-8 py-4">Vencimento</th>
                        <th class="px-8 py-4">Valor</th>
                        <th class="px-8 py-4">Status</th>
                    </tr>
                </thead>
                <tbody id="modal-installments-list" class="divide-y divide-slate-50">
                    <!-- Inserted via JS -->
                </tbody>
            </table>
        </div>
        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 shrink-0 mt-auto">
            <div class="flex gap-6">
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Valor já Pago
                    </p>
                    <p id="modal-total-pago" class="font-black text-xl text-emerald-600 leading-tight">R$ 0,00</p>
                </div>
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-rose-500"></span> Pendente / Atrasado
                    </p>
                    <p id="modal-total-aberto" class="font-black text-xl text-rose-600 leading-tight">R$ 0,00</p>
                </div>
            </div>

            <button onclick="document.getElementById('loan-installments-modal').classList.add('hidden')" class="w-full sm:w-auto px-6 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all active:scale-95">Fechar Extrato</button>
        </div>
    </div>
</div>
