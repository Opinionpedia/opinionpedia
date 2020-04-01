import jwt from 'jsonwebtoken';

const secret = 'secret';

function sign(payload, secretOrPrivateKey, options) {
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

function verify(token, secretOrPrivateKey, options) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secretOrPrivateKey, options, (err, payload) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(payload);
        });
    });
}

export function signJWT({ username }) {
    const payload = {
        sub: username,
    };
    const options = {
        expiresIn: '1 hour',
    };
    return sign(payload, secret, options);
}

export async function verifyJWT(token) {
    let payload;
    try {
        payload = await verify(token, secret, {});
    } catch (err) {
        return null;
    }

    const { sub } = payload;
    return {
        username: sub,
    };
}

export function verifyRequestJWT(req) {
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

    return verifyJWT(token);
}
