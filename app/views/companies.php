<?php
/**
 * Companies Management View (Master Only)
 */
?>
<div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-3xl font-bold font-heading">Gestão de Empresas</h1>
            <p class="text-slate-500">Cadastre e gerencie as empresas do sistema.</p>
        </div>
        <button onclick="openAddCompanyModal()" class="bg-primary text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-sm">
            <i data-lucide="plus" class="w-5 h-5"></i>
            NOVA EMPRESA
        </button>
    </div>

    <!-- Stats summary for companies could go here -->

    <!-- Companies Table -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead class="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Empresa</th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">CNPJ / Slug</th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Configuração Asaas</th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                </thead>
                <tbody id="companies-list" class="divide-y divide-slate-50">
                    <!-- Loaded via JS -->
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Add/Edit Company Modal -->
<div id="company-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] hidden flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in">
        <div class="p-8 border-b border-slate-100 flex items-center justify-between">
            <h2 id="modal-title" class="text-2xl font-black text-slate-800 font-heading">Nova Empresa</h2>
            <button onclick="closeCompanyModal()" class="p-2 hover:bg-slate-100 rounded-xl transition-all"><i data-lucide="x" class="w-6 h-6 text-slate-400"></i></button>
        </div>
        <form id="company-form" class="p-8 space-y-6">
            <input type="hidden" id="company-id">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Empresa</label>
                    <input type="text" id="company-name" required class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-700">
                </div>
                <div class="space-y-2">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificador (Slug)</label>
                    <input type="text" id="company-slug" required class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-700" placeholder="ex: malibu-filial-1">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2 col-span-2">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label>
                    <input type="text" id="company-cnpj" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-700">
                </div>
            </div>

            <div class="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 space-y-4">
                <h3 class="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                    <i data-lucide="shield-check" class="w-4 h-4"></i>
                    Configurações Financeiras (Asaas)
                </h3>
                <div class="space-y-4">
                    <div class="space-y-2">
                        <label class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">API Key Asaas</label>
                        <input type="password" id="company-asaas-key" class="w-full px-5 py-4 bg-white border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-700">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Ambiente</label>
                            <select id="company-asaas-env" class="w-full px-5 py-4 bg-white border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-700">
                                <option value="sandbox">Sandbox (Teste)</option>
                                <option value="production">Produção (Real)</option>
                            </select>
                        </div>
                        <div class="space-y-2">
                            <label class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Wallet ID (Opcional)</label>
                            <input type="text" id="company-asaas-wallet" class="w-full px-5 py-4 bg-white border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-700" placeholder="ID da carteira Asaas">
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Chave PIX</label>
                        <input type="text" id="company-pix-key" class="w-full px-5 py-4 bg-white border border-indigo-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-700">
                    </div>
                </div>
            </div>

            <div class="pt-4">
                <button type="submit" class="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest">SALVAR EMPRESA</button>
            </div>
        </form>
    </div>
</div>

<!-- Company Finance Modal -->
<div id="finance-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] hidden flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        <div class="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
            <div>
                <h2 class="text-2xl font-black text-indigo-900 font-heading">Gestão Financeira</h2>
                <p id="finance-company-name" class="text-indigo-600 font-bold text-xs uppercase tracking-widest">Empresa X</p>
            </div>
            <button onclick="closeFinanceModal()" class="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><i data-lucide="x" class="w-6 h-6 text-slate-400"></i></button>
        </div>

        <div class="p-8 space-y-8 overflow-y-auto flex-1">
            <!-- Access Control Banner -->
            <div id="finance-access-banner" class="p-6 rounded-3xl border flex items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <div id="finance-status-icon" class="w-12 h-12 rounded-2xl flex items-center justify-center">
                        <i data-lucide="shield-check" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h4 id="finance-status-title" class="font-black text-slate-800">Acesso Liberado</h4>
                        <p id="finance-status-desc" class="text-xs text-slate-500 font-medium">A empresa está em dia com as mensalidades.</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button id="finance-manual-block" onclick="toggleCompanyBlockStatus()" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                        BLOQUEAR ACESSO
                    </button>
                    <div class="w-px h-8 bg-slate-200 mx-1"></div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="finance-access-override" class="sr-only peer" onchange="toggleAccessOverride()">
                        <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span class="ml-3 text-xs font-black text-slate-400 uppercase tracking-widest">Liberar Forçado</span>
                    </label>
                </div>
            </div>

            <!-- Generate Installments Form -->
            <div class="space-y-4">
                <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <i data-lucide="plus-circle" class="w-4 h-4 text-primary"></i>
                    Gerar Novas Mensalidades
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade de Meses</label>
                        <input type="number" id="finance-count" value="1" min="1" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary">
                    </div>
                    <div class="space-y-2">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor por Mês (R$)</label>
                        <input type="number" id="finance-amount" value="10.00" step="0.01" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary">
                    </div>
                    <div class="col-span-1 md:col-span-2 space-y-2">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primeiro Vencimento</label>
                        <input type="date" id="finance-first-due" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary">
                    </div>
                </div>
                <button onclick="generateCompanyBilling()" class="w-full bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-900 transition-all uppercase tracking-widest text-xs">GERAR MENSALIDADES AGORA</button>
            </div>

            <!-- List of Installments -->
            <div class="space-y-4">
                <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <i data-lucide="history" class="w-4 h-4 text-slate-400"></i>
                    Histórico de Pagamentos
                </h3>
                <div class="border border-slate-100 rounded-3xl overflow-hidden">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th class="px-6 py-3 font-black text-slate-400 uppercase">Vencimento</th>
                                <th class="px-6 py-3 font-black text-slate-400 uppercase">Valor</th>
                                <th class="px-6 py-3 font-black text-slate-400 uppercase">Status</th>
                                <th class="px-6 py-3 font-black text-slate-400 uppercase text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="finance-installments-list" class="divide-y divide-slate-50 font-bold text-slate-600">
                            <!-- JS content -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
