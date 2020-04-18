import { Router } from 'express';

import * as auth from '../auth.js';
import { ERR_MYSQL_DUP_ENTRY, withConn } from '../db.js';

import * as question from '../models/question.js';

//
// The endpoint are:
//
// List     GET  http://localhost:4000/api/question
// Details  GET  http://localhost:4000/api/question/123
// Create   POST http://localhost:4000/api/question
// Modify   PUT  http://localhost:4000/api/question/123
//

export default (router: Router) => {
    // Route method: GET
    // Route path: /question
    // Request URL: http://localhost:4000/api/question
    router.get('/', (req, res) => {
        // TODO: Add pagination. Don't actually serve all questions in one
        // request.

        withConn(res, async (conn) => {
            const questions = await question.getQuestions(conn);

            res.json(questions);
        });
    });

    // Route method: GET
    // Route path: /question/:id
    // Request URL: http://localhost:4000/api/question/123
    //
    // req.params: {
    //     "id": 123
    // }
    router.get('/:id', async (req, res) => {
        withConn(res, async (conn) => {
            const { id: _id } = req.params;

            const valid = question.isIdValid(_id);
            if (!valid) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            const id = parseInt(_id);

            const q = await question.getQuestion(conn, id);
            if (q === null) {
                res.sendStatus(404);
                return;
            }

            res.json(q);
        });
    });

    // Route method: POST
    // Route path: /question
    // Request URL: http://localhost:4000/api/question
    //
    // req.headers.authorization: "Bearer a.b.c"
    // req.body: {
    //     "prompt": "Prompt for question",
    //     "description": "Description for question",
    // }
    router.post('/', async (req, res) => {
        withConn(res, async (conn) => {
            const {
                prompt: _prompt,
                description: _description
            } = req.body;

            const valid =
                question.isPromptValid(_prompt) &&
                question.isDescriptionValid(_description);
            if (!valid) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            const prompt = _prompt as string;
            const description = _description as string;

            const payload = await auth.verifyRequestJWT(req);
            if (payload === null) {
                res.status(400).send('Invalid authorization');
                return;
            }

            const { profile_id } = payload;

            const questionId = await question.createQuestion(conn, {
                profile_id,
                prompt,
                description,
            });

            res.json({ id: questionId });
        });
    });

    // Route method: PUT
    // Route path: /question/:id
    // Request URL: http://localhost:4000/api/question/123
    //
    // req.headers.authorization: "Bearer a.b.c"
    // req.params: {
    //     "id": 123
    // }
    // req.body: {
    //     "prompt": "my new prompt",
    //     "description": "my new description"
    // }
    router.put('/:id', async (req, res) => {
        withConn(res, async (conn) => {
            const { id: _id } = req.params;
            const { prompt: _prompt, description: _description } = req.body;

            const valid =
                question.isIdValid(_id) &&
                (_prompt === undefined || question.isPromptValid(_prompt)) &&
                (_description === undefined ||
                 question.isDescriptionValid(_description));
            if (!valid) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            const id = parseInt(_id);
            const prompt = _prompt as string | undefined;
            const description = _description as string | undefined;

            const payload = await auth.verifyRequestJWT(req);
            if (payload === null) {
                res.status(400).send('Invalid authorization');
                return;
            }

            const { profile_id } = payload;

            // Get existing question.
            const q = await question.getQuestion(conn, id);
            if (q === null) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            if (q.profile_id !== profile_id) {
                res.sendStatus(403);
                return;
            }

            // Apply changes from this PUT.
            if (prompt !== undefined) {
                q.prompt = prompt;
            }

            if (description !== undefined) {
                q.description = description;
            }

            await question.updateQuestion(conn, q);

            res.send('OK');
        });
    });
};
