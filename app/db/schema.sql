create table if not exists leads (
  id serial primary key, criado_em timestamptz not null default now(),
  nome text not null, empresa text, whatsapp text not null, email text, setor text,
  funcionarios int, escala jsonb, utm jsonb default '{}'::jsonb, ip text, status text not null default 'novo'
);

create table if not exists usuarios (
  id serial primary key,
  criado_em timestamptz not null default now(),
  nome text not null,
  empresa text not null,
  email text not null unique,
  whatsapp text,
  senha_hash text not null,
  acesso_liberado boolean not null default false,
  liberado_em timestamptz
);

create table if not exists equipes (
  id serial primary key,
  usuario_id int not null references usuarios(id) on delete cascade,
  criado_em timestamptz not null default now(),
  nome text not null,
  setor text not null,
  abertos jsonb not null,
  minimo jsonb not null
);
create index if not exists equipes_usuario_idx on equipes (usuario_id);

create table if not exists funcionarios (
  id serial primary key,
  equipe_id int not null references equipes(id) on delete cascade,
  nome text not null,
  cargo text,
  folga_fixa jsonb not null default '[]'::jsonb,
  ativo boolean not null default true
);
create index if not exists funcionarios_equipe_idx on funcionarios (equipe_id);

create table if not exists escalas (
  id serial primary key,
  equipe_id int not null references equipes(id) on delete cascade,
  criado_em timestamptz not null default now(),
  inicio date not null,
  semanas int not null,
  funcionarios jsonb not null,
  abertos jsonb not null,
  minimo jsonb not null,
  dados jsonb not null,
  alertas jsonb not null default '[]'::jsonb
);
create index if not exists escalas_equipe_idx on escalas (equipe_id, criado_em desc);

-- compras que chegam antes do cadastro (webhook do checkout)
create table if not exists compras (
  email text primary key,
  criado_em timestamptz not null default now(),
  origem text
);
