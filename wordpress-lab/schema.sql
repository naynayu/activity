-- WordPress Lab: run once in a NEW Supabase project (SQL editor).
-- Open policies, like a classroom tool: do not store anything private here.

create table session (
  id text primary key,
  step int not null default 0,
  message text,
  updated_at timestamptz not null default now()
);
insert into session (id) values ('main');

create table participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create unique index participants_name_key on participants (lower(name));

-- one row per task a person has ticked off
create table progress (
  participant_id uuid not null references participants(id) on delete cascade,
  step int not null,
  task int not null,
  created_at timestamptz not null default now(),
  primary key (participant_id, step, task)
);

-- one row per person: are they stuck, and on which step
create table help (
  participant_id uuid primary key references participants(id) on delete cascade,
  step int not null,
  stuck boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table session enable row level security;
alter table participants enable row level security;
alter table progress enable row level security;
alter table help enable row level security;

create policy "open" on session for all using (true) with check (true);
create policy "open" on participants for all using (true) with check (true);
create policy "open" on progress for all using (true) with check (true);
create policy "open" on help for all using (true) with check (true);

alter publication supabase_realtime add table session, participants, progress, help;
