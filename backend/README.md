Opinionpedia backend
====================

Source of truth for Opinionpedia's primary data.



Getting started
===============



Pre-requisites
--------------

- Node.js 12.x
- Yarn 1.x



First steps
-----------

Build the server with:

```
yarn install
yarn build
```

Make sure you have a MySQL server you can access.

Create a file in this directory called ".env" and populate it like this:

```
HTTP_PORT=4000
JWT_SECRET=secret
DB_USER=myuser
DB_PASSWORD=mypassword
DB_DATABASE=mydatabase
```

Now run:

```
yarn start-dev
```

You should see a bunch of text scroll by as we initialize the database. If the
last message is "Listening on port 4000" then congratulations! The server
is up and running.

With the server running, run the tests with:

```
yarn test
```

Next steps:

- Practice creating a profile as described below.
- Skim the API documentation as found below.



Try creating a profile and logging in
-------------------------------------

Here's an illustrative bash script that takes some typical actions. Skim it to
get a feeling for what it does and then try giving it a run.

```bash
#!/bin/bash
host=localhost:4000

send_request() {
    local method="$1"
    local path="$2"
    local body="$3"

    curl -D - -sS -X $method \
                  -H 'Content-Type: application/json' \
                  -d "$body" $host$path
    echo
}

send_request POST /api/profile '{
    "username": "your name",
    "password": "some password",
    "description": null,
    "body": null
}'

send_request POST /api/login '{
    "username": "your name",
    "password": "some password"
}'

echo 'Your authentication token should be displayed (twice), please save it'
```



Deployment
==========

- Make sure the sources are built with `yarn build`.
- Set environment variables appropriate for the deployment environment, or use
  the `.env` file.
- Set `JWT_SECRET` to a string of random bytes.
- Run the server in production mode with `yarn start-prod`.



API
===



Table of contents
-----------------

- Profiles
  - [List profile](#list-profiles)
  - [Detail profile](#detail-profile)
  - [Create profile](#create-profile)
  - [Modify profile](#modify-profile)
  - [Login](#login)
- Questions
  - [List questions](#list-questions)
  - [Detail question](#detail-question)
  - [Create question](#create-question)
  - [Modify question](#modify-question)
- Options
  - [List options](#list-options)
  - [List options on question](#list-options-on-question)
  - [Create option](#create-option)
  - [Modify option](#modify-option)
- Votes
  - [List votes](#list-votes)
  - [List votes on question](#list-votes-on-question)
  - [Create vote](#create-vote)
  - [Modify vote](#modify-vote)



List profiles
-------------

Get details for all profiles. Only available in development mode.

```
Method: GET
Path: /api/profile
Response body: {
    id: number;
    username: string;
    description: string | null;
    body: string | null;
    created: string;
    updated: string;
}[]
Possible errors:
  - HTTP 403: Not available in production
```

Example:

```
URL: http://localhost:4000/api/profile
Response body: [{
    "id": 1,
    "username": "pdm",
    "description": "Description for profile pdm",
    "body": "Body for profile pdm",
    "created": "2020-03-31T07:00:00.000Z",
    "updated": "2020-03-31T07:00:00.000Z"
}]
```



Detail profile
--------------

Get details for a profile.

```
Method: GET
Path: /profile/:id_or_username
Params: {
    id_or_username: number | string;
}
Response body: {
    id: number;
    username: string;
    description: string | null;
    body: string | null;
    created: string;
    updated: string;
}
Possible errors:
  - HTTP 400: Invalid request parameters
  - HTTP 404: Not found
```

Example 1:

```
URL: http://localhost:4000/api/profile/123
Response body: {
    "id": 123,
    "username": "alice",
    "description": "Description for profile alice",
    "body": "Body for profile alice",
    "created": "2020-03-31T07:00:00.000Z",
    "updated": "2020-03-31T07:00:00.000Z"
}
```

Example 2:

```
URL: http://localhost:4000/api/profile/bob
Response body: (similar to example 1)
```



Create profile
--------------

Create a profile.

```
Method: POST
Path: /profile
Request body: {
    "username": string,
    "password": string,
    "description": string | null,
    "body": string | null
}
Response body: {
    "profile_id": number,
    "token": string
}
```

Example:

```
URL: http://localhost:4000/api/profile
Request body: {
    "username": "your name",
    "password": "some password",
    "description": "Description for your profile",
    "body": null,
}
Response body: {
    "profile_id": 2,
    "token": "my.jwt.here"
}
```



Modify profile
--------------

Update a profile. Only fields included in request body are modified.

```
Method: PATCH
Path: /profile
Headers: {
    "Authorization": string
}
Request body: {
    "username": string | undefined,
    "password": string | undefined,
    "description": string | undefined,
    "body": string | undefined
}
```

Example:

```
URL: http://localhost:4000/api/profile
Headers: {
    "Authorization": "Bearer my.jwt.here"
}
Request body: {
    "password": "My new password"
}
```



Login
-----

Get an authentication token for a profile.

```
Method: POST
Path: /login
Request body: {
    "username": string,
    "password": string
}
Response body: {
    "id": number,
    "token": string
}
```

Example:

```
URL: http://localhost:4000/api/login
Request body: {
    "username": "ammc",
    "password": "password"
}
Response body: {
    "id": 2,
    "token": "a.b.c"
}
```


List questions
--------------

```
Route method: GET
Route path: /question
Request URL: http://localhost:4000/api/question
```



Detail question
---------------

```
Route method: GET
Route path: /question/:question_id
Request URL: http://localhost:4000/api/question/123

req.params: {
    "question_id": 123
}
```



Create question
---------------

```
Route method: POST
Route path: /question
Request URL: http://localhost:4000/api/question

req.headers.authorization: "Bearer a.b.c"
req.body: {
    "prompt": "Prompt for question",
    "description": "Description for question",
}
```



Modify question
---------------

```
Route method: PATCH
Route path: /question/:question_id
Request URL: http://localhost:4000/api/question/123

req.headers.authorization: "Bearer a.b.c"
req.params: {
    "question_id": 123
}
req.body: {
    "prompt": "My new prompt",           // optional
    "description": "My new description"  // optional
}
```



List options
------------

```
Route method: GET
Route path: /option
Request URL: http://localhost:4000/api/option
```



List options on question
------------------------

```
Route method: GET
Route path: /option/question/:question_id
Request URL: http://localhost:4000/api/option/question/123

req.params: {
    "question_id": 123
}
```


Detail option
-------------

```
Route method: GET
Route path: /option/:option_id
Request URL: http://localhost:4000/api/option/456

req.params: {
    "option_id": 456
}
```



Create option
-------------

```
Route method: POST
Route path: /option
Request URL: http://localhost:4000/api/option

req.headers.authorization: "Bearer a.b.c"
req.body: {
    "question_id": 123,
    "prompt": "Prompt for option",
    "description": "Description for option"
}
```



Modify option
-------------

```
Route method: PATCH
Route path: /option/:option_id
Request URL: http://localhost:4000/api/option/456

req.headers.authorization: "Bearer a.b.c"
req.params: {
    "option_id": 456
}
req.body: {
    "prompt": "My new prompt",           // optional
    "description": "My new description"  // optional
}
```



List votes
----------

Get details for all votes. Only available in development mode.

```
Method: GET
Path: /vote
Response body: Vote[]
```

Example:

```
URL: http://localhost:4000/api/vote
Response body: [{
    "id": 1,
    "profile_id": 123,
    "question_id": 456,
    "option_id": 789,
    "header": 2,
    "body": "Body for vote 1",
    "description": "Description for vote 1",
    "active": 3
    "created": "2020-03-31T07:00:00.000Z",
    "updated": "2020-03-31T07:00:00.000Z"
}]
```



List votes on question
----------------------

Get details for votes on a question.

```
Method: GET
Path: /vote/question/:question_id
Params: {
    "question_id": number
}
Response body: Vote[]
```

Example:

```
URL: http://localhost:4000/api/vote/question/456
Response body: [{
    "vote_id": 1,
    "profile_id": 123,
    "question_id": 456,
    "option_id": 789,
    "header": 2,
    "body": "Body for vote 1",
    "description": "Description for vote 1",
    "active": 3
    "created": "2020-03-31T07:00:00.000Z",
    "updated": "2020-03-31T07:00:00.000Z"
}]
```


Detail vote
-----------

Get details for a vote.

```
Method: GET
Path: /vote/:vote_id
Params: {
    "vote_id": number
}
Response body: Vote
```

Example:

```
URL: http://localhost:4000/api/vote/1
Response body: [{
    "profile_id": 123,
    "question_id": 456,
    "option_id": 789,
    "header": 2,
    "body": "Body for vote 1",
    "description": "Description for vote 1",
    "active": 3
    "created": "2020-03-31T07:00:00.000Z",
    "updated": "2020-03-31T07:00:00.000Z"
}]
```



Create vote
-----------

Create a vote.

```
Method: POST
Path: /vote
Headers: {
    "Authorization": string
}
Request body: {
    "question_id": number,
    "option_id": number,
    "header": number | null,
    "body": string | null,
    "description": string | null,
    "active": number
}
Response body: {
    "vote_id": number
}
```

Example:

```
URL: http://localhost:4000/api/vote
Headers: {
    "Authorization": "Bearer a.b.c"
}
Request body: {
    "profile_id": 123,
    "question_id": 456,
    "option_id": 789,
    "header": 2,
    "body": "My body for vote",
    "description": null,
    "active": 3
}
Response body: {
    "vote_id": 1
}
```


Modify vote
-----------

Update a vote. Only fields included in request body are modified.

```
Method: PATCH
Path: /vote/:vote_id
Headers: {
    "Authorization": string
}
Request body: {
    "header": number | null | undefined,
    "body": string | null | undefined,
    "description": string | null | undefined,
    "active": number | undefined
}
```

Example:

```
URL: http://localhost:4000/api/vote/456
Headers: {
    "Authorization": "Bearer a.b.c"
}
Request body: {
    "header": 2,
    "body": null,
    "active": 4
}
```
