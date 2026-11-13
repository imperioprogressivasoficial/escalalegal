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

-- ---------- v2: entrega de acesso após a compra ----------
-- conta criada pela compra ainda não tem senha (a pessoa define pelo link do e-mail)
alter table usuarios alter column senha_hash drop not null;
alter table usuarios alter column empresa drop not null;
alter table usuarios add column if not exists sessao_v int not null default 0;
alter table usuarios add column if not exists origem text;
alter table usuarios add column if not exists ultimo_acesso timestamptz;

alter table compras add column if not exists status text not null default 'aprovada';
alter table compras add column if not exists nome text;
alter table compras add column if not exists transacao text;
alter table compras add column if not exists atualizado_em timestamptz not null default now();

-- todo evento recebido do checkout fica guardado (auditoria e suporte)
create table if not exists pagamentos_eventos (
  id bigserial primary key,
  criado_em timestamptz not null default now(),
  email text,
  acao text not null,           -- liberar | bloquear | ignorar | erro
  evento text,
  plataforma text,
  payload jsonb
);
create index if not exists pagamentos_eventos_email_idx on pagamentos_eventos (email, criado_em desc);

-- links de criar/redefinir senha (guarda só o hash do token)
create table if not exists acesso_tokens (
  token_hash text primary key,
  usuario_id int not null references usuarios(id) on delete cascade,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null,
  usado_em timestamptz
);
create index if not exists acesso_tokens_usuario_idx on acesso_tokens (usuario_id);

-- fila de e-mails: tenta de novo se o SMTP falhar
create table if not exists emails (
  id bigserial primary key,
  criado_em timestamptz not null default now(),
  para text not null,
  assunto text not null,
  html text not null,
  texto text not null,
  tentativas int not null default 0,
  proxima_em timestamptz not null default now(),
  enviado_em timestamptz,
  erro text
);
create index if not exists emails_pendentes_idx on emails (proxima_em) where enviado_em is null;
