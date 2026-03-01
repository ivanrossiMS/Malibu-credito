<!-- master_billing.php - Master Dashboard for Acess and Billing Control -->
<div class="space-y-8 animate-fade-in">
    <!-- Header Area -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
            <h1 class="text-4xl font-black text-slate-800 font-heading tracking-tight">Controle de Acessos</h1>
            <p class="text-slate-500 font-medium">Gerenciamento de permissões e mensalidades dos administradores.</p>
        </div>
        
        <div class="flex items-center gap-3">
            <button id="refresh-users" class="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                <i data-lucide="rotate-cw" class="w-5 h-5 text-slate-500"></i>
            </button>
            <div class="px-5 py-3 bg-indigo-600 rounded-2xl text-white font-black shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                <i data-lucide="shield-check" class="w-5 h-5"></i>
                <span>Painel Master</span>
            </div>
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="premium-card p-6 flex items-center gap-5">
            <div class="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <i data-lucide="users" class="w-7 h-7"></i>
            </div>
            <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Admins</p>
                <h3 class="text-2xl font-black text-slate-800" id="stat-total-admins">0</h3>
            </div>
        </div>
        <div class="premium-card p-6 flex items-center gap-5">
            <div class="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <i data-lucide="check-circle-2" class="w-7 h-7"></i>
            </div>
            <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso Liberado</p>
                <h3 class="text-2xl font-black text-slate-800" id="stat-active-admins">0</h3>
            </div>
        </div>
        <div class="premium-card p-6 flex items-center gap-5 border-amber-100 bg-amber-50/10">
            <div class="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <i data-lucide="clock" class="w-7 h-7"></i>
            </div>
            <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendentes</p>
                <h3 class="text-2xl font-black text-slate-800" id="stat-pending-admins">0</h3>
            </div>
        </div>
        <div class="premium-card p-6 flex items-center gap-5 border-rose-100 bg-rose-50/10">
            <div class="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                <i data-lucide="alert-octagon" class="w-7 h-7"></i>
            </div>
            <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inadimplentes</p>
                <h3 class="text-2xl font-black text-slate-800" id="stat-overdue-admins">0</h3>
            </div>
        </div>
    </div>

    <!-- Filters & Search -->
    <div class="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div class="flex flex-wrap items-center gap-2">
            <button class="filter-btn active px-4 py-2 rounded-xl text-sm font-bold transition-all bg-slate-100 text-slate-600" data-filter="all">Todos</button>
            <button class="filter-btn px-4 py-2 rounded-xl text-sm font-bold transition-all hover:bg-slate-50 text-slate-500" data-filter="pending">Pendentes</button>
            <button class="filter-btn px-4 py-2 rounded-xl text-sm font-bold transition-all hover:bg-slate-50 text-slate-500" data-filter="overdue">Vencidos</button>
            <button class="filter-btn px-4 py-2 rounded-xl text-sm font-bold transition-all hover:bg-slate-50 text-slate-500" data-filter="paid">Em Dia</button>
        </div>
        <div class="relative w-full md:w-72">
            <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
            <input type="text" id="user-search" placeholder="Buscar administrador..." class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-medium">
        </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50/50 border-b border-slate-100">
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrador</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Acesso</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mensalidades</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recorrência</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                    </tr>
                </thead>
                <tbody id="users-table-body" class="divide-y divide-slate-100">
                    <!-- Dynamic Rows -->
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- User Detail Modal -->
<div id="user-detail-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] hidden flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
        <div class="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-5">
                <div class="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-200" id="modal-user-initials">
                    --
                </div>
                <div>
                    <h2 class="text-2xl font-black text-slate-800 font-heading" id="modal-user-name">Carregando...</h2>
                    <p class="text-slate-500 font-medium text-sm" id="modal-user-email">email@exemplo.com</p>
                </div>
            </div>
            <button id="close-modal" class="p-3 hover:bg-slate-200 rounded-2xl transition-all">
                <i data-lucide="x" class="w-6 h-6 text-slate-500"></i>
            </button>
        </div>

        <div class="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
            <!-- Access Control Controls -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <h3 class="font-black text-slate-800 flex items-center gap-2">
                        <i data-lucide="shield-check" class="w-5 h-5 text-primary"></i>
                        Status de Acesso
                    </h3>
                    <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div>
                            <p class="text-xs font-bold text-slate-500 uppercase">Acesso Geral</p>
                            <p class="text-sm font-black" id="modal-access-text">BLOQUEADO</p>
                        </div>
                        <button id="toggle-access-enabled" class="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all text-xs">
                            LIBERAR
                        </button>
                    </div>
                    <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div>
                            <p class="text-xs font-bold text-slate-500 uppercase">Override Manual</p>
                            <p class="text-xs text-slate-400">Permite acesso mesmo c/ dívida</p>
                        </div>
                        <button id="toggle-access-override" class="px-6 py-2 bg-slate-300 text-slate-600 font-bold rounded-xl hover:scale-105 transition-all text-xs">
                            ATIVAR
                        </button>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <h3 class="font-black text-slate-800 flex items-center gap-2">
                        <i data-lucide="credit-card" class="w-5 h-5 text-indigo-500"></i>
                        Resumo Financeiro
                    </h3>
                    <div class="grid grid-cols-2 gap-4 h-full">
                        <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <p class="text-[10px] font-black text-emerald-600 uppercase">Total Pago</p>
                            <p class="text-xl font-black text-emerald-700" id="modal-total-paid">R$ 0,00</p>
                        </div>
                        <div class="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <p class="text-[10px] font-black text-rose-600 uppercase">Em Aberto</p>
                            <p class="text-xl font-black text-rose-700" id="modal-total-pending">R$ 0,00</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Installments Table -->
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="font-black text-slate-800 flex items-center gap-2 text-lg">
                        <i data-lucide="calendar" class="w-6 h-6 text-slate-400"></i>
                        Histórico de Mensalidades
                    </h3>
                    <button id="generate-installments" class="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline flex items-center gap-2">
                        <i data-lucide="plus-circle" class="w-4 h-4"></i>
                        Gerar Faltantes
                    </button>
                </div>
                
                <div class="border border-slate-100 rounded-3xl overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th class="px-6 py-4">Competência</th>
                                <th class="px-6 py-4">Vencimento</th>
                                <th class="px-6 py-4">Valor</th>
                                <th class="px-6 py-4">Status</th>
                                <th class="px-6 py-4">Ação</th>
                            </tr>
                        </thead>
                        <tbody id="modal-installments-body" class="divide-y divide-slate-50 text-sm">
                            <!-- Dynamic Installments -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
