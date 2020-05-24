import SQL from 'sql-template-strings';

import { CURRENT_DATE, SQLDate, isId, isVarchar } from './util.js';

import { Conn } from '../db.js';

export interface Question {
    id: number;

    profile_id: number;

    prompt: string;
    description: string;

    created: SQLDate;
    updated: SQLDate;
}

export interface CreateQuestion {
    profile_id: number;

    prompt: string;
    description: string;
}

export interface UpdateQuestion {
    id: number;

    profile_id: number;

    prompt: string;
    description: string;
}

const MAXIMUM_PROMPT_LENGTH = 3000;
const MAXIMUM_DESCRIPTION_LENGTH = 10000;

export function isIdValid(value: any): boolean {
    return isId(value);
}

export function isPromptValid(value: any): boolean {
    return isVarchar(value, 0, MAXIMUM_PROMPT_LENGTH);
}

export function isDescriptionValid(value: any): boolean {
    return isVarchar(value, 0, MAXIMUM_DESCRIPTION_LENGTH);
}

export async function getQuestions(conn: Conn): Promise<Question[]> {
    // TODO: Add pagination. Don't actually serve all questions in one request.

    const stmt = SQL`SELECT * FROM question`;
    const { results: questions } = await conn.query(stmt);
    return questions;
}

export async function getQuestion(
    conn: Conn,
    id: number
): Promise<Question | null> {
    const sql = SQL`
        SELECT * FROM question
        WHERE id = ${id}`;
    const { results: questions } = await conn.query(sql);

    // Check if the result is found or not.
    if (questions.length !== 1) {
        return null;
    }

    return questions[0];
}

export async function createQuestion(
    conn: Conn,
    question: CreateQuestion
): Promise<number> {
    const {
        profile_id,

        prompt,
        description,
    } = question;

    const created = CURRENT_DATE;
    const updated = CURRENT_DATE;

    const stmt = SQL`
        INSERT INTO question
        (profile_id, prompt, description, created, updated)
        VALUES
        (${profile_id}, ${prompt}, ${description}, ${created}, ${updated})`;

    const { results } = await conn.query(stmt);

    const id = results.insertId;
    return id;
}

export async function updateQuestion(
    conn: Conn,
    question: UpdateQuestion
): Promise<void> {
    const {
        id,

        profile_id,

        prompt,
        description,
    } = question;

    const updated = CURRENT_DATE;

    const stmt = SQL`
        UPDATE question
        SET profile_id = ${profile_id},
            prompt = ${prompt},
            description = ${description},
            updated = ${updated}
        WHERE id = ${id}`;

    await conn.query(stmt);
}
