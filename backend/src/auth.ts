import jwt from 'jsonwebtoken';

const JWT_EXPIRATION_TIME = '1 hour';

const secret: jwt.Secret = process.env.JWT_SECRET || 'secret';

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

function isJWTPayload(obj: unknown): obj is JWTPayload {
    if (typeof obj !== 'object') {
        return false;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    const obj2 = obj as object;

    if (!('sub' in obj2)) {
        return false;
    }

    const obj3 = obj2 as JWTPayload;

    if (!Number.isInteger(obj3.sub)) {
        return false;
    }

    return true;
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
    // eslint-disable-next-line @typescript-eslint/ban-types
    payload: string | Buffer | object,
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
    secretOrPrivateKey: jwt.Secret | jwt.GetPublicKeyOrSecret,
    options: jwt.VerifyOptions
): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secretOrPrivateKey, options, (err, payload) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(payload as Record<string, unknown>);
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
        if (!isJWTPayload(decoded)) {
            return null;
        }

        payload = decoded;
    } catch (err) {
        return null;
    }

    const { sub } = payload;
    return {
        profile_id: sub,
    };
}
