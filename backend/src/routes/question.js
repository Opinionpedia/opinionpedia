import * as auth from '../auth.js';
import { ERR_MYSQL_DUP_ENTRY, withConn } from '../db.js';

import * as question from '../models/question.js';

//
// The endpoint are:
//
// List     GET  http://localhost:4000/api/question
// Details  GET  http://localhost:4000/api/question/2
// Create   POST http://localhost:4000/api/question
// Modify   PUT  http://localhost:4000/api/question/2
//

export default (router) => {
    // Route method: GET
    // Route path: /question
    // Request URL: http://localhost:4000/api/question
    router.get('/', (req, res) => {
        withConn(res, async (conn) => {
            const questions = await question.getQuestions(conn);

            res.json(questions);
        });
    });

    // Route method: GET
    // Route path: /question/:id
    // Request URL: http://localhost:4000/api/question/2
    //
    // req.params: {
    //     "id": 2
    // }
    router.get('/:id', async (req, res) => {
        withConn(res, async (conn) => {
            const { id } = req.params;

            const valid = question.isIdValid(id);
            if (!valid) {
                res.status(400).send('Invalid request parameters');
                return;
            }

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
            const { prompt, description } = req.body;

            const valid =
                question.isPromptValid(prompt) &&
                question.isDescriptionValid(description);
            if (!valid) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            const payload = await auth.verifyRequestJWT(req);
            if (payload === null) {
                res.status(400).send('Invalid authorization');
                return;
            }

            const { username } = payload;

            const id = await question.createQuestion(conn, {
                prompt,
                description,
                profile_username: username,
            });

            res.json({ id });
        });
    });

    // Route method: PUT
    // Route path: /question/:id
    // Request URL: http://localhost:4000/api/question/2
    //
    // req.headers.authorization: "Bearer a.b.c"
    // req.body: {
    //     "prompt": "my new prompt",
    //     "description": "my new description"
    // }
    router.put('/:id', async (req, res) => {
        withConn(res, async (conn) => {
            const { id } = req.params;
            const { prompt, description } = req.body;

            const valid =
                question.isIdValid(id) &&
                (prompt === undefined || question.isPromptValid(prompt)) &&
                (description === undefined || question.isDescriptionValid(description));
            if (!valid) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            const payload = await auth.verifyRequestJWT(req);
            if (payload === null) {
                res.status(400).send('Invalid authorization');
                return;
            }

            const { username } = payload;

            const q = await question.getQuestion(conn, id);
            if (q === null) {
                res.status(400).send('Invalid request parameters');
                return;
            }

            if (q.profile_username !== username) {
                res.sendStatus(401);
                return;
            }

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
