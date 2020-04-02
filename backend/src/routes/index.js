import bodyParser from 'body-parser';
import express from 'express';

import setupProfile from './profile.js';
import setupQuestion from './question.js';

const allowedOrigins = {
    'http://localhost:3000': true,
};

function log(req, res, next) {
    const { method, path } = req;
    console.log(`${method} ${path}`);
    next();
}

function cors(req, res, next) {
    const origin = req.headers.origin;

    if (origin in allowedOrigins) {
        res.set('Access-Control-Allow-Origin', origin);
        res.vary('Origin');
    }

    next();
}

function setupRoutes(router) {
    router.use(log);
    router.use(cors);

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
