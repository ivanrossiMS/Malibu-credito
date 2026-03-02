<div class="space-y-10 animate-fade-in">
    <!-- Master Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
            <h1 class="text-4xl font-black tracking-tight text-slate-900 font-heading">
                Painel <span class="gradient-text underline decoration-indigo-500/20 decoration-8 underline-offset-4">Master</span> 👑
            </h1>
            <p class="text-slate-500 font-medium">Visão global da plataforma Malibu Crédito.</p>
        </div>
        <div class="flex items-center gap-4">
             <div class="px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 font-black flex items-center gap-2 shadow-sm">
                <i data-lucide="shield-check" class="w-5 h-5"></i>
                <span>Super Admin Mode</span>
            </div>
        </div>
    </div>

    <!-- Master Global Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Metric 1: Total Companies -->
        <div class="premium-card p-8 group overflow-hidden relative border-emerald-100/50">
            <div class="absolute inset-0 bg-emerald-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <div class="flex justify-between items-start mb-6 relative z-10">
                <div class="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/10 transition-transform group-hover:scale-110 duration-500">
                    <i data-lucide="building-2" class="w-7 h-7 text-emerald-600"></i>
                </div>
            </div>
            <div class="relative z-10">
                <p class="text-slate-500 text-xs font-black uppercase tracking-widest mb-1 opacity-70">Empresas Ativas</p>
                <h3 id="master-stat-companies" class="text-3xl font-black text-slate-900 tracking-tight">0</h3>
            </div>
        </div>

        <!-- Metric 2: Total Admins -->
        <div class="premium-card p-8 group overflow-hidden relative border-blue-100/50">
            <div class="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <div class="flex justify-between items-start mb-6 relative z-10">
                <div class="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/10 transition-transform group-hover:scale-110 duration-500">
                    <i data-lucide="users" class="w-7 h-7 text-blue-600"></i>
                </div>
            </div>
            <div class="relative z-10">
                <p class="text-slate-500 text-xs font-black uppercase tracking-widest mb-1 opacity-70">Administradores</p>
                <h3 id="master-stat-admins" class="text-3xl font-black text-slate-900 tracking-tight">0</h3>
            </div>
        </div>

        <!-- Metric 3: Monthly Billing -->
        <div class="premium-card p-8 group overflow-hidden relative border-indigo-100/50">
            <div class="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <div class="flex justify-between items-start mb-6 relative z-10">
                <div class="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/10 transition-transform group-hover:scale-110 duration-500">
                    <i data-lucide="credit-card" class="w-7 h-7 text-indigo-600"></i>
                </div>
            </div>
            <div class="relative z-10">
                <p class="text-slate-500 text-xs font-black uppercase tracking-widest mb-1 opacity-70">Faturamento Mensal</p>
                <h3 id="master-stat-billing" class="text-3xl font-black text-slate-900 tracking-tight">R$ 0,00</h3>
            </div>
        </div>

        <!-- Metric 4: System Health -->
        <div class="premium-card p-8 group overflow-hidden relative border-amber-100/50">
            <div class="absolute inset-0 bg-amber-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <div class="flex justify-between items-start mb-6 relative z-10">
                <div class="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/10 transition-transform group-hover:scale-110 duration-500">
                    <i data-lucide="activity" class="w-7 h-7 text-amber-600"></i>
                </div>
            </div>
            <div class="relative z-10">
                <p class="text-slate-500 text-xs font-black uppercase tracking-widest mb-1 opacity-70">Status do Sistema</p>
                <h3 class="text-3xl font-black text-emerald-600 tracking-tight flex items-center gap-2">
                    Online
                    <span class="flex h-3 w-3 relative">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                </h3>
            </div>
        </div>
    </div>

    <!-- Main Content Area -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <!-- New Companies / Approvals -->
        <div class="lg:col-span-2 premium-card p-10 bg-white min-h-[500px]">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-2xl font-black text-slate-900 tracking-tight font-heading">Empresas Recentemente Cadastradas</h2>
                    <p class="text-slate-500 font-medium text-sm">Acompanhe as novas parceiras da plataforma</p>
                </div>
                <button onclick="window.location.href='?page=companies'" class="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline flex items-center gap-2">
                    Ver Todas <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
            </div>
            
            <div id="master-recent-companies" class="space-y-4">
                <!-- List of companies -->
                <div class="animate-pulse space-y-4">
                    <div class="h-20 bg-slate-50 rounded-2xl"></div>
                    <div class="h-20 bg-slate-50 rounded-2xl"></div>
                    <div class="h-20 bg-slate-50 rounded-2xl"></div>
                </div>
            </div>
        </div>

        <!-- System Alerts / Pending Payments -->
        <div class="space-y-8">
            <div class="premium-card p-8 border-indigo-100/30">
                <div class="mb-8">
                    <div class="flex items-center gap-3">
                        <div class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                        <h2 class="text-xl font-black text-slate-900 tracking-tight">Pendências Master</h2>
                    </div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 ml-5">Geração de Mensalidades</p>
                </div>
                
                <div id="master-pending-actions" class="space-y-4">
                    <div class="p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                        <i data-lucide="check-circle" class="w-10 h-10 text-slate-300 mx-auto mb-3"></i>
                        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Tudo em dia!</p>
                    </div>
                </div>
                
                <button onclick="window.location.href='?page=master_billing'" class="w-full mt-8 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all text-xs tracking-widest uppercase hover:-translate-y-1 shadow-xl shadow-indigo-600/20">Controle de Mensalidades</button>
            </div>

            <!-- Global Logs Summary (CTA) -->
            <div class="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
                <div class="relative z-10">
                    <h3 class="font-black text-white text-sm uppercase tracking-widest mb-6 flex items-center gap-3">
                         <i data-lucide="terminal" class="w-4 h-4 text-indigo-400"></i>
                         Logs do Sistema
                    </h3>
                    <p class="text-slate-400 text-xs font-medium leading-relaxed mb-6">
                        Monitoramento em tempo real de acessos, erros e atividades críticas das empresas.
                    </p>
                    <button class="w-full bg-white/5 border border-white/10 text-white px-4 py-3.5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all">Ver Logs (Breve)</button>
                </div>
            </div>
        </div>
    </div>
</div>
