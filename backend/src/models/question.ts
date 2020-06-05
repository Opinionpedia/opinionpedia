import SQL from 'sql-template-strings';

import { SQLDate, isId, isVarchar } from './util.js';

import { Conn } from '../db.js';

const MAXIMUM_PROMPT_LENGTH = 3000;
const MAXIMUM_DESCRIPTION_LENGTH = 10000;

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

export const isIdValid = isId;

export function isPromptValid(value: unknown): boolean {
    return isVarchar(value, 0, MAXIMUM_PROMPT_LENGTH);
}

export function isDescriptionValid(value: unknown): boolean {
    return isVarchar(value, 0, MAXIMUM_DESCRIPTION_LENGTH);
}

export async function getQuestions(conn: Conn): Promise<Question[]> {
    // TODO: Add pagination. Don't actually serve all questions in one request.

    const stmt = SQL`SELECT * FROM question`;
    const results = await conn.query(stmt);
    const questions = results.asRows() as Question[];

    return questions;
}

export async function getQuestion(
    conn: Conn,
    id: number
): Promise<Question | null> {
    const stmt = SQL`
        SELECT * FROM question
        WHERE id = ${id}`;
    const results = await conn.query(stmt);
    const questions = results.asRows() as Question[];

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

    const stmt = SQL`
        INSERT INTO question (profile_id, prompt, description)
        VALUES (${profile_id}, ${prompt}, ${description})`;

    const results = await conn.query(stmt);

    const id = results.asOk().insertId;
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

    const stmt = SQL`
        UPDATE question
        SET profile_id = ${profile_id},
            prompt = ${prompt},
            description = ${description}
        WHERE id = ${id}`;

    await conn.query(stmt);
}
