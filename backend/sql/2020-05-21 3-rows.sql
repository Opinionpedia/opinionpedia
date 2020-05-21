-- In this file, although it is unnecessary, we explicitly assign ids because
--   1) we know the database is empty so all ids start with 1, and
--   2) it is easier to read.

-- Profile 1, username ammc
-- Profile 2, username fei
-- Profile 3, username pdm
-- Profile 4, username its me gaga
INSERT INTO profile (id, username, password, salt, description, body)
VALUES (1, 'ammc', 'password', 'salt', 'Description for profile ammc',
           'Body for profile ammc'),
       (2, 'pdm', 'password', 'salt', 'Description for profile pdm',
           'Body for profile pdm'),
       (3, 'fei', 'password', 'salt', 'Description for profile fei',
           'Body for profile fei'),
       (4, 'its me gaga', 'password', 'salt',
           'Description for profile its me gaga',
           'Body for profile its me gaga');

-- Question 1, owned by profile 1
INSERT INTO question (id, profile_id, prompt, description)
VALUES (1, 1, 'Is Donald Trump a criminal?',
           'Donald Trump has had a wild 45th presidency. Lots of people say he is a criminal, but lots say he is not. Is he?');

-- Option 1, for question 1
-- Option 2, for question 1
-- Option 3, for question 1
INSERT INTO option_ (id, profile_id, question_id, prompt, description)
VALUES (1, 1, 1, 'Yes', NULL),
       (2, 1, 1, 'No', NULL),
       (3, 1, 1, 'Not sure', NULL);

-- Vote 1, profile 1 voted for option 1
-- Vote 2, profile 2 voted for option 2
-- Vote 3, profile 3 voted for option 3
-- Vote 4, profile 4 voted for option 1
INSERT INTO vote (id, profile_id, question_id, option_id, header, body,
                  description, active)
VALUES (1, 1, 1, 1, NULL, NULL, NULL, 1),
       (2, 2, 1, 2, NULL, NULL, NULL, 1),
       (3, 3, 1, 3, NULL, NULL, NULL, 1),
       (4, 4, 1, 1, NULL, NULL, NULL, 1);
