import SQL from 'sql-template-strings';

import { CURRENT_DATE, isId, isVarchar } from './util.js';

export function isIdValid(value) {
    return isId(value);
}

export function isPromptValid(value) {
    return isVarchar(value, 0, 3000);
}

export function isDescriptionValid(value) {
    return isVarchar(value, 0, 10000);
}

export async function getQuestions(conn) {
    const stmt = SQL`SELECT * FROM question`;
    const { results } = await conn.query(stmt);

    const questions = results;
    return questions;
}

export async function getQuestion(conn, id) {
    const sql = SQL`SELECT * FROM question WHERE id = ${id}`;
    const { results } = await conn.query(sql);

    // Check if the result is found or not.
    if (results.length !== 1) {
        return null;
    }

    const question = results[0];
    return question;
}

export async function createQuestion(conn, question) {
    const {
        prompt,
        description,
        profile_username,
    } = question;

    const created = CURRENT_DATE;
    const updated = CURRENT_DATE;

    const stmt = SQL`INSERT
        INTO question
        (prompt, description, created, updated, profile_username)
        VALUES
        (${prompt}, ${description}, ${created}, ${updated},
         ${profile_username})`;

    const { results } = await conn.query(stmt);

    const id = results.insertId;
    return id;
}

export async function updateQuestion(conn, question) {
    const {
        id,
        prompt,
        description,
        profile_username,
    } = question;

    const updated = CURRENT_DATE;

    const stmt = SQL`UPDATE question
        SET prompt = ${prompt},
            description = ${description},
            updated = ${updated},
            profile_username = ${profile_username}
        WHERE id = ${id}`;

    await conn.query(stmt);
}
