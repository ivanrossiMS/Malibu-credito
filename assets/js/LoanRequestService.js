import storage from './StorageService.js';

class LoanRequestService {
    async getAll() {
        const requests = await storage.getAll('loan_requests');
        // Enhance with client data
        for (let req of requests) {
            req.client = await storage.getById('clients', req.clientId);
        }
        return requests;
    }

    async getById(id) {
        const req = await storage.getById('loan_requests', id);
        if (req) {
            req.client = await storage.getById('clients', req.clientId);
        }
        return req;
    }

    async save(requestData) {
        if (requestData.id) {
            return await storage.put('loan_requests', requestData);
        }
        requestData.createdAt = new Date().toISOString();
        requestData.status = 'pendente';
        return await storage.add('loan_requests', requestData);
    }

    async updateStatus(id, status) {
        const req = await storage.getById('loan_requests', id);
        if (req) {
            req.status = status;
            await storage.put('loan_requests', req);
        }
    }

    async delete(id) {
        return await storage.delete('loan_requests', id);
    }
}

const loanRequestService = new LoanRequestService();
export default loanRequestService;
