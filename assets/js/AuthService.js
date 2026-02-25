import storage from './StorageService.js';

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

        // Check for admin user presence
        const users = await storage.getAll('users');
        const adminExists = users.find(u => u.email === 'ivanrossi@outlook.com');

        if (!adminExists) {
            await storage.add('users', {
                name: 'Ivan Rossi',
                email: 'ivanrossi@outlook.com',
                password: 'admin',
                role: 'admin',
                status: 'ativo',
                createdAt: new Date().toISOString()
            });
            console.log("Admin user created.");
        }

        // Check for active session
        const session = localStorage.getItem('malibu_session');
        console.log("AUTH STATE:", session ? JSON.parse(session) : null);

        if (session) {
            try {
                const userData = JSON.parse(session);
                let user = await storage.getById('users', userData.id);

                // Se não achou local, tenta puxar do Supabase antes de desistir
                if (!user && storage.supabase) {
                    await storage.syncSupabaseToLocal('users');
                    user = await storage.getById('users', userData.id);
                }

                if (user && user.status === 'ativo') {
                    this.currentUser = user;

                    // Inicia busca do perfil de forma assíncrona para não travar o init
                    this.fetchProfile(user.id).catch(e => console.error("Async profile fetch error:", e));

                    // Sincroniza dados locais com Supabase (caso existam usuários/clientes locais novos)
                    storage.syncStoreToSupabase('users');
                    storage.syncStoreToSupabase('clients');
                } else {
                    localStorage.removeItem('malibu_session');
                }
            } catch (e) {
                localStorage.removeItem('malibu_session');
            }
        } else if (storage.supabase) {
            // Se não tem sessão, tenta puxar usuários do Supabase de qualquer forma
            // para garantir que novos usuários cadastrados em outro local possam logar
            storage.syncSupabaseToLocal('users').catch(e => console.error("Async user pull error:", e));
        }

        this.authLoading = false;
        console.log("AUTH LOADING:", this.authLoading);
    }

    async login(email, password) {
        let users = await storage.getAll('users');
        let user = users.find(u => u.email === email && u.password === password);

        // Se não achou localmente, tenta puxar os usuários do Supabase e tenta de novo
        if (!user && storage.supabase) {
            console.log("User not found locally, attempting to sync from Supabase...");
            await storage.syncSupabaseToLocal('users');
            users = await storage.getAll('users');
            user = users.find(u => u.email === email && u.password === password);
        }

        if (!user) throw new Error("Credenciais inválidas.");
        if (user.status !== 'ativo') throw new Error(`Conta ${user.status}.`);

        this.currentUser = user;
        localStorage.setItem('malibu_session', JSON.stringify({ id: user.id, email: user.email }));

        // Sincroniza logo após o login
        storage.syncStoreToSupabase('users');
        storage.syncStoreToSupabase('clients');

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
