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
    const stmt = SQL`SELECT * FROM question`;
    const results = await conn.query(stmt);
    const questions = results.asRows() as Question[];

    return questions;
}

export async function getQuestionsCount(conn: Conn): Promise<number> {
    const stmt = SQL`SELECT COUNT(*) AS count FROM question`;
    const results = await conn.query(stmt);
    const countArray = results.asRows() as { count: number }[];

    let count = 0;
    for (const c of countArray) {
        count = c.count;
    }

    return count;
}

export async function getQuestionsWithPagination(
    conn: Conn,
    index: number
): Promise<Question[]> {
    const stmt = SQL`SELECT * FROM question LIMIT ${index}, 20`;
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
