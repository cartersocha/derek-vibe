begin;

create table if not exists campaign_characters (
  campaign_id uuid references campaigns(id) on delete cascade,
  character_id uuid references characters(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (campaign_id, character_id)
);

create index if not exists idx_campaign_characters_character_id on campaign_characters(character_id);

insert into campaign_characters (campaign_id, character_id)
select distinct s.campaign_id, sc.character_id
from session_characters sc
join sessions s on s.id = sc.session_id
where s.campaign_id is not null
  and sc.character_id is not null
on conflict do nothing;

commit;
