import storage from './StorageService.js';
import auth from './AuthService.js';
import templateService from './TemplateService.js';
import clientService from './ClientService.js';
import backupService from './BackupService.js';
import demoService from './DemoService.js';
import ClientLoanRequestModule from './modules/client_loan_request.js';

// Module Dynamic Imports
const modules = {
    clients: () => import('./modules/clients.js?v=2'),
    loans: () => import('./modules/loans.js?v=2'),
    installments: () => import('./modules/installments.js?v=2'),
    templates: () => import('./modules/templates.js?v=2'),
    users: () => import('./modules/users.js?v=2'),
    settings: () => import('./modules/settings.js?v=2'),
    dashboard: () => import('./modules/dashboard.js?v=2'),
    client_dashboard: () => import('./modules/client_dashboard.js?v=2'),
    client_profile: () => import('./modules/client_profile.js?v=2'),
    client_loan_request: () => import('./modules/client_loan_request.js?v=2'),
    loan_requests: () => import('./modules/loan_requests.js?v=2'),
    payments: () => import('./modules/payments.js?v=2'),
    payment_history: () => import('./modules/payment_history.js?v=2'),
    client_payments: () => import('./modules/client_payments.js?v=2'),
    client_loans: () => import('./modules/client_loans.js?v=2'),
    client_profile: () => import('./modules/client_profile.js?v=2'),
    master_billing: () => import('./modules/master_billing.js?v=2'),
    companies: () => import('./modules/companies.js?v=2'),
    master_dashboard: () => import('./modules/master_dashboard.js?v=2'),
    master_users: () => import('./modules/master_users.js?v=2')
};

class App {
    constructor() {
        // Obter query parameter `page` diretamente para suportar o fallback SPA do Netlify
        const urlParams = new URLSearchParams(window.location.search);
        const urlPage = urlParams.get('page');

        this.config = window.APP_CONFIG || {};

        // Se PHP não substituiu, ou URL pede outra coisa, manda a SPA
        if (urlPage || this.config.currentPage === '<?php echo $page; ?>') {
            const defaultPage = 'dashboard';
            this.config.currentPage = urlPage || defaultPage;
        }
    }

    async init() {
        console.log("Initializing Malibu Crédito...");
        window.auth = auth; // Expor globalmente para módulos como Dashboard

        try {
            await storage.init();
            await auth.init();
            try {
                await templateService.init();
            } catch (e) {
                console.warn("TemplateService failed to init (likely missing company_id column in templates table):", e);
            }

            // Check Access Status for ADMINS
            if (auth.isAuthenticated()) {
                const access = await auth.checkAccessStatus();
                if (!access.allowed) {
                    this.config.currentReason = access.reason;
                    this.config.currentPage = 'blocked';
                }
            }

            // Register PWA

            // Load specific module if authenticated e injeta HTML
            if (auth.isAuthenticated()) {
                // Redirecionamento Consolidado de Landing Page (apenas se não estiver em visualização/impersonate)
                if (!auth.isImpersonating()) {
                    const page = this.config.currentPage;

                    // 1. Master -> Master Dashboard (se cair na comum ou root)
                    if (auth.isMaster() && page === 'dashboard') {
                        window.location.href = '?page=master_dashboard';
                        return;
                    }

                    // 2. Admin Normal -> Dashboard (se cair na do cliente ou root)
                    if (auth.isAdmin() && !auth.isMaster() && page === 'client_dashboard') {
                        window.location.href = '?page=dashboard';
                        return;
                    }

                    // 3. Cliente -> Client Dashboard (se cair na do admin ou root)
                    if (!auth.isAdmin() && page === 'dashboard') {
                        window.location.href = '?page=client_dashboard';
                        return;
                    }
                }

                // SPA Injector - Injeta HTML da pagina ANTES do setupUI ler os seletores CSS
                this.renderSPAPage(this.config.currentPage);

                // Agora varre o CSS e substitui nomes e fotos (já cobrindo o conteúdo recém-injetado)
                await this.setupUI();
                this.handleAuthVisibility();
                this.bindEvents();
                this.bindGlobalModals();

                if (modules[this.config.currentPage]) {
                    try {
                        const ModuleClass = (await modules[this.config.currentPage]()).default;
                        const moduleInstance = new ModuleClass();
                        if (typeof moduleInstance.init === 'function') {
                            await moduleInstance.init();
                        } else {
                            console.error(`O módulo ${this.config.currentPage} não possui um método init().`);
                        }
                    } catch (moduleError) {
                        console.error(`Erro CRÍTICO ao iniciar o módulo: ${this.config.currentPage}`, moduleError);
                    }
                }
            } else {
                // Se não está logado, garante exec da bindEvents para forms de Login
                await this.setupUI();
                this.handleAuthVisibility();
                this.bindEvents();
            }

        } catch (error) {
            console.error("Initialization failed:", error);
        }
    }

    renderSPAPage(page) {
        // Se estivermos no build estático do Netlify, o template com o ID estará presente
        const template = document.getElementById(`view-${page}`);
        const container = document.getElementById('content');

        // Preenche APENAS se houver o container e o template
        // Se The container não estiver vazio, significa que o server.js antigo PHP injetou. Ignorar.
        if (template && container && container.innerHTML.trim() === '') {
            container.innerHTML = template.innerHTML;
        }
    }

    async setupUI() {
        if (auth.isAuthenticated()) {
            try {
                const user = auth.currentUser;
                if (!user) throw new Error("Current user is null");

                // Try to get client profile for avatar, safe-guarded
                const client = user.id ? await clientService.getByUserId(user.id).catch(() => null) : null;
                const avatarHtml = client && client.avatar
                    ? `<img src="${client.avatar}" class="w-full h-full object-cover rounded-full">`
                    : null;

                // Update user info in sidebar securely
                const displayName = (client && client.name) ? client.name : ((user && user.name) ? user.name : ((user && user.email) ? user.email : 'Usuário'));
                const safeName = displayName.trim() || 'Usuário';
                const names = safeName.split(' ');
                const firstChar = String(names[0]?.[0] || 'U');
                const lastChar = names.length > 1 ? String(names[names.length - 1]?.[0] || '') : '';
                const initials = (firstChar + lastChar).toUpperCase();

                document.querySelectorAll('.user-initials').forEach(el => {
                    const isClientDashboard = el.classList.contains('bg-gradient-to-br'); // Flex mode identifier
                    if (avatarHtml) {
                        el.innerHTML = avatarHtml.replace('rounded-full', isClientDashboard ? 'rounded-2xl' : 'rounded-full');
                        el.classList.remove('bg-primary', 'bg-gradient-to-br', 'from-primary', 'to-primary-light');
                        el.classList.add('bg-transparent');
                    } else {
                        el.innerHTML = initials;
                        if (!isClientDashboard) {
                            el.classList.add('bg-primary');
                        }
                    }
                });

                document.querySelectorAll('.user-name').forEach(el => el.textContent = safeName);
                if (user && user.email) {
                    document.querySelectorAll('.user-email').forEach(el => el.textContent = user.email);
                }

                // Update company info in sidebar
                const companyBadgeContainer = document.getElementById('sidebar-company-badge');
                const companyBadgeName = document.getElementById('sidebar-company-name');

                if (auth.isMaster()) {
                    if (companyBadgeContainer) companyBadgeContainer.classList.add('hidden');
                } else {
                    if (companyBadgeContainer) companyBadgeContainer.classList.remove('hidden');
                    if (companyBadgeName) {
                        const companyId = user.company_id || user.companyId || 1;
                        const CompanyService = (await import('./CompanyService.js')).default;
                        const company = await CompanyService.getById(companyId).catch(() => ({ name: 'Empresa Padrão' }));
                        companyBadgeName.textContent = company.name || 'Empresa Padrão';
                    }
                }

                // Visibility based on roles
                if (auth.isMaster()) {
                    document.querySelectorAll('.master-only').forEach(el => el.classList.remove('hidden'));
                }

                if (auth.isAdmin()) {
                    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));

                    // Specific logic for MASTER vs Regular ADMIN
                    if (auth.isMaster()) {
                        document.querySelectorAll('.master-only').forEach(el => el.classList.remove('hidden'));
                        document.querySelectorAll('.non-master-only').forEach(el => el.classList.add('hidden'));
                        // Hide operational menu for Master as requested
                        const opMenu = document.getElementById('admin-operational-menu');
                        if (opMenu) opMenu.classList.add('hidden');
                    } else {
                        // Ensure master-only is hidden for regular admin
                        document.querySelectorAll('.master-only').forEach(el => el.classList.add('hidden'));
                        document.querySelectorAll('.non-master-only').forEach(el => el.classList.remove('hidden'));
                        // Show operational menu for regular admin
                        const opMenu = document.getElementById('admin-operational-menu');
                        if (opMenu) opMenu.classList.remove('hidden');
                    }
                } else {
                    document.querySelectorAll('.client-only').forEach(el => el.classList.remove('hidden'));
                }

                // Check if impersonating
                if (auth.isImpersonating()) {
                    this.renderImpersonationBar(user);
                }
            } catch (err) {
                console.error("Critical error inside setupUI (recovered with fallback):", err);
                // Hard-fallback pra que a Navbar não fique explícita como '--'
                document.querySelectorAll('.user-initials').forEach(el => el.innerHTML = 'US');
                document.querySelectorAll('.user-name').forEach(el => el.textContent = 'Usuário');
            }
        }
    }

    renderImpersonationBar(user) {
        if (document.getElementById('impersonation-bar')) return;
        const bar = document.createElement('div');
        bar.id = 'impersonation-bar';
        bar.className = 'fixed top-0 left-0 w-full z-[9999] bg-rose-600 text-white px-4 py-2 flex flex-col md:flex-row justify-center md:justify-between items-center gap-3 shadow-premium font-bold text-xs uppercase tracking-widest animate-fade-in';
        bar.innerHTML = `
            <div class="flex items-center gap-2">
                <i data-lucide="eye" class="w-4 h-4 animate-pulse"></i>
                <span>VISUALIZANDO PAINEL DO CLIENTE: ${user.name}</span>
            </div>
            <button id="revert-impersonation-btn" class="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm border border-white/10 active:scale-95">
                <i data-lucide="log-out" class="w-4 h-4"></i> ENCERRAR VISUALIZAÇÃO
            </button>
        `;
        document.body.prepend(bar);

        document.getElementById('revert-impersonation-btn').onclick = () => {
            auth.revertImpersonation();
        };

        // Adjust layout spacing
        document.body.style.paddingTop = '40px';
        lucide.createIcons();
    }

    handleAuthVisibility() {
        const appContainer = document.getElementById('app-container');
        const authContainer = document.getElementById('auth-container');

        if (auth.isAuthenticated()) {
            appContainer.classList.remove('hidden');
            authContainer.classList.add('hidden');
        } else {
            appContainer.classList.add('hidden');
            authContainer.classList.remove('hidden');
            this.renderAuthPage();
        }
    }

    renderAuthPage() {
        // Determine which auth page to show (Login/Register/Pending)
        const params = new URLSearchParams(window.location.search);
        const view = params.get('auth') || 'login';

        const container = document.getElementById('auth-container');

        // Simple client-side templates for auth
        if (view === 'login') {
            container.innerHTML = `
                <div class="min-h-screen flex items-center justify-center p-6 bg-slate-50 overflow-hidden relative">
                    <!-- Decorative blobs -->
                    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
                    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s"></div>

                    <div class="max-w-md w-full bg-white p-10 sm:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-10 relative z-10">
                        <div class="text-center space-y-6">
                            <div class="w-full px-6 mb-2">
                                <img src="assets/img/logo.png" alt="Malibu Crédito" class="w-full h-auto mx-auto transition-transform hover:scale-105 duration-500 drop-shadow-md">
                            </div>
                            <div>
                                <h2 class="text-3xl font-black text-slate-800 font-heading tracking-tight">Bem-vindo</h2>
                                <p class="text-slate-500 font-medium mt-2">Acesso à plataforma Malibu Crédito</p>
                            </div>
                        </div>
                        
                        <form id="login-form" class="space-y-5">
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Seu E-mail</label>
                                <div class="relative">
                                    <i data-lucide="mail" class="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                                    <input type="email" id="email" required placeholder="exemplo@email.com" 
                                        class="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-slate-800 font-bold">
                                </div>
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sua Senha</label>
                                <div class="relative">
                                    <i data-lucide="lock" class="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                                    <input type="password" id="password" required placeholder="••••••••" 
                                        class="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-slate-800 font-black tracking-widest">
                                </div>
                            </div>
                            <button type="submit" class="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white font-black py-4 px-4 rounded-2xl shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-3 mt-4">
                                <span>Entrar no Sistema</span>
                                <i data-lucide="arrow-right" class="w-5 h-5"></i>
                            </button>
                        </form>
                        
                        <div class="text-center pt-2">
                            <p class="text-sm text-slate-500 font-medium">Não tem uma conta? <a href="?auth=register" class="text-primary font-bold hover:underline">Cadastre-se</a></p>
                        </div>
                    </div>
                </div>
            `;
        } else if (view === 'register') {
            container.innerHTML = `
                <div class="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
                    <div class="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
                    
                    <div class="max-w-3xl w-full bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl space-y-8 relative z-10 border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div class="text-center">
                            <h2 class="text-3xl font-black text-slate-800 font-heading tracking-tight">Criar Conta</h2>
                            <p class="text-slate-500 font-medium">Preencha seus dados para solicitação de empréstimo</p>
                        </div>
                        
                        <form id="register-form" class="space-y-8 text-left">
                            
                            <!-- Bloco Empresa (Multi-Tenant) -->
                            <div class="space-y-4">
                                <h3 class="text-slate-800 font-bold border-b border-slate-100 pb-2 flex items-center gap-2"><i data-lucide="building" class="w-5 h-5 text-primary"></i> Selecione sua Empresa</h3>
                                <div class="space-y-1">
                                    <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">Empresa</label>
                                    <div class="relative">
                                        <i data-lucide="briefcase" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                        <select id="reg-company-id" required class="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700 appearance-none cursor-pointer">
                                            <option value="" disabled selected>Carregando empresas...</option>
                                        </select>
                                        <i data-lucide="chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></i>
                                    </div>
                                </div>
                            </div>

                            <!-- Bloco Identidade -->
                            <div class="space-y-5">
                                <h3 class="text-slate-800 font-bold border-b border-slate-100 pb-3 flex items-center gap-2"><i data-lucide="fingerprint" class="w-5 h-5 text-primary"></i> Identidade Pessoal</h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div class="space-y-1">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                                        <div class="relative">
                                            <i data-lucide="user" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                            <input type="text" id="reg-name" required placeholder="Seu nome" class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                                        </div>
                                    </div>
                                    <div class="space-y-1">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">CPF</label>
                                        <div class="relative">
                                            <i data-lucide="file-text" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                            <input type="text" id="reg-cpf" required placeholder="***.***.***-**" class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                                        </div>
                                    </div>
                                    <div class="space-y-1">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">Data Nascimento</label>
                                        <div class="relative">
                                            <i data-lucide="calendar" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                            <input type="date" id="reg-birth" required class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                                        </div>
                                    </div>
                                    <div class="space-y-1 md:col-span-2">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">Estado Civil</label>
                                        <div class="relative">
                                            <i data-lucide="users" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                            <select id="reg-marital" required class="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700 appearance-none cursor-pointer">
                                                <option value="" disabled selected>Selecione...</option>
                                                <option value="Solteiro(a)">Solteiro(a)</option>
                                                <option value="Casado(a)">Casado(a)</option>
                                                <option value="Divorciado(a)">Divorciado(a)</option>
                                                <option value="Viúvo(a)">Viúvo(a)</option>
                                            </select>
                                            <i data-lucide="chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Bloco Contato & Acesso -->
                            <div class="space-y-4">
                                <h3 class="text-slate-800 font-bold border-b border-slate-100 pb-2 flex items-center gap-2"><i data-lucide="message-square" class="w-5 h-5 text-indigo-500"></i> Contato & Acesso</h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div class="space-y-1">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">WhatsApp / Celular</label>
                                        <div class="relative">
                                            <i data-lucide="phone" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                            <input type="tel" id="reg-phone" required placeholder="(11) 99999-9999" class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                                        </div>
                                    </div>
                                    <div class="space-y-1">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">E-mail (Login)</label>
                                        <div class="relative">
                                            <i data-lucide="mail" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                            <input type="email" id="reg-email" required placeholder="seu@email.com" class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                                        </div>
                                    </div>
                                    <div class="space-y-1 md:col-span-2">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">Senha de Acesso</label>
                                        <div class="relative">
                                            <i data-lucide="lock" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                            <input type="password" id="reg-password" required placeholder="••••••••" class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-black tracking-widest text-slate-700">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Bloco Endereço -->
                            <div class="space-y-4">
                                <h3 class="text-slate-800 font-bold border-b border-slate-100 pb-2 flex items-center gap-2"><i data-lucide="map-pin" class="w-5 h-5 text-rose-500"></i> Endereço Residencial</h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <div class="space-y-1 lg:col-span-2">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">Logradouro / Rua</label>
                                        <div class="relative">
                                            <i data-lucide="map-pin" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                            <input type="text" id="reg-street" required placeholder="Nome da rua/avenida" class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                                        </div>
                                    </div>
                                    <div class="space-y-1">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">Número</label>
                                        <div class="relative">
                                            <i data-lucide="hash" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                            <input type="text" id="reg-number" required placeholder="Ex: 123" class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                                        </div>
                                    </div>
                                    <div class="space-y-1">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">Bairro</label>
                                        <div class="relative">
                                            <i data-lucide="map" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                            <input type="text" id="reg-neighborhood" required placeholder="Nome do Bairro" class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                                        </div>
                                    </div>
                                    <div class="space-y-1">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">Cidade</label>
                                        <div class="relative">
                                            <i data-lucide="building" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                            <select id="reg-city" required class="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700 appearance-none cursor-pointer">
                                                <option value="" disabled selected>Selecione...</option>
                                                <option value="Campo Grande">Campo Grande</option>
                                                <option value="Curitiba">Curitiba</option>
                                                <option value="Maceió">Maceió</option>
                                            </select>
                                            <i data-lucide="chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></i>
                                        </div>
                                    </div>
                                    <div class="space-y-1">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">Estado</label>
                                        <div class="relative">
                                            <i data-lucide="map" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                            <select id="reg-state" required class="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700 appearance-none cursor-pointer">
                                                <option value="" disabled selected>UF...</option>
                                                <option value="AC">AC</option><option value="AL">AL</option><option value="AP">AP</option>
                                                <option value="AM">AM</option><option value="BA">BA</option><option value="CE">CE</option>
                                                <option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option>
                                                <option value="MA">MA</option><option value="MT">MT</option><option value="MS">MS</option>
                                                <option value="MG">MG</option><option value="PA">PA</option><option value="PB">PB</option>
                                                <option value="PR">PR</option><option value="PE">PE</option><option value="PI">PI</option>
                                                <option value="RJ">RJ</option><option value="RN">RN</option><option value="RS">RS</option>
                                                <option value="RO">RO</option><option value="RR">RR</option><option value="SC">SC</option>
                                                <option value="SP">SP</option><option value="SE">SE</option><option value="TO">TO</option>
                                            </select>
                                            <i data-lucide="chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Bloco Profissional -->
                            <div class="space-y-4">
                                <h3 class="text-slate-800 font-bold border-b border-slate-100 pb-2 flex items-center gap-2"><i data-lucide="briefcase" class="w-5 h-5 text-amber-500"></i> Dados Profissionais</h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div class="space-y-1">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">Ocupação / Cargo</label>
                                        <div class="relative">
                                            <i data-lucide="briefcase" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                            <input type="text" id="reg-occupation" required placeholder="Qual sua profissão?" class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                                        </div>
                                    </div>
                                    <div class="space-y-1">
                                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">Empresa / Empregador</label>
                                        <div class="relative">
                                            <i data-lucide="building-2" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                            <input type="text" id="reg-company" required placeholder="Onde você trabalha?" class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="pt-6">
                                <button type="submit" class="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-primary/30 transition-all text-sm md:text-base tracking-widest uppercase flex flex-col items-center justify-center gap-1">
                                    <span>CRIAR CONTA E SOLICITAR ACESSO</span>
                                </button>
                            </div>
                        </form>
                        
                        <div class="text-center">
                            <p class="text-slate-500 text-sm font-medium">Já tem conta? <a href="?auth=login" class="text-primary font-bold hover:underline">Fazer Login</a></p>
                        </div>
                    </div>
                </div>
            `;
        } else if (view === 'pending') {
            container.innerHTML = `
                <div class="min-h-screen flex items-center justify-center p-6 bg-gradient-sidebar relative overflow-hidden text-center">
                    <div class="max-w-md w-full glass p-10 rounded-[3rem] shadow-premium space-y-6 relative z-10 border border-white/20">
                        <div class="bg-amber-400/10 text-amber-400 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto border border-amber-400/20 shadow-lg shadow-amber-400/5 transition-transform hover:scale-110 duration-500">
                            <i data-lucide="clock-4" class="w-12 h-12"></i>
                        </div>
                        <div>
                            <h1 class="text-3xl font-black text-white font-heading">Aguardando</h1>
                            <p class="text-slate-400 mt-2">Sua conta está sendo revisada por um administrador.</p>
                        </div>
                        <div class="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p class="text-xs text-slate-500 leading-relaxed uppercase tracking-widest font-bold">Status: Em Análise</p>
                        </div>
                        <button onclick="window.location.href='?auth=login'" class="text-primary font-black uppercase tracking-widest text-sm hover:text-primary-light transition-colors">Voltar ao Login</button>
                    </div>
                </div>
            `;
        }

        lucide.createIcons();

        // Populate Companies Select dinamicamente se estiver no registro
        if (view === 'register') {
            this.populateRegisterCompanies();
        }

        this.bindAuthEvents();
    }

    async populateRegisterCompanies() {
        const select = document.getElementById('reg-company-id');
        if (!select) return;

        try {
            const CompanyService = (await import('./CompanyService.js')).default;
            const companies = await CompanyService.getAll();

            const cleanName = (name) => name.replace(/\s*\(Padrão\)/gi, '').trim();

            let optionsHtml = '<option value="" disabled selected>Selecione sua empresa</option>';

            if (companies && companies.length > 0) {
                optionsHtml += companies.map(c => `<option value="${c.id}">${cleanName(c.name)}</option>`).join('');
            } else {
                optionsHtml += '<option value="1">Malibu Crédito</option>';
            }
            select.innerHTML = optionsHtml;
        } catch (err) {
            console.error("Erro ao carregar empresas para registro:", err);
            select.innerHTML = '<option value="" disabled selected>Selecione sua empresa</option><option value="1">Malibu Crédito</option>';
        }
    }

    bindAuthEvents() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.onsubmit = async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                try {
                    const user = await auth.login(email, password);
                    const isAdmin = user.role === 'admin' || user.role === 'ADMIN' || user.role === 'MASTER';
                    if (isAdmin) {
                        if (user.role === 'MASTER') {
                            window.location.href = '?page=master_dashboard';
                        } else {
                            window.location.href = '?page=dashboard';
                        }
                    } else {
                        window.location.href = '?page=client_dashboard';
                    }
                } catch (error) {
                    alert(error.message);
                }
            };
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.onsubmit = async (e) => {
                e.preventDefault();

                const clientData = {
                    name: document.getElementById('reg-name').value.trim(),
                    email: document.getElementById('reg-email').value.trim(),
                    password: document.getElementById('reg-password').value,
                    cpf_cnpj: document.getElementById('reg-cpf').value.trim(),
                    birth_date: document.getElementById('reg-birth').value,
                    marital_status: document.getElementById('reg-marital').value,
                    phone: document.getElementById('reg-phone').value.trim(),
                    street: document.getElementById('reg-street').value.trim(),
                    number: document.getElementById('reg-number').value.trim(),
                    neighborhood: document.getElementById('reg-neighborhood').value.trim(),
                    city: document.getElementById('reg-city').value.trim(),
                    state: document.getElementById('reg-state').value.trim(),
                    occupation: document.getElementById('reg-occupation').value.trim(),
                    company: document.getElementById('reg-company').value.trim(),
                    company_id: document.getElementById('reg-company-id').value
                };

                try {
                    // Update the register call to pass all the new collected user/client data
                    await auth.register(clientData);
                    const btn = registerForm.querySelector('button[type="submit"]');
                    btn.textContent = "CONTA CRIADA! ABRINDO...";
                    btn.classList.add("opacity-50");

                    setTimeout(async () => {
                        await auth.login(clientData.email, clientData.password);
                        window.location.href = '?page=client_dashboard';
                    }, 500);
                } catch (error) {
                    alert(error.message);
                }
            };
        }
    }

    bindEvents() {
        // Mobile Sidebar Toggle
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');
        if (mobileToggle && sidebar) {
            mobileToggle.onclick = () => {
                sidebar.classList.toggle('-translate-x-full');
            };
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                if (confirm("Deseja realmente sair?")) {
                    auth.logout();
                }
            };
        }

        // Handle all internal links to prevent full reloads if possible (future enhancement)
    }

    bindGlobalModals() {
        // Global Proof Viewer Modal Close Logic
        const closeBtn = document.getElementById('close-proof-modal');
        const modal = document.getElementById('proof-viewer-modal');

        if (closeBtn && modal) {
            const close = () => modal.classList.add('hidden');
            closeBtn.onclick = close;
            modal.onclick = (e) => {
                if (e.target === modal) close();
            };
        }

        // Expose global viewer function
        window.viewProof = (url) => this.showGlobalProofModal(url);
    }

    showGlobalProofModal(proof) {
        if (!proof) return;

        const modal = document.getElementById('proof-viewer-modal');
        const display = document.getElementById('proof-display');
        if (!modal || !display) return;

        display.innerHTML = '';

        // Show loading state first
        display.innerHTML = `
            <div class="text-white text-center">
                <i data-lucide="loader-2" class="w-12 h-12 animate-spin mx-auto mb-4 opacity-20"></i>
                <p class="text-slate-400 text-sm font-medium">Carregando arquivo...</p>
            </div>
        `;

        const isImage = proof.startsWith('data:image/') || (typeof proof === 'string' && (proof.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) != null));

        if (isImage) {
            const img = new Image();
            img.onload = () => {
                display.innerHTML = '';
                img.className = 'max-w-full max-h-full object-contain rounded-xl shadow-2xl';
                display.appendChild(img);
            };
            img.onerror = () => {
                display.innerHTML = '<div class="text-rose-400 font-bold">Erro ao carregar imagem.</div>';
            };
            img.src = proof;
        } else {
            const iframe = document.createElement('iframe');
            iframe.src = proof;
            iframe.className = 'w-full h-full border-none rounded-xl bg-white shadow-2xl';
            display.innerHTML = '';
            display.appendChild(iframe);
        }

        modal.classList.remove('hidden');
        lucide.createIcons();
    }
}

const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
export default app;
