<?php
/**
 * Shared Layout View
 */
?>
<div class="flex flex-col md:flex-row min-h-screen">
    <!-- Mobile Header -->
    <header class="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center shadow-sm sticky top-0 z-[100]">
        <div class="flex items-center">
            <img src="assets/img/logo.png" alt="Malibu" class="h-10 w-auto">
        </div>
        <button id="mobile-menu-toggle" class="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <i data-lucide="menu" class="w-6 h-6"></i>
        </button>
    </header>

    <!-- Sidebar (Desktop & Mobile Drawer) -->
    <aside id="sidebar" class="bg-gradient-to-b from-slate-900 via-[#0F172A] to-[#1E293B] text-slate-300 w-full md:w-72 fixed md:sticky top-0 z-50 h-screen transition-all duration-500 transform -translate-x-full md:translate-x-0 shadow-2xl flex flex-col border-r border-white/5">
        <!-- Sidebar Header / High-Impact Logo Area -->
        <div class="w-full px-5 py-6 border-b border-white/5 flex items-center justify-center mb-2">
            <div class="w-full relative group flex justify-center items-center overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg h-[110px]">
                <div class="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <img src="assets/img/logo.png" alt="Malibu Crédito" 
                     class="w-full h-full object-contain relative z-10 transition-transform duration-500 scale-[2.2] origin-center group-hover:scale-[2.3]">
            </div>
        </div>

        <nav class="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar space-y-2">
            <!-- Company Identifier Badge (Refined Style) -->
            <div class="px-2 mb-4" id="sidebar-company-badge">
                <div class="bg-gradient-to-r from-white/10 to-transparent p-3 rounded-2xl border border-white/5 shadow-inner group transition-all hover:bg-white/[0.12]">
                    <p class="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Sua Empresa</p>
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20 shrink-0">
                            <i data-lucide="building-2" class="w-3.5 h-3.5 text-primary"></i>
                        </div>
                        <span id="sidebar-company-name" class="text-[11px] font-bold text-slate-300 uppercase tracking-tight truncate leading-tight">Carregando...</span>
                    </div>
                </div>
            </div>

            <!-- COMMON / ADMIN SECTION -->
            <!-- ADMIN OPERATIONAL SECTION (Only for non-MASTER admins) -->
            <div class="admin-only hidden space-y-1" id="admin-operational-menu">
                <a href="?page=dashboard" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group <?php echo $page === 'dashboard' ? 'bg-primary shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'dashboard' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-primary/20'; ?>">
                        <i data-lucide="layout-dashboard" class="w-4 h-4 <?php echo $page === 'dashboard' ? 'text-white' : 'text-slate-400 group-hover:text-primary'; ?>"></i>
                    </div>
                    <span class="font-semibold text-sm">Dashboard Admin</span>
                </a>
                
                <div class="pt-4 pb-1 px-4 flex items-center gap-2">
                    <span class="h-px flex-1 bg-white/5"></span>
                    <span class="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">Gestão</span>
                    <span class="h-px flex-1 bg-white/5"></span>
                </div>

                <a href="?page=clients" class="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group <?php echo $page === 'clients' ? 'bg-primary shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'clients' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-primary/20'; ?>">
                        <i data-lucide="users" class="w-4 h-4 <?php echo $page === 'clients' ? 'text-white' : 'text-slate-400 group-hover:text-primary'; ?>"></i>
                    </div>
                    <span class="font-medium text-sm">Clientes</span>
                </a>

                <a href="?page=loans" class="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group <?php echo $page === 'loans' ? 'bg-primary shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'loans' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-primary/20'; ?>">
                        <i data-lucide="hand-coins" class="w-4 h-4 <?php echo $page === 'loans' ? 'text-white' : 'text-slate-400 group-hover:text-primary'; ?>"></i>
                    </div>
                    <span class="font-medium text-sm">Empréstimos</span>
                </a>

                <a href="?page=loan_requests" class="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group <?php echo $page === 'loan_requests' ? 'bg-primary shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'loan_requests' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-primary/20'; ?>">
                        <i data-lucide="bell" class="w-4 h-4 <?php echo $page === 'loan_requests' ? 'text-white' : 'text-slate-400 group-hover:text-primary'; ?>"></i>
                    </div>
                    <span class="font-medium text-sm">Solicitações</span>
                </a>

                <a href="?page=installments" class="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group <?php echo $page === 'installments' ? 'bg-primary shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'installments' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-primary/20'; ?>">
                        <i data-lucide="calendar-clock" class="w-4 h-4 <?php echo $page === 'installments' ? 'text-white' : 'text-slate-400 group-hover:text-primary'; ?>"></i>
                    </div>
                    <span class="font-medium text-sm">Parcelas</span>
                </a>

                <a href="?page=payment_history" class="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group <?php echo $page === 'payment_history' ? 'bg-primary shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'payment_history' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-primary/20'; ?>">
                        <i data-lucide="history" class="w-4 h-4 <?php echo $page === 'payment_history' ? 'text-white' : 'text-slate-400 group-hover:text-primary'; ?>"></i>
                    </div>
                    <span class="font-medium text-sm">Histórico Pgts</span>
                </a>

                <div class="pt-4 pb-1 px-4 flex items-center gap-2">
                    <span class="h-px flex-1 bg-white/5"></span>
                    <span class="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">Sistema</span>
                    <span class="h-px flex-1 bg-white/5"></span>
                </div>
            </div>

            <!-- MASTER / SHARED ADMIN SYSTEM SECTION -->
            <div class="admin-only hidden space-y-1">
                <a href="?page=master_dashboard" class="master-only hidden flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group <?php echo $page === 'master_dashboard' ? 'bg-indigo-600 shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'master_dashboard' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-indigo-500/20'; ?>">
                        <i data-lucide="layout-dashboard" class="w-4 h-4 <?php echo $page === 'master_dashboard' ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'; ?>"></i>
                    </div>
                    <span class="font-semibold text-sm">Dashboard</span>
                </a>

                <a href="?page=master_billing" class="master-only hidden flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group <?php echo $page === 'master_billing' ? 'bg-indigo-600 shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'master_billing' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-indigo-500/20'; ?>">
                        <i data-lucide="banknote" class="w-4 h-4 <?php echo $page === 'master_billing' ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'; ?>"></i>
                    </div>
                    <span class="font-semibold text-sm">Faturamento Master</span>
                </a>

                <a href="?page=master_users" class="master-only hidden flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group <?php echo $page === 'master_users' ? 'bg-indigo-600 shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'master_users' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-indigo-500/20'; ?>">
                        <i data-lucide="users-2" class="w-4 h-4 <?php echo $page === 'master_users' ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'; ?>"></i>
                    </div>
                    <span class="font-bold text-sm">Gestão de Usuários</span>
                </a>

                <a href="?page=companies" class="master-only hidden flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group <?php echo $page === 'companies' ? 'bg-emerald-600 shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'companies' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-emerald-500/20'; ?>">
                        <i data-lucide="building-2" class="w-4 h-4 <?php echo $page === 'companies' ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'; ?>"></i>
                    </div>
                    <span class="font-bold text-sm">Gerenciar Empresas</span>
                </a>

                <a href="?page=users" class="admin-only non-master-only hidden flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group <?php echo $page === 'users' ? 'bg-primary shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'users' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-primary/20'; ?>">
                        <i data-lucide="shield-check" class="w-4 h-4 <?php echo $page === 'users' ? 'text-white' : 'text-slate-400 group-hover:text-primary'; ?>"></i>
                    </div>
                    <span class="font-medium text-sm">Usuários</span>
                </a>

                <a href="?page=settings" class="master-only hidden flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group <?php echo $page === 'settings' ? 'bg-primary shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'settings' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-primary/20'; ?>">
                        <i data-lucide="settings" class="w-4 h-4 <?php echo $page === 'settings' ? 'text-white' : 'text-slate-400 group-hover:text-primary'; ?>"></i>
                    </div>
                    <span class="font-medium text-sm">Configurações</span>
                </a>
            </div>
            
            <!-- CLIENT SECTION -->
            <div class="client-only hidden space-y-1">
                <a href="?page=client_dashboard" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group <?php echo $page === 'client_dashboard' || !$page ? 'bg-primary shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'client_dashboard' || !$page ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-primary/20'; ?>">
                        <i data-lucide="layout-dashboard" class="w-4 h-4 <?php echo $page === 'client_dashboard' || !$page ? 'text-white' : 'text-slate-400 group-hover:text-primary'; ?>"></i>
                    </div>
                    <span class="font-semibold text-sm">Meu Painel</span>
                </a>
                
                <a href="?page=client_loans" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group <?php echo $page === 'client_loans' ? 'bg-primary shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'client_loans' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-primary/20'; ?>">
                        <i data-lucide="hand-coins" class="w-4 h-4 <?php echo $page === 'client_loans' ? 'text-white' : 'text-slate-400 group-hover:text-primary'; ?>"></i>
                    </div>
                    <span class="font-semibold text-sm">Meus Empréstimos</span>
                </a>

                <a href="?page=client_loan_request" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group <?php echo $page === 'client_loan_request' ? 'bg-primary shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'client_loan_request' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-primary/20'; ?>">
                        <i data-lucide="plus-circle" class="w-4 h-4 <?php echo $page === 'client_loan_request' ? 'text-white' : 'text-slate-400 group-hover:text-primary'; ?>"></i>
                    </div>
                    <span class="font-semibold text-sm">Novo Empréstimo</span>
                </a>
                <a href="?page=client_payments" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group <?php echo $page === 'client_payments' ? 'bg-primary shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'client_payments' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-primary/20'; ?>">
                        <i data-lucide="history" class="w-4 h-4 <?php echo $page === 'client_payments' ? 'text-white' : 'text-slate-400 group-hover:text-primary'; ?>"></i>
                    </div>
                    <span class="font-semibold text-sm">Minhas Parcelas</span>
                </a>
                
                <!-- separator -->
                <div class="h-px bg-white/5 my-2"></div>

                <a href="?page=client_profile" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group <?php echo $page === 'client_profile' ? 'bg-primary shadow-premium text-white' : 'hover:bg-white/5 hover:text-white'; ?>">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center <?php echo $page === 'client_profile' ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-primary/20'; ?>">
                        <i data-lucide="user" class="w-4 h-4 <?php echo $page === 'client_profile' ? 'text-white' : 'text-slate-400 group-hover:text-primary'; ?>"></i>
                    </div>
                    <span class="font-semibold text-sm">Meu Perfil</span>
                </a>
            </div>
        </nav>

        <div class="p-4 mt-auto border-t border-white/5">
            <div class="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold user-initials shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                    IR
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-white text-sm font-bold truncate user-name">Ivan Rossi</p>
                    <p class="text-slate-500 text-[10px] truncate user-email">ivan@outlook.com</p>
                </div>
                <button id="logout-btn" class="p-2 text-slate-500 hover:text-rose-400 transition-colors">
                    <i data-lucide="log-out" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    </aside>

    <!-- Main Content -->
<main class="flex-1 overflow-x-hidden pt-4 pb-24 md:pb-8">
        <div class="container mx-auto px-4 md:px-8">
            <!-- Dynamic Content -->
            <div id="content" class="fade-in">
                <?php include $viewPath; ?>
            </div>
        </div>
        
        <!-- Bottom Nav (Mobile Only) -->
        <nav class="md:hidden fixed bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-xl border border-white/10 px-6 py-4 flex justify-between items-center rounded-3xl shadow-2xl z-[100]">
            <a href="?page=client_dashboard" class="flex flex-col items-center gap-1 <?php echo $page === 'client_dashboard' || !$page ? 'text-primary' : 'text-slate-500'; ?>">
                <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
            </a>
            <a href="?page=client_loan_request" class="flex flex-col items-center gap-1 <?php echo $page === 'client_loan_request' ? 'text-primary' : 'text-slate-500'; ?>">
                <i data-lucide="plus-circle" class="w-5 h-5"></i>
            </a>
            <div class="relative -top-10">
                <button class="w-14 h-14 bg-gradient-to-br from-primary to-primary-light text-white rounded-full shadow-premium flex items-center justify-center border-4 border-slate-900">
                    <i data-lucide="plus" class="w-8 h-8"></i>
                </button>
            </div>
            <a href="?page=client_payments" class="flex flex-col items-center gap-1 <?php echo $page === 'client_payments' ? 'text-primary' : 'text-slate-500'; ?>">
                <i data-lucide="receipt" class="w-5 h-5"></i>
            </a>
            <a href="?page=client_profile" class="flex flex-col items-center gap-1 <?php echo $page === 'client_profile' ? 'text-primary' : 'text-slate-500'; ?>">
                <i data-lucide="user" class="w-5 h-5"></i>
            </a>
        </nav>
    </main>
</div>

<!-- Global Proof Viewer Modal -->
<div id="proof-viewer-modal" class="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[250] hidden flex items-center justify-center p-4 md:p-10">
    <div class="relative w-full max-w-5xl h-full flex flex-col items-center justify-center">
        <button id="close-proof-modal" class="absolute -top-12 right-0 text-white hover:text-rose-400 transition-all flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
            <span>Fechar Visualização</span>
            <i data-lucide="x" class="w-8 h-8"></i>
        </button>
        <div id="proof-display" class="w-full h-full rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center text-center p-4">
            <!-- Content injected via JS -->
            <div class="text-white text-center">
                <i data-lucide="loader-2" class="w-12 h-12 animate-spin mx-auto mb-4 opacity-20"></i>
                <p class="text-slate-400 text-sm font-medium">Carregando arquivo...</p>
            </div>
        </div>
    </div>
</div>
