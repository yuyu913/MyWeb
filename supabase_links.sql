-- 魚魚の收藏夾：Supabase 資料表與權限設定
-- 直接整份貼到 Supabase SQL Editor 執行即可。

create extension if not exists pgcrypto;

create table if not exists public.bookmark_groups (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    name text not null,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    group_id uuid not null references public.bookmark_groups(id) on delete cascade,
    title text not null,
    url text not null,
    description text not null default '',
    tags text[] not null default '{}',
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_bookmark_groups_user on public.bookmark_groups(user_id);
create index if not exists idx_bookmarks_user on public.bookmarks(user_id);
create index if not exists idx_bookmarks_group on public.bookmarks(group_id);

alter table public.bookmark_groups enable row level security;
alter table public.bookmarks enable row level security;

-- 每位登入者只能看到、修改自己的資料。
drop policy if exists "groups_select_own" on public.bookmark_groups;
create policy "groups_select_own" on public.bookmark_groups for select using (auth.uid() = user_id);

drop policy if exists "groups_insert_own" on public.bookmark_groups;
create policy "groups_insert_own" on public.bookmark_groups for insert with check (auth.uid() = user_id);

drop policy if exists "groups_update_own" on public.bookmark_groups;
create policy "groups_update_own" on public.bookmark_groups for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "groups_delete_own" on public.bookmark_groups;
create policy "groups_delete_own" on public.bookmark_groups for delete using (auth.uid() = user_id);

drop policy if exists "bookmarks_select_own" on public.bookmarks;
create policy "bookmarks_select_own" on public.bookmarks for select using (auth.uid() = user_id);

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own" on public.bookmarks for insert with check (auth.uid() = user_id);

drop policy if exists "bookmarks_update_own" on public.bookmarks;
create policy "bookmarks_update_own" on public.bookmarks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own" on public.bookmarks for delete using (auth.uid() = user_id);

-- 使用者只能把網址放進自己的分組。
create or replace function public.check_bookmark_group_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if not exists (
        select 1 from public.bookmark_groups
        where id = new.group_id and user_id = auth.uid()
    ) then
        raise exception 'Invalid bookmark group';
    end if;
    new.user_id := auth.uid();
    return new;
end;
$$;

drop trigger if exists trg_check_bookmark_group_owner on public.bookmarks;
create trigger trg_check_bookmark_group_owner
before insert or update on public.bookmarks
for each row execute function public.check_bookmark_group_owner();

-- 分組 user_id 固定為目前登入者，避免前端誤傳。
create or replace function public.set_group_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    new.user_id := auth.uid();
    return new;
end;
$$;

drop trigger if exists trg_set_group_owner on public.bookmark_groups;
create trigger trg_set_group_owner
before insert on public.bookmark_groups
for each row execute function public.set_group_owner();