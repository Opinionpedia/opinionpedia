# Backend

## How to install and run

```
yarn install
yarn build
yarn start
```

## How to run the tests

With the backend running, do:

```
sh test.sh
```

The test script hard codes some things and works best if it is run on a clean,
just-started instance of the server. It could be improved.

## How to create a user and log in

Here is an illustrative bash script that takes some typical actions:

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
send_request >/dev/null

method=POST
path=/api/login
body='{
    "username": "ammc",
    "password": "some password"
}'
token=$(send_request)

echo Your authentication token is $token, please save it
```

Although note that in the above example an authentication token is also sent
when a profile is created, so you don't actually need to login immediately
after creating a profile.

## List of available routes

### Profiles

```
List     GET  http://localhost:4000/api/profile
Details  GET  http://localhost:4000/api/profile/123
Details  GET  http://localhost:4000/api/profile/pdm
Create   POST http://localhost:4000/api/profile
Modify   PUT  http://localhost:4000/api/profile
Login    POST http://localhost:4000/api/login
```

Note: For profiles, you can get the details for a profile by using either that
profile's id or username.

### Questions

```
List     GET  http://localhost:4000/api/question
Details  GET  http://localhost:4000/api/question/123
Create   POST http://localhost:4000/api/question
Modify   PUT  http://localhost:4000/api/question/123
```

### Options

```
List     GET  http://localhost:4000/api/option
List     GET  http://localhost:4000/api/option/question/123
Details  GET  http://localhost:4000/api/option/456
Create   POST http://localhost:4000/api/option
Modify   PUT  http://localhost:4000/api/option/456
```
