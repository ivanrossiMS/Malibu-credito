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

    <!-- Companies Table -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead class="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Empresa</th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">CNPJ / Slug</th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Integração ASAAS</th>
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

<!-- Add/Edit Company Modal (with tabs) -->
<div id="company-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] hidden flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[92vh]">
        <div class="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h2 id="modal-title" class="text-2xl font-black text-slate-800 font-heading">Nova Empresa</h2>
            <button onclick="closeCompanyModal()" class="p-2 hover:bg-slate-100 rounded-xl transition-all"><i data-lucide="x" class="w-6 h-6 text-slate-400"></i></button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-slate-100 shrink-0">
            <button id="tab-dados" onclick="switchTab('dados')" class="tab-btn px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 border-primary text-primary transition-all">
                Dados da Empresa
            </button>
            <button id="tab-asaas" onclick="switchTab('asaas')" class="tab-btn px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 border-transparent text-slate-400 hover:text-slate-600 transition-all">
                <i data-lucide="shield-check" class="w-3.5 h-3.5 inline mr-1"></i>
                Integração ASAAS
            </button>
        </div>

        <div class="flex-1 overflow-y-auto">
            <!-- TAB: Dados da Empresa -->
            <div id="panel-dados" class="tab-panel">
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

                    <div class="space-y-2">
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label>
                        <input type="text" id="company-cnpj" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-700">
                    </div>

                    <div class="pt-4">
                        <button type="submit" class="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest">SALVAR EMPRESA</button>
                    </div>
                </form>
            </div>

            <!-- TAB: Integração ASAAS -->
            <div id="panel-asaas" class="tab-panel hidden">
                <div class="p-8 space-y-6">

                    <!-- Status Banner -->
                    <div id="asaas-status-banner" class="hidden p-4 rounded-2xl border flex items-center gap-3">
                        <div id="asaas-status-icon" class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"></div>
                        <div>
                            <p id="asaas-status-text" class="font-bold text-sm text-slate-800"></p>
                            <p id="asaas-status-sub" class="text-[10px] text-slate-500 font-medium mt-0.5"></p>
                        </div>
                    </div>

                    <!-- Warning: No company selected -->
                    <div id="asaas-no-company" class="p-6 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                        <i data-lucide="alert-triangle" class="w-8 h-8 text-amber-400 mx-auto mb-2"></i>
                        <p class="text-amber-700 font-bold text-sm">Salve primeiro os Dados da Empresa antes de configurar a integração ASAAS.</p>
                    </div>

                    <div id="asaas-form-wrapper" class="hidden space-y-5">

                        <!-- Environment -->
                        <div class="space-y-2">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ambiente</label>
                            <select id="asaas-env" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-700">
                                <option value="sandbox">Sandbox (Testes)</option>
                                <option value="production">Produção (Real)</option>
                            </select>
                        </div>

                        <!-- API Key -->
                        <div class="space-y-2">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                API Key ASAAS <span class="text-rose-400 normal-case font-medium">(criptografada ao salvar — nunca exposta)</span>
                            </label>
                            <div class="relative">
                                <input type="password" id="asaas-api-key"
                                    placeholder="Cole aqui a API Key do ASAAS desta empresa"
                                    autocomplete="new-password"
                                    class="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all font-bold text-slate-700 pr-14">
                                <button type="button" onclick="toggleApiKeyVisibility()" class="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors" title="Mostrar/ocultar">
                                    <i data-lucide="eye" class="w-4 h-4" id="toggle-key-icon"></i>
                                </button>
                            </div>
                            <p id="asaas-key-status" class="text-[10px] ml-1 font-bold"></p>
                        </div>

                        <!-- Webhook Token + URL -->
                        <div class="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-4">
                            <h4 class="text-indigo-900 font-black text-sm flex items-center gap-2">
                                <i data-lucide="webhook" class="w-4 h-4"></i> Webhook URL (para o painel ASAAS)
                            </h4>

                            <div class="space-y-2">
                                <label class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Token do Webhook <span class="normal-case font-normal text-indigo-300">(gerado automaticamente)</span></label>
                                <div class="flex gap-2">
                                    <input type="text" id="asaas-webhook-token" readonly
                                        class="flex-1 px-5 py-3 bg-white border border-indigo-100 rounded-xl font-mono text-xs text-slate-600 outline-none cursor-default" placeholder="Salve a empresa primeiro...">
                                    <button type="button" onclick="regenerateWebhookToken()" title="Regenerar token" class="px-4 py-3 bg-white border border-indigo-100 rounded-xl text-indigo-500 hover:bg-indigo-50 transition-all text-[10px] font-black uppercase tracking-widest shrink-0">
                                        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="space-y-1">
                                <label class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">URL Completa — Copie e cole no painel ASAAS</label>
                                <div class="flex gap-2">
                                    <input type="text" id="asaas-webhook-url" readonly
                                        class="flex-1 px-4 py-3 bg-white border border-indigo-100 rounded-xl font-mono text-[10px] text-slate-500 outline-none cursor-default" placeholder="Salve a empresa e defina um token...">
                                    <button type="button" onclick="copyWebhookUrl()" title="Copiar URL" class="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shrink-0">
                                        <i data-lucide="copy" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            <button type="button" onclick="testAsaasConnection()" id="btn-test-asaas"
                                class="flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-700 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">
                                <i data-lucide="wifi" class="w-4 h-4"></i>
                                Testar Conexão
                            </button>
                            <button type="button" onclick="saveAsaasIntegration()" id="btn-save-asaas"
                                class="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">
                                <i data-lucide="save" class="w-4 h-4"></i>
                                Salvar Integração
                            </button>
                        </div>

                        <!-- Test Result -->
                        <div id="test-result" class="hidden p-4 rounded-2xl border text-sm font-bold"></div>
                    </div>
                </div>
            </div>
        </div>
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
                    <button id="finance-manual-block" onclick="toggleCompanyBlockStatus()" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">BLOQUEAR ACESSO</button>
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
