//
// The endpoint are:
//
// List    GET   /api/tag/question/:question_id/tags
// List    GET   /api/tag/question/:tag_id/questions
// List    GET   /api/tag/question/:tag_id/questions/:question_index
// Number  GET   /api/tag/question/:tag_id/count
// Create  POST  /api/tag/question
//

import { Router } from 'express';

import { getConn } from './db.js';
import {
    ReferencedResourceNotFound,
    ResourceAlreadyExistsDBError,
} from './errors.js';
import {
    validateBodyProps,
    validateIdParam,
    validateRequestJWT,
    wrapAsync,
} from './util.js';

import { ERR_MYSQL_DUP_ENTRY, ERR_MYSQL_NO_REFERENCED_ROW } from '../db.js';
import { hasCode } from '../errors.js';

import * as tagModel from '../models/question_tag.js';
import * as questionModel from '../models/question.js';

//
// Request body types
//
type ListTagsOnQuestionReqBody = null;
type ListTagsOnQuestionResBody = tagModel.TagOnQuestion[];

type ListQuestionsWithTagReqBody = null;
type ListQuestionsWithTagResBody = questionModel.Question[];

type CreateQuestionTagReqBody = tagModel.QuestionTag;
type CreateQuestionTagResBody = null;

export default (router: Router): void => {
    // List tags on question handler
    router.get(
        '/:question_id/tags',
        wrapAsync(async (req, res) => {
            const question_id = validateIdParam(req.params.question_id);

            const conn = await getConn(req);
            const tags: ListTagsOnQuestionResBody = await tagModel.getTagsOnQuestion(
                conn,
                question_id
            );

            res.json(tags);
        })
    );

    // get number of questions with tag handler
    router.get(
        '/:tag_id/count',
        wrapAsync(async (req, res) => {
            const tag_id = validateIdParam(req.params.tag_id);

            const conn = await getConn(req);
            const count: number = await tagModel.countQuestionsWithTag(
                conn,
                tag_id
            );

            res.json(count);
        })
    );

    // List questions with tag handler
    router.get(
        '/:tag_id/questions',
        wrapAsync(async (req, res) => {
            const tag_id = validateIdParam(req.params.tag_id);

            const conn = await getConn(req);
            const questionIds: ListQuestionsWithTagResBody = await tagModel.getQuestionsWithTag(
                conn,
                tag_id
            );

            res.json(questionIds);
        })
    );

    // List questions with tag handler
    router.get(
        '/:tag_id/questions/:question_index',
        wrapAsync(async (req, res) => {
            const tag_id = validateIdParam(req.params.tag_id);
            const start_index = validateIdParam(req.params.question_index);

            const conn = await getConn(req);
            const questionIds: ListQuestionsWithTagResBody = await tagModel.getQuestionsWithTagWithPagination(
                conn,
                tag_id,
                start_index
            );

            res.json(questionIds);
        })
    );

    // Create question tag handler
    router.post(
        '/',
        wrapAsync(async (req, res) => {
            const { tag_id, question_id } = validateBodyProps<
                CreateQuestionTagReqBody
            >(req.body, {
                tag_id: tagModel.isIdValid,
                question_id: tagModel.isIdValid,
            });

            // Must be logged in to tag a question.
            await validateRequestJWT(req);

            const conn = await getConn(req);

            try {
                await tagModel.createQuestionTag(conn, {
                    tag_id,
                    question_id,
                });
            } catch (err) {
                if (hasCode(err, ERR_MYSQL_DUP_ENTRY)) {
                    // This question tag already existed.
                    throw new ResourceAlreadyExistsDBError();
                } else if (hasCode(err, ERR_MYSQL_NO_REFERENCED_ROW)) {
                    // The question and/or tag doesn't exist in the database.
                    throw new ReferencedResourceNotFound();
                } else {
                    throw err;
                }
            }

            res.sendStatus(200);
        })
    );
};
