<?php
// blocked.php - Screen shown when an ADMIN is blocked
?>
<div class="min-h-screen flex items-center justify-center p-6 bg-gradient-sidebar relative overflow-hidden text-center">
    <!-- Decorative blobs -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/20 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s"></div>

    <div class="max-w-2xl w-full glass p-10 md:p-14 rounded-[3rem] shadow-premium space-y-10 relative z-10 border border-white/20">
        <div id="blocked-icon" class="bg-rose-500/10 text-rose-500 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto border border-rose-500/20 shadow-xl shadow-rose-500/5 transition-transform hover:scale-110 duration-700">
            <i data-lucide="shield-alert" class="w-14 h-14"></i>
        </div>

        <div class="space-y-4">
            <h1 class="text-4xl font-black text-white font-heading tracking-tight" id="blocked-title">Acesso Restrito</h1>
            <p class="text-slate-400 text-lg font-medium leading-relaxed max-w-md mx-auto" id="blocked-message">
                Seu acesso ao painel administrativo está temporariamente suspenso.
            </p>
        </div>

        <div id="billing-info" class="hidden grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div class="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Próxima Mensalidade</p>
                <div class="flex items-end justify-between">
                    <span class="text-2xl font-black text-white" id="next-due-date">--/--/--</span>
                    <span class="text-primary font-bold">R$ 10,00</span>
                </div>
            </div>
            <div id="overdue-card" class="bg-rose-500/10 p-6 rounded-3xl border border-rose-500/10 hidden">
                <p class="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Mensalidades em Atraso</p>
                <div class="flex items-end justify-between">
                    <span class="text-2xl font-black text-rose-500" id="overdue-count">0</span>
                    <i data-lucide="alert-circle" class="w-6 h-6 text-rose-500"></i>
                </div>
            </div>
        </div>

        <div class="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-4">
            <p class="text-sm text-slate-400 italic font-medium">
                "Para regularizar seu acesso, entre em contato com o administrador master ou realize o pagamento das mensalidades pendentes via PIX."
            </p>
            <div class="pt-2">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-full text-xs font-black uppercase tracking-widest border border-primary/20">
                    <i data-lucide="qr-code" class="w-4 h-4"></i>
                    Chave PIX: financeiro@malibucredito.com.br
                </div>
            </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button onclick="auth.logout()" class="w-full sm:w-auto px-10 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 border border-white/5 active:scale-95">
                <i data-lucide="log-out" class="w-5 h-5"></i>
                <span>Sair da Conta</span>
            </button>
            <button onclick="window.location.reload()" class="w-full sm:w-auto px-10 py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black transition-all shadow-lg shadow-primary/20 active:scale-95">
                Verificar Novamente
            </button>
        </div>
    </div>
</div>

<script type="module">
    import auth from './assets/js/AuthService.js';
    import billingService from './assets/js/BillingService.js';
    import DateHelper from './assets/js/DateHelper.js';

    async function initBlockedPage() {
        const user = auth.currentUser;
        if (!user) return;

        const reason = window.APP_CONFIG.currentReason;
        const titleEl = document.getElementById('blocked-title');
        const messageEl = document.getElementById('blocked-message');
        const iconContainer = document.getElementById('blocked-icon');

        if (reason === 'pending_master') {
            titleEl.textContent = 'Aguardando Liberação';
            messageEl.textContent = 'Seu acesso administrativo foi criado e está aguardando a liberação manual do Administrador Master.';
            iconContainer.className = iconContainer.className.replace('rose', 'amber');
            iconContainer.innerHTML = '<i data-lucide="clock" class="w-14 h-14"></i>';
        } else if (reason === 'overdue_billing') {
            titleEl.textContent = 'Mensalidade Pendente';
            messageEl.textContent = 'Detectamos pendências em suas mensalidades. Regularize para restabelecer seu acesso total.';
            
            // Show billing info
            document.getElementById('billing-info').classList.remove('hidden');
            const installments = await billingService.getUserInstallments(user.id);
            const overdue = installments.filter(i => i.status === 'VENCIDA');
            const next = installments.find(i => i.status === 'A_VENCER');

            if (overdue.length > 0) {
                document.getElementById('overdue-card').classList.remove('hidden');
                document.getElementById('overdue-count').textContent = overdue.length;
            }

            if (next) {
                document.getElementById('next-due-date').textContent = DateHelper.formatLocal(next.dueDate);
            }
        }

        lucide.createIcons();
    }

    document.addEventListener('DOMContentLoaded', initBlockedPage);
    // Shortcut for external access
    window.auth = auth;
</script>
