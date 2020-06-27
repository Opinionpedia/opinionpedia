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
  - [Delete vote](#delete-vote)
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
  - [List questions with tag](#list-questions-with-tag)
  - [Create question tag](#create-question-tag)



List profiles
-------------

Get details for all profiles, including IP address profiles. Only available in
development mode.

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
URL: GET http://localhost:4000/api/profile

Response body: [
    {
        "id": 1,
        "username": "alice",
        "description": "Alice's description of herself",
        "body": "Alice's body for herself",
        "created": "2020-03-31T07:00:00.000Z",
        "updated": "2020-03-31T07:00:00.000Z"
    },
    {
        "id": 2,
        "username": "bob",
        "description": "Bob's description for himself",
        "body": "Bob's body for himself",
        "created": "2020-03-31T07:00:00.000Z",
        "updated": "2020-03-31T07:00:00.000Z"
    }
]
```



Detail profile
--------------

Get details for a profile.

Trying to fetch an IP address profile will result in an "invalid request
parameters" error.

```
Method: GET
Path: /api/profile/:id_or_username
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

Example 1 - profile ID:

```
URL: GET http://localhost:4000/api/profile/123

Response body: {
    "id": 123,
    "username": "alice",
    "description": "Alice's description",
    "body": null,
    "created": "2020-03-31T07:00:00.000Z",
    "updated": "2020-03-31T07:00:00.000Z"
}
```

Example 2 - username:

```
URL: GET http://localhost:4000/api/profile/bob

Response body: {
    "id": 456,
    "username": "bob",
    "description": null,
    "body": "Bob's body",
    "created": "2020-03-31T07:00:00.000Z",
    "updated": "2020-03-31T07:00:00.000Z"
}
```



Create profile
--------------

Create a profile.

Usernames cannot be numbers or IP addresses.

An already used username will result in an HTTP 400. A profile\_id and login
token are returned to spare the need for a subsequent /login call.

```
Method: POST
Path: /api/profile
Request body: {
    username: string;
    password: string;
    description: string | null;
    body: string | null;
}

Response body: {
    profile_id: number;
    token: string;
}
Possible errors:
  - HTTP 400: Already exists
  - HTTP 400: Invalid request parameters
```

Example:

```
URL: POST http://localhost:4000/api/profile
Request body: {
    "username": "alice",
    "password": "My super secret password, shhhh",
    "description": "A little about me...",
    "body": null
}

Response body: {
    "profile_id": 3,
    "token": "my.jwt.here"
}
```



Modify profile
--------------

Update a profile. Only fields included in the request body are modified. IP
address profiles cannot be modified.

Usernames cannot be numbers or IP addresses.
```
Method: PATCH
Path: /api/profile
Headers: {
    Authorization: string;
}
Request body: {
    username: string | undefined;
    password: string | undefined;
    description: string | undefined;
    body: string | undefined;
}

No response body.
Possible errors:
  - HTTP 400: Invalid Authorization header: malformed or expired value
  - HTTP 400: Invalid request parameters
  - HTTP 403: Missing Authorization header
```

Example:

```
URL: PATCH http://localhost:4000/api/profile
Headers: {
    Authorization: "Bearer my.jwt.here"
}
Request body: {
    "password": "My new password"
}

No response body.
```



Login
-----

Get an authentication token for a profile. Also provides the id of the profile.

Usernames cannot be numbers or IP addresses. Returns an HTTP 404 if the
username was not found. Returns an HTTP 403 if the password was incorrect.

```
Method: POST
Path: /api/login
Request body: {
    username: string;
    password: string;
}

Response body: {
    profile_id: number;
    token: string;
}
Possible errors:
  - HTTP 400: Invalid request parameters
  - HTTP 403: Incorrect password
  - HTTP 404: Resource not found
```

Example:

```
URL: POST http://localhost:4000/api/login
Request body: {
    "username": "alice",
    "password": "My password"
}

Response body: {
    "profile_id": 2,
    "token": "my.jwt.here"
}
```



List questions
--------------

Get details for all questions. Only available in development mode.

The profile\_id for a question is its owner.

```
Method: GET
Path: /api/question

Response body: {
    id: number;
    profile_id: number;
    prompt: string;
    description: string;
    created: string;
    updated: string;
}[]
Possible errors:
  - HTTP 403: Not available in production
```

Example:

```
URL: GET http://localhost:4000/api/question

Response body: [
    {
        id: 1,
        profile_id: 5,
        prompt: "What is your favorite children's book?",
        description: "I'm looking for ideas for my niece.",
        created: "2020-06-20T20:00:00.000Z",
        updated: "2020-06-20T20:00:00.000Z"
    },
    {
        id: 2,
        profile_id: 5,
        prompt: "Are landscape photos better at sunrise or sunset?",
        description: "I've been wondering about this for a while.",
        created: "2020-06-20T20:00:00.000Z",
        updated: "2020-06-20T20:00:00.000Z"
    }
]
```



Detail question
---------------

Get details for a question.

The profile\_id for a question is its owner.

```
Method: GET
Path: /api/question/:question_id
Params: {
    question_id: number;
}

Possible errors:
  - HTTP 404: Not found
```

Example:

```
URL: GET http://localhost:4000/api/question/123

Reponse body: {
    id: 123,
    profile_id: 5,
    prompt: "Are there any topics that are off-limits for humor?",
    description: "Most people I know have strong opinions about this.",
    created: "2020-06-20T20:00:00.000Z",
    updated: "2020-06-20T20:00:00.000Z"
}
```



Create question
---------------

Create a question. The question is owned by the profile that created it.

```
Method: POST
Path: /api/question
Headers: {
    Authorization: string;
}
Request body: {
    prompt: string;
    description: string;
}

Reponse body: {
    question_id: number;
}
Possible errors:
  - HTTP 400: Invalid Authorization header: malformed or expired value
  - HTTP 400: Invalid request parameters
  - HTTP 403: Missing Authorization header
```

Example:

```
URL: POST http://localhost:4000/api/question
Headers: {
    Authorization: "Bearer my.jwt.here"
}
Request body: {
    "prompt": "Is a hotdot a sandwhich?",
    "description": "Let's figure it out once and for all!"
}

Response body: {
    "question_id": 15
}
```



Modify question
---------------

Update a question. Only fields included in the request body are modified.

Questions can only be modifed by their owner.

```
Method: PATCH
Path: /api/question/:question_id
Headers: {
    Authorization: string;
}
Params: {
    question_id: number;
}
Request body: {
    prompt: string | undefined;
    description: string | undefined;
}

No response body.
Possible errors:
  - HTTP 400: Invalid Authorization header: malformed or expired value
  - HTTP 400: Invalid request parameters
  - HTTP 403: Missing Authorization header
  - HTTP 403: Not owner
  - HTTP 404: Not found
```

Example:

```
URL: PATCH http://localhost:4000/api/question/123
Headers: {
    Authorization: "Bearer my.jwt.here"
}
Request body: {
    "prompt": "Which book has aged the least well?"
}

No response body.
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
URL: GET http://localhost:4000/api/question/123/suggestions

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
Path: /api/question/:question_id/vote_table
Params: {
    question_id: number;
}

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
URL: GET http://localhost:4000/api/question/1/vote_table

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

Get details for all option (includes options from every question). Only
available in development mode.

The profile\_id for an option is its owner.

```
Method: GET
Path: /api/option

Response body: {
    id: number;
    profile_id: number;
    question_id: number;
    prompt: string;
    description: string | null;
    created: string;
    updated: string;
}[]
Possible errors:
  - HTTP 403: Not available in production
```

Example:

```
URL: GET http://localhost:4000/api/option

Response body: [
    {
        "id": 1,
        "profile_id": 5,
        "question_id": 1,
        "prompt": "Apples",
        "description": null,
        "created": "2020-06-20T21:30:00.000Z",
        "updated": "2020-06-20T21:30:00.000Z"
    },
    {
        "id": 2,
        "profile_id": 5,
        "question_id": 1,
        "prompt": "Bananas",
        "description": null,
        "created": "2020-06-20T21:30:00.000Z",
        "updated": "2020-06-20T21:30:00.000Z"
    },
    {
        "id": 3,
        "profile_id": 8,
        "question_id": 2,
        "prompt": "George Washington",
        "description": null,
        "created": "2020-06-20T21:30:00.000Z",
        "updated": "2020-06-20T21:30:00.000Z"
    }
]
```



List options on question
------------------------

Get details for all options on a particular question.

If the question does not exist it returns an empty array.

The profile\_id for an option is its owner.

```
Method: GET
Path: /api/option/question/:question_id
Params: {
    question_id: number;
}

Response body: {
    id: number;
    profile_id: number;
    question_id: number;
    prompt: string;
    description: string | null;
    created: string;
    updated: string;
}[]
Possible errors:
  - None
```

Example:

```
URL: GET http://localhost:4000/api/option/question/123

Response body: [
    {
        "id": 1,
        "profile_id": 2,
        "question_id": 1,
        "prompt": "Agree",
        "description": null,
        "created": "2020-06-20T21:30:00.000Z",
        "updated": "2020-06-20T21:30:00.000Z"
    },
    {
        "id": 2,
        "profile_id": 2,
        "question_id": 1,
        "prompt": "Disagree",
        "description": null,
        "created": "2020-06-20T21:30:00.000Z",
        "updated": "2020-06-20T21:30:00.000Z"
    }
```



Detail option
-------------

Gets details for a particular option.

The profile\_id for an option is its owner.

```
Method: GET
Path: /api/option/:option_id
Params: {
    option_id: number;
}

Response body: {
    id: number;
    profile_id: number;
    question_id: number;
    prompt: string;
    description: string | null;
    created: string;
    updated: string;
}
Possible errors:
  - HTTP 404: Not found
```

Example:

```
URL: GET http://localhost:4000/api/option/5

Response body: {
    "id": 5,
    "profile_id": 1,
    "question_id": 2,
    "prompt": "Canadian",
    "description": null,
    "created": "2020-06-20T21:30:00.000Z",
    "updated": "2020-06-20T21:30:00.000Z"
}
```



Create option
-------------

Create an option on a question. The option is owned by the profile that created it.

```
Method: POST
Path: /api/option
Headers: {
    Authorization: string;
}
Request body: {
    question_id: number;
    prompt: string;
    description: string | null;
}

Response body: {
    option_id: number;
}
Possible errors:
  - HTTP 400: Invalid Authorization header: malformed or expired value
  - HTTP 400: Invalid request parameters
  - HTTP 403: Missing Authorization header
  - HTTP 403: Not owner
  - HTTP 404: Referenced resource not found
```

Example:

```
URL: POST http://localhost:4000/api/option
Headers: {
    Authorization: "Bearer my.jwt.here"
}
Request body: {
    "question_id": 6,
    "prompt": "Hiking",
    "description": null
}

Response body: {
    "option_id": 15
}
```



Modify option
-------------

Updates an option. Only fields included in the request body are modified.

Options can only be modified by their owner.

```
Method: PATCH
Path: /api/option/:option_id
Headers: {
    Authorization: string;
}
Params: {
    option_id: number;
}
Request body: {
    prompt: string | undefined;
    description: string | null | undefined;
}

No response body.
Possible errors:
  - HTTP 400: Invalid Authorization header: malformed or expired value
  - HTTP 400: Invalid request parameters
  - HTTP 403: Missing Authorization header
  - HTTP 403: Not owner
  - HTTP 404: Not found
```

Example:

```
URL: PATCH http://localhost:4000/api/option/427
Headers: {
    Authorization: "Bearer my.jwt.here"
}
Request body: {
    "prompt": "Greek salad"
}

No response body.
```



List votes
----------

Get details for all votes (includes votes from every option). Only available in development mode.

```
Method: GET
Path: /api/vote

Response body: {
    id: number;
    profile_id: number;
    question_id: number;
    option_id: number;
    header: number | null;
    body: string | null;
    description: string | null;
    active: number;
    create: string;
    updated: string;
}[]
Possible errors:
  - HTTP 403: Not available in production
```

Example:

```
URL: GET http://localhost:4000/api/vote

Response body: [
    {
        "id": 1,
        "profile_id": 2,
        "question_id": 6,
        "option_id": 10,
        "header": 1,
        "body": null,
        "description": null,
        "active": 1
        "created": "2020-06-20T22:00:00.000Z",
        "updated": "2020-06-20T22:00:00.000Z"
    },
    {
        "id": 2,
        "profile_id": 3,
        "question_id": 6,
        "option_id": 10,
        "header": 2,
        "body": null,
        "description": null,
        "active": 1
        "created": "2020-06-20T22:00:00.000Z",
        "updated": "2020-06-20T22:00:00.000Z"
    }
]
```



List votes on question
----------------------

Get details for all votes on a question.

If the question does not exist it returns an empty array.

```
Method: GET
Path: /api/vote/question/:question_id
Params: {
    question_id: number;
}

Response body: {
    id: number;
    profile_id: number;
    question_id: number;
    option_id: number;
    header: number | null;
    body: string | null;
    description: string | null;
    active: number;
    create: string;
    updated: string;
}[]
Possible errors:
  - None
```

Example:

```
URL: GET http://localhost:4000/api/vote/question/9

Response body: [
    {
        "id": 2,
        "profile_id": 1,
        "question_id": 9,
        "option_id": 23,
        "header": 1,
        "body": null,
        "description": null,
        "active": 1
        "created": "2020-06-20T22:00:00.000Z",
        "updated": "2020-06-20T22:00:00.000Z"
    },
    {
        "id": 5,
        "profile_id": 4,
        "question_id": 9,
        "option_id": 24,
        "header": 2,
        "body": null,
        "description": null,
        "active": 1
        "created": "2020-06-20T22:00:00.000Z",
        "updated": "2020-06-20T22:00:00.000Z"
    }
]
```



Detail vote
-----------

Get details for a vote.

```
Method: GET
Path: /api/vote/:vote_id
Params: {
    vote_id: number;
}

Response body: {
    id: number;
    profile_id: number;
    question_id: number;
    option_id: number;
    header: number | null;
    body: string | null;
    description: string | null;
    active: number;
    create: string;
    updated: string;
}
Possible errors:
  - HTTP 404: Not found
```

Example:

```
URL: GET http://localhost:4000/api/vote/1

Response body: {
    "id": 1,
    "profile_id": 1,
    "question_id": 3,
    "option_id": 8,
    "header": 2,
    "body": null,
    "description": null,
    "active": 0
    "created": "2020-03-31T07:00:00.000Z",
    "updated": "2020-03-31T07:00:00.000Z"
}
```



Create vote
-----------

Cast a vote.

The created vote will be owned by the profile the client is logged into, if
they send an authorization header. Otherwise, it will be owned by the client's
IP address.

When using the IP address, a so-called "IP address profile" for the IP address
is implicitly created, if it had not been created previously, to provide a
valid profile\_id for API use.

```
Method: POST
Path: /api/vote
Headers: {
    Authorization: string | undefined;
}
Request body: {
    question_id: number;
    option_id: number;
    header: number | null;
    body: string | null;
    description: string | null;
    active: number;
}

Response body: {
    vote_id: number;
}
Possible errors:
  - HTTP 400: Invalid Authorization header: malformed or expired value
  - HTTP 400: Invalid request parameters
  - HTTP 404: Referenced resource not found
```

Example 1 - logged in:

```
URL: POST http://localhost:4000/api/vote
Headers: {
    Authorization: "Bearer a.b.c"
}
Request body: {
    "question_id": 7,
    "option_id": 22,
    "header": 3,
    "body": null,
    "description": null,
    "active": 1
}

Response body: {
    "vote_id": 1
}
```

Example 2 - not logged in

```
URL: POST http://localhost:4000/api/vote
Request body: {
    "question_id": 4,
    "option_id": 19,
    "header": 1,
    "body": null,
    "description": null,
    "active": 1
}

Response body: {
    "vote_id": 2
}
```



Modify vote
-----------

Update a vote. Only fields included in request body are modified.

If the vote being modified was created by a logged in client, an authorization
header must be provided. Otherwise, the question is considered owned by an IP
address. The client's IP address must match this or it will be rejected.

```
Method: PATCH
Path: /api/vote/:vote_id
Headers: {
    Authorization: string | undefined;
}
Request body: {
    header: number | null | undefined;
    body: string | null | undefined;
    description: string | null | undefined;
    active: number | undefined;
}

No response body.
Possible errors:
  - HTTP 400: Invalid Authorization header: malformed or expired value
  - HTTP 400: Invalid request parameters
  - HTTP 403: Not owner
  - HTTP 404: Not found
```

Example 1 - logged in:

```
URL: PATCH http://localhost:4000/api/vote/5
Headers: {
    Authorization: "Bearer a.b.c"
}
Request body: {
    "header": 2
}

No response body.
```

Example 2 - not logged in:

```
URL: PATCH http://localhost:4000/api/vote/7
Request body: {
    "header": 4
}

No response body.
```



Delete vote
-----------

Delete a vote. Votes may only be deleted by the profile that created them.

If the vote being deleted was created by a logged in client, an authorization
header must be provided. Otherwise, the question is considered owned by an IP
address. The client's IP address must match this or it will be rejected.

```
Method: DELETE
Path: /api/vote/:vote_id
Headers: {
    Authorization: string | undefined;
}

No response body.
Possible errors:
  - HTTP 403: Not owner
  - HTTP 404: Not found
```

Example 1 - logged in:

```
URL: DELETE http://localhost:4000/api/vote/10
Headers: {
    Authorization: "Bearer my.jwt.here"
}

No response body.
```

Example 2 - not logged in:

```
URL: DELETE http://localhost:4000/api/vote/13

No response body.
```



List tags
---------

Get details for all tags.

The profile\_id for a tag is its owner.

```
Method: GET
Path: /api/tag
Response body: {
    id: number;
    profile_id: number;
    name: string;
    description: string | null;
    category: string | null;
    created: string;
    updated: string;
}[]
Possible errors:
  - None
```

Example:

```
URL: GET http://localhost:4000/api/tag

Response body: [
    {
        "id": 1,
        "profile_id": 5,
        "name": "Bacon lover",
        "description": "This user loves bacon with a passion",
        "category": "identity",
        "created": "2020-06-20T23:00:00.000Z",
        "updated": "2020-06-20T23:00:00.000Z"
    },
    {
        "id": 2,
        "profile_id": 3,
        "name": "Political",
        "description": "This is a question about a political topic",
        "category": null,
        "created": "2020-06-20T23:00:00.000Z",
        "updated": "2020-06-20T23:00:00.000Z"
    }
]
```



Detail tag by id
----------------

Get details for a tag by id.

The profile\_id for a tag is its owner.

```
Method: GET
Path: /api/tag/id/:tag_id
Params: {
    tag_id: number;
}

Response body: {
    id: number;
    profile_id: number;
    name: string;
    description: string | null;
    category: string | null;
    created: string;
    updated: string;
}
Possible errors:
  - HTTP 404: Not found
```

Example:

```
URL: GET http://localhost:4000/api/tag/id/2

Response body: {
    "id": 1,
    "profile_id": 11,
    "name": "Age: 40-49",
    "description": "This user's age is between 40 and 49",
    "category": "identity",
    "created": "2020-06-20T23:00:00.000Z",
    "updated": "2020-06-20T23:00:00.000Z"
}
```


Detail tag by name
------------------

Get details for a tag by name.

The profile\_id for a tag is its owner.

```
Method: GET
Path: /api/tag/name/:tag_name
Params: {
    tag_name: string;
}

Response body: {
    id: number;
    profile_id: number;
    name: string;
    description: string | null;
    category: string | null;
    created: string;
    updated: string;
}
Possible errors:
  - HTTP 404: Not found
```

Example:

```
URL: GET http://localhost:4000/api/tag/name/ethics

Response body: {
    "id": 1,
    "profile_id": 11,
    "name": "Age: 40-49",
    "description": "This user's age is between 40 and 49",
    "category": "identity",
    "created": "2020-06-20T23:00:00.000Z",
    "updated": "2020-06-20T23:00:00.000Z"
}
```



Create tag
-----------

Create a tag. Tag names are unique, so attempting to create a tag with the same
name as another will fail.

The tag is owned by the profile that created it.

```
Method: POST
Path: /api/tag
Headers: {
    Authorization: string;
}
Request body: {
    name: string;
    description: string | null;
    category: string | null;
}

Response body: {
    tag_id: number;
}
Possible errors:
  - HTTP 400: Already exists
  - HTTP 400: Invalid Authorization header: malformed or expired value
  - HTTP 400: Invalid request parameters
  - HTTP 403: Missing Authorization header
```

Example:

```
URL: POST http://localhost:4000/api/tag
Headers: {
    Authorization: "Bearer my.jwt.here"
}
Request body: {
    "name": "Disney",
    "description": "This question relates to the Walt Disney company or one of its film studios",
    "category": null
}

Response body: {
    "tag_id": 34
}
```



Modify tag
-----------

Update a tag. Only fields included in request body are modified.

Tag names are unique, so attempting to modify a tag's name to be the same as
another will fail.

Tags can only be modifed by their owner.

```
Method: PATCH
Path: /api/tag/:tag_id
Headers: {
    Authorization: string;
}
Request body: {
    name: string | undefined;
    description: string | null | undefined;
    "category": string | null;
}

No response body.
Possible errors:
  - HTTP 400: Already exists
  - HTTP 400: Invalid Authorization header: malformed or expired value
  - HTTP 400: Invalid request parameters
  - HTTP 403: Missing Authorization header
  - HTTP 403: Not owner
  - HTTP 404: Not found
```

Example:

```
URL: PATCH http://localhost:4000/api/tag/6
Headers: {
    Authorization: "Bearer my.jwt.here"
}
Request body: {
    "description": "This question is about shampoo"
}

No response body.
```



List tags on profile
--------------------

Get list of tags on a profile.

If the profile does not exist or if it is an IP address profile, an empty array is returned.

```
Method: GET
Path: /api/tag/profile/:profile_id
Params: {
    profile_id: number;
}

Response body: {
    tag_id: number;
    name: string;
    description: string | null;
    category: string | null;
}[]
Possible errors:
  - None
```

Example:

```
URL: GET http://localhost:4000/api/tag/profile/17
Response body: [
    {
        "tag_id": 52,
        "name": "Man",
        "description": "Identifies as man",
        "category": "identity"
    },
    {
        "tag_id": 89,
        "name": "Vegetarian",
        "description": "Does not eat meat",
        "category": "identity"
    }
]
```



Create profile tag
------------------

Adds a tag to the current profile. The current profile is implied via the
authorization header.

If the profile already had the tag, an HTTP 400 is returned.

```
Method: POST
Path: /api/tag/profile
Headers: {
    Authorization: string;
}
Request body: {
    tag_id: number;
}

No response body.
Possible errors:
  - HTTP 400: Already exists
  - HTTP 400: Invalid Authorization header: malformed or expired value
  - HTTP 400: Invalid request parameters
  - HTTP 403: Missing Authorization header
  - HTTP 404: Referenced resource not found
```

Example:

```
URL: POST http://localhost:4000/api/tag/profile
Headers: {
    Authorization: "Bearer my.jwt.here"
}
Request body: {
    "tag_id": 2
}

No response body.
```



List tags on question
---------------------

Get list of tags on a question.

If the question does not exist it returns an empty array.

```
Method: GET
Path: /api/tag/question/:question_id/tags
Params: {
    question_id: number;
}

Response body: {
    tag_id: number;
    name: string;
    description: string | null;
    category: string | null;
}[]
Possible errors:
  - None
```

Example:

```
URL: GET http://localhost:4000/api/tag/question/123/tags

Response body: [
    {
        "tag_id": 15,
        "name": "Gossip",
        "description": "This question relates to celebrity gossip",
        "category": null
    },
    {
        "tag_id": 16,
        "name": "Johnny Depp",
        "description": "This question is about Johnny Depp",
        "category": null
    }
]
```



List questions with tag
-----------------------

Get list of ids of every question tagged with a particular tag.

If the tag does not exist it returns an empty array.

```
Method: GET
Path: /api/tag/question/:tag_id/questions
Params: {
    tag_id: number;
}

Response body: number[]
Possible errors:
  - None
```

Example:

```
URL: GET http://localhost:4000/api/tag/question/21/questions

Response body: [
    17,
    18,
    231
]
```



Create question tag
-------------------

Adds a tag to a question.

Profiles that are not the owner of a question can still add tags to it.

```
Method: POST
Path: /api/tag/question
Headers: {
    Authorization: string;
}
Request body: {
    tag_id: number;
    question_id: number;
}

No response body.
Possible errors:
  - HTTP 400: Invalid Authorization header: malformed or expired value
  - HTTP 403: Missing Authorization header
  - HTTP 404: Referenced resource not found
```

Example:

```
URL: POST http://localhost:4000/api/tag/question
Headers: {
    Authorization: "Bearer my.jwt.here"
}
Request body: {
    "tag_id": 4,
    "question_id": 22
}

No response body.
```
