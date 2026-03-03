/**
 * StorageService - 100% Supabase (Online Only)
 */

const SUPABASE_URL = 'https://hfavkgsghlqgdqfckwce.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmYXZrZ3NnaGxxZ2RxZmNrd2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTI0NTgsImV4cCI6MjA4NzU2ODQ1OH0.CUCb6zd9MMAm4LddDeDhj1tYo-M-FoXi59kJjaILG28';

let supabase;
if (typeof window !== 'undefined' && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

class StorageService {
    constructor() {
        this.supabase = supabase;
    }

    // Helper to convert camelCase to snake_case
    toSnakeCase(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(v => this.toSnakeCase(v));

        const newObj = {};
        Object.keys(obj).forEach(key => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            newObj[snakeKey] = this.toSnakeCase(obj[key]);
        });
        return newObj;
    }

    // Helper to convert snake_case to camelCase
    toCamelCase(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(v => this.toCamelCase(v));

        const newObj = {};
        Object.keys(obj).forEach(key => {
            const camelKey = key.replace(/(_\w)/g, m => m[1].toUpperCase());
            newObj[camelKey] = this.toCamelCase(obj[key]);
        });
        return newObj;
    }

    async init() {
        // Agora o init é apenas informativo, pois não há IndexedDB para abrir
        console.log("Storage initialized with Supabase (Direct Access Mode)");
        return Promise.resolve(true);
    }

    async getAll(storeName) {
        if (!this.supabase) return [];
        let query = this.supabase.from(storeName).select('*');

        // [MULTI-TENANCY] Injetar filtro de empresa se não for MASTER
        const companyId = this.getContextCompanyId();
        if (companyId) {
            query = this.applyMultiTenancy(query, storeName, companyId);
        }

        const { data, error } = await query;
        if (error) {
            // [TRANSITION LOGIC] Se a coluna company_id não existir ainda, fazemos o fallback para a query completa
            if ((error.code === 'PGRST204' || error.code === '42703') && companyId) {
                console.warn(`Fallback: Tabela ${storeName} ainda não possui a coluna company_id. Retornando todos os registros.`);
                const fallback = await this.supabase.from(storeName).select('*');
                return this.toCamelCase(fallback.data || []);
            }
            console.error(`Supabase getAll error (${storeName}):`, error);
            return [];
        }
        return this.toCamelCase(data);
    }

    async getById(storeName, id) {
        if (!this.supabase) return null;

        const queryWithoutCompany = this.supabase.from(storeName).select('*').eq('id', id).single();
        let query = this.supabase.from(storeName).select('*').eq('id', id);

        // [MULTI-TENANCY] Injetar filtro de empresa se não for MASTER
        const companyId = this.getContextCompanyId();
        if (companyId) {
            query = this.applyMultiTenancy(query, storeName, companyId);
        }

        try {
            const { data, error } = await query.single();
            if (error) {
                // FALLBACK: Se houver erro de coluna inexistente (PGRST204 ou 42703), tenta sem companyId
                if (error.code === 'PGRST204' || error.code === '42703') {
                    console.warn(`Fallback Seguro: Coluna company_id não existe em ${storeName}. Tentando sem filtro.`);
                    const { data: retryData, error: retryError } = await queryWithoutCompany;
                    if (retryError) throw retryError;
                    return retryData ? this.toCamelCase(retryData) : null;
                }
                throw error;
            }
            return data ? this.toCamelCase(data) : null;
        } catch (error) {
            console.error(`Supabase getById error (${storeName}, ${id}):`, error);
            return null;
        }
    }

    async logAction(action, module, details = null) {
        if (!this.supabase) return;

        try {
            const session = localStorage.getItem('malibu_session');
            let userId = null;
            let userEmail = 'Sistema';
            let companyId = this.getContextCompanyId();

            if (session) {
                const userData = JSON.parse(session);
                userId = userData.id || userData.uuid;
                userEmail = userData.email;
            }

            const payload = {
                company_id: companyId,
                user_id: (userId && userId.length > 20) ? userId : null, // UUID check
                user_email: userEmail,
                action: action,
                module: module,
                details: details ? JSON.stringify(details) : null,
                created_at: new Date().toISOString()
            };

            const { error } = await this.supabase.from('system_logs').insert([payload]);
            if (error && error.code !== 'PGRST205' && error.message?.indexOf('system_logs') === -1) {
                console.warn("Silent Log Error:", error);
            }
        } catch (e) {
            console.warn("Log Exception:", e);
        }
    }

    // Helper para obter o companyId do contexto global
    getContextCompanyId() {
        const session = localStorage.getItem('malibu_session');
        if (!session) return null;

        try {
            const userData = JSON.parse(session);
            // Se for o MASTER global (ivanrossi), ignoramos o filtro de empresa para ele ver tudo
            if (userData.email === 'ivanrossi@outlook.com') return null;

            // Caso contrário, usamos o companyId salvo na sessão
            return userData.companyId || userData.company_id || null;
        } catch (e) {
            return null;
        }
    }

    applyMultiTenancy(query, storeName, companyId) {
        if (!companyId) return query;
        // Na tabela de empresas, filtramos pelo ID da própria empresa
        if (storeName === 'companies') return query.eq('id', companyId);
        // Nas demais, filtramos pela coluna company_id
        return query.eq('company_id', companyId);
    }

    async add(storeName, data) {
        if (!this.supabase) return null;
        let payload = this.preparePayload(storeName, data);

        if (data.id === null || data.id === undefined || data.id === '') {
            delete payload.id;
        }
        // ... (rest of logic legacy from previous edits preserved implicitly)

        // Property mapping logic handled in preparePayload

        const { data: result, error } = await this.supabase
            .from(storeName)
            .insert([payload])
            .select();

        if (error) {
            console.error(`Supabase add error (${storeName}):`, JSON.stringify(error, null, 2));
            throw new Error(`${error.code} - ${error.message}`);
        }

        // AUTO-LOG
        this.logAction('CREATE', storeName.toUpperCase(), { id: result[0]?.id, data: payload });

        return result[0]?.id || result[0];
    }

    async put(storeName, data) {
        if (!this.supabase) return null;
        const payload = this.preparePayload(storeName, data);
        const { data: result, error } = await this.supabase
            .from(storeName)
            .upsert([payload])
            .select();
        if (error) {
            console.error(`Supabase put error (${storeName}):`, error);
            throw error;
        }

        // AUTO-LOG
        this.logAction('UPDATE', storeName.toUpperCase(), { id: data.id, data: payload });

        return result[0]?.id || result[0];
    }

    // Helper para padronizar o payload antes de enviar ao Supabase
    preparePayload(storeName, data) {
        const payload = this.toSnakeCase(data);

        // [MULTI-TENANCY] Injetar company_id automaticamente se não fornecido
        if (!payload.company_id && storeName !== 'companies') {
            const ctxCompanyId = this.getContextCompanyId();
            if (ctxCompanyId) {
                payload.company_id = ctxCompanyId;
            }
        }

        // Mapeamentos específicos por tabela (Legado + Transição)
        if (storeName === 'loans') {
            const targetClientId = data.clientid || data.clientId || data.client_id;
            if (targetClientId) {
                payload.clientid = targetClientId;
                payload.client_id = targetClientId;
            }
        }

        if (storeName === 'installments') {
            const targetLoanId = data.loanid || data.loanId || data.loan_id;
            if (targetLoanId) {
                payload.loanid = targetLoanId;
                payload.loan_id = targetLoanId;
            }

            const targetVal = data.installmentValue || data.installment_value || data.amount;
            if (targetVal) payload.amount = targetVal;

            const targetDueDate = data.due_date || data.dueDate || data.duedate;
            if (targetDueDate) payload.due_date = targetDueDate;
        }

        return payload;
    }

    async delete(storeName, id) {
        if (!this.supabase) return false;
        const { error } = await this.supabase
            .from(storeName)
            .delete()
            .eq('id', id);
        if (error) {
            console.error(`Supabase delete error (${storeName}, ${id}):`, error);
            return false;
        }

        // AUTO-LOG
        this.logAction('DELETE', storeName.toUpperCase(), { id: id });

        return true;
    }

    async query(storeName, indexName, value) {
        if (!this.supabase) return [];
        const dbColumn = indexName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        const { data, error } = await this.supabase.from(storeName).select('*').eq(dbColumn, value);
        if (error) {
            console.error(`Supabase query error (${storeName}, ${indexName}):`, error);
            return [];
        }
        return this.toCamelCase(data);
    }

    // Novos métodos de Alta Performance (PostgREST Direct)
    async getAdvanced(storeName, options = {}) {
        if (!this.supabase) return [];
        const selectQuery = options.select || '*';
        let query = this.supabase.from(storeName).select(selectQuery);

        // [MULTI-TENANCY] Injetar filtro de empresa se não for MASTER
        const companyId = this.getContextCompanyId();
        if (companyId) {
            query = this.applyMultiTenancy(query, storeName, companyId);
        }

        if (options.eq) {
            // ...
            for (const [key, val] of Object.entries(options.eq)) {
                const dbCol = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                query = query.eq(dbCol, val);
            }
        }

        if (options.in) {
            for (const [key, val] of Object.entries(options.in)) {
                const dbCol = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                query = query.in(dbCol, val);
            }
        }

        if (options.gte) {
            for (const [key, val] of Object.entries(options.gte)) {
                const dbCol = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                query = query.gte(dbCol, val);
            }
        }

        if (options.lte) {
            for (const [key, val] of Object.entries(options.lte)) {
                const dbCol = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                query = query.lte(dbCol, val);
            }
        }

        if (options.order) {
            const dbCol = options.order.column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            query = query.order(dbCol, { ascending: options.order.ascending ?? true });
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) {
            // [TRANSITION LOGIC] Se a coluna company_id não existir ainda, fazemos o fallback para a query completa
            if ((error.code === 'PGRST204' || error.code === '42703') && companyId) {
                console.warn(`Fallback Advanced: Tabela ${storeName} ainda não possui a coluna company_id.`);
                let retryQuery = this.supabase.from(storeName).select(selectQuery);
                // Re-aplicar outros filtros exceto company_id
                if (options.limit) retryQuery = retryQuery.limit(options.limit);
                const fallback = await retryQuery;
                return this.toCamelCase(fallback.data || []);
            }

            // [FALLBACK DO SISTEMA ANTI-TELA-BRANCA]
            // Se o PostgREST acusar PGRST200 (Falha de Relacionamento/FK), mas estávamos pedindo um JOIN,
            // cancelamos a árvore e enviamos a lista Plana para não quebrar a UI.
            if (error.code === 'PGRST200' && selectQuery !== '*') {
                console.warn(`Fallback Seguro: Join Falhou (${storeName}). Retornando à Carga Simples (Modo Degradado).`);

                let retryQuery = this.supabase.from(storeName).select('*');
                if (options.eq) { Object.entries(options.eq).forEach(([k, v]) => retryQuery = retryQuery.eq(k.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`), v)); }
                if (options.limit) { retryQuery = retryQuery.limit(options.limit); }

                const fallback = await retryQuery;
                return this.toCamelCase(fallback.data || []);
            }

            if (error.code === 'PGRST205') {
                console.warn(`Tabela não encontrada: ${storeName}. Certifique-se de executar os scripts de migração SQL.`);
                return { _error: 'TABLE_NOT_FOUND', store: storeName };
            }

            console.error(`Supabase getAdvanced error (${storeName}):`, error);
            return [];
        }
        return this.toCamelCase(data);
    }

    // Realtime Support
    subscribe(table, event, callback, filter = null) {
        if (!this.supabase) return null;

        let channelName = `public:${table}`;
        if (filter) channelName += `:${filter.column}=eq.${filter.value}`;

        const channel = this.supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: event, // '*', 'INSERT', 'UPDATE', 'DELETE'
                    schema: 'public',
                    table: table,
                    filter: filter ? `${filter.column}=eq.${filter.value}` : undefined
                },
                (payload) => {
                    callback(this.toCamelCase(payload.new || payload.old));
                }
            )
            .subscribe();

        return channel;
    }

    async unsubscribe(channel) {
        if (channel) {
            await this.supabase.removeChannel(channel);
        }
    }

    // Edge Functions Support
    async invoke(functionName, body = {}) {
        if (!this.supabase) throw new Error("Supabase client not initialized.");
        const { data, error } = await this.supabase.functions.invoke(functionName, {
            body: body
        });
        if (error) throw error;
        return this.toCamelCase(data);
    }

    // Métodos legados mantidos apenas para evitar quebra de código que ainda os chame
    async syncStoreToSupabase() { return Promise.resolve(); }
    async syncSupabaseToLocal() { return Promise.resolve(); }

    async clearStores(storeNames) {
        if (!this.supabase) return;
        for (const storeName of storeNames) {
            // Em RDBMS nativo, delete() sem filtro não é permitido por segurança.
            const { error } = await this.supabase.from(storeName).delete().not('id', 'is', null);
            if (error) {
                console.error(`Erro ao limpar tabela ${storeName}:`, error);
            }
        }
    }

    async clearDatabase() {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    }
}

const storage = new StorageService();
export default storage;
