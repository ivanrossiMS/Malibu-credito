<?php
/**
 * Settings View
 */
?>
<div class="space-y-8">
    <div>
        <h1 class="text-3xl font-bold font-heading">Configurações</h1>
        <p class="text-slate-500">Backup de dados e personalização do sistema.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Backup Section -->
        <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div class="flex items-center gap-3">
                <div class="bg-primary/10 p-2.5 rounded-2xl text-primary">
                    <i data-lucide="database" class="w-6 h-6"></i>
                </div>
                <h2 class="text-xl font-bold">Backup & Segurança</h2>
            </div>
            
            <p class="text-slate-600 text-sm">Como os dados são armazenados localmente no seu navegador, é essencial fazer backups periódicos para não perder informações.</p>
            
            <div class="space-y-3">
                <button id="export-backup-btn" class="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group">
                    <div class="flex items-center gap-3">
                        <i data-lucide="download" class="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors"></i>
                        <span class="font-semibold text-slate-700">Exportar Backup (.json)</span>
                    </div>
                    <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
                </button>
                
                <div class="relative">
                    <input type="file" id="import-backup-input" class="hidden" accept=".json">
                    <button id="import-backup-trigger" class="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group">
                        <div class="flex items-center gap-3">
                            <i data-lucide="upload" class="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors"></i>
                            <span class="font-semibold text-slate-700">Importar Backup</span>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
                    </button>
                </div>

                <button id="generate-demo-btn" class="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 rounded-2xl transition-all group border border-primary/10">
                    <div class="flex items-center gap-3">
                        <i data-lucide="sparkles" class="w-5 h-5 text-primary"></i>
                        <span class="font-semibold text-primary">Gerar Dados de Demonstração</span>
                    </div>
                    <i data-lucide="chevron-right" class="w-4 h-4 text-primary/30"></i>
                </button>

                <button id="factory-reset-btn" class="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-2xl transition-all group border border-red-100">
                    <div class="flex items-center gap-3">
                        <i data-lucide="trash-2" class="w-5 h-5 text-red-500"></i>
                        <span class="font-semibold text-red-600">Restaurar de fábrica</span>
                    </div>
                    <i data-lucide="chevron-right" class="w-4 h-4 text-red-200"></i>
                </button>
            </div>
        </div>

        <!-- Info / Version -->
        <div class="bg-secondary text-white p-8 rounded-3xl shadow-xl space-y-6 flex flex-col justify-center">
            <div class="flex items-center gap-3">
                <div class="bg-white/10 p-2.5 rounded-2xl">
                    <i data-lucide="info" class="w-6 h-6 text-primary"></i>
                </div>
                <h2 class="text-xl font-bold">Sobre o Malibu</h2>
            </div>
            <p class="text-slate-400 text-sm">Versão 1.0 (MVP Local-First). Desenvolvido para facilitar a gestão de cobranças de forma ágil e segura sem depender de internet constante.</p>
            <div class="pt-4 border-t border-white/10">
                <p class="text-xs text-slate-500 uppercase tracking-widest font-bold">Status do Sistema</p>
                <div class="flex items-center gap-2 mt-2">
                    <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span class="text-sm font-medium">Funcionando Localmente (IndexedDB)</span>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Reset Modal -->
<div id="reset-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] hidden flex items-center justify-center p-4 sm:p-6">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div class="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            <div class="flex items-center gap-4 shrink-0">
                <div class="bg-red-100 p-3 rounded-2xl text-red-600">
                    <i data-lucide="alert-triangle" class="w-8 h-8"></i>
                </div>
                <div>
                    <h2 class="text-2xl font-black text-slate-900">Restaurar de Fábrica</h2>
                    <p class="text-slate-500 text-sm">Selecione o que deseja apagar permanentemente.</p>
                </div>
            </div>

            <div class="space-y-4">
                <label class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border border-transparent has-[:checked]:border-red-200 has-[:checked]:bg-red-50/30 group">
                    <input type="checkbox" id="reset-loans" class="w-5 h-5 rounded-lg border-slate-300 text-red-600 focus:ring-red-500">
                    <div class="flex-1">
                        <p class="font-bold text-slate-700 group-hover:text-red-700 transition-colors">Empréstimos e Pagamentos</p>
                        <p class="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Histórico financeiro completo</p>
                    </div>
                </label>

                <label class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border border-transparent has-[:checked]:border-red-200 has-[:checked]:bg-red-50/30 group">
                    <input type="checkbox" id="reset-clients" class="w-5 h-5 rounded-lg border-slate-300 text-red-600 focus:ring-red-500">
                    <div class="flex-1">
                        <p class="font-bold text-slate-700 group-hover:text-red-700 transition-colors">Clientes</p>
                        <p class="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Todos os clientes cadastrados</p>
                    </div>
                </label>

                <label class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all border border-transparent has-[:checked]:border-red-200 has-[:checked]:bg-red-50/30 group">
                    <input type="checkbox" id="reset-users" class="w-5 h-5 rounded-lg border-slate-300 text-red-600 focus:ring-red-500">
                    <div class="flex-1">
                        <p class="font-bold text-slate-700 group-hover:text-red-700 transition-colors">Usuários</p>
                        <p class="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Logins e acessos admin</p>
                    </div>
                </label>
            </div>

            <div class="flex gap-3 pt-4 shrink-0 mt-4 border-t border-slate-100">
                <button type="button" id="close-reset-modal" class="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancelar</button>
                <button type="button" id="confirm-reset-btn" class="flex-1 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-200 transition-all">Apagar Selecionados</button>
            </div>
        </div>
    </div>
</div>
