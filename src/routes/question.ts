//
// The endpoint are:
//
// List         GET   /api/question
// Details      GET   /api/question/:question_id
// Create       POST  /api/question
// Modify       PATCH /api/question/:question_id
//
// Suggestions  GET   /api/question/:question_id/suggestions
// VoteTable    GET   /api/question/:question_id/vote_table
//

import { Router } from 'express';

import { getConn } from './db.js';

import {
    NotOwnerError,
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

import { ERR_MYSQL_NO_REFERENCED_ROW } from '../db.js';
import { hasCode } from '../errors.js';

import * as model from '../models/question.js';
import * as suggestions from '../models/suggestions.js';
import * as voteTable from '../models/vote_table.js';

//
// Request body types
//
type ListQuestionsReqBody = null;
type ListQuestionsResBody = model.Question[];

type DetailQuestionReqBody = null;
type DetailQuestionResBody = model.Question;

type CreateQuestionReqBody = Omit<model.CreateQuestion, 'profile_id'>;
type CreateQuestionResBody = { question_id: number; };

type ModifyQuestionReqBody = Omit<model.UpdateQuestion, 'id' | 'profile_id'>;
type ModifyQuestionResBody = null;

type SuggestionsReqBody = null;
type SuggestionsResBody = suggestions.SuggestedQuestionIds;

type VoteTableReqBody = null;
type VoteTableResBody = voteTable.VoteTable;

export default (router: Router): void => {
    // List questions handler
    router.get('/', wrapAsync(async (req, res) => {
        notAvailableInProduction();

        const conn = await getConn(req);
        const questions: ListQuestionsResBody =
            await model.getQuestions(conn);

        res.json(questions);
    }));

    // Detail question handler
    router.get('/:question_id', wrapAsync(async (req, res) => {
        const question_id = validateIdParam(req.params.question_id);

        const conn = await getConn(req);
        const question: DetailQuestionResBody | null =
            await model.getQuestion(conn, question_id);
        if (question === null) {
            throw new ResourceNotFoundError();
        }

        res.json(question);
    }));

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

        let question_id;
        try {
            question_id = await model.createQuestion(conn, {
                profile_id,
                prompt,
                description,
            });
        } catch (err) {
            if (hasCode(err, ERR_MYSQL_NO_REFERENCED_ROW)) {
                // Rare: The profile doesn't exist in the database.
                throw new ResourceNotFoundError();
            } else {
                throw err;
            }
        }

        const resBody: CreateQuestionResBody = { question_id };

        res.json(resBody);
    }));

    // Modify question handler
    router.patch('/:question_id', wrapAsync(async (req, res) => {
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

    // Get question suggestions handler
    router.get('/:question_id/suggestions', wrapAsync(async (req, res) => {
        const question_id = validateIdParam(req.params.question_id);

        const conn = await getConn(req);
        const question = await model.getQuestion(conn, question_id);
        if (question === null) {
            throw new ResourceNotFoundError();
        }

        const suggests: SuggestionsResBody =
            await suggestions.getQuestionSuggestions(conn, question_id);

        res.json(suggests);
    }));

    // Get vote table handler
    router.get('/:question_id/vote_table', wrapAsync(async (req, res) => {
        const question_id = validateIdParam(req.params.question_id);

        const conn = await getConn(req);
        const question = await model.getQuestion(conn, question_id);
        if (question === null) {
            throw new ResourceNotFoundError();
        }

        const table: VoteTableResBody =
            await voteTable.getVoteTable(conn, question_id);

        res.json(table);
    }));
};
