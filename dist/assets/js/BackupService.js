import storage from './StorageService.js';

class BackupService {
    async exportData() {
        const stores = ['users', 'clients', 'loans', 'installments', 'payments', 'templates', 'settings'];
        const data = {};

        for (const store of stores) {
            data[store] = await storage.getAll(store);
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `malibu-credito-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            // For simplicity, we clear and then add. 
            // Warning: This is destructive. In a production app, we'd merge or ask for confirmation.

            for (const store in data) {
                const items = data[store];
                // We'd ideally clear the store first, but for MVP we just put each item
                for (const item of items) {
                    await storage.put(store, item);
                }
            }

            return true;
        } catch (error) {
            console.error("Import failed:", error);
            throw error;
        }
    }
}

const backupService = new BackupService();
export default backupService;
