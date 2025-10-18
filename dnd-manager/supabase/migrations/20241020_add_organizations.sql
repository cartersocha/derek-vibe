-- Organizations feature rollout
-- Create organizations table and affiliation join tables for campaigns, sessions, and characters.

begin;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table organization_campaigns (
  organization_id uuid references organizations(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (organization_id, campaign_id)
);

create table organization_sessions (
  organization_id uuid references organizations(id) on delete cascade,
  session_id uuid references sessions(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (organization_id, session_id)
);

create table organization_characters (
  organization_id uuid references organizations(id) on delete cascade,
  character_id uuid references characters(id) on delete cascade,
  role text not null default 'npc' check (role in ('npc', 'player')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (organization_id, character_id)
);

-- Maintain updated_at for organizations
create trigger update_organizations_updated_at
  before update on organizations
  for each row
  execute function update_updated_at_column();

-- Helpful indexes for join lookups
create index idx_organization_campaigns_campaign_id on organization_campaigns(campaign_id);
create index idx_organization_sessions_session_id on organization_sessions(session_id);
create index idx_organization_characters_character_id on organization_characters(character_id);

-- Backfill: create a default organization and affiliate existing data.
insert into organizations (id, name, description)
values ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'Migrated from single-tenant setup')
  on conflict do nothing;

insert into organization_campaigns (organization_id, campaign_id)
select '00000000-0000-0000-0000-000000000001', c.id
from campaigns c
where not exists (
  select 1 from organization_campaigns oc
  where oc.campaign_id = c.id
);

insert into organization_sessions (organization_id, session_id)
select distinct
  coalesce(oc.organization_id, '00000000-0000-0000-0000-000000000001') as organization_id,
  s.id
from sessions s
left join organization_campaigns oc on oc.campaign_id = s.campaign_id
where not exists (
  select 1 from organization_sessions os
  where os.session_id = s.id
);

insert into organization_characters (organization_id, character_id, role)
select distinct
  '00000000-0000-0000-0000-000000000001' as organization_id,
  sc.character_id,
  'player'
from session_characters sc
where not exists (
  select 1 from organization_characters och
  where och.character_id = sc.character_id
)
union
select distinct
  '00000000-0000-0000-0000-000000000001' as organization_id,
  c.id,
  'npc'
from characters c
where not exists (
  select 1 from organization_characters och
  where och.character_id = c.id
);

commit;
