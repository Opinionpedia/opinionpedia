//
// The endpoint are:
//
// List     GET   /api/profile
// Details  GET   /api/profile/:id_or_username
// Create   POST  /api/profile
// Modify   PATCH /api/profile
// Login    POST  /api/login
//

import { Router } from 'express';

import { getConn } from './db.js';
import {
    HTTP500InternalServerError,
    IncorrectPassword,
    InvalidParametersError,
    ResourceAlreadyExistsDBError,
    ResourceNotFoundError,
} from './errors.js';
import {
    asString,
    getIdParam,
    getParam,
    notAvailableInProduction,
    validateBodyProps,
    validatePartialBodyProps,
    validateRequestJWT,
    wrapAsync,
} from './util.js';

import * as auth from '../auth.js';
import { ERR_MYSQL_DUP_ENTRY } from '../db.js';
import { hasCode } from '../errors.js';
import { hashPassword, makeSalt } from '../password.js';

import * as model from '../models/profile.js';

type CleanProfile = Omit<model.Profile, 'salt' | 'password'>;

//
// Request body types
//
type ListProfileReqBody = null;
type ListProfileResBody = CleanProfile[];

type DetailProfileReqBody = null;
type DetailProfileResBody = CleanProfile;

type CreateProfileReqBody = Omit<model.CreateProfile, 'salt'>;
type CreateProfileResBody = {
    profile_id: number;
    token: string;
};

type ModifyProfileReqBody = Omit<model.UpdateProfile, 'id'>;
type ModifyProfileResBody = null;

type LoginReqBody = {
    username: string;
    password: string;
};
type LoginResBody = {
    profile_id: number;
    token: string;
};

function cleanProfile(profile: model.Profile): CleanProfile {
    const cleaned = Object.assign({}, profile);
    delete cleaned.salt;
    delete cleaned.password;
    return cleaned;
}

interface IdOrUsername {
    profile_id: number | null;
    username: string | null;
}

function getIdOrUsernameParam(id_or_username: string): IdOrUsername {
    const profile_id = getIdParam(id_or_username);
    const username = getParam(id_or_username, asString, model.isUsernameValid);

    if (profile_id === null && username === null) {
        throw new InvalidParametersError();
    }

    return { profile_id, username };
}

export default (routers: { profile: Router; login: Router }): void => {
    // List profiles handler
    routers.profile.get(
        '/',
        wrapAsync(async (req, res) => {
            notAvailableInProduction();

            const conn = await getConn(req);
            const profiles = await model.getProfiles(conn);

            const cleanedProfiles: ListProfileResBody = profiles.map(
                cleanProfile
            );

            res.json(cleanedProfiles);
        })
    );

    // Detail profile handler
    routers.profile.get(
        '/:id_or_username',
        wrapAsync(async (req, res) => {
            const { profile_id, username } = getIdOrUsernameParam(
                req.params.id_or_username
            );

            const conn = await getConn(req);
            const profile: model.Profile | null =
                profile_id !== null
                    ? await model.getProfile(conn, profile_id)
                    : await model.getProfileByUsername(conn, username!);
            if (profile === null) {
                throw new ResourceNotFoundError();
            }

            const cleaned: DetailProfileResBody = cleanProfile(profile);

            res.json(cleaned);
        })
    );

    // Create profile handler
    routers.profile.post(
        '/',
        wrapAsync(async (req, res) => {
            const { username, password, description, body } = validateBodyProps<
                CreateProfileReqBody
            >(req.body, {
                username: model.isUsernameValid,
                password: model.isPasswordValid,
                description: model.isDescriptionValid,
                body: model.isBodyValid,
            });

            const salt = await makeSalt();
            const hash = await hashPassword(password, salt);

            const conn = await getConn(req);

            let profile_id: number;
            try {
                profile_id = await model.createProfile(conn, {
                    username,
                    salt: salt.toString('hex'),
                    password: hash.toString('hex'),
                    description,
                    body,
                });
            } catch (err) {
                if (hasCode(err, ERR_MYSQL_DUP_ENTRY)) {
                    throw new ResourceAlreadyExistsDBError();
                } else {
                    throw err;
                }
            }

            // No need to hit /login after this. We give you a token now.
            const token = await auth.signJWT({ profile_id });

            const resBody: CreateProfileResBody = { profile_id, token };
            res.json(resBody);
        })
    );

    // Modify profile handler
    routers.profile.patch(
        '/',
        wrapAsync(async (req, res) => {
            const {
                username,
                password,
                description,
                body,
            } = validatePartialBodyProps<ModifyProfileReqBody>(req.body, {
                username: model.isUsernameValid,
                password: model.isPasswordValid,
                description: model.isDescriptionValid,
                body: model.isBodyValid,
            });

            const { profile_id } = await validateRequestJWT(req);

            // Get existing profile.
            const conn = await getConn(req);
            const profile = await model.getProfile(conn, profile_id);
            if (profile === null) {
                // The JWT is valid, so a profile must have existed at some
                // point...
                throw new HTTP500InternalServerError('Unknown profile');
            }

            // Apply requested changes.
            if (username !== undefined) {
                profile.username = username;
            }

            if (password !== undefined) {
                const salt = Buffer.from(profile.salt, 'hex');
                const hash = await hashPassword(password, salt);
                profile.password = hash.toString('hex');
            }

            if (body !== undefined) {
                profile.body = body;
            }

            if (description !== undefined) {
                profile.description = description;
            }

            await model.updateProfile(conn, profile);

            res.sendStatus(200);
        })
    );

    // Login handler
    routers.login.post(
        '/',
        wrapAsync(async (req, res) => {
            const { username, password } = validateBodyProps<LoginReqBody>(
                req.body,
                {
                    username: model.isUsernameValid,
                    password: model.isPasswordValid,
                }
            );

            // Get existing profile.
            const conn = await getConn(req);
            const profile = await model.getProfileByUsername(conn, username);
            if (profile === null) {
                throw new ResourceNotFoundError();
            }

            const salt = Buffer.from(profile.salt, 'hex');
            const hash = await hashPassword(password, salt);

            if (profile.password !== hash.toString('hex')) {
                throw new IncorrectPassword();
            }

            const token = await auth.signJWT({ profile_id: profile.id });

            const resBody: LoginResBody = {
                profile_id: profile.id,
                token,
            };

            res.json(resBody);
        })
    );
};
