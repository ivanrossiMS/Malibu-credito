import storage from './StorageService.js';
import clientService from './ClientService.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.profile = null;
        this.authLoading = true;
        this.profileLoading = false;
        console.log("AUTH LOADING:", this.authLoading);
    }

    async fetchProfile(userId) {
        this.profileLoading = true;
        console.log("PROFILE LOADING:", this.profileLoading);

        if (!storage.supabase) {
            console.warn("Supabase client not initialized.");
            this.profileLoading = false;
            console.log("PROFILE LOADING:", this.profileLoading);
            return null;
        }

        try {
            console.log("FETCH PROFILE FOR USER ID:", userId, typeof userId);
            const { data, error } = await storage.supabase
                .from('clients')
                .select('*')
                .eq('user_id', String(userId)); // Revertendo para user_id e mantendo como String

            if (error) {
                console.error("Supabase fetchProfile error:", error);
            }
            console.log("PROFILE RESULT (Raw):", data);

            const rawProfile = data && data.length > 0 ? data[0] : null;
            const profile = rawProfile ? storage.toCamelCase(rawProfile) : null;

            if (!profile) {
                console.log("No profile found");
                this.setProfile(null);
            } else {
                this.setProfile(profile);
            }

            this.profileLoading = false;
            console.log("PROFILE LOADING:", this.profileLoading);
            return profile;
        } catch (err) {
            console.error("fetchProfile critical error (non-blocking):", err);
            this.profileLoading = false;
            console.log("PROFILE LOADING:", this.profileLoading);
            return null;
        }
    }

    setProfile(profile) {
        this.profile = profile;
    }

    stopLoading() {
        // Mantido por compatibilidade, mas o controle agora é via flags individuais
        console.log("Loading stopped (legacy call).");
    }

    async init() {
        console.log("AUTH LOADING:", this.authLoading);

        const users = await storage.getAll('users');
        const masterEmail = 'ivanrossi@outlook.com';
        const adminExists = users.find(u => u.email === masterEmail);

        if (!adminExists) {
            try {
                await storage.add('users', {
                    name: 'Ivan Rossi',
                    email: masterEmail,
                    password: 'admin',
                    role: 'MASTER',
                    status: 'ativo',
                    createdAt: new Date().toISOString()
                });
                console.log("Master Admin user created.");
            } catch (e) {
                if (e.code === '23505' || e.message?.includes('unique constraint')) {
                    console.log("Master Admin specifically confirmed in remote (23505).");
                } else {
                    console.warn("Master Admin creation issue:", e.message);
                }
            }
        } else if (adminExists.role !== 'MASTER') {
            // Garantir que ele seja MASTER se já existir mas com outro role
            adminExists.role = 'MASTER';
            await storage.put('users', adminExists);
            console.log("Existing user promoted to MASTER.");
        }

        // Check for active session
        const session = localStorage.getItem('malibu_session');
        console.log("AUTH STATE:", session ? JSON.parse(session) : null);

        if (session) {
            try {
                const userData = JSON.parse(session);
                const user = await storage.getById('users', userData.id);

                if (user && user.status === 'ativo') {
                    this.currentUser = user;
                    // Aguarda a busca do perfil para garantir que o Dashboard encontre o registro do cliente
                    await this.fetchProfile(user.id);
                } else {
                    localStorage.removeItem('malibu_session');
                }
            } catch (e) {
                localStorage.removeItem('malibu_session');
            }
        }

        this.authLoading = false;
        console.log("AUTH LOADING:", this.authLoading);
    }

    async login(email, password) {
        const users = await storage.getAll('users');
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) throw new Error("Credenciais inválidas.");
        if (user.status !== 'ativo') throw new Error(`Conta ${user.status}.`);

        this.currentUser = user;
        localStorage.setItem('malibu_session', JSON.stringify({
            id: user.id,
            email: user.email,
            companyId: user.company_id || user.companyId
        }));

        // Garantir que o admin tenha um perfil se ele não tiver (correção para base existente)
        // Garantir que o admin tenha um perfil se ele não tiver (correção para base existente)
        const isRegularAdmin = user.role === 'admin' || user.role === 'ADMIN';
        if (isRegularAdmin) {
            const profile = await this.fetchProfile(user.id);
            if (!profile) {
                await storage.add('clients', {
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    status: 'ativo',
                    createdAt: new Date().toISOString()
                });
                await this.fetchProfile(user.id);
            }
        }

        return user;
    }

    async register(userData) {
        const users = await storage.getAll('users');
        if (users.find(u => u.email === userData.email)) {
            throw new Error("Email já cadastrado.");
        }

        if (!clientService.constructor.validateEmail(userData.email)) {
            throw new Error("Formato de e-mail inválido.");
        }

        if (userData.cpf_cnpj && userData.cpf_cnpj.length <= 14) { // Basic check for CPF vs CNPJ
            if (!clientService.constructor.validateCPF(userData.cpf_cnpj)) {
                throw new Error("CPF inválido.");
            }
        }

        const newUser = {
            name: userData.name,
            email: userData.email,
            password: userData.password,
            role: 'user',
            status: 'ativo',
            company_id: userData.company_id || 1, // Fallback para 1 se não vier do form (retrocompatibilidade)
            createdAt: new Date().toISOString()
        };
        if (userData.id) newUser.id = userData.id;

        const userId = await storage.add('users', newUser);

        // Also create a complete client record linked to this user
        await storage.add('clients', {
            userId: userId,
            name: userData.name,
            email: userData.email,
            phone: userData.phone || '',
            cpf_cnpj: userData.cpf_cnpj || null,
            rg: userData.rg || null,
            birth_date: userData.birth_date || null,
            marital_status: userData.marital_status || null,
            street: userData.street || '',
            number: userData.number || '',
            neighborhood: userData.neighborhood || '',
            city: userData.city || '',
            state: userData.state || '',
            occupation: userData.occupation || '',
            company: userData.company || '',
            status: 'ativo',
            companyId: newUser.company_id,
            createdAt: new Date().toISOString()
        });

        return userId;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('malibu_session');
        window.location.reload();
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    isAdmin() {
        return this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'ADMIN' || this.currentUser.role === 'MASTER');
    }

    isMaster() {
        return this.currentUser && (this.currentUser.role === 'MASTER' || this.currentUser.email === 'ivanrossi@outlook.com');
    }

    /**
     * Verifica se o acesso está liberado para o usuário atual.
     * Retorna { allowed: boolean, reason: string|null }
     */
    async checkAccessStatus() {
        if (!this.currentUser) return { allowed: false, reason: 'not_logged_in' };

        // MASTER sempre tem acesso
        if (this.isMaster()) return { allowed: true };

        // Somente ADMINS normais passam pela regra de mensalidade
        if (this.currentUser.role !== 'admin' && this.currentUser.role !== 'ADMIN') {
            return { allowed: true };
        }

        // 1. Verificar Override da Empresa (Se o Master liberou a empresa toda)
        const CompanyService = (await import('./CompanyService.js')).default;
        const company = await CompanyService.getById(this.currentUser.company_id || this.currentUser.companyId);

        if (company && (company.access_override || company.accessOverride)) {
            return { allowed: true };
        }

        // 2. Se o MASTER deu override individual no usuário, entra tbm
        if (this.currentUser.accessOverride) return { allowed: true };

        // 3. Se o acesso ainda não foi habilitado pelo MASTER (primeira vez)
        if (!this.currentUser.accessEnabled) return { allowed: false, reason: 'pending_master' };

        // 4. Verificar mensalidades da Empresa (Bloqueio Coletivo)
        const billingService = (await import('./BillingService.js')).default;
        const hasOverdue = await billingService.hasCompanyOverdue(this.currentUser.company_id || this.currentUser.companyId);

        if (hasOverdue) return { allowed: false, reason: 'overdue_billing' };

        return { allowed: true };
    }

    async impersonate(targetUserId) {
        if (!this.isAdmin()) throw new Error("Acesso negado.");

        const users = await storage.getAll('users');
        const targetUser = users.find(u => String(u.id) === String(targetUserId));

        if (!targetUser) throw new Error("Usuário não encontrado.");

        const isTargetAdmin = targetUser.role === 'admin' || targetUser.role === 'ADMIN' || targetUser.role === 'MASTER';

        // Regra: Apenas Master pode assumir Admin. Admin comum só assume Cliente.
        if (isTargetAdmin && !this.isMaster()) {
            throw new Error("Apenas o Administrador Master pode acessar outros painéis administrativos.");
        }

        if (targetUser.email === 'ivanrossi@outlook.com' && this.currentUser.email !== 'ivanrossi@outlook.com') {
            throw new Error("Não é possível assumir a conta do Administrador Master.");
        }

        // Salvar a sessão atual (do admin/master) como backup
        localStorage.setItem('malibu_admin_session', localStorage.getItem('malibu_session'));

        // Logar como o alvo
        localStorage.setItem('malibu_session', JSON.stringify({
            id: targetUser.id,
            email: targetUser.email,
            companyId: targetUser.company_id || targetUser.companyId
        }));

        // Redirecionamento inteligente
        if (isTargetAdmin) {
            window.location.href = '?page=dashboard';
        } else {
            window.location.href = '?page=client_dashboard';
        }
    }

    isImpersonating() {
        return !!localStorage.getItem('malibu_admin_session');
    }

    revertImpersonation() {
        const adminSession = localStorage.getItem('malibu_admin_session');
        if (adminSession) {
            localStorage.setItem('malibu_session', adminSession);
            localStorage.removeItem('malibu_admin_session');
            window.location.href = '?page=users';
        }
    }
}

const auth = new AuthService();
export default auth;
