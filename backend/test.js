import http from 'http';

/**
 * Make an HTTP request to the backend server.
 */
function request({ method, path, token, body }) {
    const options = {
        host: 'localhost',
        port: 4000,
        method,
        path: '/api' + path,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (token) {
        options.headers.Authorization = `Bearer ${token}`;
    }

    const reqJson = body;
    const reqText = body && JSON.stringify(body, null, 4);

    return new Promise((resolve, reject) => {
        const req = http.request(options);

        req.on('response', (res) => {
            let resText = '';

            res.setEncoding('utf8');
            res.on('data', (chunk) => resText += chunk);
            req.on('aborted', reject);
            res.on('end', () => {
                if (resText === res.statusMessage) {
                    resText = undefined;
                }

                let resJson;

                try {
                    resJson = JSON.parse(resText);
                    resText = JSON.stringify(resJson, null, 4);
                } catch (e) {
                }

                resolve({
                    req: {
                        method,
                        path,
                        token,
                        text: reqText,
                        json: reqJson,
                    },
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    text: resText,
                    json: resJson,
                });
            });
        });

        req.on('error', reject);

        if (reqText) {
            req.write(reqText);
        }

        req.end();
    });
}

/**
 * Print an HTTP response.
 */
function log(res) {
    //
    // Print request info.
    //
    const {
        method,
        path,
        token,
        text: reqText,
    } = res.req;

    console.log(`${method} ${path}`);

    if (token) {
        console.log(`Authorization: Bearer ${token}`);
    }

    if (reqText) {
        console.log(reqText);
    }

    console.log();

    //
    // Print response info.
    //
    const {
        statusCode,
        statusMessage,
        text: resText,
    } = res;

    console.log(`HTTP ${statusCode} ${statusMessage}`);

    if (resText) {
        console.log(resText);
    }

    console.log();
}

async function tryRequest(statusCode, options) {
    const res = await request(options);
    if (res.statusCode !== statusCode) {
        log(res);
        throw new Error(
            `Expected HTTP status to be ${statusCode}, got ${res.statusCode}`);
    }

    return res;
}

function get(statusCode, options) {
    return tryRequest(
        statusCode,
        Object.assign({}, options, { method: 'GET' })
    );
}

function post(statusCode, options) {
    return tryRequest(
        statusCode,
        Object.assign({}, options, { method: 'POST' })
    );
}

function patch(statusCode, options) {
    return tryRequest(
        statusCode,
        Object.assign({}, options, { method: 'PATCH' })
    );
}

function randomNumber() {
    return (Math.random() * 10000).toFixed();
}

async function test() {
    let res;

    console.log('===============');
    console.log('TESTING PROFILE');
    console.log('===============');

    log(await get(200, { path: '/profile' }));

    const username = 'testuser-' + randomNumber();
    let password = 'password';
    res = await post(200, {
        path: '/profile',
        body: {
            username,
            password,
            description: `Description for ${username}`,
            body: `Body for ${username}`,
        },
    });
    log(res);
    const { profile_id } = res.json;
    const token = res.json.token;

    log(await post(200, { path: '/login', body: { username, password }}));

    password = 'new password';
    log(await patch(200, { path: '/profile', token, body: { password }}));

    log(await post(200, { path: '/login', body: { username, password }}));

    log(await get(200, { path: `/profile/${profile_id}` }));
    log(await get(200, { path: `/profile/${username}` }));

    console.log('================');
    console.log('TESTING QUESTION');
    console.log('================');

    log(await get(200, { path: '/question' }));

    res = await post(200, {
        path: '/question',
        token,
        body: {
            prompt: 'Prompt for question',
            description: 'Description for question',
        },
    });
    log(res);
    const { question_id } = res.json;

    log(await get(200, { path: `/question/${question_id}` }));

    log(await patch(200, {
        path: `/question/${question_id}`,
        token,
        body: {
            prompt: 'New prompt for question',
            description: 'New description for question',
        },
    }));

    log(await get(200, { path: `/question/${question_id}` }));

    console.log('==============');
    console.log('TESTING OPTION');
    console.log('==============');

    log(await get(200, { path: '/option' }));

    res = await post(200, {
        path: '/option',
        token,
        body: {
            question_id,
            prompt: 'Prompt for option',
            description: 'Description for option',
        },
    });
    log(res);
    const { option_id } = res.json;

    log(await get(200, { path: `/option/${option_id}` }));

    log(await patch(200, {
        path: `/option/${option_id}`,
        token,
        body: {
            prompt: 'New prompt for option',
            description: 'New description for option',
        },
    }));

    log(await get(200, { path: `/option/${option_id}` }));

    console.log('============');
    console.log('TESTING VOTE');
    console.log('============');

    log(await get(200, { path: '/vote' }));

    res = await post(200, {
        path: '/vote',
        token,
        body: {
            profile_id,
            question_id,
            option_id,
            header: 1,
            body: 'Body for vote',
            description: 'Description for vote',
            active: 3,
        },
    });
    log(res);
    const { vote_id } = res.json;

    log(await get(200, { path: `/vote/${vote_id}`}));

    log(await patch(200, {
        path: `/vote/${vote_id}`,
        token,
        body: {
            header: 5,
            body: 'New body for vote',
            description: 'New description for vote',
            active: 17,
        },
    }));

    log(await get(200, { path: `/vote/${vote_id}`}));

    log(await get(200, { path: `/vote/question/${question_id}`}));

    console.log('===========');
    console.log('TESTING TAG');
    console.log('===========');

    const tagName = 'tag-' + randomNumber();

    log(await get(200, { path: '/tag' }));

    // Tag with 'identity' category.
    res = await post(200, {
        path: '/tag',
        token,
        body: {
            profile_id,
            name: `Name for ${tagName}`,
            description: `Description for ${tagName}`,
            category: 'identity',
        },
    });
    log(res);
    const { tag_id } = res.json;

    // Tag with null category.
    const tagName2 = 'tag-' + randomNumber();
    log(await post(200, {
        path: '/tag',
        token,
        body: {
            profile_id,
            name: `Name for ${tagName2}`,
            description: `Description for ${tagName2}`,
            category: null,
        },
    }));

    // Tag with invalid category.
    const tagName3 = 'tag-' + randomNumber();
    log(await post(400, {
        path: '/tag',
        token,
        body: {
            profile_id,
            name: `Name for ${tagName2}`,
            description: `Description for ${tagName2}`,
            category: 'invalid',
        },
    }));

    log(await get(200, { path: `/tag/${tag_id}`}));

    log(await patch(200, {
        path: `/tag/${tag_id}`,
        token,
        body: {
            name: `New name for ${tagName}`,
            description: `New description for ${tagName}`,
        },
    }));

    log(await get(200, { path: `/tag/${tag_id}`}));

    console.log('===================');
    console.log('TESTING PROFILE TAG');
    console.log('===================');

    log(await post(200, {
        path: '/tag/profile',
        token,
        body: { tag_id },
    }));

    log(await get(200, { path: `/tag/profile/${profile_id}`}));

    console.log('====================');
    console.log('TESTING QUESTION TAG');
    console.log('====================');

    log(await post(200, {
        path: '/tag/question',
        token,
        body: { tag_id, question_id },
    }));

    log(await get(200, { path: `/tag/question/${question_id}`}));

    console.log('==================');
    console.log('TESTING VOTE TABLE');
    console.log('==================');

    log(await get(200, { path: `/question/${question_id}/vote_table` }));
}

test();
