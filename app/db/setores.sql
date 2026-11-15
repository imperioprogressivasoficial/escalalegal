-- setores da unidade (Empresa > Unidade > Setores > Colaboradores). Roda junto com o app; idempotente.
create table if not exists setores (
  id serial primary key,
  equipe_id int not null references equipes(id) on delete cascade,
  nome text not null,
  ordem int not null default 0,
  minimo jsonb,
  funcionamento jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists setores_equipe on setores(equipe_id);
alter table funcionarios add column if not exists setor_id int references setores(id) on delete set null;
alter table escalas add column if not exists setores jsonb;
