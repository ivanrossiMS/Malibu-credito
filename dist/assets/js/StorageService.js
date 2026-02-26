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
        const { data, error } = await this.supabase
            .from(storeName)
            .select('*');
        if (error) {
            console.error(`Supabase getAll error (${storeName}):`, error);
            return [];
        }
        return this.toCamelCase(data);
    }

    async getById(storeName, id) {
        if (!this.supabase) return null;
        const { data, error } = await this.supabase
            .from(storeName)
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            console.error(`Supabase getById error (${storeName}, ${id}):`, error);
            return null;
        }
        return this.toCamelCase(data);
    }

    async add(storeName, data) {
        if (!this.supabase) return null;

        // Sanitização de payload extrema: O JS do Supabase converte chaves para snake_case.
        // Contudo, as tabelas originais do projeto não seguem snake_case (possuem `clientid`).
        // Precisamos prevenir envios excedentes e reverter as formatações não mapeadas pelo banco.
        const payload = this.toSnakeCase(data);

        // [RESILIÊNCIA DE BANCO] - Injetar duplicatas para colunas legadas
        // O banco possui colunas como `clientid` e `client_id`. O Supabase FK depende de `clientid`.
        if (payload.client_id) payload.clientid = payload.client_id;
        if (payload.loan_id) payload.loanid = payload.loan_id;
        if (payload.installment_id) payload.installmentid = payload.installment_id;

        delete payload.client;
        delete payload.loan;
        delete payload.installment;
        delete payload.type; // Request frontend prop

        // Se a tabela é estritamente loan_requests (Schema Rígido de 4 Colunas), limitamos o payload.
        if (storeName === 'loan_requests') {
            const pureRequest = {
                clientid: data.clientid || data.clientId || data.client_id,
                amount: data.amount,
                status: data.status || 'pendente',
                installments: data.installments || 1,
                frequency: data.frequency || '',
                description: data.description || '',
                created_at: data.created_at || data.createdAt || new Date().toISOString()
            };

            const reqResponse = await this.supabase.from(storeName).insert([pureRequest]).select();

            if (reqResponse.error) {
                console.error(`Supabase add error (${storeName}):`, JSON.stringify(reqResponse.error, null, 2));
                throw new Error(`${reqResponse.error.code} - ${reqResponse.error.message} \nHint: ${reqResponse.error.hint}\nDetails: ${reqResponse.error.details}`);
            }
            return reqResponse.data[0]?.id || reqResponse.data[0];
        }

        const { data: result, error } = await this.supabase
            .from(storeName)
            .insert([payload])
            .select();

        if (error) {
            console.error(`Supabase add error (${storeName}):`, JSON.stringify(error, null, 2));
            throw new Error(`${error.code} - ${error.message} \nHint: ${error.hint}\nDetails: ${error.details}`);
        }
        return result[0]?.id || result[0];
    }

    async put(storeName, data) {
        if (!this.supabase) return null;
        const { data: result, error } = await this.supabase
            .from(storeName)
            .upsert([this.toSnakeCase(data)])
            .select();
        if (error) {
            console.error(`Supabase put error (${storeName}):`, error);
            throw error;
        }
        return result[0]?.id || result[0];
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

        if (options.eq) {
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

            console.error(`Supabase getAdvanced error (${storeName}):`, error);
            return [];
        }
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
