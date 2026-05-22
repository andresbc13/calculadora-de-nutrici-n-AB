-- ================================================================
-- TABLA: perfiles_guardados
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS perfiles_guardados (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre      TEXT        NOT NULL,
    etapa       TEXT,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    datos       JSONB       NOT NULL DEFAULT '{}',
    resultados  JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pg_user_id  ON perfiles_guardados(user_id);
CREATE INDEX IF NOT EXISTS idx_pg_ts       ON perfiles_guardados(timestamp DESC);

-- Row Level Security
ALTER TABLE perfiles_guardados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON perfiles_guardados FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON perfiles_guardados FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON perfiles_guardados FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON perfiles_guardados FOR DELETE USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_pg_updated_at
    BEFORE UPDATE ON perfiles_guardados
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
