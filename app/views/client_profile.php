<?php
/**
 * Meu Perfil View - CLIENT
 */
?>
<div class="space-y-10 pb-12 fade-in">
    <!-- Premium Header Profile -->
    <div class="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-primary-dark rounded-[3rem] p-10 md:p-14 text-white shadow-premium flex flex-col md:flex-row items-center gap-10">
        
        <!-- Avatar Block -->
        <div class="relative group shrink-0 cursor-pointer" id="avatar-container" title="Clique para alterar a foto do perfil">
            <div class="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary to-emerald-400 p-1 shadow-[0_0_50px_rgba(13,148,136,0.5)] relative z-10 transition-transform duration-500 group-hover:scale-105">
                <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center border-4 border-slate-900 overflow-hidden relative">
                    <span id="profile-initials" class="text-4xl md:text-5xl font-black text-white tracking-tighter w-full h-full flex items-center justify-center bg-transparent relative z-10 transition-colors">--</span>
                    <!-- Overlay & Camera Icon -->
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 backdrop-blur-sm">
                        <i data-lucide="camera" class="w-8 h-8 text-white animate-pulse"></i>
                    </div>
                </div>
            </div>
            <!-- Decorative rings -->
            <div class="absolute inset-0 rounded-full border border-white/20 scale-[1.15] -z-0 pointer-events-none"></div>
            <div class="absolute inset-0 rounded-full border border-white/10 scale-[1.3] -z-0 pointer-events-none"></div>
            
            <!-- Hidden Input -->
            <input type="file" id="avatar-upload" accept="image/*" class="hidden">
        </div>

        <!-- Info Block -->
        <div class="text-center md:text-left space-y-4 relative z-10 flex-1">
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div class="space-y-2">
                    <span id="profile-status-badge" class="inline-block px-4 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/50 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        Conta Ativa
                    </span>
                    <h1 id="profile-name" class="text-4xl md:text-5xl font-black font-heading tracking-tighter loading-pulse text-white">Carregando Nome...</h1>
                    <p id="profile-email-main" class="text-white/60 font-medium text-lg flex items-center justify-center md:justify-start gap-2">
                        <i data-lucide="mail" class="w-5 h-5 opacity-70"></i>
                        <span>...</span>
                    </p>
                </div>
                
                <!-- Edit Button -->
                <button id="btn-open-edit" class="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-2xl text-white font-bold transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-white/20 group">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                    <span>Editar Perfil</span>
                </button>
            </div>
            
            <div class="pt-4 border-t border-white/10 flex flex-wrap gap-6 justify-center md:justify-start">
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Cliente Desde</p>
                    <p id="profile-member-since" class="font-bold text-white/90">--/--/----</p>
                </div>
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Cód. Identificador</p>
                    <p id="profile-internal-id" class="font-bold text-white/90 font-mono">#0000</p>
                </div>
            </div>
        </div>
        
        <!-- Decoration -->
        <div class="absolute right-0 top-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
    </div>

    <!-- Data Grid: 4 Semantic Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        <!-- Card 1: Identidade -->
        <div class="premium-card p-8 hover:shadow-2xl transition-all duration-500 group border-t-4 border-t-primary">
            <div class="flex flex-col gap-8">
                <div class="flex items-center gap-4 border-b border-slate-50 pb-6">
                    <div class="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i data-lucide="fingerprint" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-black text-slate-900 tracking-tight">Identidade Pessoal</h3>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Documentação Oficial</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">CPF</p>
                        <p id="profile-cpf" class="text-sm font-bold text-slate-700">--</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">RG / Órgão Expedidor</p>
                        <p id="profile-rg" class="text-sm font-bold text-slate-700">--</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Nascimento</p>
                        <p id="profile-birth" class="text-sm font-bold text-slate-700">--</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Civil</p>
                        <p id="profile-marital" class="text-sm font-bold text-slate-700">--</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card 2: Contato -->
        <div class="premium-card p-8 hover:shadow-2xl transition-all duration-500 group border-t-4 border-t-indigo-500">
            <div class="flex flex-col gap-8">
                <div class="flex items-center gap-4 border-b border-slate-50 pb-6">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i data-lucide="message-square" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-black text-slate-900 tracking-tight">Meios de Contato</h3>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Canais de Comunicação</p>
                    </div>
                </div>
                
                <div class="space-y-6">
                    <div class="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <i data-lucide="phone" class="w-4 h-4"></i>
                        </div>
                        <div class="space-y-0.5">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone Celular / WhatsApp</p>
                            <p id="profile-phone" class="text-sm font-bold text-slate-800">--</p>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <i data-lucide="mail" class="w-4 h-4"></i>
                        </div>
                        <div class="space-y-0.5 overflow-hidden">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail Principal</p>
                            <p id="profile-email" class="text-sm font-bold text-slate-800 truncate">--</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card 3: Endereço -->
        <div class="premium-card p-8 hover:shadow-2xl transition-all duration-500 group border-t-4 border-t-rose-500">
            <div class="flex flex-col gap-8">
                <div class="flex items-center gap-4 border-b border-slate-50 pb-6">
                    <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i data-lucide="map-pin" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-black text-slate-900 tracking-tight">Endereço Residencial</h3>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Localização Atual</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                    <div class="space-y-1 sm:col-span-2">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logradouro / Rua</p>
                        <p id="profile-street" class="text-sm font-bold text-slate-700">--</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número</p>
                        <p id="profile-number" class="text-sm font-bold text-slate-700">--</p>
                    </div>
                    <div class="space-y-1 sm:col-span-2">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bairro</p>
                        <p id="profile-neighborhood" class="text-sm font-bold text-slate-700">--</p>
                    </div>
                    <div class="space-y-1 sm:col-span-2">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cidade / Estado</p>
                        <p id="profile-city-state" class="text-sm font-bold text-slate-700">--</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card 4: Dados Profissionais -->
        <div class="premium-card p-8 hover:shadow-2xl transition-all duration-500 group border-t-4 border-t-amber-500 md:col-span-2 lg:col-span-1">
            <div class="flex flex-col gap-8">
                <div class="flex items-center gap-4 border-b border-slate-50 pb-6">
                    <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i data-lucide="briefcase" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-black text-slate-900 tracking-tight">Dados Profissionais</h3>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Renda e Ocupação</p>
                    </div>
                </div>
                
                <div class="space-y-6">
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocupação / Cargo</p>
                        <p id="profile-occupation" class="text-sm font-bold text-slate-700">--</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa / Empregador</p>
                        <p id="profile-company" class="text-sm font-bold text-slate-700">--</p>
                    </div>
                </div>
            </div>
        </div>
        
    </div>
</div>

<!-- Modal Edição Meu Perfil -->
<dialog id="edit-profile-modal" class="backdrop:bg-slate-900/80 backdrop:backdrop-blur-sm rounded-[2rem] shadow-2xl border-0 p-0 w-full max-w-4xl mx-auto bg-transparent">
    <div class="bg-white overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Header fixo -->
        <div class="bg-gradient-sidebar p-8 relative overflow-hidden flex-shrink-0">
            <div class="absolute inset-0 bg-primary/10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
            <div class="relative z-10 flex justify-between items-center text-white">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                        <i data-lucide="user-cog" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h2 class="text-2xl font-black font-heading">Editar Perfil</h2>
                        <p class="text-sm font-medium text-slate-400">Atualize seus dados cadastrais</p>
                    </div>
                </div>
                <button id="btn-close-edit" class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
        </div>

        <!-- Scrollable Form Content -->
        <div class="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
            <form id="form-edit-profile" class="space-y-8">
                
                <!-- Identidade -->
                <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                    <h3 class="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                        <i data-lucide="fingerprint" class="w-4 h-4 text-primary"></i> Identidade
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="block text-[10px] font-black text-slate-400 uppercase">Nome Completo</label>
                            <input type="text" id="edit-name" required class="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] font-black text-slate-400 uppercase">CPF</label>
                            <input type="text" id="edit-cpf" required class="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] font-black text-slate-400 uppercase">RG / Órgão</label>
                            <input type="text" id="edit-rg" required class="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <label class="block text-[10px] font-black text-slate-400 uppercase">Data Nasc.</label>
                                <input type="date" id="edit-birth" required class="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                            </div>
                            <div class="space-y-1">
                                <label class="block text-[10px] font-black text-slate-400 uppercase">Est. Civil</label>
                                <select id="edit-marital" required class="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all appearance-none">
                                    <option value="" disabled>Selecione...</option>
                                    <option value="Solteiro(a)">Solteiro(a)</option>
                                    <option value="Casado(a)">Casado(a)</option>
                                    <option value="Divorciado(a)">Divorciado(a)</option>
                                    <option value="Viúvo(a)">Viúvo(a)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contato -->
                <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                    <h3 class="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                        <i data-lucide="message-square" class="w-4 h-4 text-indigo-400"></i> Contato (Bloqueado)
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="block text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 justify-between">WhatsApp/Celular <i data-lucide="lock" class="w-3 h-3 text-red-300"></i></label>
                            <input type="tel" id="edit-phone" readonly class="w-full bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 text-slate-500 cursor-not-allowed outline-none select-none">
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 justify-between">E-mail <i data-lucide="lock" class="w-3 h-3 text-red-300"></i></label>
                            <input type="email" id="edit-email" readonly class="w-full bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 text-slate-500 cursor-not-allowed outline-none select-none">
                        </div>
                    </div>
                </div>

                <!-- Endereço -->
                <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                    <h3 class="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                        <i data-lucide="map-pin" class="w-4 h-4 text-rose-400"></i> Endereço Residencial
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div class="space-y-1 lg:col-span-2">
                            <label class="block text-[10px] font-black text-slate-400 uppercase">Logradouro / Rua</label>
                            <input type="text" id="edit-street" required class="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] font-black text-slate-400 uppercase">Número</label>
                            <input type="text" id="edit-number" required class="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                        </div>
                        <div class="space-y-1 flex-1 min-w-[150px]">
                            <label class="block text-[10px] font-black text-slate-400 uppercase">Bairro</label>
                            <input type="text" id="edit-neighborhood" required class="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                        </div>
                        <div class="space-y-1 flex-1 min-w-[150px]">
                            <label class="block text-[10px] font-black text-slate-400 uppercase">Cidade</label>
                            <select id="edit-city" required class="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all appearance-none">
                                <option value="" disabled selected>Selecione...</option>
                                <option value="Campo Grande">Campo Grande</option>
                                <option value="Curitiba">Curitiba</option>
                                <option value="Maceió">Maceió</option>
                            </select>
                        </div>
                        <div class="space-y-1 flex-1 min-w-[70px]">
                            <label class="block text-[10px] font-black text-slate-400 uppercase">Estado</label>
                            <select id="edit-state" required class="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all appearance-none">
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
                        </div>
                    </div>
                </div>

                <!-- Profissional -->
                <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                    <h3 class="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                        <i data-lucide="briefcase" class="w-4 h-4 text-amber-400"></i> Dados Profissionais
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="block text-[10px] font-black text-slate-400 uppercase">Ocupação / Cargo</label>
                            <input type="text" id="edit-occupation" required class="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                        </div>
                        <div class="space-y-1">
                            <label class="block text-[10px] font-black text-slate-400 uppercase">Empresa / Empregador</label>
                            <input type="text" id="edit-company" required class="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all">
                        </div>
                    </div>
                </div>

                <div class="pb-6">
                    <button type="submit" class="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-premium transition-all text-lg flex items-center justify-center gap-2">
                        <i data-lucide="save" class="w-5 h-5"></i>
                        SALVAR ALTERAÇÕES
                    </button>
                </div>
            </form>
        </div>
    </div>
</dialog>
