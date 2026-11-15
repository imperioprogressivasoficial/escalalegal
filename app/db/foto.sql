-- foto de perfil do usuário (guardada no banco: o container é recriado a cada deploy). Roda junto com o app; idempotente.
alter table usuarios add column if not exists foto bytea;
alter table usuarios add column if not exists foto_tipo text;
alter table usuarios add column if not exists foto_em timestamptz;
