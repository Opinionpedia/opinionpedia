-- Ids in all tables are set to AUTO_INCREMENT, but we explicitly assign them
-- in this file so we can use them as foreign keys.

-- Profile 1, username ammc
-- Profile 2, username fei
-- Profile 3, username pdm
-- Profile 4, username its me gaga
INSERT INTO profile (id, username, password, salt, description, body)
VALUES (1, 'ammc', 'password', 'salt', NULL, NULL),
       (2, 'pdm', 'password', 'salt', NULL, NULL),
       (3, 'fei', 'password', 'salt', NULL, NULL),
       (4, 'its me gaga', 'password', 'salt', NULL, NULL);

-- Question 1, owned by profile 1
INSERT INTO question (id, profile_id, prompt, description)
VALUES (1, 1, 'Is Donald Trump a good president?',
           'I want to know what the people think about the American president');

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

-- Tag 1, intended for questions
-- Tag 2, intended for profiles
INSERT INTO tag (id, profile_id, name, description)
VALUES (1, 2, 'Political', NULL),
       (2, 2, 'Man', 'Identifies as man');

-- Profile 2 has tag 2.
INSERT INTO profile_tag (tag_id, profile_id)
VALUES (2, 2);

-- Question 1 has tag 1.
INSERT INTO question_tag (tag_id, question_id)
VALUES (1, 1);
