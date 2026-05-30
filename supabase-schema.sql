-- Jalankan di Supabase SQL Editor

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nama text,
  nim text,
  role text default 'mahasiswa' check (role in ('admin','mahasiswa')),
  created_at timestamp with time zone default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kode text not null,
  mata_kuliah text not null,
  sks int default 2,
  nama_tugas text not null,
  catatan text,
  status text default 'belum' check (status in ('belum','selesai')),
  foto text,
  created_at timestamp with time zone default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kode text not null,
  mata_kuliah text not null,
  hari text not null,
  jam_mulai text not null,
  jam_selesai text not null,
  ruangan text,
  created_at timestamp with time zone default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nama, nim, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nama', ''),
    coalesce(new.raw_user_meta_data->>'nim', ''),
    coalesce(new.raw_user_meta_data->>'role', 'mahasiswa')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.schedules enable row level security;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- profiles
create policy "mahasiswa read own profile" on public.profiles
for select using (auth.uid() = id or public.is_admin());

create policy "mahasiswa update own profile" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

-- tasks
create policy "read own tasks or admin" on public.tasks
for select using (auth.uid() = user_id or public.is_admin());

create policy "insert own tasks" on public.tasks
for insert with check (auth.uid() = user_id);

create policy "update own tasks" on public.tasks
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own tasks or admin" on public.tasks
for delete using (auth.uid() = user_id or public.is_admin());

-- schedules
create policy "read own schedules or admin" on public.schedules
for select using (auth.uid() = user_id or public.is_admin());

create policy "insert own schedules" on public.schedules
for insert with check (auth.uid() = user_id);

create policy "update own schedules" on public.schedules
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own schedules or admin" on public.schedules
for delete using (auth.uid() = user_id or public.is_admin());
