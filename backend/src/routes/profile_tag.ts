//
// The endpoint are:
//
// List     GET   /api/tag/profile/:profile_id
// Create   POST  /api/tag/profile
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

import {
    ERR_MYSQL_DUP_ENTRY,
    ERR_MYSQL_NO_REFERENCED_ROW,
} from '../db.js';

import * as model from '../models/profile_tag.js';

//
// Request body types
//
type ListTagsOnProfileReqBody = null;
type ListTagsOnProfileResBody = model.TagOnProfile[];

type CreateProfileTagReqBody = Omit<model.ProfileTag, 'profile_id'>;
type CreateProfileTagResBody = null;

export default (router: Router): void => {
    // List tags on profile handler
    router.get('/:profile_id', wrapAsync(async (req, res) => {
        const profile_id = validateIdParam(req.params.profile_id);

        const conn = await getConn(req);
        const tags: ListTagsOnProfileResBody =
            await model.getTagsOnProfile(conn, profile_id);

        res.json(tags);
    }));

    // Create profile tag handler
    router.post('/', wrapAsync(async (req, res) => {
        const { tag_id } = validateBodyProps<CreateProfileTagReqBody>(
            req.body,
            { tag_id: model.isIdValid }
        );

        const { profile_id } = await validateRequestJWT(req);

        const conn = await getConn(req);

        try {
            await model.createProfileTag(conn, {
                tag_id,
                profile_id,
            });
        } catch (err) {
            if (err.code === ERR_MYSQL_DUP_ENTRY) {
                // This profile tag already existed.
                throw new ResourceAlreadyExistsDBError();
            } else if (err.code === ERR_MYSQL_NO_REFERENCED_ROW) {
                // The profile and/or tag doesn't exist in the database.
                throw new ReferencedResourceNotFound();
            } else {
                throw err;
            }
        }

        res.sendStatus(200);
    }));
};
