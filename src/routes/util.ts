import { NextFunction, Request, RequestHandler, Response } from 'express';

import { getConn } from './db.js';
import {
    InvalidAuthorizationError,
    InvalidParametersError,
    HTTP500InternalServerError,
    MissingAuthorizationError,
    NotAvailableInProductionError,
} from './errors.js';

import { Token, verifyJWT } from '../auth.js';
import { production } from '../config.js';
import { ERR_MYSQL_DUP_ENTRY } from '../db.js';
import { hasCode } from '../errors.js';

import * as profileModel from '../models/profile.js';
import { isId } from '../models/util.js';

/**
 * Route unavailable except when development mode is opted into.
 */
export function notAvailableInProduction(): void {
    if (production) {
        throw new NotAvailableInProductionError();
    }
}

/**
 * Express middleware factory to catch exceptions from a request handler that
 * is async. Propagates any error through to the rest of the middlewares so
 * they have a chance to handle it.
 */
export function wrapAsync(fn: RequestHandler): RequestHandler {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            await fn(req, res, next);
            next();
        } catch (err) {
            next(err);
        }
    };
}

/**
 * Get and validate a parameter from an Express HTTP request.
 *
 * @param value - Express HTTP request parameter value
 * @param convert - Function to typecast the parameter from string
 * @param validate - How to validate the value of the parameter
 * @returns The value of the HTTP parameter or null if invalid
 */
export function getParam<T>(
    param: string | undefined,
    convert: (value: string | undefined) => T | null,
    validate: (value: T) => boolean
): T | null {
    const converted = convert(param);

    if (converted === null) {
        // Type conversion failed.
        return null;
    }
    if (!validate(converted)) {
        // Value check failed.
        return null;
    }

    return converted;
}

/**
 * Converter for getParam().
 */
export function asNumber(value: string | undefined): number | null {
    // Cast required because TypeScript's signature for isNaN() says it only
    // takes a number.
    const asNumber = value as unknown as number;

    if (isNaN(asNumber)) {
        return null;
    }

    // Guaranteed to be a string that is parsable as a number.
    return +(value!);
}

/**
 * Converter for getParam().
 */
export function asString(value: string | undefined): string | null {
    return value === undefined ? null : value;
}

/**
 * Get and validate a database id from an Express HTTP request parameter.
 *
 * @param value - Express HTTP request parameter value
 * @returns The value of the id or null if invalid
 */
export function getIdParam(value: string | undefined): number | null {
    return getParam(value, asNumber, isId);
}

export function validateIdParam(value: string | undefined): number {
    const id = getIdParam(value);
    if (id === null) {
        throw new InvalidParametersError();
    }

    return id;
}

type BodyValidator = (value: unknown) => boolean;

function getBodyProps<BodyProperties>(
    body: { [prop: string]: unknown },
    validators: { [PropertyName in keyof BodyProperties]: BodyValidator }
): BodyProperties | null {
    const bodyProperties: { [prop: string]: unknown } = {};

    for (const key in validators) {
        const value: unknown = body[key];

        const validator = validators[key];

        const validated: boolean = validator(body[key]);
        if (!validated) {
            return null;
        }

        bodyProperties[key] = value;
    }

    return bodyProperties as unknown as BodyProperties;
}

export function validateBodyProps<BodyProperties>(
    body: any,
    validators: { [PropertyName in keyof BodyProperties]: BodyValidator }
): BodyProperties {
    const props = getBodyProps(body, validators);
    if (props === null) {
        throw new InvalidParametersError();
    }

    return props;
}

function getPartialBodyProps<BodyProperties>(
    body: { [prop: string]: unknown },
    validators: { [PropertyName in keyof BodyProperties]: BodyValidator }
): Partial<BodyProperties> | null {
    const bodyProperties: { [prop: string]: unknown } = {};

    for (const key in validators) {
        const value: unknown = body[key];

        // Okay if a property is missing.
        if (value === undefined) {
            continue;
        }

        const validator = validators[key];

        const validated: boolean = validator(body[key]);
        if (!validated) {
            return null;
        }

        bodyProperties[key] = value;
    }

    return bodyProperties as Partial<BodyProperties>;
}

export function validatePartialBodyProps<BodyProperties>(
    body: any,
    validators: { [PropertyName in keyof BodyProperties]: BodyValidator }
): Partial<BodyProperties> {
    const props = getPartialBodyProps(body, validators);
    if (props === null) {
        throw new InvalidParametersError();
    }

    return props;
}

function getAuthToken(req: Request): string | null {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return null;
    }

    const parts = authorization.split(' ');
    if (parts.length !== 2) {
        return null;
    }
    if (parts[0] !== 'Bearer') {
        return null;
    }

    const token = parts[1];

    return token;
}

/**
 * Retrieves the payload of a JWT token in the Authorization header on an HTTP
 * request.
 *
 * @param req - the HTTP request
 * @returns the JWT's payload
 *
 * @throws {@link MissingAuthorizationError}
 * Thrown if the request did not include an Authorization header.
 *
 * @throws {@link InvalidAuthorizationError}
 * Thrown if the Authorization header was malformed or contained an invalid
 * value.
 */
export async function validateRequestJWT(req: Request): Promise<Token> {
    const authorization = req.headers.authorization;
    if (!authorization) {
        throw new MissingAuthorizationError();
    }

    const token = getAuthToken(req);
    if (token === null) {
        throw new InvalidAuthorizationError();
    }

    const payload = await verifyJWT(token);
    if (payload === null) {
        throw new InvalidAuthorizationError();
    }

    return payload;
}

/**
 * Attempts to find or create a profile for an HTTP request.
 *
 * If the request has an "Authorization" header, it is assumed to contain a JWT
 * and validation/decoding is performed. This should be the case for logged in
 * users.
 *
 * Otherwise, the request's remote IP address is used to find or create (if it
 * didn't already exist) a profile.
 *
 * @param req - the HTTP request
 * @returns a profile ID to use for authorizing actions in the request
 *
 * @throws {@link InvalidAuthorizationError}
 * Thrown if an Authorization header was provided but was malformed or
 * contained an invalid value.
 */
export async function getProfileID(req: Request): Promise<number> {
    const authorization = req.headers.authorization;
    if (authorization) {
        // If an Authorization header was provided, never try to use an IP
        // address profile.
        const token = getAuthToken(req);
        if (!token) {
            throw new InvalidAuthorizationError();
        }

        // TODO: Great place for an LRU cache. The profile ID for a JWT will
        //       never change. It will expire (expiration time included in JWT
        //       payload), but that can be inserted into the cache, too.
        const payload = await verifyJWT(token);
        if (payload === null) {
            throw new InvalidAuthorizationError();
        }

        return payload.profile_id;
    } else {
        // The request is from an anonymous user. Use an IP address profile.
        const { remoteAddress } = req.socket;
        if (remoteAddress === undefined) {
            // Rare: Client disconnected, Node has scrubbed what their IP
            //       address was. We cannot progress.
            //
            // Technically it shouldn't matter what we throw here because no
            // response will be able to be sent back to the client anyway...
            throw new MissingAuthorizationError();
        }

        if (!profileModel.isIPValid(remoteAddress)) {
            // Rare: If this fails, it means our IP-checking regex is invalid
            //       and a user could create a profile with a username that is
            //       an IP address, which would cause problems.
            throw new HTTP500InternalServerError();
        }

        // TODO: Great place for an LRU cache. The profile ID for a remote
        //       address will never change.
        const profile_id = await getIPAddrProfile(req, remoteAddress);
        if (profile_id !== null) {
            return profile_id;
        }

        return await createIPAddrProfile(req, remoteAddress);
    }
}

async function getIPAddrProfile(
    req: Request,
    remoteAddress: string
): Promise<number | null> {
    const conn = await getConn(req);
    return await profileModel.getIPAddrProfileId(conn, remoteAddress);
}

async function createIPAddrProfile(
    req: Request,
    remoteAddress: string
): Promise<number> {
    const conn = await getConn(req);

    let profile_id: number;
    try {
        profile_id = await profileModel.createIPAddrProfile(
            conn,
            remoteAddress
        );
    } catch (err) {
        if (hasCode(err, ERR_MYSQL_DUP_ENTRY)) {
            // Maybe the profile was created in a concurrent request??
            throw new HTTP500InternalServerError();
        } else {
            throw err;
        }
    }

    return profile_id;
}
