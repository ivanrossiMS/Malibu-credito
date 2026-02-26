<?php
/**
 * Malibu Crédito - Client Dashboard
 */
?>
<div class="space-y-10 fade-in">
    <!-- Premium Welcome Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
            <h1 class="text-4xl font-black tracking-tight text-slate-900 font-heading">
                Olá, <span class="user-name gradient-text underline decoration-primary/20 decoration-8 underline-offset-4 font-black">...</span>! 👋
            </h1>
            <p class="text-slate-500 font-medium">Seu resumo financeiro está atualizado.</p>
        </div>
        <div class="flex items-center gap-4">
            <div class="relative cursor-pointer group" id="notification-bell">
                <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft group-hover:shadow-premium group-hover:-translate-y-1 transition-all">
                    <i data-lucide="bell" class="w-6 h-6 text-slate-600 group-hover:text-primary transition-colors"></i>
                </div>
                <span id="notification-badge" class="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-4 border-slate-50 shadow-lg hidden">0</span>
                
                <!-- Notifications Dropdown (Premiumized) -->
                <div id="notifications-dropdown" class="absolute right-0 mt-4 w-96 bg-white rounded-[2.5rem] shadow-premium border border-slate-100 hidden z-[150] overflow-hidden">
                    <div class="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 backdrop-blur-md">
                        <h4 class="font-black text-slate-900 uppercase tracking-widest text-xs">Notificações</h4>
                        <button id="mark-all-read" class="text-[10px] font-black text-primary uppercase tracking-widest hover:text-primary-dark transition-colors">Limpar tudo</button>
                    </div>
                    <div id="notifications-list" class="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                        <div class="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Sem alertas novos.</div>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-4 bg-white p-3 pr-6 rounded-[2rem] shadow-soft border border-slate-50 hover:shadow-premium transition-all">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-light text-white flex items-center justify-center font-black text-xl user-initials shadow-lg shadow-primary/20 transition-transform hover:scale-110">
                    --
                </div>
                <div class="space-y-0.5">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Minha Conta</p>
                    <p class="text-sm font-black text-emerald-600 flex items-center gap-1.5">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse"></span>
                        Status Ativo
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- Stats Grid: Floating Glass Look -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Metric 1: Total Loaned -->
        <div class="premium-card p-8 group overflow-hidden relative">
            <div class="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <div class="flex items-center gap-5 relative z-10">
                <div class="w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center border border-primary/10 transition-transform group-hover:scale-110 duration-500 shadow-inner">
                    <i data-lucide="briefcase" class="w-8 h-8"></i>
                </div>
                <div>
                    <p class="text-slate-500 text-xs font-black uppercase tracking-widest mb-1 opacity-70">Total Emprestado</p>
                    <h3 class="text-3xl font-black text-slate-900 tracking-tight" id="total-loaned">R$ 0,00</h3>
                </div>
            </div>
        </div>

        <!-- Metric 2: Total Paid -->
        <div class="premium-card p-8 group overflow-hidden relative border-emerald-100/30">
            <div class="absolute inset-0 bg-emerald-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <div class="flex items-center gap-5 relative z-10">
                <div class="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/10 transition-transform group-hover:scale-110 duration-500 shadow-inner">
                    <i data-lucide="check-circle-2" class="w-8 h-8"></i>
                </div>
                <div>
                    <p class="text-slate-500 text-xs font-black uppercase tracking-widest mb-1 opacity-70">Total Pago</p>
                    <h3 class="text-3xl font-black text-slate-900 tracking-tight" id="total-paid">R$ 0,00</h3>
                </div>
            </div>
        </div>

        <!-- Metric 3: Balance Due -->
        <div class="premium-card p-8 group overflow-hidden relative border-rose-100/30">
            <div class="absolute inset-0 bg-rose-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <div class="flex items-center gap-5 relative z-10">
                <div class="w-16 h-16 rounded-[1.5rem] bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/10 transition-transform group-hover:scale-110 duration-500 shadow-inner">
                    <i data-lucide="clock" class="w-8 h-8"></i>
                </div>
                <div>
                    <p class="text-slate-500 text-xs font-black uppercase tracking-widest mb-1 opacity-70">Saldo Devedor</p>
                    <h3 class="text-3xl font-black text-rose-600 tracking-tight" id="balance-due">R$ 0,00</h3>
                </div>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        <!-- Main Content: Next Installments -->
        <div class="lg:col-span-2 space-y-8">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 class="text-2xl font-black text-slate-900 font-heading">Minhas Parcelas</h2>
                <div class="relative w-full sm:w-auto">
                    <select id="client-dashboard-filter" class="w-full sm:w-auto pl-5 pr-12 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-all shadow-sm">
                        <option value="pendente" selected>Pendentes</option>
                        <option value="paga">Pagas</option>
                        <option value="vencida">Vencidas / Em Atraso</option>
                    </select>
                    <i data-lucide="filter" class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none"></i>
                </div>
            </div>
            
            <div class="premium-card overflow-hidden">
                <div class="overflow-x-auto custom-scrollbar">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50/50 border-b border-slate-100">
                                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrato</th>
                                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Parcela</th>
                                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="client-installments" class="divide-y divide-slate-50">
                            <!-- Loaded via JS with premium row styles -->
                        </tbody>
                    </table>
                </div>
                <!-- Pagination Controls -->
                <div class="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <span id="installments-page-info" class="text-[10px] font-black uppercase tracking-widest text-slate-400">Página 1</span>
                    <div class="flex gap-2">
                        <button id="installments-prev" class="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                            <i data-lucide="chevron-left" class="w-4 h-4"></i>
                        </button>
                        <button id="installments-next" class="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                            <i data-lucide="chevron-right" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sidebar Section -->
        <div class="lg:col-span-1 space-y-8">
            <!-- PIX Payment Card: Light & Compact -->
            <div class="bg-white border border-emerald-100 p-6 rounded-3xl shadow-soft space-y-5 relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent"></div>
                <div class="flex items-center gap-3 relative z-10">
                    <div class="bg-emerald-100 p-2.5 rounded-xl text-emerald-600 border border-emerald-200">
                        <i data-lucide="qr-code" class="w-5 h-5"></i>
                    </div>
                    <h3 class="font-black text-emerald-900 uppercase tracking-widest text-xs">Pague com PIX</h3>
                </div>
                
                <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center relative z-10">
                    <div class="w-40 h-40 bg-white mx-auto mb-4 rounded-2xl border border-slate-200 p-2 flex items-center justify-center shadow-sm relative group">
                        <div class="absolute inset-0 bg-emerald-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div id="qr-code-display" class="w-full h-full relative z-10 flex flex-col items-center justify-center">
                            <div class="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none text-center">QR CODE<br>PIX MALIBU</div>
                        </div>
                    </div>
                    <button id="copy-pix" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-md cursor-pointer active:scale-95">
                        <i data-lucide="copy" class="w-4 h-4"></i>
                        COPIAR CHAVE PIX
                    </button>
                </div>
            </div>

            <!-- Financial Insight (Modern Glass) -->
            <div class="relative rounded-[2rem] p-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-purple-500/30 border border-white/20">
                <!-- Inner glow overlay -->
                <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div class="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                
                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/30 shadow-inner">
                            <i data-lucide="sparkles" class="w-4 h-4 text-white"></i>
                        </div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-white/90 drop-shadow-sm">Inteligência Operacional</span>
                    </div>
                    <h2 id="insight-title" class="text-xl md:text-2xl font-black mb-3 text-white font-heading tracking-tight drop-shadow-md">Tudo em dia! ✨</h2>
                    <p id="insight-message" class="text-white/90 text-sm leading-relaxed font-medium drop-shadow-sm">Seu comprometimento financeiro está excelente. Continue assim para desbloquear novos limites em breve.</p>
                </div>
                
                <i data-lucide="cpu" class="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 -rotate-12 group-hover:rotate-0 transition-all duration-1000 group-hover:scale-110"></i>
            </div>
        </div>
    </div>
</div>
</div>

<!-- Extrato Modal -->
<div id="extrato-modal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] hidden flex items-center justify-center p-4 sm:p-6">
    <div class="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[100dvh] sm:max-h-[90vh] flex flex-col">
        <div class="p-8 border-b border-slate-100 flex justify-between items-center">
            <div>
                <h2 class="text-2xl font-bold font-heading">Histórico de Transações</h2>
                <p class="text-slate-500 text-sm">Todos os pagamentos confirmados no sistema.</p>
            </div>
            <button class="close-modal p-3 rounded-2xl hover:bg-slate-100 text-slate-400 transition-all">
                <i data-lucide="x" class="w-7 h-7"></i>
            </button>
        </div>
        <div class="p-8 overflow-y-auto flex-1">
            <div class="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-slate-200">
                            <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                            <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                            <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Método</th>
                            <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Comprovante</th>
                        </tr>
                    </thead>
                    <tbody id="extrato-list" class="divide-y divide-slate-100">
                        <!-- Loaded via JS -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- Onboarding Modal -->
<div id="onboarding-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] hidden flex items-center justify-center p-4 sm:p-6">
    <div class="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[100dvh] sm:max-h-[90vh]">
        <div class="p-8 md:p-10 overflow-y-auto custom-scrollbar flex-1">
            <div class="mb-8 text-center shrink-0">
                <div class="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="user-check" class="w-10 h-10"></i>
                </div>
                <h2 class="text-3xl font-bold text-slate-900 font-heading">Finalize seu Cadastro</h2>
                <p class="text-slate-500 mt-2">Para sua segurança e conformidade, precisamos de alguns dados adicionais.</p>
            </div>

            <form id="onboarding-form" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="md:col-span-2">
                        <label class="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                        <div class="relative">
                            <i data-lucide="user" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                            <input type="text" id="ob-name" required class="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-slate-800">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">CPF / CNPJ</label>
                        <div class="relative">
                            <i data-lucide="file-text" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                            <input type="text" id="ob-cpf" required placeholder="000.000.000-00" class="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-slate-800">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">WhatsApp / Telefone</label>
                        <div class="relative">
                            <i data-lucide="phone" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                            <input type="text" id="ob-phone" required placeholder="(11) 99999-9999" class="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-slate-800">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">Sua Cidade</label>
                        <div class="relative">
                            <i data-lucide="building" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                            <select id="ob-city" required class="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none cursor-pointer font-medium text-slate-800">
                                <option value="" disabled selected>Selecione sua cidade</option>
                                <option value="Campo Grande">Campo Grande</option>
                                <option value="Curitiba">Curitiba</option>
                                <option value="Maceió">Maceió</option>
                            </select>
                            <i data-lucide="chevron-down" class="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"></i>
                        </div>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-bold text-slate-700 mb-2">Endereço Completo</label>
                        <div class="relative">
                            <i data-lucide="map-pin" class="absolute left-4 top-4 w-5 h-5 text-slate-400"></i>
                            <textarea id="ob-address" required rows="2" placeholder="Rua, número, bairro, cidade - UF" class="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-slate-800 resize-none"></textarea>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">Foto do RG ou CPF</label>
                        <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all">
                            <div class="flex flex-col items-center justify-center pt-5 pb-6">
                                <i data-lucide="camera" class="w-8 h-8 text-slate-400 mb-2"></i>
                                <p class="text-xs text-slate-500 font-medium">Anexar Documento</p>
                            </div>
                            <input type="file" id="ob-doc-id" accept="image/*" class="hidden" />
                        </label>
                        <div id="preview-id" class="hidden mt-2 h-20 w-auto rounded-lg overflow-hidden border border-slate-100"></div>
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">Comprovante de Residência</label>
                        <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all">
                            <div class="flex flex-col items-center justify-center pt-5 pb-6">
                                <i data-lucide="image" class="w-8 h-8 text-slate-400 mb-2"></i>
                                <p class="text-xs text-slate-500 font-medium">Anexar Comprovante</p>
                            </div>
                            <input type="file" id="ob-doc-residence" accept="image/*" class="hidden" />
                        </label>
                        <div id="preview-residence" class="hidden mt-2 h-20 w-auto rounded-lg overflow-hidden border border-slate-100"></div>
                    </div>
                </div>

                <div class="pt-4">
                    <button type="submit" class="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-[1.5rem] shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-3 text-lg">
                        <span>Salvar e Começar</span>
                        <i data-lucide="arrow-right" class="w-6 h-6"></i>
                    </button>
                    <p class="text-center text-xs text-slate-400 mt-4">Seus dados estão protegidos conforme nossa política de privacidade.</p>
                </div>
            </form>
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
            <div class="text-white text-center">
                <i data-lucide="loader-2" class="w-12 h-12 animate-spin mx-auto mb-4 opacity-20"></i>
                <p class="text-slate-400 text-sm font-medium">Carregando arquivo...</p>
            </div>
        </div>
    </div>
</div>
