<?php
/**
 * Settings View - Modern Master Control
 */
?>
<div class="space-y-8 pb-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 class="text-4xl font-black text-slate-800 font-heading tracking-tight">Configurações Master</h1>
            <p class="text-slate-500 font-medium">Gestão de segurança, auditoria e manutenção do ecossistema Malibu.</p>
        </div>
        <div class="flex items-center gap-3">
            <div class="px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-2">
                <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span class="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Sistema Online (Cloud)</span>
            </div>
        </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left Column: Maintenance & Backups -->
        <div class="lg:col-span-1 space-y-8">
            <!-- Backup Card -->
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                
                <div class="flex items-center gap-4 relative z-10">
                    <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <i data-lucide="database" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h2 class="text-xl font-black text-slate-800">Manutenção</h2>
                        <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-1">Backup & Integridade</p>
                    </div>
                </div>

                <div class="space-y-3 relative z-10">
                    <!-- Backup Server -->
                    <button id="backup-server-btn" class="w-full group flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-900 border border-slate-100 hover:border-slate-800 rounded-2xl transition-all duration-300">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-slate-800 transition-colors">
                                <i data-lucide="cloud-upload" class="w-5 h-5 text-slate-400 group-hover:text-primary"></i>
                            </div>
                            <div class="text-left">
                                <span class="block font-bold text-slate-700 group-hover:text-white text-sm">Backup no Servidor</span>
                                <span class="block text-[9px] text-slate-400 font-black uppercase tracking-tighter">Armazenar na Nuvem</span>
                            </div>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1"></i>
                    </button>

                    <!-- Export JSON -->
                    <button id="export-backup-btn" class="w-full group flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-900 border border-slate-100 hover:border-slate-800 rounded-2xl transition-all duration-300">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-slate-800 transition-colors">
                                <i data-lucide="download" class="w-5 h-5 text-slate-400 group-hover:text-primary"></i>
                            </div>
                            <div class="text-left">
                                <span class="block font-bold text-slate-700 group-hover:text-white text-sm">Baixar Backup (.json)</span>
                                <span class="block text-[9px] text-slate-400 font-black uppercase tracking-tighter">Cópia Local</span>
                            </div>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1"></i>
                    </button>

                    <!-- Import -->
                    <div class="relative">
                        <input type="file" id="import-backup-input" class="hidden" accept=".json">
                        <button id="import-backup-trigger" class="w-full group flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-900 border border-slate-100 hover:border-slate-800 rounded-2xl transition-all duration-300">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-slate-800 transition-colors">
                                    <i data-lucide="upload" class="w-5 h-5 text-slate-400 group-hover:text-amber-500"></i>
                                </div>
                                <div class="text-left">
                                    <span class="block font-bold text-slate-700 group-hover:text-white text-sm">Importar Dados</span>
                                    <span class="block text-[9px] text-slate-400 font-black uppercase tracking-tighter">Upload de Arquivo</span>
                                </div>
                            </div>
                            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-all group-hover:translate-x-1"></i>
                        </button>
                    </div>

                    <!-- Generate Demo -->
                    <button id="generate-demo-btn" class="w-full group flex items-center justify-between p-4 bg-emerald-50/50 hover:bg-emerald-600 border border-emerald-100/50 hover:border-emerald-500 rounded-2xl transition-all duration-300">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-emerald-500 transition-colors">
                                <i data-lucide="sparkles" class="w-5 h-5 text-emerald-500 group-hover:text-white"></i>
                            </div>
                            <div class="text-left">
                                <span class="block font-bold text-emerald-700 group-hover:text-white text-sm">Gerar Dados Demo</span>
                                <span class="block text-[9px] text-emerald-400 group-hover:text-emerald-100 font-black uppercase tracking-tighter">Ambiente de Teste</span>
                            </div>
                        </div>
                        <i data-lucide="plus" class="w-4 h-4 text-emerald-300 group-hover:text-white transition-all"></i>
                    </button>

                    <div class="pt-4 mt-4 border-t border-slate-100">
                        <!-- Factory Reset -->
                        <button id="factory-reset-btn" class="w-full group flex items-center justify-between p-4 bg-rose-50/50 hover:bg-rose-600 border border-rose-100/50 hover:border-rose-500 rounded-2xl transition-all duration-300">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-rose-500 transition-colors">
                                    <i data-lucide="trash-2" class="w-5 h-5 text-rose-500 group-hover:text-white"></i>
                                </div>
                                <div class="text-left">
                                    <span class="block font-bold text-rose-700 group-hover:text-white text-sm">Restauração Total</span>
                                    <span class="block text-[9px] text-rose-400 group-hover:text-rose-100 font-black uppercase tracking-tighter">Cuidado: Irreversível</span>
                                </div>
                            </div>
                            <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-300 group-hover:text-white transition-all"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- System Info Card -->
            <div class="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/20 transition-all duration-1000"></div>
                <div class="relative z-10 space-y-6">
                    <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary border border-white/10">
                        <i data-lucide="info" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-black text-white">Sobre o Malibu</h3>
                        <p class="text-slate-400 text-sm mt-2 leading-relaxed font-medium">Ecossistema de gestão financeira avançado para empresas de crédito. 100% cloud-driven e seguro.</p>
                    </div>
                    <div class="pt-6 border-t border-white/10 flex items-center justify-between">
                        <div>
                            <p class="text-[9px] text-slate-500 uppercase tracking-widest font-black">Versão Atual</p>
                            <p class="text-white font-black text-sm">2.1 <span class="text-[10px] text-primary">(Cloud Pro)</span></p>
                        </div>
                        <i data-lucide="shield-check" class="w-8 h-8 text-white/10"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Column: System Logs -->
        <div class="lg:col-span-2">
            <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[700px]">
                <!-- Logs Header & Filters -->
                <div class="p-8 border-b border-slate-50 bg-slate-50/30">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                                <i data-lucide="scroll-text" class="w-6 h-6 text-white"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-black text-slate-800 tracking-tight">Logs de Auditoria</h2>
                                <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest">Monitoramento em Tempo Real</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <button id="export-logs-csv-btn" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold py-2.5 px-5 rounded-xl border border-emerald-200 shadow-sm transition-all flex items-center gap-2 text-sm">
                                <i data-lucide="file-spread-sheet" class="w-4 h-4"></i>
                                <span>Exportar CSV</span>
                            </button>
                            <button id="refresh-logs-btn" class="bg-white hover:bg-slate-50 text-slate-600 font-bold py-2.5 px-5 rounded-xl border border-slate-200 shadow-sm transition-all flex items-center gap-2 text-sm">
                                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                <span>Atualizar Logs</span>
                            </button>
                        </div>
                    </div>

                    <!-- Filters Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div class="relative group">
                            <i data-lucide="building-2" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors"></i>
                            <select id="log-filter-company" class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 appearance-none text-xs">
                                <option value="all">Todas as Empresas</option>
                            </select>
                        </div>
                        <div class="relative group">
                            <i data-lucide="user" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors"></i>
                            <select id="log-filter-user" class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 appearance-none text-xs">
                                <option value="all">Todos os Usuários</option>
                            </select>
                        </div>
                        <div class="relative group">
                            <i data-lucide="tag" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors"></i>
                            <select id="log-filter-action" class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 appearance-none text-xs">
                                <option value="all">Todas as Ações</option>
                                <option value="CREATE">Criação</option>
                                <option value="UPDATE">Edição</option>
                                <option value="DELETE">Exclusão</option>
                                <option value="LOGIN">Acesso</option>
                                <option value="BACKUP">Manutenção</option>
                            </select>
                        </div>
                        <div class="relative group">
                            <i data-lucide="calendar" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors"></i>
                            <input type="date" id="log-filter-date-from" placeholder="De" class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 text-xs">
                        </div>
                        <div class="relative group">
                            <i data-lucide="calendar" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors"></i>
                            <input type="date" id="log-filter-date-to" placeholder="Até" class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 text-xs">
                        </div>
                    </div>
                </div>

                <!-- Logs List Area -->
                <div class="flex-1 overflow-y-auto custom-scrollbar p-0">
                    <table class="w-full text-left border-collapse">
                        <thead class="sticky top-0 bg-slate-50/90 backdrop-blur-md z-10">
                            <tr>
                                <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Data / Hora</th>
                                <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Usuário / Empresa</th>
                                <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Módulo / Ação</th>
                                <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody id="system-logs-list" class="divide-y divide-slate-50">
                            <!-- Logs will be loaded here -->
                            <tr>
                                <td colspan="4" class="px-8 py-20 text-center">
                                    <div class="flex flex-col items-center gap-4">
                                        <div class="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center animate-pulse">
                                            <i data-lucide="loader-2" class="w-8 h-8 text-slate-200 animate-spin"></i>
                                        </div>
                                        <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando auditoria global...</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Advanced Reset Modal (Enhanced) -->
<div id="reset-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div class="p-10 space-y-8">
            <div class="flex items-center gap-6">
                <div class="bg-rose-100 p-4 rounded-3xl text-rose-600 shadow-lg shadow-rose-200">
                    <i data-lucide="shield-alert" class="w-10 h-10"></i>
                </div>
                <div>
                    <h2 class="text-3xl font-black text-slate-900 tracking-tight leading-none">Restauração Master</h2>
                    <p class="text-slate-500 font-medium text-sm mt-2">Selecione os módulos que deseja apagar.</p>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-4">
                <label class="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl cursor-pointer hover:bg-slate-100 transition-all border-2 border-transparent has-[:checked]:border-rose-500/20 has-[:checked]:bg-rose-50/30 group">
                    <input type="checkbox" id="reset-loans" class="w-6 h-6 rounded-xl border-slate-300 text-rose-600 focus:ring-rose-500 transition-all">
                    <div class="flex-1">
                        <p class="font-black text-slate-800 group-hover:text-rose-700 transition-colors tracking-tight text-lg">Finanças & Operações</p>
                        <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">Empréstimos, Parcelas, Pagamentos</p>
                    </div>
                </label>

                <label class="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl cursor-pointer hover:bg-slate-100 transition-all border-2 border-transparent has-[:checked]:border-rose-500/20 has-[:checked]:bg-rose-50/30 group">
                    <input type="checkbox" id="reset-clients" class="w-6 h-6 rounded-xl border-slate-300 text-rose-600 focus:ring-rose-500 transition-all">
                    <div class="flex-1">
                        <p class="font-black text-slate-800 group-hover:text-rose-700 transition-colors tracking-tight text-lg">Cadastro de Clientes</p>
                        <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">Base global de clientes Malibu</p>
                    </div>
                </label>

                <label class="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl cursor-pointer hover:bg-slate-100 transition-all border-2 border-transparent has-[:checked]:border-rose-500/20 has-[:checked]:bg-rose-50/30 group">
                    <input type="checkbox" id="reset-users" class="w-6 h-6 rounded-xl border-slate-300 text-rose-600 focus:ring-rose-500 transition-all">
                    <div class="flex-1">
                        <p class="font-black text-slate-800 group-hover:text-rose-700 transition-colors tracking-tight text-lg">Usuários & Acessos</p>
                        <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">Contas, Cargos e Autorizações</p>
                    </div>
                </label>
            </div>

            <div class="flex gap-4 pt-4 border-t border-slate-100">
                <button type="button" id="close-reset-modal" class="flex-1 px-8 py-5 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]">Cancelar</button>
                <button type="button" id="confirm-reset-btn" class="flex-1 px-8 py-5 bg-slate-900 hover:bg-rose-600 text-white rounded-2xl font-black shadow-xl transition-all uppercase tracking-widest text-[10px]">Confirmar Exclusão</button>
            </div>
        </div>
    </div>
</div>
