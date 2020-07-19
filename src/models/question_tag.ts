import SQL from 'sql-template-strings';

import { isId } from './util.js';
import { Tag } from './tag.js';

import { Conn } from '../db.js';
import { Question } from './question.js';

export interface QuestionTag {
    tag_id: number;
    question_id: number;
}

export type TagOnQuestion = { tag_id: number } & Pick<
    Tag,
    'name' | 'description' | 'category'
>;

export const isIdValid = isId;

export async function getTagsOnQuestion(
    conn: Conn,
    question_id: number
): Promise<TagOnQuestion[]> {
    const stmt = SQL`
        SELECT tag_id, name, description, category
        FROM question_tag
             JOIN
             tag ON question_tag.tag_id = tag.id
        WHERE question_tag.question_id = ${question_id}`;
    const results = await conn.query(stmt);
    const questionTags = results.asRows() as TagOnQuestion[];

    return questionTags;
}

export async function getQuestionsWithTag(
    conn: Conn,
    tag_id: number
): Promise<Question[]> {
    const stmt = SQL`
        SELECT question.*
        FROM question
         RIGHT JOIN question_tag ON question.id=question_tag.question_id
        WHERE question_tag.tag_id = ${tag_id};
        `;
    const results = await conn.query(stmt);
    const questions = results.asRows() as Question[];

    return questions;
}

export async function getQuestionsWithTagWithPagination(
    conn: Conn,
    tag_id: number,
    start_index: number
): Promise<Question[]> {
    let end_index: number = start_index+20
    const stmt = SQL`
        SELECT question.*
        FROM question
         RIGHT JOIN question_tag ON question.id=question_tag.question_id
        WHERE question_tag.tag_id = ${tag_id}
        LIMIT ${start_index}, ${end_index};
        `;
    const results = await conn.query(stmt);
    const questions = results.asRows() as Question[];
    return questions;
}

export async function countQuestionsWithTag(
    conn: Conn,
    tag_id: number
): Promise<number> {
    const stmt = SQL`
        SELECT COUNT(question_id) AS count
        FROM question_tag
        WHERE tag_id = ${tag_id}`;
    const results = await conn.query(stmt);
    const question_tags = results.asRows() as { count: number }[];

    let count = 0;
    for (const question_tag of question_tags) {
        count = question_tag.count;
    }

    return count;
}

export async function createQuestionTag(
    conn: Conn,
    questionTag: QuestionTag
): Promise<void> {
    const { tag_id, question_id } = questionTag;

    const stmt = SQL`
        INSERT INTO question_tag (tag_id, question_id)
        VALUES (${tag_id}, ${question_id})`;

    await conn.query(stmt);
}
