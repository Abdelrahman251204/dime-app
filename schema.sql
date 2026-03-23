-- Initial Database Schema for DIME Interview Hub

-- 1. Profiles (extending auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  role text check (role in ('Admin', 'Interviewer', 'Hiring Manager')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Job Titles
create table if not exists public.job_titles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  department text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Pipelines
create table if not exists public.pipelines (
  id uuid default gen_random_uuid() primary key,
  job_title_id uuid references public.job_titles(id) on delete cascade unique,
  stages jsonb not null, -- Array of strings: ['Applied', 'Technical', 'HR',...]
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Candidates
create table if not exists public.candidates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  job_title_id uuid references public.job_titles(id) on delete set null,
  status text default 'active',
  stage text,
  cv_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Interview Templates
create table if not exists public.interview_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  job_title_id uuid references public.job_titles(id) on delete set null,
  stage text,
  schema_json jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Interview Sessions
create table if not exists public.interview_sessions (
  id uuid default gen_random_uuid() primary key,
  candidate_id uuid references public.candidates(id) on delete cascade,
  template_id uuid references public.interview_templates(id) on delete set null,
  interviewer_id uuid references public.profiles(id),
  score numeric default 0,
  recommendation text check (recommendation in ('Strong Hire', 'Hire', 'Neutral', 'No Hire')),
  status text default 'draft', -- 'draft', 'submitted'
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Interview Responses
create table if not exists public.interview_responses (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.interview_sessions(id) on delete cascade,
  question_id text not null,
  response text,
  score numeric default 0,
  is_red_flag boolean default false,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Enablement
alter table public.profiles enable row level security;
alter table public.job_titles enable row level security;
alter table public.pipelines enable row level security;
alter table public.candidates enable row level security;
alter table public.interview_templates enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.interview_responses enable row level security;

-- Simple permissive policies for dev (adjust for production)
create policy "Public read profiles" on public.profiles for select using (true);
create policy "Authenticated all job_titles" on public.job_titles for all using (true);
create policy "Authenticated all pipelines" on public.pipelines for all using (true);
create policy "Authenticated all candidates" on public.candidates for all using (true);
create policy "Authenticated all interview_templates" on public.interview_templates for all using (true);
create policy "Authenticated all interview_sessions" on public.interview_sessions for all using (true);
create policy "Authenticated all interview_responses" on public.interview_responses for all using (true);

-- Trigger for new user profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (new.id, new.raw_user_meta_data->>'name', new.email, 'Interviewer');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
