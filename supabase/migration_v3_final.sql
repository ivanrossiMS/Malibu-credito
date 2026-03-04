-- ============================================================================
-- MALIBU CRÉDITO — MIGRATION V3: FINAL MULTI-TENANT CONSOLIDATION
-- ============================================================================
-- Execute no SQL Editor do Supabase Dashboard (SQL Editor > New Query)
-- EXECUTE DE CIMA PARA BAIXO — a ordem é obrigatória.
-- ============================================================================

-- ============================================================================
-- 0. EXTENSÃO NECESSÁRIA (gen_random_bytes)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. GARANTIR ESTRUTURA BÁSICA DE TABELAS
-- ============================================================================

-- Tabela companies deve existir (criada anteriormente)
-- Garante coluna slug existe e é única
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uidx_companies_slug ON public.companies(slug) WHERE slug IS NOT NULL;

-- ============================================================================
-- 2. CRIAR EMPRESA DEFAULT (se não existir)
-- Todos os dados antigos (sem company_id) serão vinculados a ela.
-- ============================================================================
DO $$
DECLARE
    default_id INT;
BEGIN
    -- Verificar se já existe empresa default
    SELECT id INTO default_id FROM public.companies WHERE slug = 'malibu-default' LIMIT 1;

    IF default_id IS NULL THEN
        INSERT INTO public.companies (name, slug, status, created_at)
        VALUES ('Malibu Default', 'malibu-default', 'ativo', NOW())
        RETURNING id INTO default_id;
        RAISE NOTICE 'Empresa default criada com ID: %', default_id;
    ELSE
        RAISE NOTICE 'Empresa default já existe com ID: %', default_id;
    END IF;
END $$;

-- ============================================================================
-- 3. ADICIONAR company_id ÀS TABELAS FINANCEIRAS (se não existir)
-- ============================================================================
ALTER TABLE public.clients       ADD COLUMN IF NOT EXISTS company_id INT REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.loans         ADD COLUMN IF NOT EXISTS company_id INT REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.installments  ADD COLUMN IF NOT EXISTS company_id INT REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.payments      ADD COLUMN IF NOT EXISTS company_id INT REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.pix_charges   ADD COLUMN IF NOT EXISTS company_id INT REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.pix_charges   ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
ALTER TABLE public.pix_charges   ADD COLUMN IF NOT EXISTS pix_payload JSONB;
ALTER TABLE public.pix_charges   ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- company_id para users (cada usuário admin pertence a uma empresa)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_id INT REFERENCES public.companies(id) ON DELETE SET NULL;

-- ============================================================================
-- 4. MIGRAR DADOS ÓRFÃOS PARA A EMPRESA DEFAULT
-- ============================================================================
DO $$
DECLARE
    default_id INT;
BEGIN
    SELECT id INTO default_id FROM public.companies WHERE slug = 'malibu-default' LIMIT 1;

    IF default_id IS NULL THEN
        RAISE EXCEPTION 'Empresa default não encontrada! Execute o bloco 2 primeiro.';
    END IF;

    -- Migrar clients
    UPDATE public.clients SET company_id = default_id WHERE company_id IS NULL;
    RAISE NOTICE 'clients sem company_id migrados para empresa %', default_id;

    -- Migrar loans
    UPDATE public.loans SET company_id = default_id WHERE company_id IS NULL;
    RAISE NOTICE 'loans sem company_id migrados para empresa %', default_id;

    -- Migrar installments (a partir do loan se necessário)
    UPDATE public.installments i
    SET company_id = COALESCE(
        (SELECT l.company_id FROM public.loans l WHERE l.id = i.loanid OR l.id = i.loan_id LIMIT 1),
        default_id
    )
    WHERE i.company_id IS NULL;
    RAISE NOTICE 'installments sem company_id migradas para empresa %', default_id;

    -- Migrar payments
    UPDATE public.payments p
    SET company_id = COALESCE(
        (SELECT i.company_id FROM public.installments i
         WHERE i.id = p.installmentid OR i.id = p.installment_id LIMIT 1),
        default_id
    )
    WHERE p.company_id IS NULL;
    RAISE NOTICE 'payments sem company_id migrados para empresa %', default_id;

    -- Migrar pix_charges
    UPDATE public.pix_charges pc
    SET company_id = COALESCE(
        (SELECT i.company_id FROM public.installments i
         WHERE i.id = pc.installment_id LIMIT 1),
        default_id
    )
    WHERE pc.company_id IS NULL;
    RAISE NOTICE 'pix_charges sem company_id migradas para empresa %', default_id;

END $$;

-- ============================================================================
-- 5. CRIAR TABELAS DE INTEGRAÇÃO (se não existirem — da migration v2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_integrations (
    id                  BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    company_id          INT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    provider            TEXT NOT NULL DEFAULT 'asaas',
    environment         TEXT NOT NULL DEFAULT 'sandbox',
    api_key_encrypted   TEXT,
    api_key_iv          TEXT,
    webhook_token       TEXT,
    is_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
    last_test_ok        BOOLEAN,
    last_test_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, provider)
);

CREATE TABLE IF NOT EXISTS public.logs_webhook (
    id              BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    company_id      INT REFERENCES public.companies(id) ON DELETE SET NULL,
    provider        TEXT NOT NULL DEFAULT 'asaas',
    event_type      TEXT,
    asaas_event_id  TEXT,
    payload         JSONB,
    received_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_ok    BOOLEAN DEFAULT FALSE,
    error_message   TEXT
);

-- ============================================================================
-- 6. ÍNDICES DE PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_company_id         ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_loans_company_id           ON public.loans(company_id);
CREATE INDEX IF NOT EXISTS idx_installments_company_id    ON public.installments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_company_id        ON public.payments(company_id);
CREATE INDEX IF NOT EXISTS idx_pix_charges_company_id     ON public.pix_charges(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company_id           ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_logs_webhook_company_id    ON public.logs_webhook(company_id);
CREATE INDEX IF NOT EXISTS idx_logs_webhook_event_type    ON public.logs_webhook(event_type);

-- Índice único: evento ASAAS não pode ser processado 2x (idempotência)
CREATE UNIQUE INDEX IF NOT EXISTS uidx_logs_webhook_event_id
    ON public.logs_webhook(provider, asaas_event_id)
    WHERE asaas_event_id IS NOT NULL;

-- Índice único: cobrança ASAAS pertence a apenas uma empresa
CREATE UNIQUE INDEX IF NOT EXISTS uidx_pix_charges_company_asaas
    ON public.pix_charges(company_id, asaas_payment_id)
    WHERE company_id IS NOT NULL AND asaas_payment_id IS NOT NULL;

-- ============================================================================
-- 7. FUNÇÕES AUXILIARES RLS (não dependem de Supabase Auth JWT)
-- ============================================================================

-- Verifica se user_id passado é MASTER
CREATE OR REPLACE FUNCTION public.is_master_user(p_user_id INT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = p_user_id
          AND (role = 'MASTER' OR role = 'master')
          AND status = 'ativo'
    );
$$;

-- Retorna company_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_company_id(p_user_id INT)
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT company_id FROM public.users WHERE id = p_user_id LIMIT 1;
$$;

-- Funções para RLS baseada em JWT (caso o sistema migre para Supabase Auth no futuro)
CREATE OR REPLACE FUNCTION public.is_master()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id::text = auth.uid()::text
          AND (role = 'MASTER' OR role = 'master')
          AND status = 'ativo'
    );
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT company_id FROM public.users
    WHERE id::text = auth.uid()::text
    LIMIT 1;
$$;

-- ============================================================================
-- 8. RLS — TABELAS DE INTEGRAÇÃO (bloqueio total ao frontend)
-- ============================================================================

-- company_integrations: APENAS service_role pode ler/escrever (Edge Functions)
ALTER TABLE public.company_integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS block_all_direct_access ON public.company_integrations;
CREATE POLICY block_all_direct_access ON public.company_integrations
    AS RESTRICTIVE TO anon, authenticated
    USING (FALSE);

-- logs_webhook: bloqueio total ao frontend
ALTER TABLE public.logs_webhook ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS block_frontend_access_logs ON public.logs_webhook;
CREATE POLICY block_frontend_access_logs ON public.logs_webhook
    AS RESTRICTIVE TO anon, authenticated
    USING (FALSE);

-- ============================================================================
-- 9. GRANTS — PERMISSÕES DE ACESSO
-- ============================================================================

-- Service role tem acesso total às tabelas de integração (Edge Functions)
GRANT ALL ON public.company_integrations TO service_role;
GRANT ALL ON public.logs_webhook TO service_role;

-- Frontend (anon key) pode operar nas tabelas operacionais
-- (O app filtra por company_id via código — não depende somente de RLS)
GRANT SELECT, INSERT, UPDATE ON public.clients      TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.loans        TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.installments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payments     TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pix_charges  TO anon, authenticated;

-- Sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================================================
-- 10. MIGRATION DA API KEY EXISTENTE (se company_id já estava em companies)
-- ============================================================================
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT id, asaas_api_key, asaas_environment
        FROM public.companies
        WHERE asaas_api_key IS NOT NULL AND asaas_api_key != ''
    LOOP
        INSERT INTO public.company_integrations
            (company_id, provider, environment, webhook_token, is_enabled,
             api_key_encrypted, api_key_iv)
        VALUES (
            rec.id,
            'asaas',
            COALESCE(rec.asaas_environment, 'sandbox'),
            encode(gen_random_bytes(32), 'hex'),
            TRUE,
            NULL,  -- Será reconfigurado via UI (a key antiga não pode ser criptografada retroativamente)
            NULL
        )
        ON CONFLICT (company_id, provider) DO NOTHING;
    END LOOP;
    RAISE NOTICE 'API Keys antigas registradas como integrações pendentes de reconfiguração.';
EXCEPTION
    WHEN undefined_column THEN
        RAISE NOTICE 'Coluna asaas_api_key não existe em companies — OK, ignorando migração legacy.';
END $$;

-- Gerar webhook_token para integrações que ainda não têm
UPDATE public.company_integrations
SET webhook_token = encode(gen_random_bytes(32), 'hex')
WHERE webhook_token IS NULL OR webhook_token = '';

-- ============================================================================
-- 11. VERIFICAÇÃO FINAL
-- ============================================================================
DO $$
DECLARE
    cnt_no_company INT;
    msg TEXT := '';
BEGIN
    SELECT COUNT(*) INTO cnt_no_company FROM public.clients WHERE company_id IS NULL;
    IF cnt_no_company > 0 THEN msg := msg || '⚠ ' || cnt_no_company || ' clients sem company_id. '; END IF;

    SELECT COUNT(*) INTO cnt_no_company FROM public.loans WHERE company_id IS NULL;
    IF cnt_no_company > 0 THEN msg := msg || '⚠ ' || cnt_no_company || ' loans sem company_id. '; END IF;

    SELECT COUNT(*) INTO cnt_no_company FROM public.installments WHERE company_id IS NULL;
    IF cnt_no_company > 0 THEN msg := msg || '⚠ ' || cnt_no_company || ' installments sem company_id. '; END IF;

    SELECT COUNT(*) INTO cnt_no_company FROM public.payments WHERE company_id IS NULL;
    IF cnt_no_company > 0 THEN msg := msg || '⚠ ' || cnt_no_company || ' payments sem company_id. '; END IF;

    SELECT COUNT(*) INTO cnt_no_company FROM public.pix_charges WHERE company_id IS NULL;
    IF cnt_no_company > 0 THEN msg := msg || '⚠ ' || cnt_no_company || ' pix_charges sem company_id. '; END IF;

    IF msg = '' THEN
        RAISE NOTICE '✅ MIGRATION V3 CONCLUÍDA COM SUCESSO — todos os registros têm company_id.';
    ELSE
        RAISE WARNING 'MIGRATION V3: Registros ainda sem company_id: %', msg;
    END IF;
END $$;

-- ============================================================================
-- ✅ FIM DA MIGRATION V3
-- PRÓXIMOS PASSOS:
-- 1. Configurar MASTER_ENCRYPTION_KEY nas Supabase Edge Function Secrets
-- 2. Deploy: supabase functions deploy save-company-integration
-- 3. Deploy: supabase functions deploy create-pix-charge
-- 4. Deploy: supabase functions deploy test-asaas-connection
-- 5. Deploy: supabase functions deploy webhook-pix
-- 6. No Admin > Empresas, configurar API Key de cada empresa (será criptografada)
-- ============================================================================
