# Row Level Security (RLS) Policies

FamilyNotify משתמש ב-Row Level Security של Supabase להגנה על הנתונים.

## הפעלת RLS על כל הטבלאות

\`\`\`sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
\`\`\`

## Policies לטבלת Users

\`\`\`sql
-- Users can view their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow signup (insert)
CREATE POLICY "Allow user signup"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
\`\`\`

## Policies לטבלת FamilyGroups

\`\`\`sql
-- Members can view their groups
CREATE POLICY "Members view groups"
  ON family_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.family_group_id = family_groups.id
      AND memberships.user_id = auth.uid()
    )
  );

-- Anyone can create a group (for onboarding)
CREATE POLICY "Anyone can create group"
  ON family_groups FOR INSERT
  WITH CHECK (true);

-- Only admins can update/delete groups
CREATE POLICY "Admins can update groups"
  ON family_groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.family_group_id = family_groups.id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'ADMIN'
    )
  );
\`\`\`

## Policies לטבלת Memberships

\`\`\`sql
-- Members can view other members in their groups
CREATE POLICY "View group members"
  ON memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships m2
      WHERE m2.family_group_id = memberships.family_group_id
      AND m2.user_id = auth.uid()
    )
  );

-- Users can join groups
CREATE POLICY "Users can join groups"
  ON memberships FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can manage memberships
CREATE POLICY "Admins manage memberships"
  ON memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM memberships m2
      WHERE m2.family_group_id = memberships.family_group_id
      AND m2.user_id = auth.uid()
      AND m2.role = 'ADMIN'
    )
  );
\`\`\`

## Policies לטבלת Preferences

\`\`\`sql
-- Users can view and manage their own preferences
CREATE POLICY "Users manage own preferences"
  ON preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
\`\`\`

## Policies לטבלת Announcements

\`\`\`sql
-- Members can view announcements in their groups
CREATE POLICY "Members view announcements"
  ON announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.family_group_id = announcements.family_group_id
      AND memberships.user_id = auth.uid()
    )
  );

-- Admins and Editors can create announcements
CREATE POLICY "Admins create announcements"
  ON announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.family_group_id = announcements.family_group_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('ADMIN', 'EDITOR')
    )
  );

-- Creators can update their own announcements
CREATE POLICY "Creators update announcements"
  ON announcements FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Admins can delete any announcement in their group
CREATE POLICY "Admins delete announcements"
  ON announcements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.family_group_id = announcements.family_group_id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'ADMIN'
    )
  );
\`\`\`

## Policies לטבלת Events

\`\`\`sql
-- Members can view events in their groups
CREATE POLICY "Members view events"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.family_group_id = events.family_group_id
      AND memberships.user_id = auth.uid()
    )
  );

-- Admins and Editors can create events
CREATE POLICY "Admins create events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.family_group_id = events.family_group_id
      AND memberships.user_id = auth.uid()
      AND memberships.role IN ('ADMIN', 'EDITOR')
    )
  );

-- Similar UPDATE and DELETE policies as announcements
\`\`\`

## Policies לטבלת DeliveryAttempts

\`\`\`sql
-- Users can view their own delivery attempts
CREATE POLICY "Users view own attempts"
  ON delivery_attempts FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all attempts in their groups
CREATE POLICY "Admins view group attempts"
  ON delivery_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM announcements
      JOIN memberships ON memberships.family_group_id = announcements.family_group_id
      WHERE announcements.id = delivery_attempts.item_id
      AND delivery_attempts.item_type = 'ANNOUNCEMENT'
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'ADMIN'
    )
    OR
    EXISTS (
      SELECT 1 FROM events
      JOIN memberships ON memberships.family_group_id = events.family_group_id
      WHERE events.id = delivery_attempts.item_id
      AND delivery_attempts.item_type = 'EVENT'
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'ADMIN'
    )
  );

-- System (service role) can insert/update for dispatch
-- No policy needed for service role, uses bypass
\`\`\`

## Policies לטבלת Topics

\`\`\`sql
-- Members can view topics in their groups
CREATE POLICY "Members view topics"
  ON topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.family_group_id = topics.family_group_id
      AND memberships.user_id = auth.uid()
    )
  );

-- Admins can manage topics
CREATE POLICY "Admins manage topics"
  ON topics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.family_group_id = topics.family_group_id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'ADMIN'
    )
  );
\`\`\`

## Policies לטבלת Consents

\`\`\`sql
-- Users can view their own consents
CREATE POLICY "Users view own consents"
  ON consents FOR SELECT
  USING (user_id = auth.uid());

-- Users can create consent records
CREATE POLICY "Users create consents"
  ON consents FOR INSERT
  WITH CHECK (user_id = auth.uid());
\`\`\`

## הפעלה

להפעלת כל ה-policies:

1. התחברו ל-Supabase Dashboard
2. עברו ל-SQL Editor
3. הריצו את כל הפקודות לעיל
4. בדקו ב-Table Editor שכל הטבלאות מוגנות (🔒 icon)

## בדיקה

\`\`\`sql
-- Test: Try to view another user's data (should return empty)
SELECT * FROM preferences WHERE user_id != auth.uid();

-- Test: Try to create announcement in group you're not admin
INSERT INTO announcements (title, body, family_group_id, created_by)
VALUES ('Test', 'Test', '[some-group-id]', auth.uid());
-- Should fail if you're not admin

-- Test: View your own data (should work)
SELECT * FROM preferences WHERE user_id = auth.uid();
\`\`\`

## Service Role

שירותי הבקאנד (API routes, Cron jobs) משתמשים ב-Service Role Key שעוקף את ה-RLS.
זהירות: אל תחשפו את ה-Service Role Key בצד הקליינט!



