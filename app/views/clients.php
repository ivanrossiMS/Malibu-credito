<?php
/**
 * Clients View
 */
?>
<div class="space-y-10 fade-in">
    <!-- Premium Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
            <h1 class="text-4xl font-black text-slate-900 tracking-tight font-heading">Clientes</h1>
            <p class="text-slate-500 font-medium">Gestão inteligente da sua base de devedores e parceiros.</p>
        </div>
        <button id="add-client-btn" class="bg-gradient-to-r from-primary to-primary-light hover:shadow-primary/30 text-white px-8 py-4 rounded-[1.5rem] shadow-xl transition-all font-black flex items-center gap-3 uppercase tracking-widest text-xs hover:-translate-y-1 active:scale-95">
            <i data-lucide="user-plus" class="w-5 h-5"></i>
            <span>Novo Cliente</span>
        </button>
    </div>

    <!-- Search and Filters: Refined UI -->
    <div class="premium-card p-4 flex flex-col md:flex-row gap-4">
        <div class="relative flex-1">
            <i data-lucide="search" class="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
            <input type="text" id="client-search" placeholder="Buscar por nome, CPF ou email..." 
                class="w-full pl-12 pr-6 py-4 bg-slate-50/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-400">
        </div>
        <div class="relative min-w-[220px]">
            <select id="client-city-filter" class="w-full bg-slate-50/50 hover:bg-slate-100 border-none rounded-2xl px-6 py-4 outline-none cursor-pointer text-slate-600 font-black uppercase tracking-widest text-[10px] transition-all appearance-none text-ellipsis">
                <option value="all">Todas Cidades</option>
            </select>
            <i data-lucide="map-pin" class="w-4 h-4 text-primary absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
        </div>
        <div class="relative min-w-[220px]">
            <select id="client-status-filter" class="w-full bg-slate-50/50 hover:bg-slate-100 border-none rounded-2xl px-6 py-4 outline-none cursor-pointer text-slate-600 font-black uppercase tracking-widest text-[10px] transition-all appearance-none">
                <option value="">Todos os Status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="bloqueado">Bloqueado</option>
            </select>
            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
        </div>
    </div>

    <!-- Clients Table/Grid: Premium Finish -->
    <div class="premium-card overflow-hidden">
        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50/50 border-b border-slate-100">
                        <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                        <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Cidade</th>
                        <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Contato Principal</th>
                        <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                </thead>
                <tbody id="clients-list" class="divide-y divide-slate-50">
                    <!-- Loaded via JS with premium row styles -->
                    <tr>
                        <td colspan="5" class="px-8 py-32 text-center">
                             <div class="flex flex-col items-center gap-4 opacity-30">
                                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center animate-spin">
                                    <i data-lucide="loader-2" class="w-8 h-8 text-primary"></i>
                                </div>
                                <p class="text-xs font-black uppercase tracking-widest">Carregando carteira...</p>
                             </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Add/Edit Modal (Template) -->
<div id="client-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] hidden flex items-center justify-center p-4 sm:p-6">
    <div class="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden scale-95 transition-transform duration-300 flex flex-col max-h-[100dvh] sm:max-h-[90vh]">
        <!-- Header fixo modernizado com glassmorphism e cores vibrantes -->
        <div class="bg-slate-900 p-8 sm:p-10 relative overflow-hidden flex-shrink-0">
            <!-- Decorative blobs -->
            <div class="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl"></div>
            <div class="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl"></div>
            
            <div class="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-6 text-white">
                <div class="flex items-center gap-5">
                    <div class="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30 border border-white/10 shrink-0">
                        <i data-lucide="user-cog" class="w-8 h-8 text-white"></i>
                    </div>
                    <div>
                        <h2 class="text-3xl font-black font-heading tracking-tight" id="modal-title">Novo Cliente</h2>
                        <p class="text-sm font-medium text-slate-300 mt-1">Gerencie os dados cadastrais deste cliente de forma simplificada</p>
                    </div>
                </div>
                <!-- Premium Close Button -->
                <button type="button" class="close-modal group flex items-center justify-center w-12 h-12 rounded-full bg-white/5 hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-500/30 border border-white/10 transition-all duration-300 transform hover:scale-105" title="Fechar sem salvar">
                    <i data-lucide="x" class="w-5 h-5 text-slate-300 group-hover:text-white transition-colors"></i>
                </button>
            </div>
        </div>

        <!-- Scrollable Form Content -->
        <div class="flex-1 flex flex-col overflow-hidden bg-slate-50">
            <form id="client-form" class="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-8">
                <input type="hidden" id="client-id">
                
                <!-- Status Administrativo -->
                <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                    <h3 class="text-sm font-black text-slate-800 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><i data-lucide="shield" class="w-4 h-4"></i></div>
                        Status do Cliente no Sistema
                    </h3>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-2">Status</label>
                        <div class="relative">
                            <i data-lucide="activity" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                            <select id="status" class="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700 appearance-none cursor-pointer">
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                                <option value="bloqueado">Bloqueado</option>
                                <option value="recusado">Solicitação Recusada</option>
                            </select>
                            <i data-lucide="chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></i>
                        </div>
                    </div>
                </div>

                <!-- Identidade -->
                <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                    <h3 class="text-sm font-black text-slate-800 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><i data-lucide="fingerprint" class="w-4 h-4"></i></div>
                        Identidade Corporativa
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Nome Completo</label>
                            <div class="relative">
                                <i data-lucide="user" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                <input type="text" id="name" required class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">CPF / CNPJ</label>
                            <div class="relative">
                                <i data-lucide="file-text" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                <input type="text" id="cpf_cnpj" required class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Data Nasc.</label>
                                <div class="relative">
                                    <i data-lucide="calendar" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                    <input type="date" id="birth" required class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                                </div>
                            </div>
                            <div class="space-y-1">
                                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Est. Civil</label>
                                <div class="relative">
                                    <i data-lucide="heart" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                    <select id="marital" required class="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700 appearance-none cursor-pointer">
                                        <option value="" disabled>Selecione...</option>
                                        <option value="Solteiro(a)">Solteiro(a)</option>
                                        <option value="Casado(a)">Casado(a)</option>
                                        <option value="Divorciado(a)">Divorciado(a)</option>
                                        <option value="Viúvo(a)">Viúvo(a)</option>
                                    </select>
                                    <i data-lucide="chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contato -->
                <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                    <h3 class="text-sm font-black text-slate-800 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center"><i data-lucide="message-square" class="w-4 h-4"></i></div>
                        Dados de Contato
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">WhatsApp / Celular</label>
                            <div class="relative">
                                <i data-lucide="phone" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                <input type="tel" id="phone" required class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">E-mail</label>
                            <div class="relative">
                                <i data-lucide="mail" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                <input type="email" id="email" required class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Endereço -->
                <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                    <h3 class="text-sm font-black text-slate-800 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center"><i data-lucide="map-pin" class="w-4 h-4"></i></div>
                        Endereço Residencial
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div class="space-y-1 lg:col-span-2">
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Logradouro / Rua</label>
                            <div class="relative">
                                <i data-lucide="map-pin" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                <input type="text" id="street" required class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Número</label>
                            <div class="relative">
                                <i data-lucide="hash" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                <input type="text" id="number" required class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                            </div>
                        </div>
                        <div class="space-y-1 flex-1 min-w-[150px]">
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Bairro</label>
                            <div class="relative">
                                <i data-lucide="map" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                <input type="text" id="neighborhood" required class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                            </div>
                        </div>
                        <div class="space-y-1 flex-1 min-w-[150px]">
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Cidade</label>
                            <div class="relative">
                                <i data-lucide="building" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                <select id="city" required class="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700 appearance-none cursor-pointer">
                                    <option value="" disabled selected>Selecione...</option>
                                    <option value="Campo Grande">Campo Grande</option>
                                    <option value="Curitiba">Curitiba</option>
                                    <option value="Maceió">Maceió</option>
                                </select>
                                <i data-lucide="chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></i>
                            </div>
                        </div>
                        <div class="space-y-1 flex-1 min-w-[70px]">
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Estado</label>
                            <div class="relative">
                                <i data-lucide="map" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                <select id="state" required class="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700 appearance-none cursor-pointer">
                                    <option value="" disabled selected>UF...</option>
                                    <option value="AC">AC</option><option value="AL">AL</option><option value="AP">AP</option>
                                    <option value="AM">AM</option><option value="BA">BA</option><option value="CE">CE</option>
                                    <option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option>
                                    <option value="MA">MA</option><option value="MT">MT</option><option value="MS">MS</option>
                                    <option value="MG">MG</option><option value="PA">PA</option><option value="PB">PB</option>
                                    <option value="PR">PR</option><option value="PE">PE</option><option value="PI">PI</option>
                                    <option value="RJ">RJ</option><option value="RN">RN</option><option value="RS">RS</option>
                                    <option value="RO">RO</option><option value="RR">RR</option><option value="SC">SC</option>
                                    <option value="SP">SP</option><option value="SE">SE</option><option value="TO">TO</option>
                                </select>
                                <i data-lucide="chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Profissional -->
                <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                    <h3 class="text-sm font-black text-slate-800 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center"><i data-lucide="briefcase" class="w-4 h-4"></i></div>
                        Dados Profissionais
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Ocupação / Cargo</label>
                            <div class="relative">
                                <i data-lucide="briefcase" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                <input type="text" id="occupation" required class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Empresa / Empregador</label>
                            <div class="relative">
                                <i data-lucide="building-2" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                                <input type="text" id="company" required class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700">
                            </div>
                        </div>
                    </div>
                </div>

            </form>
            <div id="footer-actions-client" class="p-6 bg-white border-t border-slate-100 shrink-0 flex flex-col md:flex-row justify-end gap-3 rounded-b-[2rem] mt-auto relative z-20">
                <button type="button" class="close-modal w-full md:w-auto px-8 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all text-sm flex items-center justify-center">
                    CANCELAR
                </button>
                <button type="button" onclick="document.getElementById('client-form').requestSubmit()" class="w-full md:flex-1 md:max-w-[400px] py-3.5 bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white font-black rounded-2xl shadow-xl shadow-primary/30 transition-all text-sm md:text-base flex items-center justify-center gap-3">
                    <i data-lucide="save" class="w-5 h-5"></i>
                    SALVAR ALTERAÇÕES
                </button>
            </div>
        </div>
    </div>
</div>
