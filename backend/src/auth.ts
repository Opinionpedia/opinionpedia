import { Request } from 'express';
import jwt from 'jsonwebtoken';

const JWT_EXPIRATION_TIME = '1 hour';

// FIXME: Change to environment variable / use secret store.
const secret: jwt.Secret = 'secret';

/**
 * Information about clients stored on the client. Cryptographically
 * tamper-proof.
 */
export interface Token {
    profile_id: number;
}

/**
 * Internal format of payload used to communicate with clients.
 */
interface JWTPayload {
    sub: number;
}

function isJWTPayload(obj: any): boolean {
    return typeof obj.sub === 'string';
}


/**
 * Sign the given payload into a JSON Web Token string.
 *
 * @param payload - Payload object to sign
 * @param secretOrPrivateKey - Either the secret for HMAC algorithms, or the
 *                             PEM encoded private key for RSA and ECDSA
 * @param options - Options for the signature
 * @returns A Promise with the encoded token
 */
function sign(
    payload: object,
    secretOrPrivateKey: jwt.Secret,
    options: jwt.SignOptions
): Promise<string> {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, secretOrPrivateKey, options, (err, token) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(token);
        });
    });
}

/**
 * Asynchronously verify given token using a secret key to get a decoded token.
 *
 * @param token - JWT string to verify
 * @param secretOrPublicKey - A string containing either the secret for HMAC
 *                            algorithms or the PEM encoded public key for RSA
 *                            and ECDSA
 * @param options - Options for the verification
 * @returns A Promise with the decoded token
 */
function verify(
    token: string,
    secretOrPrivateKey: jwt.Secret,
    options: jwt.VerifyOptions
): Promise<any> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secretOrPrivateKey, options, (err, payload) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(payload!);
        });
    });
}

/**
 * Sign the given token into a JSON Web Token string using the server's
 * configured secret.
 *
 * @param token - The token to sign
 * @returns A Promise with the encoded token
 */
export function signJWT(token: Token): Promise<string> {
    const { profile_id } = token;
    const payload: JWTPayload = {
        sub: profile_id,
    };
    const options: jwt.SignOptions = {
        expiresIn: JWT_EXPIRATION_TIME,
    };

    // We assume this doesn't throw.
    return sign(payload, secret, options);
}

/**
 * Verify given token using the server's configured secret to get a decoded
 * token.
 *
 * @param token - JWT string to verify
 * @returns A Promise with either the decoded token or null if error
 */
export async function verifyJWT(token: string): Promise<Token | null> {
    let payload: JWTPayload;
    try {
        const decoded = await verify(token, secret, {});

        // Safe cast.
        if (isJWTPayload(decoded)) {
            return null;
        }
        payload = decoded as JWTPayload;
    } catch (err) {
        return null;
    }

    const { sub } = payload;
    return {
        profile_id: sub,
    };
}

/**
 * Verify an authentication token in the Authorization header on an HTTP
 * request.
 *
 * @param req - The HTTP request
 * @returns A Promise with either the decoded token or null if error
 */
export async function verifyRequestJWT(req: Request): Promise<Token | null> {
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

    return await verifyJWT(token);
}
