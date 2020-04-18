import bodyParser from 'body-parser';
import express, { NextFunction, Request, Response, Router } from 'express';

import setupProfile from './profile.js';
import setupQuestion from './question.js';
import setupOption from './option.js';

const allowedOrigins = {
    'http://localhost:3000': true,
};

const allowedHeaders = [
    'authorization',
    'content-type',
].join(', ');

const allowedMethods = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'HEAD',
    'OPTIONS',
].join(', ');

function log(req: Request, res: Response, next: NextFunction) {
    const { method, path } = req;
    console.log(`${method} ${path}`);
    next();
}

function cors(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;
    if (origin === undefined) {
        next();
        return;
    }

    if (origin in allowedOrigins) {
        res.set('Access-Control-Allow-Origin', origin);
        res.vary('Origin');
    }

    res.set('Access-Control-Allow-Headers', allowedHeaders);
    res.set('Access-Control-Allow-Methods', allowedMethods);

    next();
}

function setupRoutes(router: Router) {
    router.use(log);
    router.use(cors);

    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: false }));

    const profile = express.Router();
    const login = express.Router();
    const question = express.Router();
    const option = express.Router();

    router.use('/profile', profile);
    router.use('/login', login);
    router.use('/question', question);
    router.use('/option', option);

    setupProfile({ profile, login });
    setupQuestion(question);
    setupOption(option);
}

export default setupRoutes;
