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
                <div class="space-y-2">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label>
                    <input type="text" id="company-cnpj" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-700">
                </div>
                <div class="space-y-2">
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                    <select id="company-status" class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-700">
                        <option value="ativo">Ativo</option>
                        <option value="bloqueado">Bloqueado</option>
                    </select>
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
