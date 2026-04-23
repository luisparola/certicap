-- Row Level Security for CertiCap (Neon PostgreSQL)
-- Run this once in: Neon Console → SQL Editor → paste & execute

-- Enable RLS on all tables
ALTER TABLE "Tenant"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Usuario"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Actividad"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Participante"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Certificado"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Encuesta"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pregunta"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RespuestaEncuesta"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RespuestaPregunta"  ENABLE ROW LEVEL SECURITY;

-- Grant full access to the application DB role (neondb_owner)
-- RLS protects against unauthorized direct DB connections
CREATE POLICY "app_full_access" ON "Tenant"
  FOR ALL TO neondb_owner USING (true) WITH CHECK (true);
CREATE POLICY "app_full_access" ON "Usuario"
  FOR ALL TO neondb_owner USING (true) WITH CHECK (true);
CREATE POLICY "app_full_access" ON "Actividad"
  FOR ALL TO neondb_owner USING (true) WITH CHECK (true);
CREATE POLICY "app_full_access" ON "Participante"
  FOR ALL TO neondb_owner USING (true) WITH CHECK (true);
CREATE POLICY "app_full_access" ON "Certificado"
  FOR ALL TO neondb_owner USING (true) WITH CHECK (true);
CREATE POLICY "app_full_access" ON "Encuesta"
  FOR ALL TO neondb_owner USING (true) WITH CHECK (true);
CREATE POLICY "app_full_access" ON "Pregunta"
  FOR ALL TO neondb_owner USING (true) WITH CHECK (true);
CREATE POLICY "app_full_access" ON "RespuestaEncuesta"
  FOR ALL TO neondb_owner USING (true) WITH CHECK (true);
CREATE POLICY "app_full_access" ON "RespuestaPregunta"
  FOR ALL TO neondb_owner USING (true) WITH CHECK (true);
