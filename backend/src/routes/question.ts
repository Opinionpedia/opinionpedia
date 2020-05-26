//
// The endpoint are:
//
// List     GET   /api/question
// Details  GET   /api/question/:question_id
// Create   POST  /api/question
// Modify   PATCH /api/question/:question_id
//

import { Router } from 'express';

import { getConn } from './db.js';

import {
    NotOwnerError,
    ResourceAlreadyExistsDBError,
    ResourceNotFoundError,
} from './errors.js';

import {
    notAvailableInProduction,
    validateBodyProps,
    validateIdParam,
    validatePartialBodyProps,
    validateRequestJWT,
    wrapAsync,
} from './util.js';

import * as model from '../models/question.js';

//
// Request body types
//
type ListQuestionsReqBody = null;
type ListQuestionsResBody = model.Question[];

type DetailQuestionReqBody = null;
type DetailQuestionResBody = model.Question;

type CreateQuestionReqBody = Omit<model.CreateQuestion, 'profile_id'>;
type CreateQuestionResBody = { question_id: number; };

type ModifyQuestionReqBody = Partial<model.UpdateQuestion>;
type ModifyQuestionResBody = null;

export default (router: Router) => {
    // List questions handler
    router.get('/', wrapAsync(async (req, res) => {
        notAvailableInProduction();

        const conn = await getConn(req);
        const questions: ListQuestionsResBody =
            await model.getQuestions(conn);

        res.json(questions);
    }));

    // Detail question handler
    router.get('/:question_id', async (req, res) => {
        const question_id = validateIdParam(req.params.question_id);

        const conn = await getConn(req);
        const question: DetailQuestionResBody | null =
            await model.getQuestion(conn, question_id);
        if (question === null) {
            throw new ResourceNotFoundError();
        }

        res.json(question);
    });

    // Create question handler
    router.post('/', wrapAsync(async (req, res) => {
        const {
            prompt,
            description,
        } = validateBodyProps<CreateQuestionReqBody>(
            req.body,
            {
                prompt: model.isPromptValid,
                description: model.isDescriptionValid,
            }
        );

        const { profile_id } = await validateRequestJWT(req);

        const conn = await getConn(req);
        const question_id = await model.createQuestion(conn, {
            profile_id,
            prompt,
            description,
        });

        const resBody: CreateQuestionResBody = { question_id };

        res.json(resBody);
    }));

    // Modify question handler
    router.patch('/:id', wrapAsync(async (req, res) => {
        const question_id = validateIdParam(req.params.question_id);
        const {
            prompt,
            description,
        } = validatePartialBodyProps<ModifyQuestionReqBody>(
            req.body,
            {
                prompt: model.isPromptValid,
                description: model.isDescriptionValid,
            }
        );

        const { profile_id } = await validateRequestJWT(req);

        // Get existing question.
        const conn = await getConn(req);
        const question = await model.getQuestion(conn, question_id);
        if (question === null) {
            throw new ResourceNotFoundError();
        }

        if (question.profile_id !== profile_id) {
            throw new NotOwnerError();
        }

        // Apply requested changes.
        if (prompt !== undefined) {
            question.prompt = prompt;
        }

        if (description !== undefined) {
            question.description = description;
        }

        await model.updateQuestion(conn, question);

        res.sendStatus(200);
    }));
};
