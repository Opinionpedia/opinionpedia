Opinionpedia backend
====================

![Tests](https://github.com/Opinionpedia/opinionpedia/workflows/Tests/badge.svg)

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
JWT_SECRET=mysecret
DB_HOST=localhost
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



Development
===========

Run the linter with `yarn lint` before pushing. GitHub is set to run the linter
and try building the project in its CI, so it will notice if lint has any
errors.



API
===



Table of contents
-----------------

- Profiles
  - [List profiles](#list-profiles)
  - [Detail profile](#detail-profile)
  - [Create profile](#create-profile)
  - [Modify profile](#modify-profile)
  - [Login](#login)
- Questions
  - [List questions](#list-questions)
  - [Detail question](#detail-question)
  - [Create question](#create-question)
  - [Modify question](#modify-question)
  - [Get question suggestions](#get-question-suggestions)
  - [Get vote table](#get-vote-table)
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
- Tags
  - [List tags](#list-tags)
  - [Detail tag](#detail-tag)
  - [Create tag](#create-tag)
  - [Modify tag](#modify-tag)
- Profile tags
  - [List tags on profile](#list-tags-on-profile)
  - [Create profile tag](#create-profile-tag)
- Question tags
  - [List tags on question](#list-tags-on-question)
  - [Create question tag](#create-question-tag)



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



Get question suggestions
------------------------

Get a list of up to three questions with tags similar to the chosen question.
The questions are purposefully selected with an element of randomness, so
repeated calls to this route may produce different responses for the same
inputs.

The algorithm used to select the questions is the following:

1. Create an empty list of question suggestions.
2. Get the list of question tags on the requested question.
3. Search the database for other questions with all of those same tags. Add
   those to the list.
4. If the list has three or more items, pick 3 at random and return.
5. Repeat steps 3 and 4, but search for questions with all but one of the tags.
6. Repeat steps 3 and 4, but search for questions with all but two of the tags.
7. Etc, until we run out of tags. Return what we have at the end.

```
Method: GET
Path: /api/question/:question_id/suggestions
Params: {
    question_id: number;
}
Response body: number[];
Possible errors:
  - HTTP 404: Resource not found
```

Example:

```
URL: http://localhost:4000/api/question/123/suggestions
Response body: [
    1072,
    12,
    889
]
```



Get vote table
--------------

Produces a 2-D array of vote count statistics on a question.

Within the 2-D array, the outer index is option\_id and the inner index is a
tag\_id.

After using this call, you will need to [fetch tag details](#detail-tag) to
learn the names of these tags.

```
Method: GET
Path: /question/:question_id/vote_table
Response body: {
    [option_id: string]: {
        total: number;
        [tag_id: string]: number;
    };
}
Possible errors:
  - HTTP 404: Resource not found
```

Example:

Suppose the database has the following data in it at the time of a call:

- Suppose question 1 has three options with ids 10, 20, and 30.
- Suppose option 10 has three votes, one of which is by a profile tagged
  with tag\_ids 100 and 200, and the other two of which have no tags.
- Suppose option 20 has five votes, each by profiles tagged with tag\_ids 300
  and 400.
- Suppose option 30 has no votes.

```
URL: http://localhost:4000/api/question/1/vote_table
Response body: {
    "10": {
        total: 3,
        "100": 1,
        "200": 1
    },
    "20": {
        total: 5,
        "300": 5,
        "400": 5
    }
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



List tags
---------

Get details for all tags.

```
Method: GET
Path: /tag
Response body: {
    id: number;
    profile_id: number;
    name: string;
    description: string | null;
    created: string;
    updated: string;
}[]
```

Example:

```
URL: http://localhost:4000/api/tag
Response body: [{
    "id": 1,
    "profile_id": 123,
    "name": "Name for tag 1",
    "description": "Description for tag 1",
    "created": "2020-03-31T07:00:00.000Z",
    "updated": "2020-03-31T07:00:00.000Z"
}]
```



Detail tag
-----------

Get details for a tag.

```
Method: GET
Path: /tag/:tag_id
Params: {
    "tag_id": number;
}
Response body: {
    id: number;
    profile_id: number;
    name: string;
    description: string | null;
    created: string;
    updated: string;
}
```

Example:

```
URL: http://localhost:4000/api/tag/1
Response body: {
    "id": 1,
    "profile_id": 123,
    "name": "Name for tag 1",
    "description": "Description for tag 1",
    "created": "2020-03-31T07:00:00.000Z",
    "updated": "2020-03-31T07:00:00.000Z"
}
```



Create tag
-----------

Create a tag.

```
Method: POST
Path: /tag
Headers: {
    Authorization: string;
}
Request body: {
    name: string;
    description: string | null;
}
Response body: {
    tag_id: number;
}
```

Example:

```
URL: http://localhost:4000/api/tag
Headers: {
    "Authorization": "Bearer my.jwt.here"
}
Request body: {
    "name": "My name for tag",
    "description": null
}
Response body: {
    "tag_id": 1
}
```


Modify tag
-----------

Update a tag. Only fields included in request body are modified.

```
Method: PATCH
Path: /tag/:tag_id
Headers: {
    Authorization: string;
}
Request body: {
    name: string | undefined;
    description: string | null | undefined;
}
```

Example:

```
URL: http://localhost:4000/api/tag/456
Headers: {
    "Authorization": "Bearer my.jwt.here"
}
Request body: {
    "description": null
}
```



List tags on profile
--------------------

Get list of tags on a profile.

```
Method: GET
Path: /tag/profile/:profile_id
Params: {
    profile_id: number;
}
Response body: {
    tag_id: number;
    name: string;
    description: string | null;
}[]
```

Example:

```
URL: http://localhost:4000/api/tag/profile/123
Response body: [{
    "tag_id": 456,
    "name": "Man",
    "description": "Identifies as man"
}]
```


Create profile tag
------------------

Adds a tag to the current profile. The current profile is implied via the
JWT in the Authorization header.

```
Method: POST
Path: /vote
Headers: {
    Authorization: string;
}
Request body: {
    tag_id: number;
}
```

Example:

```
URL: http://localhost:4000/api/vote
Headers: {
    Authorization: "Bearer my.jwt.here"
}
Request body: {
    "tag_id": 456
}
```



List tags on question
---------------------

Get list of tags on a question.

```
Method: GET
Path: /tag/question/:question_id
Params: {
    question_id: number;
}
Response body: {
    tag_id: number;
    name: string;
    description: string | null;
}[]
```

Example:

```
URL: http://localhost:4000/api/tag/question/123
Response body: [{
    "tag_id": 456,
    "name": "Man",
    "description": "Identifies as man"
}]
```


Create question tag
-------------------

Adds a tag to a question.

Any user can tag a question, but they must be logged in.

```
Method: POST
Path: /vote
Headers: {
    Authorization: string;
}
Request body: {
    tag_id: number;
    question_id: number;
}
```

Example:

```
URL: http://localhost:4000/api/vote
Headers: {
    Authorization: "Bearer my.jwt.here"
}
Request body: {
    "tag_id": 456,
    "question_id": 123
}
```
