-- Rename organizations tables, columns, indexes, and triggers to groups

begin;

-- Tables
alter table organizations rename to groups;
alter table organization_campaigns rename to group_campaigns;
alter table organization_sessions rename to group_sessions;
alter table organization_characters rename to group_characters;

-- Columns
alter table group_campaigns rename column organization_id to group_id;
alter table group_sessions rename column organization_id to group_id;
alter table group_characters rename column organization_id to group_id;

-- Primary keys
alter table group_campaigns rename constraint organization_campaigns_pkey to group_campaigns_pkey;
alter table group_sessions rename constraint organization_sessions_pkey to group_sessions_pkey;
alter table group_characters rename constraint organization_characters_pkey to group_characters_pkey;

-- Foreign keys
alter table group_campaigns rename constraint organization_campaigns_organization_id_fkey to group_campaigns_group_id_fkey;
alter table group_campaigns rename constraint organization_campaigns_campaign_id_fkey to group_campaigns_campaign_id_fkey;

alter table group_sessions rename constraint organization_sessions_organization_id_fkey to group_sessions_group_id_fkey;
alter table group_sessions rename constraint organization_sessions_session_id_fkey to group_sessions_session_id_fkey;

alter table group_characters rename constraint organization_characters_organization_id_fkey to group_characters_group_id_fkey;
alter table group_characters rename constraint organization_characters_character_id_fkey to group_characters_character_id_fkey;

-- Indexes
alter index idx_organization_campaigns_campaign_id rename to idx_group_campaigns_campaign_id;
alter index idx_organization_sessions_session_id rename to idx_group_sessions_session_id;
alter index idx_organization_characters_character_id rename to idx_group_characters_character_id;

-- Trigger (only if it exists)
do $$
begin
    if exists (select 1 from pg_trigger where tgname = 'update_organizations_updated_at') then
        alter trigger update_organizations_updated_at on groups rename to update_groups_updated_at;
    end if;
end $$;

commit;

