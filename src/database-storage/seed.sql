-- Seed initial test user (password is 'password123' hashed with bcrypt)
INSERT INTO users (email, password_hash) 
VALUES ('admin@enterprise.com', '$2b$10$E1E8qH/1c2a13E78eHkS.O9P2Y8rW2aFk6xR1xG3e6vG9P2Y8rW2a')
ON CONFLICT (email) DO NOTHING;

-- Seed initial habit
INSERT INTO habits (user_id, title, description, frequency, reminder_time, tags)
VALUES (1, 'Morning Meditations', 'Start the day with 10 mins of mindfulness', 'daily', '07:00', ARRAY['health', 'mindfulness'])
ON CONFLICT DO NOTHING;

-- Seed initial tracking log
INSERT INTO tracking_logs (habit_id, user_id, completed_date)
VALUES (1, 1, CURRENT_DATE)
ON CONFLICT DO NOTHING;
