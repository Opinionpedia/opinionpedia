import { NextFunction, Request, RequestHandler, Response } from 'express';

import {
    InvalidParametersError,
    MissingAuthenticationError,
    NotAvailableInProductionError,
} from './errors.js';

import { Token, verifyJWT } from '../auth.js';

import { production } from '../config.js';

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
 * Validate an authentication token in the Authorization header on an HTTP
 * request.
 *
 * @param req - The HTTP request
 * @returns A Promise with either the decoded token
 * @throws
 */
export async function validateRequestJWT(req: Request): Promise<Token> {
    const token = getAuthToken(req);
    if (token === null) {
        throw new MissingAuthenticationError();
    }

    const payload = await verifyJWT(token);
    if (payload === null) {
        throw new MissingAuthenticationError();
    }

    return payload;
}
