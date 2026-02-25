<?php
/**
 * Renegotiation View
 */
?>
<div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-3xl font-bold font-heading">Renegociação de Dívidas</h1>
            <p class="text-slate-500">Crie novos acordos para parcelas em atraso.</p>
        </div>
    </div>

    <div class="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
        <div class="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-primary">
            <i data-lucide="refresh-cw" class="w-10 h-10"></i>
        </div>
        <h2 class="text-2xl font-bold">Módulo em Desenvolvimento</h2>
        <p class="text-slate-500 max-w-md mx-auto">Em breve você poderá selecionar contratos com parcelas vencidas e gerar novos planos de pagamento facilitados para seus clientes.</p>
        <button onclick="window.location.href='?page=installments'" class="bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary/90 transition-all">Ver Parcelas em Atraso</button>
    </div>
</div>
