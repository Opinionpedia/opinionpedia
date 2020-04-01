import SQL from 'sql-template-strings';

import { CURRENT_DATE, isVarchar } from './util.js';

export function isUsernameValid(value) {
    return isVarchar(value, 1, 300);
}

// Note: function isPasswordValid can be found in password.js

export function isBodyValid(value) {
    return isVarchar(value, 0, 10000);
}

export function isDescriptionValid(value) {
    return isVarchar(value, 0, 3000);
}

export async function getProfiles(conn) {
    const stmt = SQL`SELECT * FROM profile`;
    const { results } = await conn.query(stmt);

    const profiles = results;
    return profiles;
}

export async function getProfile(conn, username) {
    const stmt = SQL`SELECT * FROM profile WHERE username = ${username}`;
    const { results } = await conn.query(stmt);

    // Check if the result is found or not.
    if (results.length !== 1) {
        return null;
    }

    const profile = results[0];
    return profile;
}

export async function createProfile(conn, profile) {
    const {
        username,
        password,
        salt,
        body,
        description,
    } = profile;

    const created = CURRENT_DATE;
    const updated = CURRENT_DATE;

    const stmt = SQL`INSERT
        INTO profile
        (username, password, salt, created, updated, body, description)
        VALUES
        (${username}, ${password}, ${salt}, ${created}, ${updated}, ${body},
         ${description})`;

    await conn.query(stmt);
}

export async function updateProfile(conn, profile) {
    const {
        username,
        password,
        body,
        description,
    } = profile;

    const updated = CURRENT_DATE;

    const stmt = SQL`UPDATE profile
        SET password = ${password},
            body = ${body},
            updated = ${updated},
            description = ${description}
        WHERE username = ${username}`;

    await conn.query(stmt);
}
