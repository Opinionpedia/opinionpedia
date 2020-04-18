import { Router } from 'express';

import * as auth from '../auth.js';
import { ERR_MYSQL_DUP_ENTRY, withConn } from '../db.js';

import * as option from '../models/option.js';
import * as question from '../models/question.js';

//
// The endpoint are:
//
// List     GET  http://localhost:4000/api/option
// List     GET  http://localhost:4000/api/option/question/123
// Details  GET  http://localhost:4000/api/option/456
// Create   POST http://localhost:4000/api/option
// Modify   PUT  http://localhost:4000/api/option/456
//

export default (router: Router) => {
    // Route method: GET
    // Route path: /option
    // Request URL: http://localhost:4000/api/option
    router.get('/', (req, res) => {
        withConn(res, async (conn) => {
            if (process.env.NODE_ENV === 'production') {
                // Route unavailable in production.
                res.sendStatus(403);
                return;
            }

            const options = await option.getOptions(conn);

            res.json(options);
        });
    });

    // Route method: GET
    // Route path: /option/question/:question_id
    // Request URL: http://localhost:4000/api/option/question/123
    //
    // req.params: {
    //     "question_id": 123
    // }
    router.get('/question/:question_id', async (req, res) => {
        withConn(res, async (conn) => {
            const { question_id: _question_id } = req.params;

            const valid = question.isIdValid(_question_id);
            if (!valid) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            const question_id = parseInt(_question_id);

            const options = await option.getOptionsByQuestionId(conn,
                                                                question_id);

            res.json(options);
        });
    });

    // Route method: GET
    // Route path: /option/:id
    // Request URL: http://localhost:4000/api/option/456
    //
    // req.params: {
    //     "id": 456
    // }
    router.get('/:id', async (req, res) => {
        withConn(res, async (conn) => {
            const { id: _id } = req.params;

            const valid = option.isIdValid(_id);
            if (!valid) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            const id = parseInt(_id);

            const o = await option.getOption(conn, id);
            if (o === null) {
                res.sendStatus(404);
                return;
            }

            res.json(o);
        });
    });

    // Route method: POST
    // Route path: /option
    // Request URL: http://localhost:4000/api/option
    //
    // req.headers.authorization: "Bearer a.b.c"
    // req.body: {
    //     "question_id": 123,
    //     "prompt": "Prompt for option",
    //     "description": "Description for option",
    // }
    router.post('/', async (req, res) => {
        withConn(res, async (conn) => {
            const {
                question_id: _question_id,

                prompt: _prompt,
                description: _description
            } = req.body;

            const valid =
                question.isIdValid(_question_id) &&
                option.isPromptValid(_prompt) &&
                (_description === undefined ||
                 option.isDescriptionValid(_description));
            if (!valid) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            const question_id = parseInt(_question_id);
            const prompt = _prompt as string;
            const description = _description === undefined
                ? null
                : _description as string;

            const payload = await auth.verifyRequestJWT(req);
            if (payload === null) {
                res.status(400).send('Invalid authorization');
                return;
            }

            const { profile_id } = payload;

            const optionId = await option.createOption(conn, {
                profile_id,
                question_id,
                prompt,
                description,
            });

            res.json({ id: optionId });
        });
    });

    // Route method: PUT
    // Route path: /option/:id
    // Request URL: http://localhost:4000/api/option/456
    //
    // req.headers.authorization: "Bearer a.b.c"
    // req.params: {
    //     "id": 456
    // }
    // req.body: {
    //     "prompt": "my new prompt",
    //     "description": "my new description"
    // }
    router.put('/:id', async (req, res) => {
        withConn(res, async (conn) => {
            const { id: _id } = req.params;
            const {
                prompt: _prompt,
                description: _description
            } = req.body;

            const valid =
                option.isIdValid(_id) &&
                (_prompt === undefined || option.isPromptValid(_prompt)) &&
                (_description === undefined ||
                 option.isDescriptionValid(_description));
            if (!valid) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            const id = parseInt(_id);
            const prompt = _prompt as string | undefined;
            const description = _description as string | null | undefined;

            const payload = await auth.verifyRequestJWT(req);
            if (payload === null) {
                res.status(400).send('Invalid authorization');
                return;
            }

            const { profile_id } = payload;

            // Get existing option.
            const o = await option.getOption(conn, id);
            if (o === null) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            if (o.profile_id !== profile_id) {
                res.sendStatus(403);
                return;
            }

            // Apply changes from this PUT.
            if (prompt !== undefined) {
                o.prompt = prompt;
            }

            if (description !== undefined) {
                o.description = description;
            }

            await option.updateOption(conn, o);

            res.send('OK');
        });
    });
};
