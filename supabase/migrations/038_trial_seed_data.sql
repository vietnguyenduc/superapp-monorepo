-- Trial Seed Data
-- Lưu trữ dữ liệu mẫu cho chế độ trial của tất cả apps
-- Admin có thể chỉnh sửa qua /admin/trial-seeds

create schema if not exists trial_seed;

create table trial_seed.data (
  id         uuid default gen_random_uuid() primary key,
  table_name text not null,
  record     jsonb not null,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_trial_seed_table_name on trial_seed.data(table_name);

-- RLS: ai cũng đọc được, chỉ authenticated mới ghi được
alter table trial_seed.data enable row level security;

create policy "Trial seed readable by all"
  on trial_seed.data
  for select
  using (true);

create policy "Trial seed writable by authenticated"
  on trial_seed.data
  for insert
  with check (auth.role() = 'authenticated');

create policy "Trial seed updatable by authenticated"
  on trial_seed.data
  for update
  using (auth.role() = 'authenticated');

create policy "Trial seed deletable by authenticated"
  on trial_seed.data
  for delete
  using (auth.role() = 'authenticated');

-- Trigger tự động updated_at
create or replace function trial_seed.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_trial_seed_data_updated_at
  before update on trial_seed.data
  for each row
  execute function trial_seed.update_updated_at();
