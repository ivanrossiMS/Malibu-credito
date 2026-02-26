import storage from './assets/js/StorageService.js';
import loanService from './assets/js/LoanService.js';

(async () => {
    try {
        console.log("=== INICIANDO DEBUG DE LOAN ===");

        // Let's get "MAL-2602-005", its ID.
        const loans = await storage.getAll('loans');
        console.log('Total de emps:', loans.length);
        if (loans.length > 0) console.log('Exemplo 1:', loans[0]);

        const targetLoan = loans.find(l => l.loanCode === 'MAL-2602-005' || l.loan_code === 'MAL-2602-005' || l.loancode === 'MAL-2602-005');

        if (!targetLoan) {
            console.log("Emprestimo não encontrado");
            // The original instruction was to remove the return, but the provided code edit still has the if block.
            // I will remove the return as per the text instruction, but keep the console.log.
            // If the user meant to remove the entire if block, the instruction should have been clearer.
            // Given "Remova a trava que cancelava a execução quando `targetLoan` não era encontrado",
            // removing `return;` is the direct interpretation.
            // The provided `Code Edit` snippet shows the `if (!targetLoan)` block still present,
            // but the `return;` is not explicitly shown within the `{{ ... }}`.
            // I will assume the `return;` should be removed.
            // return; // Removed as per instruction
        }

        console.log("Contrato encontrado:", targetLoan.id, targetLoan.status);

        const installments = await storage.query('installments', 'loanId', targetLoan.id);
        console.log("Parcelas vinculadas encontradas:", installments.length);

        installments.forEach(inst => {
            console.log(`Parcela ${inst.id}: status=${inst.status}, dueDate=${inst.dueDate}`);
        });

        const today = new Date().toISOString().split('T')[0];
        console.log("Data de hoje computada:", today);

        let hasAtrasada = false;
        let allPaid = true;

        for (let inst of installments) {
            if (inst.status === 'pendente' && inst.dueDate < today) {
                console.log(`Parcela ${inst.id} VENCEU. Atualizando...`);
                // inst.status = 'atrasada';
                // delete inst.paidAt;
                // delete inst.paid_at;
                // await storage.put('installments', inst);
            }
            if (inst.status !== 'paga') allPaid = false;
            // logic fix: se ela for virar atrasada
            if (inst.status === 'atrasada' || (inst.status === 'pendente' && inst.dueDate < today)) {
                hasAtrasada = true;
            }
        }

        console.log("allPaid:", allPaid, "hasOverdue:", hasAtrasada);

        // Real check using the function
        console.log("Rodando checkAndUpdateLoanStatus...");
        await loanService.checkAndUpdateLoanStatus(targetLoan.id);

        const finalLoan = await storage.getById('loans', targetLoan.id);
        console.log("Status final do contrato:", finalLoan.status);

    } catch (e) {
        console.error("Erro no debug:", e);
    }
})();
