<?php
/**
 * Malibu Crédito - Solicitar Empréstimo
 */
?>
<div class="space-y-10 fade-in pb-10">
    <!-- Premium Header -->
    <div class="space-y-2">
        <h1 class="text-4xl font-black text-slate-900 tracking-tight font-heading">Solicitar Empréstimo</h1>
        <p class="text-slate-500 font-medium text-lg">Simule agora e descubra as melhores condições para você.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <!-- Calculator Card: High-End Tech Aesthetic -->
        <div class="premium-card p-10 space-y-10 group">
            <div class="flex items-center gap-5 mb-4">
                <div class="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <i data-lucide="calculator" class="w-7 h-7"></i>
                </div>
                <div>
                    <h2 class="text-2xl font-black text-slate-900 tracking-tight font-heading">Simulador de Empréstimo</h2>
                    <p class="text-slate-500 font-medium text-sm">Personalize sua oferta em tempo real.</p>
                </div>
            </div>

            <div class="space-y-10">
                <!-- Amount Slider: Refined UI -->
                <div class="space-y-6">
                    <div class="flex justify-between items-end">
                        <label class="text-xs font-black text-slate-400 uppercase tracking-widest">Valor do Empréstimo</label>
                        <span class="text-3xl font-black text-primary tracking-tighter" id="amount-display">R$ 5.000,00</span>
                    </div>
                    <div class="relative pt-2">
                        <input type="range" id="loan-amount" min="500" max="50000" step="500" value="5000" class="w-full h-2.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary-light transition-all">
                    </div>
                    <div class="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>R$ 500</span>
                        <span>R$ 50.000</span>
                    </div>
                </div>

                <!-- Frequency Selection: Modern Glass Toggles -->
                <div class="space-y-4">
                    <label class="text-xs font-black text-slate-400 uppercase tracking-widest">Frequência de Pagamento</label>
                    <div class="grid grid-cols-2 gap-5">
                        <label class="relative flex items-center justify-center p-5 rounded-[1.5rem] border-2 border-slate-50 cursor-pointer hover:border-primary/20 transition-all group bg-slate-50/50 has-[:checked]:border-primary has-[:checked]:bg-white has-[:checked]:shadow-premium">
                            <input type="radio" name="loan-frequency" value="mensal" checked class="hidden">
                            <div class="flex flex-col items-center gap-1.5">
                                <span class="text-base font-black text-slate-700 group-has-[:checked]:text-primary transition-colors">Mensal</span>
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Todo mês</span>
                            </div>
                        </label>
                        <label class="relative flex items-center justify-center p-5 rounded-[1.5rem] border-2 border-slate-50 cursor-pointer hover:border-primary/20 transition-all group bg-slate-50/50 has-[:checked]:border-primary has-[:checked]:bg-white has-[:checked]:shadow-premium">
                            <input type="radio" name="loan-frequency" value="semanal" class="hidden">
                            <div class="flex flex-col items-center gap-1.5">
                                <span class="text-base font-black text-slate-700 group-has-[:checked]:text-primary transition-colors">Semanal</span>
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">A cada 7 dias</span>
                            </div>
                        </label>
                        <label class="relative flex items-center justify-center p-5 rounded-[1.5rem] border-2 border-slate-50 cursor-pointer hover:border-primary/20 transition-all group bg-slate-50/50 has-[:checked]:border-primary has-[:checked]:bg-white has-[:checked]:shadow-premium">
                            <input type="radio" name="loan-frequency" value="diaria" class="hidden">
                            <div class="flex flex-col items-center gap-1.5">
                                <span class="text-base font-black text-slate-700 group-has-[:checked]:text-primary transition-colors">Diária</span>
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Todos os dias</span>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Installments Slider: Refined UI -->
                <div class="space-y-6">
                    <div class="flex justify-between items-end">
                        <label class="text-xs font-black text-slate-400 uppercase tracking-widest">Quantidade de Parcelas</label>
                        <span class="text-3xl font-black text-primary tracking-tighter" id="installments-display">12x</span>
                    </div>
                    <div class="relative pt-2">
                        <input type="range" id="loan-installments" min="1" max="48" step="1" value="12" class="w-full h-2.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary-light transition-all">
                    </div>
                    <div class="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>1x</span>
                        <span>48x</span>
                    </div>
                </div>

                <!-- First Installment Date: Modern Input -->
                <div class="space-y-3">
                    <label class="text-xs font-black text-slate-400 uppercase tracking-widest">Data da 1ª Parcela</label>
                    <input type="date" id="loan-start-date" required class="w-full px-6 py-5 rounded-2xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all shadow-inner text-slate-700 font-bold font-mono">
                    <p class="text-[10px] text-slate-400 font-medium mt-2 px-1 italic">
                        * Mensal/Diário: Juros total diluído. Semanal: Juros fixo por parcela.
                    </p>
                </div>

                <!-- Description: Minimalist Input -->
                <div class="space-y-3">
                    <label class="text-xs font-black text-slate-400 uppercase tracking-widest">Observações Adicionais</label>
                    <textarea id="loan-desc" rows="3" placeholder="Ex: Investimento em equipamentos, reforma..." class="w-full px-6 py-5 rounded-2xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all resize-none shadow-inner"></textarea>
                </div>
            </div>
        </div>

        <!-- Summary Card: Black/Teal High-Contrast -->
        <div class="space-y-8">
            <div class="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <!-- Premium Background Elements -->
                <div class="absolute -right-16 -top-16 w-64 h-64 bg-primary/20 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000"></div>
                <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] group-hover:scale-125 transition-transform duration-1000"></div>

                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-10">
                        <div class="bg-white/10 p-2 rounded-xl border border-white/10">
                            <i data-lucide="scroll-text" class="w-4 h-4 text-primary-light"></i>
                        </div>
                        <h3 class="text-xs font-black uppercase tracking-widest text-slate-400">Resumo da Proposta</h3>
                    </div>
                    
                    <div class="space-y-2">
                        <div class="flex justify-between items-center py-5 border-b border-white/5 group/row">
                            <span class="text-slate-400 font-medium group-hover/row:text-white transition-colors">Valor Total</span>
                            <span class="text-2xl font-black text-white tracking-tight" id="sum-amount">R$ 5.000,00</span>
                        </div>
                        <div class="flex justify-between items-center py-5 border-b border-white/5 group/row">
                            <span class="text-slate-400 font-medium group-hover/row:text-white transition-colors">Periodicidade</span>
                            <span class="text-xl font-black text-white tracking-tight capitalize" id="sum-frequency">Mensal</span>
                        </div>
                        <div class="flex justify-between items-center py-5 border-b border-white/5 group/row">
                            <span class="text-slate-400 font-medium group-hover/row:text-white transition-colors">Nº de Parcelas</span>
                            <span class="text-xl font-black text-white tracking-tight" id="sum-installments">12x</span>
                        </div>
                        <div class="flex justify-between items-center py-5 border-b border-white/5 group/row">
                            <span class="text-slate-400 font-medium group-hover/row:text-white transition-colors">1ª Parcela</span>
                            <span class="text-xl font-black text-white tracking-tight" id="sum-start-date">--/--/----</span>
                        </div>
                    </div>

                    <div class="mt-12 p-6 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/5 flex items-start gap-4 shadow-inner">
                        <div class="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <i data-lucide="message-circle" class="w-5 h-5 text-emerald-400"></i>
                        </div>
                        <p class="text-xs text-slate-300 leading-relaxed font-medium">Sua proposta passará por análise de empréstimo. O resultado será enviado via <strong class="text-white">WhatsApp</strong> em instantes.</p>
                    </div>

                    <button id="submit-loan-request" class="w-full bg-gradient-to-r from-primary to-primary-light hover:shadow-primary/30 text-white font-black py-6 rounded-[1.5rem] mt-10 transition-all shadow-xl flex items-center justify-center gap-4 text-lg uppercase tracking-widest hover:-translate-y-1 active:scale-95">
                        <span>Lançar Solicitação</span>
                        <i data-lucide="send" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>

            <!-- Enhanced Help CTA -->
            <div class="premium-card p-6 flex items-center justify-between group cursor-pointer hover:border-primary/20 transition-all shadow-soft border-slate-100">
                <div class="flex items-center gap-5">
                    <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
                        <i data-lucide="help-circle" class="w-7 h-7"></i>
                    </div>
                    <div>
                        <p class="text-sm font-black text-slate-900 tracking-tight">Precisa de Ajuda?</p>
                        <p class="text-xs text-slate-500 font-medium font-heading">Fale direto com um especialista Malibu.</p>
                    </div>
                </div>
                <div class="bg-slate-50 p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                    <i data-lucide="arrow-right" class="w-5 h-5 text-slate-300 group-hover:text-primary transition-all"></i>
                </div>
            </div>
        </div>
    </div>
</div>
