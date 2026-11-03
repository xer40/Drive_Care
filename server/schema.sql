-- DriveCare database schema (PostgreSQL 17)
--
-- Creates every table the server expects in an EMPTY database:
--   psql "$DATABASE_URL" -f server/schema.sql
--
-- Do not run this against a database that already has these tables; every statement would
-- fail with "already exists".
--
-- The constraint names matter: server/helpers.js maps them to the error messages users see.


-- Keeps updated_at current on every UPDATE, so the server never has to set it
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;


-- ---------- Accounts ----------

CREATE TABLE users (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      text NOT NULL,
  email         text NOT NULL,
  password_hash text NOT NULL,
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_username_key UNIQUE (username),
  CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------- Vehicles ----------

CREATE TABLE vehicles (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  make            text NOT NULL,
  model           text NOT NULL,
  year            smallint NOT NULL,
  vin             varchar(17),
  current_mileage integer,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  photo           text,            -- Cloudinary link to the car's photo
  CONSTRAINT vehicles_vin_key UNIQUE (vin),
  CONSTRAINT vehicles_year_check CHECK (year >= 1900 AND year <= 2100),
  CONSTRAINT vehicles_current_mileage_check CHECK (current_mileage >= 0)
);

CREATE INDEX vehicles_user_id_idx ON vehicles (user_id);

CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------- Maintenance records ----------

CREATE TABLE maintenance_records (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id   bigint NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
  service_type text NOT NULL,
  service_date date NOT NULL,
  mileage      integer,
  cost         numeric(10,2),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  service_location text,           -- where the work was done, e.g. 'Valvoline' or 'Dealer'
  CONSTRAINT maintenance_records_mileage_check CHECK (mileage >= 0),
  CONSTRAINT maintenance_records_cost_check CHECK (cost >= 0)
);

CREATE INDEX maintenance_records_vehicle_id_service_date_idx ON maintenance_records (vehicle_id, service_date DESC);

CREATE TRIGGER maintenance_records_updated_at BEFORE UPDATE ON maintenance_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------- Reminders ----------

CREATE TABLE reminders (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id   bigint NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
  service_type text NOT NULL,
  due_date     date,
  due_mileage  integer,
  is_done      boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reminders_due_mileage_check CHECK (due_mileage >= 0),
  -- A reminder needs a due date or a due mileage
  CONSTRAINT reminders_check CHECK (due_date IS NOT NULL OR due_mileage IS NOT NULL)
);

-- Only open reminders are indexed, since those are the ones looked up most
CREATE INDEX reminders_vehicle_id_idx ON reminders (vehicle_id) WHERE (NOT is_done);


-- ---------- Posts, comments and likes ----------

CREATE TABLE posts (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  -- Deleting a tagged vehicle keeps the post and just removes the tag
  vehicle_id bigint REFERENCES vehicles (id) ON DELETE SET NULL,
  topic      text NOT NULL,      -- what the post is about, e.g. 'Brakes', used to filter the feed
  body       text,
  image_url  text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX posts_created_at_idx ON posts (created_at DESC);

CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE comments (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id    bigint NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  user_id    bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX comments_post_id_created_at_idx ON comments (post_id, created_at);

CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- The two-column primary key means a user can like a post only once
CREATE TABLE post_likes (
  post_id    bigint NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  user_id    bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);


-- ---------- AI chatbot ----------

CREATE TABLE ai_conversations (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    bigint NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  vehicle_id bigint REFERENCES vehicles (id) ON DELETE SET NULL,
  title      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_conversations_user_id_updated_at_idx ON ai_conversations (user_id, updated_at DESC);

CREATE TRIGGER ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE ai_messages (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id bigint NOT NULL REFERENCES ai_conversations (id) ON DELETE CASCADE,
  role            text NOT NULL,
  content         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_messages_role_check CHECK (role IN ('user', 'assistant'))
);

CREATE INDEX ai_messages_conversation_id_created_at_idx ON ai_messages (conversation_id, created_at);


-- ---------- Row level security ----------

-- Enabled with no policies: the tables can't be read through the database host's public API.
-- The server is unaffected because it connects as the table owner
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
