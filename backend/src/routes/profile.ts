import { Router } from 'express';

import * as auth from '../auth.js';
import { ERR_MYSQL_DUP_ENTRY, withConn } from '../db.js';
import * as password from '../password.js';

import * as profile from '../models/profile.js';

//
// The endpoint are:
//
// List     GET  http://localhost:4000/api/profile
// Details  GET  http://localhost:4000/api/profile/123
// Details  GET  http://localhost:4000/api/profile/pdm
// Create   POST http://localhost:4000/api/profile
// Modify   PUT  http://localhost:4000/api/profile
// Login    POST http://localhost:4000/api/login
//

export default (routers: { profile: Router, login: Router }) => {
    // Route method: GET
    // Route path: /profile
    // Request URL: http://localhost:4000/api/profile
    routers.profile.get('/', (req, res) => {
        withConn(res, async (conn) => {
            if (process.env.NODE_ENV === 'production') {
                // Route unavailable in production.
                res.sendStatus(403);
                return;
            }

            const profiles = await profile.getProfiles(conn);

            for (const profile of profiles) {
                delete profile.password;
                delete profile.salt;
            }

            res.json(profiles);
        });
    });

    // Route method: GET
    // Route path: /profile/:id_or_username
    //
    // Example 1:
    // Request URL: http://localhost:4000/api/profile/123
    // req.params: {
    //     "id_or_username": "123"
    // }
    //
    // Example 2:
    // Request URL: http://localhost:4000/api/profile/pdm
    // req.params: {
    //     "id_or_username": "pdm"
    // }
    routers.profile.get('/:id_or_username', async (req, res) => {
        withConn(res, async (conn) => {
            const { id_or_username } = req.params;

            const valid = profile.isIdValid(id_or_username) ||
                          profile.isUsernameValid(id_or_username);
            if (!valid) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            const p = profile.isIdValid(id_or_username)
                ? await profile.getProfile(conn, parseInt(id_or_username))
                : await profile.getProfileByUsername(conn, id_or_username);

            if (p === null) {
                res.sendStatus(404);
                return;
            }

            delete p.password;
            delete p.salt;

            res.json(p);
        });
    });

    // Route method: POST
    // Route path: /profile
    // Request URL: http://localhost:4000/api/profile
    //
    // req.body: {
    //     "username": "ammc",
    //     "password": "password",
    //     "description": "Description for profile ammc",
    //     "body": "Body for profile ammc"
    // }
    routers.profile.post('/', async (req, res) => {
        withConn(res, async (conn) => {
            const {
                username: _username,
                password: _pw,
                description: _description,
                body: _body,
            } = req.body;

            const valid =
                profile.isUsernameValid(_username) &&
                profile.isPasswordValid(_pw) &&
                profile.isDescriptionValid(_description) &&
                profile.isBodyValid(_body);
            if (!valid) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            const username = _username as string;
            const pw = _pw as string;
            const description = _description as string;
            const body = _body as string;

            const salt = await password.makeSalt();
            const hash = await password.hashPassword(pw, salt);

            let id;
            try {
                id = await profile.createProfile(conn, {
                    username,
                    password: hash.toString('hex'),
                    salt: salt.toString('hex'),
                    description,
                    body,
                });
            } catch (err) {
                if (err.code === ERR_MYSQL_DUP_ENTRY) {
                    res.status(400).send('Profile already exists');
                    return;
                }

                throw err;
            }

            // No need to hit /login after this. We give you a token now.
            const token = await auth.signJWT({ profile_id: id });

            res.send(token);
        });
    });

    // Route method: PUT
    // Route path: /profile
    // Request URL: http://localhost:4000/api/profile
    //
    // req.headers.authorization: "Bearer a.b.c"
    // req.body: {
    //     "username": "my new username",
    //     "password": "my new password",
    //     "description": "my new description",
    //     "body": "my new body"
    // }
    routers.profile.put('/', async (req, res) => {
        withConn(res, async (conn) => {
            const {
                username: _username,
                password: _pw,
                description: _description,
                body: _body,
            } = req.body;

            const valid =
                (_username === undefined ||
                 profile.isUsernameValid(_username)) &&
                (_pw === undefined || profile.isPasswordValid(_pw)) &&
                (_description === undefined ||
                 profile.isDescriptionValid(_description)) &&
                (_body === undefined || profile.isBodyValid(_body));
            if (!valid) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            const username = _username as string | undefined;
            const pw = _pw as string | undefined;
            const description = _description as string | undefined;
            const body = _body as string | undefined;

            const payload = await auth.verifyRequestJWT(req);
            if (payload === null) {
                res.status(400).send('Invalid authorization');
                return;
            }

            const { profile_id } = payload;

            // Get existing profile.
            const p = await profile.getProfile(conn, profile_id);
            if (p === null) {
                res.status(500).send('Unknown profile');
                return;
            }

            // Apply changes from this PUT.
            if (username !== undefined) {
                p.username = username;
            }

            if (pw !== undefined) {
                const salt = Buffer.from(p.salt, 'hex');
                const hash = await password.hashPassword(pw, salt);
                p.password = hash.toString('hex');
            }

            if (body !== undefined) {
                p.body = body;
            }

            if (description !== undefined) {
                p.description = description;
            }

            await profile.updateProfile(conn, p);

            res.send('OK');
        });
    });

    // Route method: POST
    // Route path: /login
    // Request URL: http://localhost:4000/api/login
    //
    // req.body: {
    //     "username": "ammc",
    //     "password": "password"
    // }
    routers.login.post('/', async (req, res) => {
        withConn(res, async (conn) => {
            const { username: _username, password: _pw } = req.body;

            const invalid =
                !profile.isUsernameValid(_username) ||
                !profile.isPasswordValid(_pw);
            if (invalid) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            const username = _username as string;
            const pw = _pw as string;

            const p = await profile.getProfileByUsername(conn, username);

            if (p === null) {
                res.status(400).send('User does not exist');
                return;
            }

            const salt = Buffer.from(p.salt, 'hex');
            const hash = await password.hashPassword(pw, salt);

            if (p.password !== hash.toString('hex')) {
                res.status(400).send('Incorrect password');
                return;
            }

            const token = await auth.signJWT({ profile_id: p.id });

            res.send(token);
        });
    });
};
