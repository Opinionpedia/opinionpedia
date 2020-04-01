import bodyParser from 'body-parser';
import express from 'express';

import setupProfile from './profile.js';
import setupQuestion from './question.js';

function log(req, res, next) {
    const { method, path } = req;
    console.log(`${method} ${path}`);
    next();
}

function setupRoutes(router) {
    router.use(log);

    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: false }));

    const profile = express.Router();
    const login = express.Router();
    const question = express.Router();

    router.use('/profile', profile);
    router.use('/login', login);
    router.use('/question', question);

    setupProfile({ profile, login });
    setupQuestion(question);
}

export default setupRoutes;
