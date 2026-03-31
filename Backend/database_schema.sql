create table public.payments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  stripe_payment_intent_id text not null,
  stripe_subscription_id text null,
  amount integer not null,
  currency text not null default 'cad'::text,
  status text not null,
  plan text null,
  period_start timestamp with time zone null,
  period_end timestamp with time zone null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint payments_pkey primary key (id),
  constraint payments_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_payments_user_id on public.payments using btree (user_id) TABLESPACE pg_default;
