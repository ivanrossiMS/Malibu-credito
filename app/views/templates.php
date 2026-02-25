<?php
/**
 * Templates View
 */
?>
<div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-3xl font-bold font-heading">Templates de Mensagem</h1>
            <p class="text-slate-500">Configure suas réguas de cobrança automatizadas.</p>
        </div>
        <button id="add-template-btn" class="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all font-bold flex items-center gap-2">
            <i data-lucide="plus" class="w-5 h-5"></i>
            <span>Novo Template</span>
        </button>
    </div>

    <!-- Templates Grid -->
    <div id="templates-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Loaded via JS -->
    </div>
</div>

<!-- Template Modal -->
<div id="template-modal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] hidden flex items-center justify-center p-4 sm:p-6">
    <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[90vh]">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h2 class="text-xl font-bold font-heading">Editar Template</h2>
            <button type="button" class="close-modal p-2 rounded-xl hover:bg-slate-100 text-slate-400 focus:outline-none">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
        </div>
        <form id="template-form" class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            <input type="hidden" id="template-id">
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Título do Template</label>
                <input type="text" id="title" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Ex: Lembrete Vencimento Hoje">
            </div>
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Conteúdo da Mensagem</label>
                <textarea id="content" required rows="6" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Olá {nome_cliente}, sua parcela de {valor_parcela} vence hoje..."></textarea>
                <p class="mt-2 text-xs text-slate-400">Variáveis: {nome_cliente}, {valor_parcela}, {data_vencimento}, {dias_atraso}</p>
            </div>
            <div class="pt-6 flex justify-end gap-3 shrink-0 mt-2">
                <button type="button" class="close-modal px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
                <button type="submit" class="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all font-bold">Salvar Template</button>
            </div>
        </form>
    </div>
</div>
