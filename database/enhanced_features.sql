-- Add archived column to users table
alter table public.users
add column if not exists archived boolean default false;

-- Add permanent_delete column for soft delete tracking
alter table public.users
add column if not exists permanent_delete boolean default false;

-- Add deleted_at timestamp for audit trail
alter table public.users
add column if not exists deleted_at timestamp with time zone;

-- Add deleted_by for tracking who deleted the user
alter table public.users
add column if not exists deleted_by uuid references public.users (id);

-- Create attendance_edits table for manual attendance adjustments
create table if not exists public.attendance_edits (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  employee_id uuid not null references public.users (id) on delete CASCADE,
  edit_date date not null,
  edit_type text not null check (
    edit_type in (
      'manual_checkin',
      'manual_checkout',
      'weekend',
      'holiday',
      'absence',
      'sick_leave',
      'vacation'
    )
  ),
  original_checkin timestamp with time zone,
  original_checkout timestamp with time zone,
  edited_checkin timestamp with time zone,
  edited_checkout timestamp with time zone,
  reason text,
  edited_by uuid not null references public.users (id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create holidays table
create table if not exists public.holidays (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  name text not null,
  date date not null,
  is_recurring boolean default false,
  created_by uuid not null references public.users (id),
  created_at timestamp with time zone default now(),
  unique (company_id, date)
);

-- Create employee_details table for extended employee information
create table if not exists public.employee_details (
  id uuid default gen_random_uuid () primary key,
  user_id uuid not null references public.users (id) on delete CASCADE unique,
  phone text,
  address text,
  birth_date date,
  hire_date date,
  department text,
  salary numeric(10, 2),
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  skills text[],
  certifications text[],
  performance_rating integer check (
    performance_rating >= 1
    and performance_rating <= 5
  ),
  last_promotion_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create notifications table
create table if not exists public.notifications (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  user_id uuid references public.users (id) on delete CASCADE,
  title text not null,
  message text not null,
  type text not null check (type in ('info', 'warning', 'error', 'success')),
  is_read boolean default false,
  action_url text,
  created_at timestamp with time zone default now()
);

-- Create employee_schedules table for flexible work schedules
create table if not exists public.employee_schedules (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  employee_id uuid not null references public.users (id) on delete CASCADE,
  day_of_week integer not null check (
    day_of_week >= 0
    and day_of_week <= 6
  ), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  is_working_day boolean default true,
  created_at timestamp with time zone default now(),
  unique (employee_id, day_of_week)
);

-- Create attendance_reports table for cached reports
create table if not exists public.attendance_reports (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  report_type text not null,
  report_data jsonb not null,
  generated_by uuid not null references public.users (id),
  generated_at timestamp with time zone default now(),
  expires_at timestamp with time zone
);

-- Create employee_goals table for performance tracking
create table if not exists public.employee_goals (
  id uuid default gen_random_uuid () primary key,
  employee_id uuid not null references public.users (id) on delete CASCADE,
  title text not null,
  description text,
  target_date date,
  status text default 'pending' check (
    status in (
      'pending',
      'in_progress',
      'completed',
      'cancelled'
    )
  ),
  progress_percentage integer default 0 check (
    progress_percentage >= 0
    and progress_percentage <= 100
  ),
  created_by uuid not null references public.users (id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create time_tracking table for detailed time tracking
create table if not exists public.time_tracking (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  employee_id uuid not null references public.users (id) on delete CASCADE,
  project_name text,
  task_description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  duration_minutes integer,
  is_billable boolean default false,
  created_at timestamp with time zone default now()
);

-- Create company_announcements table
create table if not exists public.company_announcements (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  title text not null,
  content text not null,
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  is_active boolean default true,
  expires_at timestamp with time zone,
  created_by uuid not null references public.users (id),
  created_at timestamp with time zone default now()
);

-- Create employee_feedback table
create table if not exists public.employee_feedback (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  from_employee_id uuid not null references public.users (id) on delete CASCADE,
  to_employee_id uuid references public.users (id) on delete CASCADE,
  feedback_type text not null check (
    feedback_type in (
      'peer_review',
      'manager_review',
      'self_assessment',
      'suggestion'
    )
  ),
  rating integer check (
    rating >= 1
    and rating <= 5
  ),
  comments text,
  is_anonymous boolean default false,
  created_at timestamp with time zone default now()
);

-- INNOVATIVE FEATURE 1: Employee Mood Tracking
create table if not exists public.employee_mood (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  employee_id uuid not null references public.users (id) on delete CASCADE,
  mood_score integer not null check (mood_score >= 1 and mood_score <= 5),
  mood_emoji text not null,
  mood_note text,
  date date not null default current_date,
  created_at timestamp with time zone default now(),
  unique (employee_id, date)
);

-- INNOVATIVE FEATURE 2: Team Collaboration Spaces
create table if not exists public.team_spaces (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  name text not null,
  description text,
  color text default '#6366F1',
  is_private boolean default false,
  created_by uuid not null references public.users (id),
  created_at timestamp with time zone default now()
);

create table if not exists public.team_space_members (
  id uuid default gen_random_uuid () primary key,
  space_id uuid not null references public.team_spaces (id) on delete CASCADE,
  user_id uuid not null references public.users (id) on delete CASCADE,
  role text default 'member' check (role in ('member', 'admin')),
  joined_at timestamp with time zone default now(),
  unique (space_id, user_id)
);

create table if not exists public.team_messages (
  id uuid default gen_random_uuid () primary key,
  space_id uuid not null references public.team_spaces (id) on delete CASCADE,
  user_id uuid not null references public.users (id) on delete CASCADE,
  message text not null,
  message_type text default 'text' check (message_type in ('text', 'file', 'image')),
  file_url text,
  created_at timestamp with time zone default now()
);

-- INNOVATIVE FEATURE 3: Achievement/Badge System
create table if not exists public.achievements (
  id uuid default gen_random_uuid () primary key,
  name text not null,
  description text not null,
  icon text not null,
  category text not null,
  points integer default 0,
  criteria jsonb not null,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists public.employee_achievements (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  employee_id uuid not null references public.users (id) on delete CASCADE,
  achievement_id uuid not null references public.achievements (id),
  earned_at timestamp with time zone default now(),
  unique (employee_id, achievement_id)
);

-- INNOVATIVE FEATURE 4: Real-time Chat System
create table if not exists public.chat_rooms (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  name text not null,
  room_type text default 'group' check (room_type in ('direct', 'group', 'announcement')),
  is_active boolean default true,
  created_by uuid not null references public.users (id),
  created_at timestamp with time zone default now()
);

create table if not exists public.chat_participants (
  id uuid default gen_random_uuid () primary key,
  room_id uuid not null references public.chat_rooms (id) on delete CASCADE,
  user_id uuid not null references public.users (id) on delete CASCADE,
  is_admin boolean default false,
  joined_at timestamp with time zone default now(),
  unique (room_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid default gen_random_uuid () primary key,
  room_id uuid not null references public.chat_rooms (id) on delete CASCADE,
  sender_id uuid not null references public.users (id) on delete CASCADE,
  message text not null,
  message_type text default 'text' check (message_type in ('text', 'file', 'image', 'system')),
  file_url text,
  is_edited boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- INNOVATIVE FEATURE 5: Employee Wellness Tracking
create table if not exists public.wellness_metrics (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  employee_id uuid not null references public.users (id) on delete CASCADE,
  date date not null default current_date,
  stress_level integer check (stress_level >= 1 and stress_level <= 5),
  energy_level integer check (energy_level >= 1 and energy_level <= 5),
  work_life_balance integer check (work_life_balance >= 1 and work_life_balance <= 5),
  sleep_hours numeric(3,1),
  exercise_minutes integer,
  notes text,
  created_at timestamp with time zone default now(),
  unique (employee_id, date)
);

-- INNOVATIVE FEATURE 6: Skills Assessment and Training
create table if not exists public.skill_categories (
  id uuid default gen_random_uuid () primary key,
  name text not null unique,
  description text,
  icon text,
  created_at timestamp with time zone default now()
);

create table if not exists public.skills (
  id uuid default gen_random_uuid () primary key,
  category_id uuid not null references public.skill_categories (id),
  name text not null,
  description text,
  level_required text default 'beginner' check (level_required in ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at timestamp with time zone default now()
);

create table if not exists public.employee_skills (
  id uuid default gen_random_uuid () primary key,
  employee_id uuid not null references public.users (id) on delete CASCADE,
  skill_id uuid not null references public.skills (id),
  proficiency_level integer check (proficiency_level >= 1 and proficiency_level <= 5),
  last_assessed date,
  notes text,
  created_at timestamp with time zone default now(),
  unique (employee_id, skill_id)
);

create table if not exists public.training_programs (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  title text not null,
  description text,
  duration_hours integer,
  difficulty_level text check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
  url text,
  skills_covered uuid[] not null,
  created_by uuid not null references public.users (id),
  created_at timestamp with time zone default now()
);

-- INNOVATIVE FEATURE 7: Automated Shift Scheduling
create table if not exists public.shift_templates (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  name text not null,
  start_time time not null,
  end_time time not null,
  break_duration_minutes integer default 60,
  color text default '#6366F1',
  created_at timestamp with time zone default now()
);

create table if not exists public.scheduled_shifts (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  employee_id uuid not null references public.users (id) on delete CASCADE,
  template_id uuid references public.shift_templates (id),
  date date not null,
  start_time time not null,
  end_time time not null,
  status text default 'scheduled' check (status in ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes text,
  created_by uuid not null references public.users (id),
  created_at timestamp with time zone default now()
);

-- INNOVATIVE FEATURE 8: Expense Management
create table if not exists public.expense_categories (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  name text not null,
  description text,
  max_amount numeric(10,2),
  requires_receipt boolean default true,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists public.expense_reports (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  employee_id uuid not null references public.users (id) on delete CASCADE,
  title text not null,
  total_amount numeric(10,2) not null,
  status text default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected', 'paid')),
  submitted_at timestamp with time zone,
  approved_by uuid references public.users (id),
  approved_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists public.expense_items (
  id uuid default gen_random_uuid () primary key,
  report_id uuid not null references public.expense_reports (id) on delete CASCADE,
  category_id uuid not null references public.expense_categories (id),
  description text not null,
  amount numeric(10,2) not null,
  expense_date date not null,
  receipt_url text,
  notes text,
  created_at timestamp with time zone default now()
);

-- INNOVATIVE FEATURE 9: Employee Recognition System
create table if not exists public.recognition_types (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  name text not null,
  description text,
  icon text,
  points_value integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists public.employee_recognitions (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  recipient_id uuid not null references public.users (id) on delete CASCADE,
  giver_id uuid not null references public.users (id) on delete CASCADE,
  recognition_type_id uuid not null references public.recognition_types (id),
  message text not null,
  is_public boolean default true,
  points_awarded integer default 0,
  created_at timestamp with time zone default now()
);

-- INNOVATIVE FEATURE 10: AI-Powered Insights
create table if not exists public.ai_insights (
  id uuid default gen_random_uuid () primary key,
  company_id uuid not null references public.companies (id) on delete CASCADE,
  insight_type text not null check (insight_type in ('attendance_pattern', 'performance_trend', 'wellness_alert', 'productivity_tip')),
  title text not null,
  description text not null,
  data jsonb,
  confidence_score numeric(3,2) check (confidence_score >= 0 and confidence_score <= 1),
  is_actionable boolean default false,
  action_url text,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone
);

-- Enhanced RLS Policies
-- Enable RLS on all tables
alter table public.attendance_edits ENABLE row LEVEL SECURITY;
alter table public.holidays ENABLE row LEVEL SECURITY;
alter table public.employee_details ENABLE row LEVEL SECURITY;
alter table public.notifications ENABLE row LEVEL SECURITY;
alter table public.employee_schedules ENABLE row LEVEL SECURITY;
alter table public.attendance_reports ENABLE row LEVEL SECURITY;
alter table public.employee_goals ENABLE row LEVEL SECURITY;
alter table public.time_tracking ENABLE row LEVEL SECURITY;
alter table public.company_announcements ENABLE row LEVEL SECURITY;
alter table public.employee_feedback ENABLE row LEVEL SECURITY;

-- RLS for innovative features
alter table public.employee_mood ENABLE row LEVEL SECURITY;
alter table public.team_spaces ENABLE row LEVEL SECURITY;
alter table public.team_space_members ENABLE row LEVEL SECURITY;
alter table public.team_messages ENABLE row LEVEL SECURITY;
alter table public.achievements ENABLE row LEVEL SECURITY;
alter table public.employee_achievements ENABLE row LEVEL SECURITY;
alter table public.chat_rooms ENABLE row LEVEL SECURITY;
alter table public.chat_participants ENABLE row LEVEL SECURITY;
alter table public.chat_messages ENABLE row LEVEL SECURITY;
alter table public.wellness_metrics ENABLE row LEVEL SECURITY;
alter table public.skill_categories ENABLE row LEVEL SECURITY;
alter table public.skills ENABLE row LEVEL SECURITY;
alter table public.employee_skills ENABLE row LEVEL SECURITY;
alter table public.training_programs ENABLE row LEVEL SECURITY;
alter table public.shift_templates ENABLE row LEVEL SECURITY;
alter table public.scheduled_shifts ENABLE row LEVEL SECURITY;
alter table public.expense_categories ENABLE row LEVEL SECURITY;
alter table public.expense_reports ENABLE row LEVEL SECURITY;
alter table public.expense_items ENABLE row LEVEL SECURITY;
alter table public.recognition_types ENABLE row LEVEL SECURITY;
alter table public.employee_recognitions ENABLE row LEVEL SECURITY;
alter table public.ai_insights ENABLE row LEVEL SECURITY;

-- RLS Policies (company-based access for most tables)
-- Employee mood tracking
create policy "Company users can manage mood data" on public.employee_mood for all using (
  company_id in (
    select company_id from public.users where id = auth.uid()
  )
);

-- Team collaboration
create policy "Company users can access team spaces" on public.team_spaces for all using (
  company_id in (
    select company_id from public.users where id = auth.uid()
  )
);

create policy "Members can access team messages" on public.team_messages for all using (
  space_id in (
    select ts.id from public.team_spaces ts
    join public.team_space_members tsm on ts.id = tsm.space_id
    where tsm.user_id = auth.uid()
  )
);

-- Achievement system
create policy "Public achievements readable by all" on public.achievements for select using (true);

create policy "Company users can view employee achievements" on public.employee_achievements for select using (
  company_id in (
    select company_id from public.users where id = auth.uid()
  )
);

-- Chat system
create policy "Company users can access chat rooms" on public.chat_rooms for all using (
  company_id in (
    select company_id from public.users where id = auth.uid()
  )
);

create policy "Chat participants can access messages" on public.chat_messages for all using (
  room_id in (
    select cp.room_id from public.chat_participants cp
    where cp.user_id = auth.uid()
  )
);

-- Wellness tracking
create policy "Company users can manage wellness data" on public.wellness_metrics for all using (
  company_id in (
    select company_id from public.users where id = auth.uid()
  )
);

-- Skills and training
create policy "Skills readable by all" on public.skills for select using (true);
create policy "Skill categories readable by all" on public.skill_categories for select using (true);

create policy "Company users can manage employee skills" on public.employee_skills for all using (
  employee_id in (
    select id from public.users 
    where company_id in (
      select company_id from public.users where id = auth.uid()
    )
  )
);

-- Create indexes for better performance
create index IF not exists idx_attendance_edits_company_date on public.attendance_edits (company_id, edit_date);
create index IF not exists idx_holidays_company_date on public.holidays (company_id, date);
create index IF not exists idx_employee_details_user_id on public.employee_details (user_id);
create index IF not exists idx_notifications_user_read on public.notifications (user_id, is_read);
create index IF not exists idx_employee_schedules_employee on public.employee_schedules (employee_id);
create index IF not exists idx_time_tracking_employee_date on public.time_tracking (employee_id, start_time);
create index IF not exists idx_company_announcements_active on public.company_announcements (company_id, is_active);
create index IF not exists idx_employee_mood_date on public.employee_mood (employee_id, date);
create index IF not exists idx_team_messages_space_time on public.team_messages (space_id, created_at);
create index IF not exists idx_chat_messages_room_time on public.chat_messages (room_id, created_at);
create index IF not exists idx_wellness_metrics_employee_date on public.wellness_metrics (employee_id, date);
create index IF not exists idx_scheduled_shifts_employee_date on public.scheduled_shifts (employee_id, date);
create index IF not exists idx_expense_reports_employee_status on public.expense_reports (employee_id, status);

-- Create functions for automated tasks
create or replace function update_updated_at_column () RETURNS TRIGGER as $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
create trigger update_employee_details_updated_at BEFORE update on public.employee_details for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_employee_goals_updated_at BEFORE update on public.employee_goals for EACH row execute FUNCTION update_updated_at_column ();
create trigger update_attendance_edits_updated_at BEFORE update on public.attendance_edits for EACH row execute FUNCTION update_updated_at_column ();

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, points, criteria) VALUES
('Perfect Week', 'No late arrivals for a full week', '🎯', 'attendance', 50, '{"type": "attendance", "metric": "on_time_week", "threshold": 7}'),
('Early Bird', 'Arrive 30 minutes early for 5 consecutive days', '🌅', 'attendance', 30, '{"type": "attendance", "metric": "early_streak", "threshold": 5}'),
('Team Player', 'Help 10 colleagues this month', '🤝', 'collaboration', 75, '{"type": "collaboration", "metric": "help_count", "threshold": 10}'),
('Skill Master', 'Complete 5 training programs', '🏆', 'learning', 100, '{"type": "training", "metric": "completed_programs", "threshold": 5}'),
('Wellness Champion', 'Log wellness data for 30 days', '💪', 'wellness', 60, '{"type": "wellness", "metric": "daily_logs", "threshold": 30}');

-- Insert default skill categories
INSERT INTO public.skill_categories (name, description, icon) VALUES
('Technical Skills', 'Programming, software, and technical expertise', '💻'),
('Communication', 'Written and verbal communication abilities', '💬'),
('Leadership', 'Management and team leadership skills', '👥'),
('Problem Solving', 'Analytical and critical thinking skills', '🧠'),
('Project Management', 'Planning, organizing, and executing projects', '📊');

-- Insert default skills
INSERT INTO public.skills (category_id, name, description, level_required) VALUES
((SELECT id FROM public.skill_categories WHERE name = 'Technical Skills'), 'JavaScript', 'Modern JavaScript development', 'beginner'),
((SELECT id FROM public.skill_categories WHERE name = 'Technical Skills'), 'React', 'React framework development', 'intermediate'),
((SELECT id FROM public.skill_categories WHERE name = 'Communication'), 'Public Speaking', 'Presenting to groups and audiences', 'beginner'),
((SELECT id FROM public.skill_categories WHERE name = 'Leadership'), 'Team Management', 'Leading and motivating teams', 'intermediate'),
((SELECT id FROM public.skill_categories WHERE name = 'Problem Solving'), 'Data Analysis', 'Analyzing and interpreting data', 'intermediate');
