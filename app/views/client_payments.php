<?php
/**
 * Malibu Crédito - Meus Pagamentos
 */
?>
<div class="space-y-8 fade-in">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 class="text-3xl font-black text-slate-900 font-heading tracking-tight">Meus Pagamentos</h1>
            <p class="text-slate-500 font-medium">Gerencie suas parcelas e realize pagamentos via PIX.</p>
        </div>
        
        <!-- Quick Stats -->
        <div class="flex gap-4">
            <div class="bg-white px-6 py-4 rounded-3xl shadow-soft border border-emerald-50 text-center">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pagas</p>
                <p id="stats-paid-count" class="text-xl font-black text-emerald-600">0</p>
            </div>
            <div class="bg-white px-6 py-4 rounded-3xl shadow-soft border border-amber-50 text-center">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendentes</p>
                <p id="stats-pending-count" class="text-xl font-black text-amber-600">0</p>
            </div>
        </div>
    </div>

    <!-- Filters -->
    <div class="bg-white p-6 rounded-[2rem] shadow-soft border border-slate-100 flex flex-wrap gap-4 items-center">
        <div class="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <i data-lucide="filter" class="w-4 h-4 text-slate-400"></i>
            <select id="payment-filter-status" class="bg-transparent text-xs font-bold text-slate-600 outline-none appearance-none pr-4">
                <option value="ALL">Todo Status</option>
                <option value="PENDING">Pendentes</option>
                <option value="PAID">Pagas</option>
                <option value="OVERDUE">Atrasadas</option>
            </select>
        </div>
        
        <div class="flex-1"></div>
        
        <button id="export-payments" class="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">
            <i data-lucide="download" class="w-4 h-4"></i>
            Exportar Extrato
        </button>
    </div>

    <!-- Main Table / Mobile Cards -->
    <div class="premium-card overflow-hidden">
        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50/50 border-b border-slate-100">
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº Parcela</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                    </tr>
                </thead>
                <tbody id="payments-list" class="divide-y divide-slate-50">
                    <!-- Loaded via JS -->
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Pix Payment Modal -->
<div id="pix-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] hidden flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div class="p-8 text-center space-y-6">
            <div class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <i data-lucide="qr-code" class="w-10 h-10"></i>
            </div>
            
            <div>
                <h3 class="text-2xl font-black text-slate-900">Pagamento PIX</h3>
                <p class="text-slate-500 text-sm mt-1">Escaneie o código ou copie a chave abaixo.</p>
            </div>

            <div id="pix-qr-container" class="w-64 h-64 bg-slate-50 mx-auto rounded-3xl border border-slate-100 p-4 flex items-center justify-center shadow-inner">
                <!-- QR Code injected here -->
                <div class="animate-pulse flex flex-col items-center">
                    <div class="bg-slate-200 w-48 h-48 rounded-xl"></div>
                </div>
            </div>

            <div class="space-y-3">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor a pagar</p>
                <p id="pix-amount" class="text-3xl font-black text-slate-900 tracking-tight">R$ 0,00</p>
            </div>

            <button id="pix-copy-btn" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs shadow-xl active:scale-95">
                <i data-lucide="copy" class="w-4 h-4"></i>
                Copiar Código PIX
            </button>

            <button class="close-pix-modal w-full text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest transition-colors">
                Fechar e voltar
            </button>
        </div>
        
        <div class="bg-emerald-50 p-4 text-center border-t border-emerald-100">
            <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Aguardando confirmação em tempo real...
            </p>
        </div>
    </div>
</div>
