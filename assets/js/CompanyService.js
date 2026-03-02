import storage from './StorageService.js';

class CompanyService {
    async getAll() {
        // Como o StorageService agora filtra por empresa automaticamente, 
        // o Master (ivanrossi) verá todas porque o Storage detecta que ele é master e desabilita o filtro.
        return await storage.getAll('companies');
    }

    async getById(id) {
        return await storage.getById('companies', id);
    }

    async save(companyData) {
        if (companyData.id) {
            return await storage.put('companies', companyData);
        } else {
            companyData.createdAt = new Date().toISOString();
            companyData.status = companyData.status || 'bloqueado';
            return await storage.add('companies', companyData);
        }
    }

    async delete(id) {
        // Atenção: Deletar uma empresa deveria ser uma operação protegida ou em cascata.
        // Por ora, vamos apenas desativar ou deletar se não houver vínculos críticos.
        return await storage.delete('companies', id);
    }
}

const companyService = new CompanyService();
export default companyService;
