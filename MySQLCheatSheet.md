#MySQL commands cheat sheet#

* SHOW TABLES;
* DROP DATABASE opinionpedia;
* CREATE DATABASE opinionpedia;
* USE opinionpedia;
* SOURCE init.ddl;
* SHOW CREATE TABLE status;
* INSERT INTO `table_name`(column_1,column_2,...) VALUES (value_1,value_2,...);
* INSERT INTO `question`(id,prompt,created,updated,user_username) VALUES (1,'a question', STR_TO_DATE('07-25-2012','%m-%d-%Y'), STR_TO_DATE('07-25-2013','%m-%d-%Y'), 'alex');
* INSERT INTO `vote`(id, header, created, updated, option_id, option_question_id, option_user_username, question_id, user_username) VALUES (3,1, STR_TO_DATE('07-25-2012','%m-%d-%Y'), STR_TO_DATE('07-25-2013','%m-%d-%Y'),1,1, 'alex',1, 'alex');
* SHOW COLUMNS FROM tag;
* INSERT INTO tag(name,description,created,updated,profile_username) VALUES ('political','Use this tag to track questions that involve management over groups of people',STR_TO_DATE('01-22-2020','%m-%d-%Y'),STR_TO_DATE('01-24-2020','%m-%d-%Y'),'ammc');
* INSERT INTO question(id,prompt,description,created,updated,profile_username) VALUES (1,'Do you like the president?', 'I often here stats given by the media on the subject but id like to see for myself', STR_TO_DATE('01-17-2002','%m-%d-%Y'), STR_TO_DATE('01-27-20','%m-%d-%Y'),'ammc');
* INSERT INTO status(title,description,created,updated,profile_username) VALUES ('active','currently being displayed across the site',STR_TO_DATE('01-23-2020','%m-%d-%Y'),STR_TO_DATE('01-24-2020','%m-%d-%Y'),'ammc');
