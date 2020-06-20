//
// The endpoint are:
//
// List     GET   /api/vote
// List     GET   /api/vote/question/:question_id
// Details  GET   /api/vote/:vote_id
// Create   POST  /api/vote
// Modify   PATCH /api/vote/:vote_id
//

import { Router } from 'express';

import { getConn } from './db.js';

import {
    NotOwnerError,
    ReferencedResourceNotFound,
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

import {
    ERR_MYSQL_DUP_ENTRY,
    ERR_MYSQL_NO_REFERENCED_ROW,
} from '../db.js';
import { hasCode } from '../errors.js';

import * as model from '../models/vote.js';

//
// Request body types
//
type ListVotesReqBody = null;
type ListVotesResBody = model.Vote[];

type ListVotesByQuestionReqBody = null;
type ListVotesByQuestionResBody = model.Vote[];

type DetailVoteReqBody = null;
type DetailVoteResBody = model.Vote;

type CreateVoteReqBody = Omit<model.CreateVote, 'profile_id'>;
type CreateVoteResBody = { vote_id: number; };

type ModifyVoteReqBody = Omit<model.UpdateVote, 'id'>;
type ModifyVoteResBody = null;

export default (router: Router): void => {
    // List votes handler
    router.get('/', wrapAsync(async (req, res) => {
        notAvailableInProduction();

        const conn = await getConn(req);
        const votes: ListVotesResBody = await model.getVotes(conn);

        res.json(votes);
    }));

    // List votes on question handler
    router.get('/question/:question_id', wrapAsync(async (req, res) => {
        const question_id = validateIdParam(req.params.question_id);

        const conn = await getConn(req);
        const votes: ListVotesByQuestionResBody =
            await model.getVotesByQuestionId(conn, question_id);

        res.json(votes);
    }));

    // Detail vote handler
    router.get('/:vote_id', wrapAsync(async (req, res) => {
        const vote_id = validateIdParam(req.params.vote_id);

        const conn = await getConn(req);
        const vote: DetailVoteResBody | null =
            await model.getVote(conn, vote_id);
        if (vote === null) {
            throw new ResourceNotFoundError();
        }

        res.json(vote);
    }));

    // Create vote handler
    router.post('/', wrapAsync(async (req, res) => {
        const {
            question_id,
            option_id,
            header,
            body,
            description,
            active,
        } = validateBodyProps<CreateVoteReqBody>(
            req.body,
            {
                question_id: model.isIdValid,
                option_id: model.isIdValid,
                header: model.isHeaderValid,
                body: model.isBodyValid,
                description: model.isDescriptionValid,
                active: model.isActiveValid,
            }
        );

        const { profile_id } = await validateRequestJWT(req);

        const conn = await getConn(req);

        let vote_id;
        try {
            vote_id = await model.createVote(conn, {
                profile_id,
                question_id,
                option_id,
                header,
                body,
                description,
                active,
            });
        } catch (err) {
            if (hasCode(err, ERR_MYSQL_DUP_ENTRY)) {
                // This profile already voted on this question.
                throw new ResourceAlreadyExistsDBError();
            } else if (hasCode(err, ERR_MYSQL_NO_REFERENCED_ROW)) {
                // The profile, question, and/or option doesn't exist in the
                // database.
                throw new ReferencedResourceNotFound();
            } else {
                throw err;
            }
        }

        const resBody: CreateVoteResBody = { vote_id };

        res.json(resBody);
    }));

    // Modify vote handler
    router.patch('/:vote_id', wrapAsync(async (req, res) => {
        const vote_id = validateIdParam(req.params.vote_id);

        const {
            header,
            body,
            description,
            active,
        } = validatePartialBodyProps<ModifyVoteReqBody>(
            req.body,
            {
                header: model.isHeaderValid,
                body: model.isBodyValid,
                description: model.isDescriptionValid,
                active: model.isActiveValid,
            }
        );

        const { profile_id } = await validateRequestJWT(req);

        // Get existing vote.
        const conn = await getConn(req);
        const vote = await model.getVote(conn, vote_id);
        if (vote === null) {
            throw new ResourceNotFoundError();
        }

        if (vote.profile_id !== profile_id) {
            throw new NotOwnerError();
        }

        // Apply requested changes.
        if (header !== undefined) {
            vote.header = header;
        }

        if (body !== undefined) {
            vote.body = body;
        }

        if (description !== undefined) {
            vote.description = description;
        }

        if (active !== undefined) {
            vote.active = active;
        }

        await model.updateVote(conn, vote);

        res.sendStatus(200);
    }));
};
