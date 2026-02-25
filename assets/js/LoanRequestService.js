import storage from './StorageService.js';

class LoanRequestService {
    async getAll() {
        return await storage.getAdvanced('loan_requests', { select: '*, client:clients(*)' });
    }

    async getById(id) {
        const result = await storage.getAdvanced('loan_requests', { select: '*, client:clients(*)', eq: { id: id }, limit: 1 });
        return result.length > 0 ? result[0] : null;
    }

    async save(requestData) {
        if (requestData.id) {
            return await storage.put('loan_requests', requestData);
        }
        if (!requestData.created_at && !requestData.createdAt) {
            requestData.created_at = new Date().toISOString();
        }
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
