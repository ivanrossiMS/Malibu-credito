import storage from './StorageService.js';

class NotificationService {
    async getAllForClient(clientId) {
        return await storage.query('notifications', 'clientId', clientId);
    }

    async getUnreadCount(clientId) {
        const notifications = await this.getAllForClient(clientId);
        return notifications.filter(n => !n.read).length;
    }

    async add(notification) {
        notification.createdAt = new Date().toISOString();
        notification.read = false;
        return await storage.add('notifications', notification);
    }

    async markAsRead(id) {
        const notification = await storage.getById('notifications', id);
        if (notification) {
            notification.read = true;
            await storage.put('notifications', notification);
        }
    }

    async markAllAsRead(clientId) {
        const notifications = await this.getAllForClient(clientId);
        for (let n of notifications) {
            if (!n.read) {
                n.read = true;
                await storage.put('notifications', n);
            }
        }
    }

    async notifyPaymentConfirmed(clientId, amount, date) {
        await this.add({
            clientId,
            type: 'payment_confirmed',
            title: 'Pagamento Confirmado',
            message: `Recebemos seu pagamento de R$ ${parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} referente à parcela de ${DateHelper.formatLocal(date)}.`,
            icon: 'check-circle'
        });
    }

    async notifyLoanApproved(clientId, loanCode) {
        await this.add({
            clientId,
            type: 'loan_approved',
            title: 'Empréstimo Aprovado',
            message: `Seu contrato ${loanCode} foi aprovado! Agora você pode acompanhar as parcelas pelo seu dashboard.`,
            icon: 'award'
        });
    }

    async notifyInstallmentDueTomorrow(clientId, amount, date) {
        await this.add({
            clientId,
            type: 'installment_due',
            title: 'Lembrete de Vencimento',
            message: `Sua parcela de R$ ${parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} vence amanhã (${DateHelper.formatLocal(date)}).`,
            icon: 'calendar'
        });
    }
}

const notificationService = new NotificationService();
export default notificationService;

