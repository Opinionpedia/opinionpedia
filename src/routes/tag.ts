//
// The endpoint are:
//
// List     GET   /api/tag
// Details  GET   /api/tag/:tag_id
// Create   POST  /api/tag
// Modify   PATCH /api/tag/:tag_id
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

import * as model from '../models/tag.js';

//
// Request body types
//
type ListTagsReqBody = null;
type ListTagsResBody = model.Tag[];

type DetailTagReqBody = null;
type DetailTagResBody = model.Tag;

type CreateTagReqBody = Omit<model.CreateTag, 'profile_id'>;
type CreateTagResBody = { tag_id: number; };

type ModifyTagReqBody = Omit<model.UpdateTag, 'id'>;
type ModifyTagResBody = null;

export default (router: Router): void => {
    // List tags handler
    router.get('/', wrapAsync(async (req, res) => {
        const conn = await getConn(req);
        const tags: ListTagsResBody = await model.getTags(conn);

        res.json(tags);
    }));

    // Detail tag handler
    router.get('/:tag_id', wrapAsync(async (req, res) => {
        const tag_id = validateIdParam(req.params.tag_id);

        const conn = await getConn(req);
        const tag: DetailTagResBody | null = await model.getTag(conn, tag_id);
        if (tag === null) {
            throw new ResourceNotFoundError();
        }

        res.json(tag);
    }));

    // Create tag handler
    router.post('/', wrapAsync(async (req, res) => {
        const {
            name,
            description,
            category,
        } = validateBodyProps<CreateTagReqBody>(
            req.body,
            {
                name: model.isNameValid,
                description: model.isDescriptionValid,
                category: model.isCategoryValid,
            }
        );

        const { profile_id } = await validateRequestJWT(req);

        const conn = await getConn(req);

        let tag_id;
        try {
            tag_id = await model.createTag(conn, {
                profile_id,
                name,
                description,
                category,
            });
        } catch (err) {
            if (hasCode(err, ERR_MYSQL_DUP_ENTRY)) {
                // Tag already exists.
                throw new ResourceAlreadyExistsDBError();
            } else if (hasCode(err, ERR_MYSQL_NO_REFERENCED_ROW)) {
                // Rare: The profile doesn't exist in the database.
                throw new ReferencedResourceNotFound();
            } else {
                throw err;
            }
        }

        const resBody: CreateTagResBody = { tag_id };

        res.json(resBody);
    }));

    // Modify tag handler
    router.patch('/:tag_id', wrapAsync(async (req, res) => {
        const tag_id = validateIdParam(req.params.tag_id);

        const {
            name,
            description,
        } = validatePartialBodyProps<ModifyTagReqBody>(
            req.body,
            {
                name: model.isNameValid,
                description: model.isDescriptionValid,
            }
        );

        const { profile_id } = await validateRequestJWT(req);

        // Get existing tag.
        const conn = await getConn(req);
        const tag = await model.getTag(conn, tag_id);
        if (tag === null) {
            throw new ResourceNotFoundError();
        }

        if (tag.profile_id !== profile_id) {
            throw new NotOwnerError();
        }

        // Apply requested changes.
        if (name !== undefined) {
            tag.name = name;
        }

        if (description !== undefined) {
            tag.description = description;
        }

        try {
            await model.updateTag(conn, tag);
        } catch (err) {
            if (hasCode(err, ERR_MYSQL_DUP_ENTRY)) {
                // Tag already exists.
                throw new ResourceAlreadyExistsDBError();
            } else {
                throw err;
            }
        }

        res.sendStatus(200);
    }));
};
