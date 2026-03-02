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

<!-- Edit User Modal -->
<div id="edit-user-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] hidden flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in">
        <div class="p-8 border-b border-slate-100 flex items-center justify-between">
            <h2 class="text-2xl font-black text-slate-800 font-heading">Editar Administrador</h2>
            <button id="close-edit-modal" class="p-2 hover:bg-slate-100 rounded-xl transition-all"><i data-lucide="x" class="w-6 h-6 text-slate-400"></i></button>
        </div>
        <form id="edit-user-form" class="p-8 space-y-6">
            <input type="hidden" id="edit-user-id">
            <div class="space-y-2">
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input type="text" id="edit-user-name" required class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-700">
            </div>
            <div class="space-y-2">
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de Acesso</label>
                <input type="email" id="edit-user-email" required class="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-slate-700">
            </div>
            <div class="pt-4">
                <button type="submit" class="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">SALVAR ALTERAÇÕES</button>
            </div>
        </form>
    </div>
</div>
