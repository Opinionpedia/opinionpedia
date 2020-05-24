import crypto from 'crypto';

//https://api.pwnedpasswords.com/range/ce0b2

export function isPasswordValid(value: any): boolean {
    return typeof value === 'string' &&
           value.length <= 128;
}

function randomBytes(size: number): Promise<Buffer> {
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

export function makeSalt(): Promise<Buffer> {
    return randomBytes(16);
}

interface Pbkdf2Params {
    password: string;
    salt: Buffer,
    iterations: number;
    keylen: number;
    digest: string;
}

function pbkdf2({
    password,
    salt,
    iterations,
    keylen,
    digest,
}: Pbkdf2Params): Promise<Buffer> {
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

export function hashPassword(
    password: string,
    salt: Buffer,
): Promise<Buffer> {
    return pbkdf2({
        password,
        salt,
        iterations: 10000,
        keylen: 64,
        digest: 'sha512',
    });
}
