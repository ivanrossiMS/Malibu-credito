import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

class StorageService {
    constructor() {
        // ESSAS VARIAVEIS DEVEM SER SUBSTITUIDAS PELAS DE PRODUCAO NO BLOCO C
        const SUPABASE_URL = 'VITE_SUPABASE_URL_AQUI';
        const SUPABASE_KEY = 'VITE_SUPABASE_ANON_KEY_AQUI';

        this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    }

    async init() {
        // Não é mais necessário abrir DB local
        console.log("Supabase inicializado.");
        return this.supabase;
    }

    // Generic CRUD operations mapped to Supabase
    async getAll(storeName) {
        try {
            const { data, error } = await this.supabase
                .from(storeName)
                .select('*');
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error(`Erro getAll no Supabase (${storeName}):`, e);
            throw e;
        }
    }

    async getById(storeName, id) {
        try {
            const { data, error } = await this.supabase
                .from(storeName)
                .select('*')
                .eq('id', id)
                .single();
            // Erro 406 do postgrest significa found no rows para .single(), fallback suave
            if (error && error.code !== 'PGRST116') throw error;
            return data || null;
        } catch (e) {
            console.error(`Erro getById no Supabase (${storeName}):`, e);
            return null; // Fallback silencioso pra não quebrar iteradores map
        }
    }

    async add(storeName, data) {
        try {
            // Remove o ID para que o BD (Supabase Postgres) autoincremente ou use UUID nativo
            const payload = { ...data };
            if (payload.id === undefined || payload.id === null || typeof payload.id === 'string' && payload.id.startsWith('temp-')) {
                delete payload.id;
            }

            const { data: inserted, error } = await this.supabase
                .from(storeName)
                .insert([payload])
                .select()
                .single();
            if (error) throw error;

            // Retorna apenas se o insert funcionou (alguns inserts mockados retornavam ID literal)
            return inserted ? inserted.id : true;
        } catch (e) {
            console.error(`Erro add no Supabase (${storeName}):`, e);
            throw e;
        }
    }

    async put(storeName, data) {
        try {
            if (!data.id) throw new Error("Tentativa de atualizar sem ID");
            const { error } = await this.supabase
                .from(storeName)
                .update(data)
                .eq('id', data.id);
            if (error) throw error;
            return data.id;
        } catch (e) {
            console.error(`Erro put no Supabase (${storeName}):`, e);
            throw e;
        }
    }

    async delete(storeName, id) {
        try {
            const { error } = await this.supabase
                .from(storeName)
                .delete()
                .eq('id', id);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error(`Erro delete no Supabase (${storeName}):`, e);
            throw e;
        }
    }

    async query(storeName, indexName, value) {
        try {
            const { data, error } = await this.supabase
                .from(storeName)
                .select('*')
                .eq(indexName, value);
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error(`Erro query no Supabase (${storeName}):`, e);
            throw e;
        }
    }

    async clearDatabase() {
        // Função perigosa de wipe, num cenário real online vc não pode/não deve dar wipe frontal
        throw new Error("Não é possível limpar o Supabase via frontend por segurança.");
    }
}

const storage = new StorageService();
export default storage;
