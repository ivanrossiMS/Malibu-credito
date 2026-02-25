/**
 * StorageService - Abstraction for IndexedDB
 */

const SUPABASE_URL = 'https://hfavkgsghlqgdqfckwce.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmYXZrZ3NnaGxxZ2RxZmNrd2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTI0NTgsImV4cCI6MjA4NzU2ODQ1OH0.CUCb6zd9MMAm4LddDeDhj1tYo-M-FoXi59kJjaILG28';

// Fallback if supabase is not available via script tag
let supabase;
if (typeof window !== 'undefined' && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

class StorageService {
    constructor() {
        this.dbName = 'MalibuCreditoDB';
        this.dbVersion = 4; // Bumped version for notifications
        this.db = null;
        this.supabase = supabase;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error("Database error: " + event.target.errorCode);
                reject(event.target.errorCode);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const transaction = event.target.transaction;

                // Users store
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                    userStore.createIndex('email', 'email', { unique: true });
                }

                // Clients store
                let clientStore;
                if (!db.objectStoreNames.contains('clients')) {
                    clientStore = db.createObjectStore('clients', { keyPath: 'id', autoIncrement: true });
                    clientStore.createIndex('cpf_cnpj', 'cpf_cnpj', { unique: false }); // Changed to false
                    clientStore.createIndex('name', 'name', { unique: false });
                } else {
                    clientStore = transaction.objectStore('clients');
                    // Modify index if it exists and version changed
                    if (clientStore.indexNames.contains('cpf_cnpj')) {
                        const index = clientStore.index('cpf_cnpj');
                        if (index.unique) {
                            clientStore.deleteIndex('cpf_cnpj');
                            clientStore.createIndex('cpf_cnpj', 'cpf_cnpj', { unique: false });
                        }
                    }
                }

                // Loans store
                if (!db.objectStoreNames.contains('loans')) {
                    const loanStore = db.createObjectStore('loans', { keyPath: 'id', autoIncrement: true });
                    loanStore.createIndex('clientId', 'clientId', { unique: false });
                    loanStore.createIndex('status', 'status', { unique: false });
                }

                // Installments store
                if (!db.objectStoreNames.contains('installments')) {
                    const installmentStore = db.createObjectStore('installments', { keyPath: 'id', autoIncrement: true });
                    installmentStore.createIndex('loanId', 'loanId', { unique: false });
                    installmentStore.createIndex('dueDate', 'dueDate', { unique: false });
                    installmentStore.createIndex('status', 'status', { unique: false });
                }

                // Payments store
                if (!db.objectStoreNames.contains('payments')) {
                    const paymentStore = db.createObjectStore('payments', { keyPath: 'id', autoIncrement: true });
                    paymentStore.createIndex('installmentId', 'installmentId', { unique: false });
                }

                // Templates store
                if (!db.objectStoreNames.contains('templates')) {
                    db.createObjectStore('templates', { keyPath: 'id', autoIncrement: true });
                }

                // Loan Requests store
                if (!db.objectStoreNames.contains('loan_requests')) {
                    const requestStore = db.createObjectStore('loan_requests', { keyPath: 'id', autoIncrement: true });
                    requestStore.createIndex('clientId', 'clientId', { unique: false });
                    requestStore.createIndex('status', 'status', { unique: false });
                }

                // Sessions / Local Config (could also be in localStorage, but for uniformity...)
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                // Notifications store
                if (!db.objectStoreNames.contains('notifications')) {
                    const notifyStore = db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
                    notifyStore.createIndex('clientId', 'clientId', { unique: false });
                    notifyStore.createIndex('read', 'read', { unique: false });
                }
            };
        });
    }

    // Generic CRUD operations
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getById(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearDatabase() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.deleteDatabase(this.dbName);
            req.onsuccess = () => {
                localStorage.clear();
                sessionStorage.clear();
                resolve();
            };
            req.onerror = () => reject(new Error("Erro ao excluir banco de dados."));
            req.onblocked = () => {
                alert("Por favor, feche as outras abas do sistema para completar a restauração.");
                reject(new Error("Database blocked"));
            };
        });
    }

    async clearStores(storeNames) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeNames, "readwrite");

            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);

            for (const storeName of storeNames) {
                const store = transaction.objectStore(storeName);
                store.clear();
            }
        });
    }

    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async query(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

const storage = new StorageService();
export default storage;
