import storage from './StorageService.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.profile = null;
    }

    async fetchProfile(userId) {
        if (!storage.supabase) {
            console.warn("Supabase client not initialized.");
            return null;
        }

        try {
            // 1) Logar explicitamente o resultado do fetchProfile
            // 2) Sem .single(), sem timeout manual, sem fallback automático
            const { data, error } = await storage.supabase
                .from('clients')
                .select('*')
                .eq('userId', userId);

            console.log({ profileData: data, profileError: error });

            const profile = data && data.length > 0 ? data[0] : null;

            // 3) Garantir o fluxo solicitado
            if (!profile) {
                console.log("No profile found");
                this.setProfile(null);
                this.stopLoading();
            }

            return profile;
        } catch (err) {
            // Erro de perfil NÃO pode bloquear renderização
            console.error("fetchProfile critical error (non-blocking):", err);
            this.stopLoading();
            return null;
        }
    }

    setProfile(profile) {
        this.profile = profile;
        console.log("Profile state updated:", profile);
    }

    stopLoading() {
        console.log("Loading stopped.");
    }

    async init() {
        // Check for admin user presence
        const users = await storage.getAll('users');
        const adminExists = users.find(u => u.email === 'ivanrossi@outlook.com');

        if (!adminExists) {
            await storage.add('users', {
                name: 'Ivan Rossi',
                email: 'ivanrossi@outlook.com',
                password: 'admin', // Atualizado para um padrão mais fácil
                role: 'admin',
                status: 'ativo',
                createdAt: new Date().toISOString()
            });
            console.log("Admin user created.");
        } else if (adminExists.password === 'ivanross') {
            // Força a atualização da senha antiga para admin
            adminExists.password = 'admin';
            await storage.put('users', adminExists);
            console.log("Admin password updated to 'admin'.");
        }

        // Check for active session in localStorage/storage
        const session = localStorage.getItem('malibu_session');
        if (session) {
            try {
                const userData = JSON.parse(session);
                const user = await storage.getById('users', userData.id);
                if (user && user.status === 'ativo') {
                    this.currentUser = user;

                    // Isolar o problema: Logar o perfil explicitamente durante o init
                    console.log(`[Diagnostic] Buscando perfil para id: ${user.id}`);
                    await this.fetchProfile(user.id);
                } else {
                    localStorage.removeItem('malibu_session');
                }
            } catch (e) {
                localStorage.removeItem('malibu_session');
            }
        }
    }

    async login(email, password) {
        const users = await storage.getAll('users');
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) throw new Error("Credenciais inválidas.");
        if (user.status !== 'ativo') throw new Error(`Conta ${user.status}.`);

        this.currentUser = user;
        localStorage.setItem('malibu_session', JSON.stringify({ id: user.id, email: user.email }));
        return user;
    }

    async register(userData) {
        const users = await storage.getAll('users');
        if (users.find(u => u.email === userData.email)) {
            throw new Error("Email já cadastrado.");
        }

        const newUser = {
            name: userData.name,
            email: userData.email,
            password: userData.password,
            role: 'user',
            status: 'ativo',
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
        return this.currentUser && this.currentUser.role === 'admin';
    }

    async impersonate(targetUserId) {
        if (!this.isAdmin()) throw new Error("Apenas administradores podem acessar contas de clientes.");

        const users = await storage.getAll('users');
        const targetUser = users.find(u => String(u.id) === String(targetUserId));

        if (!targetUser) throw new Error("Usuário não encontrado.");
        if (targetUser.role === 'admin') throw new Error("Não é possível assumir a conta de outro administrador.");

        // Salvar a sessão atual do admin como backup
        localStorage.setItem('malibu_admin_session', localStorage.getItem('malibu_session'));

        // Logar como o cliente
        localStorage.setItem('malibu_session', JSON.stringify({ id: targetUser.id, email: targetUser.email }));
        window.location.href = '?page=client_dashboard';
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
