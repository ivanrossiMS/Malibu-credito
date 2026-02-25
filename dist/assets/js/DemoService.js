import storage from './StorageService.js';
import loanService from './LoanService.js';

class DemoService {
    constructor() {
        this.firstNames = ['Ana', 'Carlos', 'João', 'Maria', 'Pedro', 'Lucas', 'Mariana', 'Beatriz', 'Rafael', 'Fernanda', 'Diego', 'Camila', 'Thiago', 'Juliana', 'Ricardo', 'Leticia', 'Bruno', 'Amanda', 'Felipe', 'Carolina'];
        this.lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa'];
        this.streets = ['Rua das Flores', 'Av. Brasil', 'Rua do Comércio', 'Praça da Matriz', 'Av. Paulista', 'Rua Augusta', 'Av. Atlântica', 'Rua Direita', 'Av. Sete de Setembro', 'Rua da Consolação'];
        this.cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador', 'Fortaleza', 'Recife', 'Brasília', 'Goiânia'];
        this.states = ['SP', 'RJ', 'MG', 'PR', 'RS', 'BA', 'CE', 'PE', 'DF', 'GO'];
    }

    getRandomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getRandomPhone() {
        const ddd = this.getRandomInt(11, 99);
        const prefix = this.getRandomInt(90000, 99999);
        const suffix = this.getRandomInt(1000, 9999);
        return `(${ddd}) ${prefix}-${suffix}`;
    }

    async generate() {
        console.log("Generating dynamic demo data...");

        // Generate 3 to 6 random clients
        const numClients = this.getRandomInt(3, 6);
        const savedClients = [];

        for (let i = 0; i < numClients; i++) {
            const firstName = this.getRandomItem(this.firstNames);
            const lastName = this.getRandomItem(this.lastNames);
            const name = `${firstName} ${lastName}`;
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${this.getRandomInt(1, 9999)}@email.com`;

            const client = {
                name: name,
                email: email,
                phone: this.getRandomPhone(),
                address: `${this.getRandomItem(this.streets)}, ${this.getRandomInt(10, 2000)}`,
                city: this.getRandomItem(this.cities),
                state: this.getRandomItem(this.states),
                status: 'ativo',
                createdAt: new Date(Date.now() - this.getRandomInt(1, 60) * 24 * 60 * 60 * 1000).toISOString()
            };

            const id = await storage.put('clients', client);
            savedClients.push({ ...client, id });
        }

        // Generate 1 to 3 loans per client

        for (const c of savedClients) {
            const numLoans = this.getRandomInt(1, 3);
            for (let j = 0; j < numLoans; j++) {
                const amount = this.getRandomInt(5, 50) * 100; // 500 to 5000
                const numInstallments = this.getRandomItem([3, 6, 9, 12, 18, 24]);
                const interestRate = this.getRandomInt(2, 6); // 2% to 6%

                // create random start date from up to 60 days ago to up to 15 days in future
                const startDateOffset = this.getRandomInt(-60, 15);
                const startDate = new Date();
                startDate.setDate(startDate.getDate() + startDateOffset);
                const startDateStr = startDate.toISOString().split('T')[0];

                const totalInterest = amount * (interestRate / 100) * numInstallments;
                const totalAmount = amount + totalInterest;
                const installmentValue = totalAmount / numInstallments;

                const loanData = {
                    clientId: c.id,
                    amount: amount,
                    interestRate: interestRate,
                    interestType: 'percent',
                    numInstallments: numInstallments,
                    installmentValue: installmentValue,
                    frequency: 'mensal',
                    startDate: startDateStr,
                    notes: 'Gerado via Demonstração Automática',
                    status: 'ativo',
                    createdAt: new Date(Date.now() - this.getRandomInt(1, 10) * 24 * 60 * 60 * 1000).toISOString()
                };

                // Create loan and installments through the service to keep consistency
                await loanService.createLoan(loanData);
            }
        }

        // Make some past installments "paga" randomly and create payment records
        const allInstallments = await storage.getAll('installments');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const inst of allInstallments) {
            const instDate = new Date(inst.dueDate);
            if (instDate < today) {
                const isPaid = Math.random() > 0.3; // 70% chance to be paid if past due
                if (isPaid) {
                    inst.status = 'paga';
                    await storage.put('installments', inst);

                    // Create payment record
                    const paymentDate = new Date(instDate);
                    paymentDate.setDate(paymentDate.getDate() + this.getRandomInt(-5, 2));

                    const payment = {
                        installmentId: inst.id,
                        loanId: inst.loanId,
                        clientId: inst.clientId,
                        amount: inst.amount,
                        paymentDate: paymentDate.toISOString().split('T')[0],
                        method: this.getRandomItem(['pix', 'dinheiro', 'transferencia']),
                        createdAt: paymentDate.toISOString()
                    };
                    await storage.add('payments', payment);
                } else {
                    inst.status = 'atrasada';
                    await storage.put('installments', inst);
                }
            }
        }

        console.log("Demo data generated successfully.");
    }
}

export default new DemoService();
