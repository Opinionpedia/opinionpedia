#!/bin/bash
api=localhost:4000/api
newuser=ammc$RANDOM

echo ===============
echo TESTING PROFILE
echo ===============

echo GET /profile
curl $api/profile
echo

echo GET /profile/1
curl $api/profile/1
echo

echo GET /profile/pdm
curl $api/profile/pdm
echo

echo POST /profile
curl -X POST -H 'Content-Type: application/json' -d '{
        "username": "'"$newuser"'",
        "password": "password",
        "description": "Description for profile ammc",
        "body": "Body for profile ammc"
    }' $api/profile
echo

echo POST /login
token=$(curl -sS -X POST -H 'Content-Type: application/json' -d '{
        "username": "'"$newuser"'",
        "password": "password"
    }' $api/login)
echo $token

echo PATCH /profile
curl -X PATCH -H 'Content-Type: application/json' -H "Authorization: Bearer $token" -d '{
        "password": "New password"
    }' $api/profile
echo

echo POST /login
token=$(curl -sS -X POST -H 'Content-Type: application/json' -d '{
        "username": "'"$newuser"'",
        "password": "New password"
    }' $api/login)
echo $token

echo
echo ================
echo TESTING QUESTION
echo ================

echo POST /question
curl -X POST -H 'Content-Type: application/json' -H "Authorization: Bearer $token" -d '{
        "prompt": "Prompt for question",
        "description": "Description for question"
    }' $api/question
echo

echo GET /question/1
curl $api/question/1
echo

echo PATCH /question/1
curl -X PATCH -H 'Content-Type: application/json' -H "Authorization: Bearer $token" -d '{
        "prompt": "New prompt for question",
        "description": "New description for question"
    }' $api/question/1
echo

echo GET /question/1
curl $api/question/1
echo

echo
echo ==============
echo TESTING OPTION
echo ==============

echo GET /option
curl $api/option
echo

echo POST /option
curl -X POST -H 'Content-Type: application/json' -H "Authorization: Bearer $token" -d '{
        "question_id": 1,
        "prompt": "Prompt for option",
        "description": "Description for option"
    }' $api/option
echo

echo GET /option/1
curl $api/option/1
echo

echo PATCH /option/1
curl -X PATCH -H 'Content-Type: application/json' -H "Authorization: Bearer $token" -d '{
        "prompt": "New prompt for option",
        "description": "New description for option"
    }' $api/option/1
echo

echo GET /option/1
curl $api/option/1
echo

echo GET /option/question/1
curl $api/option/question/1
echo

echo
echo ==============
echo TESTING VOTE
echo ==============

echo GET /vote
curl $api/vote
echo

echo POST /vote
curl -X POST -H 'Content-Type: application/json' -H "Authorization: Bearer $token" -d '{
        "profile_id": 2,
        "question_id": 1,
        "option_id": 1,
        "header": "My header for vote",
        "body": "My body for vote",
        "description": "My description for vote",
        "active": 3
    }' $api/vote
echo

echo GET /vote/1
curl $api/vote/1
echo

echo PATCH /vote/1
curl -X PATCH -H 'Content-Type: application/json' -H "Authorization: Bearer $token" -d '{
        "header": "My new header for vote",
        "body": "My new body for vote",
        "description": "My new description for vote",
        "active": 4
    }' $api/vote/1
echo

echo GET /vote/1
curl $api/vote/1
echo

echo GET /vote/question/1
curl $api/vote/question/1
echo
