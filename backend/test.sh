#!/bin/bash
api=localhost:4000/api
newuser=ammc$RANDOM

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

echo PUT /profile
curl -X PUT -H 'Content-Type: application/json' -H "Authorization: Bearer $token" -d '{
        "password": "New password"
    }' $api/profile
echo

echo POST /login
token=$(curl -sS -X POST -H 'Content-Type: application/json' -d '{
        "username": "'"$newuser"'",
        "password": "New password"
    }' $api/login)
echo $token

echo POST /question
curl -X POST -H 'Content-Type: application/json' -H "Authorization: Bearer $token" -d '{
        "prompt": "Prompt for question",
        "description": "Description for question"
    }' $api/question
echo

echo GET /question/1
curl $api/question/1
echo

echo PUT /question/1
curl -X PUT -H 'Content-Type: application/json' -H "Authorization: Bearer $token" -d '{
        "prompt": "New prompt for question",
        "description": "New description for question"
    }' $api/question/1
echo

echo GET /question/1
curl $api/question/1
echo
