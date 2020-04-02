# Backend

## How to install and run

```
yarn install
```

then

```
node src
```

## How to run the tests

With the backend running, do:

```
sh test.sh
```

## How to create a user and log in

```
host=localhost:4000

send_request() {
    curl -sS -X $method -H 'Content-Type: application/json' -d "$body" $host$path
}

method=POST
path=/api/profile
body='{
    "username": "ammc",
    "password": "some password",
    "body": "Body for profile ammc",
    "description": "Description for profile ammc"
}'
send_request

method=POST
path=/api/login
body='{
    "username": "ammc",
    "password": "some password"
}'
token=$(send_request)

echo Your authentication token is $token, please save it
```

## List of available routes

### Profiles

```
List     GET  http://localhost:4000/api/profile
Details  GET  http://localhost:4000/api/profile/pdm
Create   POST http://localhost:4000/api/profile
Modify   PUT  http://localhost:4000/api/profile
Login    POST http://localhost:4000/api/login
```

### Questions

```
List     GET  http://localhost:4000/api/question
Details  GET  http://localhost:4000/api/question/2
Create   POST http://localhost:4000/api/question
Modify   PUT  http://localhost:4000/api/question/2
```
