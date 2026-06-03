-- ============================================================
--  AST NEXT — Supabase schema
--  Paste this into your Supabase project's SQL editor and run it,
--  then enable Realtime on these tables (Database → Replication),
--  then put your project URL + anon key into store.js.
-- ============================================================

create table if not exists players (
  id   bigint generated always as identity primary key,
  name text unique not null,
  sort int default 0
);

create table if not exists events (
  id   bigint generated always as identity primary key,
  name text unique not null,
  sort int default 0
);

create table if not exists sport_votes (
  player text not null,
  sport  text not null,
  primary key (player, sport)
);

create table if not exists location_votes (
  player   text primary key,
  location text not null
);

create table if not exists date_proposals (
  id          bigint generated always as identity primary key,
  label       text not null,
  proposed_by text
);

create table if not exists date_votes (
  date_id bigint references date_proposals(id) on delete cascade,
  player  text not null,
  primary key (date_id, player)
);

create table if not exists scores (
  event  text not null,
  player text not null,
  points numeric default 0,
  primary key (event, player)
);

-- ---- seed players + events ----
insert into players (name, sort) values
  ('Heath Hagan', 0), ('Jason Lewis', 1), ('Brack Watters', 2), ('Justin Ray', 3)
on conflict (name) do nothing;

insert into events (name, sort) values
  ('Golf', 0), ('Basketball Shooting', 1), ('Disc Golf', 2),
  ('Pickleball', 3), ('Bocce Ball', 4), ('Cornhole', 5)
on conflict (name) do nothing;

-- ---- Row Level Security ----
-- This is a private friend-group app. Simplest setup: allow the public
-- (anon) key to read + write everything. If you want it locked down,
-- replace these with auth-based policies.
do $$ declare t text;
begin
  foreach t in array array['players','events','sport_votes','location_votes','date_proposals','date_votes','scores']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "anon all" on %I;', t);
    execute format('create policy "anon all" on %I for all using (true) with check (true);', t);
  end loop;
end $$;

-- ---- Enable realtime ----
-- (You can also do this in the dashboard under Database → Replication.)
alter publication supabase_realtime add table
  players, events, sport_votes, location_votes, date_proposals, date_votes, scores;
