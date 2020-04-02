#!/bin/sh
api=localhost:4000/api

curl $api/profile
echo

curl $api/profile/pdm
echo

curl -X POST -H 'Content-Type: application/json' -d '{
        "username": "ammc",
        "password": "password",
        "body": "Body for profile ammc",
        "description": "Description for profile ammc"
    }' $api/profile
echo

token=$(curl -sS -X POST -H 'Content-Type: application/json' -d '{
        "username": "ammc",
        "password": "password"
    }' $api/login)
echo $token

curl -X PUT -H 'Content-Type: application/json' -H "Authorization: Bearer $token" -d '{
        "password": "New password"
    }' $api/profile
echo

token=$(curl -sS -X POST -H 'Content-Type: application/json' -d '{
        "username": "ammc",
        "password": "New password"
    }' $api/login)
echo $token

curl -X POST -H 'Content-Type: application/json' -H "Authorization: Bearer $token" -d '{
        "prompt": "Prompt for question",
        "description": "Description for question"
    }' $api/question
echo

curl $api/question/1
echo

curl -X PUT -H 'Content-Type: application/json' -H "Authorization: Bearer $token" -d '{
        "prompt": "New prompt for question",
        "description": "New description for question"
    }' $api/question/1
echo

curl $api/question/1
echo
