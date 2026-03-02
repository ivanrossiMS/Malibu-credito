<?php
/**
 * Master User Management View
 * Modern & Centralized control over all system users
 */
?>
<div class="space-y-8">
    <!-- Header Area -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-3xl font-black text-slate-800 font-heading tracking-tight">Gestão de Usuários</h1>
            <p class="text-slate-500 font-medium">Controle total de clientes e administradores em todas as empresas.</p>
        </div>
        <div class="flex items-center gap-3">
            <button onclick="refreshUsers()" class="bg-white hover:bg-slate-50 text-slate-600 font-bold py-3 px-6 rounded-2xl border border-slate-200 shadow-sm transition-all flex items-center gap-2 active:scale-95">
                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                <span class="text-sm">Atualizar Lista</span>
            </button>
        </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- Total Usuários -->
        <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div class="flex items-center gap-4 relative z-10">
                <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <i data-lucide="users" class="w-6 h-6"></i>
                </div>
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Usuários</p>
                    <h3 class="text-2xl font-black text-slate-800 tracking-tight" id="kpi-total-users">0</h3>
                </div>
            </div>
        </div>

        <!-- Administradores -->
        <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div class="flex items-center gap-4 relative z-10">
                <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                    <i data-lucide="shield-check" class="w-6 h-6"></i>
                </div>
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Administradores</p>
                    <h3 class="text-2xl font-black text-slate-800 tracking-tight" id="kpi-total-admins">0</h3>
                </div>
            </div>
        </div>

        <!-- Ativos -->
        <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div class="flex items-center gap-4 relative z-10">
                <div class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                    <i data-lucide="check-circle" class="w-6 h-6"></i>
                </div>
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Usuários Ativos</p>
                    <h3 class="text-2xl font-black text-slate-800 tracking-tight" id="kpi-total-active">0</h3>
                </div>
            </div>
        </div>

        <!-- Bloqueados -->
        <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div class="flex items-center gap-4 relative z-10">
                <div class="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all duration-500">
                    <i data-lucide="user-x" class="w-6 h-6"></i>
                </div>
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Bloqueados</p>
                    <h3 class="text-2xl font-black text-slate-800 tracking-tight" id="kpi-total-blocked">0</h3>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content Card -->
    <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        <!-- Filters Header -->
        <div class="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <i data-lucide="search" class="w-6 h-6 text-white"></i>
                </div>
                <div>
                    <h2 class="text-xl font-black text-slate-800 tracking-tight">Filtros de Pesquisa</h2>
                    <p class="text-slate-500 text-xs font-bold uppercase tracking-widest">Localize qualquer usuário</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto">
                <!-- Search Input -->
                <div class="relative">
                    <i data-lucide="user" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                    <input type="text" id="master-user-search" placeholder="Nome ou E-mail..." 
                        class="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 text-sm">
                </div>

                <!-- Company Filter -->
                <div class="relative">
                    <i data-lucide="building-2" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                    <select id="master-user-company-filter" class="w-full pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 text-sm appearance-none">
                        <option value="all">Todas Empresas</option>
                    </select>
                </div>

                <!-- Role Filter -->
                <div class="relative">
                    <i data-lucide="shield" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                    <select id="master-user-role-filter" class="w-full pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-700 text-sm appearance-none">
                        <option value="all">Todos Cargos</option>
                        <option value="MASTER">Master Admin</option>
                        <option value="ADMIN">Admin Empresa</option>
                        <option value="user">Cliente / Comum</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Table View -->
        <div class="flex-1 overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50/50">
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">Usuário</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">Empresa</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 text-center">Nível</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 text-center">Status</th>
                        <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody id="master-user-list" class="divide-y divide-slate-50">
                    <tr>
                        <td colspan="5" class="px-8 py-20 text-center">
                            <div class="flex flex-col items-center gap-4">
                                <div class="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center animate-pulse">
                                    <i data-lucide="loader-2" class="w-8 h-8 text-slate-200 animate-spin"></i>
                                </div>
                                <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando usuários do sistema...</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Impersonation Reverting Bar Styling (Handled by App.js mostly, but ensuring CSS here just in case) -->
<style>
#impersonation-bar {
    backdrop-filter: blur(10px);
}
</style>
