import storage from './StorageService.js';

class ClientService {
    async getAll() {
        return await storage.getAll('clients');
    }

    async getById(id) {
        return await storage.getById('clients', id);
    }

    async getByUserId(userId) {
        const all = await this.getAll();
        return all.find(c => String(c.userId) === String(userId));
    }

    async save(client) {
        if (client.id) {
            return await storage.put('clients', client);
        } else {
            client.createdAt = new Date().toISOString();
            client.status = client.status || 'ativo';
            return await storage.add('clients', client);
        }
    }

    async update(id, updatedData) {
        const client = await this.getById(id);
        if (!client) throw new Error("Cliente não encontrado.");
        Object.assign(client, updatedData);
        return await storage.put('clients', client);
    }

    async delete(id) {
        // In a real app, check for linked loans first
        return await storage.delete('clients', id);
    }

    async search(query) {
        const all = await this.getAll();
        const lowerQuery = query.toLowerCase();
        return all.filter(c =>
            c.name.toLowerCase().includes(lowerQuery) ||
            c.cpf_cnpj.includes(query) ||
            c.email.toLowerCase().includes(lowerQuery)
        );
    }
}

const clientService = new ClientService();
export default clientService;
