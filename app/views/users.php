<?php
/**
 * Users Admin View
 */
?>
<div class="space-y-6 fade-in">

  <!-- HEADER -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-black tracking-tight text-slate-900 font-heading">Gestão de Usuários</h1>
      <p class="text-slate-500 font-medium mt-1">Aprovação e controle de acesso ao sistema.</p>
    </div>
  </div>

  <!-- STATS ROW -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div class="premium-card p-5">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
          <i data-lucide="user-check" class="w-4 h-4 text-emerald-600"></i>
        </div>
      </div>
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativos</p>
      <h3 id="stat-users-active" class="text-2xl font-black text-slate-900">0</h3>
    </div>
    <div class="premium-card p-5">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
          <i data-lucide="user-x" class="w-4 h-4 text-slate-600"></i>
        </div>
      </div>
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bloqueados</p>
      <h3 id="stat-users-blocked" class="text-2xl font-black text-slate-900">0</h3>
    </div>
    <div class="premium-card p-5">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
          <i data-lucide="shield" class="w-4 h-4 text-indigo-600"></i>
        </div>
      </div>
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admins</p>
      <h3 id="stat-users-admin" class="text-2xl font-black text-slate-900">0</h3>
    </div>
    <div class="premium-card p-5">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
          <i data-lucide="trash-2" class="w-4 h-4 text-rose-500"></i>
        </div>
      </div>
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Excluídos</p>
      <h3 id="stat-users-rejected" class="text-2xl font-black text-slate-900">0</h3>
    </div>
  </div>

  <!-- TABS & SEARCH BAR -->
  <div class="premium-card overflow-hidden">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-2 gap-2">
      <!-- TABS -->
      <div class="flex overflow-x-auto">
        <button class="user-tab flex-shrink-0 flex items-center gap-2 px-5 py-4 text-xs font-black uppercase tracking-wider border-b-2 border-primary text-primary transition-all" data-tab="ativo">
          <i data-lucide="user-check" class="w-3.5 h-3.5"></i> Ativos
        </button>
        <button class="user-tab flex-shrink-0 flex items-center gap-2 px-5 py-4 text-xs font-black uppercase tracking-wider border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition-all" data-tab="admin">
          <i data-lucide="shield" class="w-3.5 h-3.5"></i> Administradores
        </button>
        <button class="user-tab flex-shrink-0 flex items-center gap-2 px-5 py-4 text-xs font-black uppercase tracking-wider border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition-all" data-tab="bloqueado">
          <i data-lucide="shield-off" class="w-3.5 h-3.5"></i> Bloqueados
        </button>
        <button class="user-tab flex-shrink-0 flex items-center gap-2 px-5 py-4 text-xs font-black uppercase tracking-wider border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition-all" data-tab="rejeitado">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Excluídos
        </button>
      </div>
      <!-- SEARCH -->
      <div class="relative px-4 pb-2 sm:pb-0 sm:px-4 min-w-[220px]">
        <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-7 top-1/2 -translate-y-1/2 sm:top-auto sm:translate-y-0 sm:top-3 pointer-events-none"></i>
        <input id="users-search" type="text" placeholder="Buscar usuário..." oninput="usersModule?.filterBySearch(this.value)" class="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 placeholder:text-slate-400 outline-none focus:border-primary transition-colors">
      </div>
    </div>

    <!-- TABLE -->
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-slate-50 border-b border-slate-100">
          <tr>
            <th class="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
            <th class="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Email</th>
            <th class="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Autorização</th>
            <th class="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Cargo</th>
            <th class="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Cadastro</th>
            <th class="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
          </tr>
        </thead>
        <tbody id="users-list" class="divide-y divide-slate-50">
          <!-- Loaded via JS -->
          <tr>
            <td colspan="6" class="px-6 py-12 text-center text-slate-400">
              <div class="flex flex-col items-center gap-2">
                <i data-lucide="loader-2" class="w-6 h-6 animate-spin text-slate-300"></i>
                <p class="text-xs font-bold">Carregando...</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- EMPTY STATE (hidden, shown by JS) -->
    <div id="users-empty" class="hidden py-16 text-center">
      <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <i data-lucide="users" class="w-6 h-6 text-slate-300"></i>
      </div>
      <h3 class="text-slate-700 font-black text-sm">Nenhum usuário encontrado</h3>
      <p class="text-slate-400 text-xs mt-1">Tente outra aba ou busca.</p>
    </div>
  </div>
</div>
