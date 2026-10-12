-- V7.3: private practice history and notes. No changes to academic grades or existing content.
create table if not exists study_game_attempts (
 id text primary key,
 user_id text not null,
 subject_id text not null,
 mode text not null,
 correct integer not null check(correct >= 0),
 total integer not null check(total > 0 and correct <= total),
 seconds integer not null check(seconds >= 0),
 created_at timestamptz not null default now()
);
create index if not exists study_game_attempts_user_created on study_game_attempts(user_id,created_at desc);
create table if not exists study_game_notes (
 user_id text not null,
 subject_id text not null,
 body text not null default '',
 revision integer not null default 1,
 updated_at timestamptz not null default now(),
 primary key(user_id,subject_id)
);
