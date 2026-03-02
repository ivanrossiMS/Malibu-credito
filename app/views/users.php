<?php
/**
 * Users Admin View
 */
?>
<div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-3xl font-bold font-heading">Gestão de Usuários</h1>
            <p class="text-slate-500">Aprovação e controle de acesso ao sistema.</p>
        </div>
    </div>

    <!-- Users Tabs & Sub-filters -->
    <div class="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 gap-4">
        <div class="flex gap-4">
            <button class="user-tab px-4 py-3 font-bold text-slate-400 hover:text-slate-600 transition-all" data-tab="rejeitado">Excluídos</button>
            <button class="user-tab px-4 py-3 font-bold text-primary border-b-2 border-primary transition-all" data-tab="ativo">Ativos</button>
            <button class="user-tab px-4 py-3 font-bold text-slate-400 hover:text-slate-600 transition-all" data-tab="bloqueado">Bloqueados</button>
            <button class="user-tab px-4 py-3 font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-2 transition-all relative" data-tab="admin">
                Administradores
            </button>
        </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead class="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Usuário</th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Email</th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Cadastro</th>
                        <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                </thead>
                <tbody id="users-list" class="divide-y divide-slate-50">
                    <!-- Loaded via JS -->
                </tbody>
            </table>
        </div>
    </div>
</div>

</div>
