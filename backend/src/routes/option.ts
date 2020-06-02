//
// The endpoint are:
//
// List     GET   /api/option
// List     GET   /api/option/question/:question_id
// Details  GET   /api/option/:option_id
// Create   POST  /api/option
// Modify   PATCH /api/option/:option_id
//

import { Router } from 'express';

import { getConn } from './db.js';

import {
    NotOwnerError,
    ReferencedResourceNotFound,
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

import * as model from '../models/option.js';

//
// Request body types
//
type ListOptionsReqBody = null;
type ListOptionsResBody = model.Option[];

type ListOptionsByQuestionReqBody = null;
type ListOptionsByQuestionResBody = model.Option[];

type DetailOptionReqBody = null;
type DetailOptionResBody = model.Option;

type CreateOptionReqBody = Omit<model.CreateOption, 'profile_id'>;
type CreateOptionResBody = { option_id: number; };

type ModifyOptionReqBody = Partial<model.UpdateOption>;
type ModifyOptionResBody = null;

export default (router: Router) => {
    // List options handler
    router.get('/', wrapAsync(async (req, res) => {
        notAvailableInProduction();

        const conn = await getConn(req);
        const options: ListOptionsResBody = await model.getOptions(conn);

        res.json(options);
    }));

    // List options on question handler
    router.get('/question/:question_id', wrapAsync(async (req, res) => {
        const question_id = validateIdParam(req.params.question_id);

        const conn = await getConn(req);
        const options: ListOptionsByQuestionResBody =
            await model.getOptionsByQuestionId(conn, question_id);

        res.json(options);
    }));

    // Detail option handler
    router.get('/:option_id', wrapAsync(async (req, res) => {
        const option_id = validateIdParam(req.params.option_id);

        const conn = await getConn(req);
        const option: DetailOptionResBody | null =
            await model.getOption(conn, option_id);
        if (option === null) {
            throw new ResourceNotFoundError();
        }

        res.json(option);
    }));

    // Create option handler
    router.post('/', wrapAsync(async (req, res) => {
        const {
            question_id,
            prompt,
            description
        } = validateBodyProps<CreateOptionReqBody>(
            req.body,
            {
                question_id: model.isIdValid,
                prompt: model.isPromptValid,
                description: model.isDescriptionValid,
            }
        );

        const { profile_id } = await validateRequestJWT(req);

        const conn = await getConn(req);

        let option_id;
        try {
            option_id = await model.createOption(conn, {
                profile_id,
                question_id,
                prompt,
                description,
            });
        } catch (err) {
            if (err.code === ERR_MYSQL_NO_REFERENCED_ROW) {
                // The profile and/or question don't exist in the database.
                throw new ReferencedResourceNotFound();
            } else {
                throw err;
            }
        }

        const resBody: CreateOptionResBody = { option_id };

        res.json(resBody);
    }));

    // Modify option handler
    router.patch('/:option_id', wrapAsync(async (req, res) => {
        const option_id = validateIdParam(req.params.option_id);
        const {
            prompt,
            description
        } = validatePartialBodyProps<ModifyOptionReqBody>(
            req.body,
            {
                prompt: model.isPromptValid,
                description: model.isDescriptionValid,
            }
        );

        const { profile_id } = await validateRequestJWT(req);

        // Get existing option.
        const conn = await getConn(req);
        const option = await model.getOption(conn, option_id);
        if (option === null) {
            throw new ResourceNotFoundError();
        }

        if (option.profile_id !== profile_id) {
            throw new NotOwnerError();
        }

        // Apply requested changes.
        if (prompt !== undefined) {
            option.prompt = prompt;
        }

        if (description !== undefined) {
            option.description = description;
        }

        await model.updateOption(conn, option);

        res.sendStatus(200);
    }));
};
