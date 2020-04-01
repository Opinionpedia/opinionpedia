import crypto from 'crypto';

export function isPasswordValid(value) {
    return typeof value === 'string' &&
        value.length <= 128;
}

function randomBytes(size) {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(size, (err, buf) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(buf);
        });
    });
}

export function makeSalt() {
    return randomBytes(16);
}

function pbkdf2({ password, salt, iterations, keylen, digest }) {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, iterations, keylen, digest,
                      (err, derivedKey) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(derivedKey);
        });
    });
}

export function hashPassword(password, salt) {
    return pbkdf2({
        password,
        salt,
        iterations: 10000,
        keylen: 64,
        digest: 'sha512',
    });
}
