alter table characters
  add column status text not null default 'alive';

alter table characters
  add constraint characters_status_check
  check (status in ('alive', 'dead', 'unknown'));
