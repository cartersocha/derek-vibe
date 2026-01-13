begin;

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  header_image_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists campaign_locations (
  campaign_id uuid references campaigns(id) on delete cascade,
  location_id uuid references locations(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (campaign_id, location_id)
);

create table if not exists session_locations (
  session_id uuid references sessions(id) on delete cascade,
  location_id uuid references locations(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (session_id, location_id)
);

create table if not exists character_locations (
  character_id uuid references characters(id) on delete cascade,
  location_id uuid references locations(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (character_id, location_id)
);

create table if not exists group_locations (
  group_id uuid references groups(id) on delete cascade,
  location_id uuid references locations(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (group_id, location_id)
);

create index if not exists idx_session_locations_location_id on session_locations(location_id);
create index if not exists idx_character_locations_location_id on character_locations(location_id);
create index if not exists idx_group_locations_location_id on group_locations(location_id);
create index if not exists idx_campaign_locations_location_id on campaign_locations(location_id);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

create trigger update_locations_updated_at before update on locations
  for each row execute function update_updated_at_column();

commit;
