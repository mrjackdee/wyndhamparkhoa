DO $$ BEGIN CREATE TYPE wphoa.enum_spotlights_status AS ENUM ('draft','published'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE wphoa.enum__spotlights_v_version_status AS ENUM ('draft','published'); EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE TABLE IF NOT EXISTS wphoa.spotlights (
 id serial PRIMARY KEY, title varchar, introduction varchar, meeting_date timestamptz,
 recap_id integer REFERENCES wphoa.news(id) ON DELETE SET NULL, recap_label varchar DEFAULT 'Read the meeting recap',
 photos_approved boolean DEFAULT false, source varchar, featured boolean DEFAULT false, archived boolean DEFAULT false,
 featured_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(),
 _status wphoa.enum_spotlights_status DEFAULT 'draft'
);
CREATE TABLE IF NOT EXISTS wphoa.spotlights_recognitions (
 _order integer NOT NULL, _parent_id integer NOT NULL REFERENCES wphoa.spotlights(id) ON DELETE CASCADE,
 id varchar PRIMARY KEY NOT NULL, name varchar, role varchar, message varchar,
 photo_id integer REFERENCES wphoa.media(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS wphoa._spotlights_v (
 id serial PRIMARY KEY, parent_id integer REFERENCES wphoa.spotlights(id) ON DELETE SET NULL,
 version_title varchar, version_introduction varchar, version_meeting_date timestamptz,
 version_recap_id integer REFERENCES wphoa.news(id) ON DELETE SET NULL, version_recap_label varchar DEFAULT 'Read the meeting recap',
 version_photos_approved boolean DEFAULT false, version_source varchar, version_featured boolean DEFAULT false,
 version_archived boolean DEFAULT false, version_featured_at timestamptz,
 version_updated_at timestamptz, version_created_at timestamptz,
 version__status wphoa.enum__spotlights_v_version_status DEFAULT 'draft',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), latest boolean
);
CREATE TABLE IF NOT EXISTS wphoa._spotlights_v_version_recognitions (
 _order integer NOT NULL, _parent_id integer NOT NULL REFERENCES wphoa._spotlights_v(id) ON DELETE CASCADE,
 id serial PRIMARY KEY NOT NULL, name varchar, role varchar, message varchar,
 photo_id integer REFERENCES wphoa.media(id) ON DELETE SET NULL, _uuid varchar
);
ALTER TABLE wphoa.payload_locked_documents_rels ADD COLUMN IF NOT EXISTS spotlights_id integer REFERENCES wphoa.spotlights(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS spotlights_status_idx ON wphoa.spotlights (_status);
CREATE INDEX IF NOT EXISTS spotlights_featured_at_idx ON wphoa.spotlights (featured_at);
CREATE INDEX IF NOT EXISTS spotlights_recap_idx ON wphoa.spotlights (recap_id);
CREATE INDEX IF NOT EXISTS spotlights_recognitions_parent_idx ON wphoa.spotlights_recognitions (_parent_id, _order);
CREATE INDEX IF NOT EXISTS spotlights_v_parent_idx ON wphoa._spotlights_v (parent_id);
CREATE INDEX IF NOT EXISTS spotlights_v_recognitions_parent_idx ON wphoa._spotlights_v_version_recognitions (_parent_id, _order);
ALTER TABLE wphoa.spotlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE wphoa.spotlights_recognitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wphoa._spotlights_v ENABLE ROW LEVEL SECURITY;
ALTER TABLE wphoa._spotlights_v_version_recognitions ENABLE ROW LEVEL SECURITY;
