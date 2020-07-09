import SQL from 'sql-template-strings';

import { QuestionTag } from './question_tag.js';
import { getQuestion, Question } from './question.js';
import { ResourceNotFoundError } from '../routes/errors.js';

import { Conn } from '../db.js';

const MAXIMUM_QUESTION_SUGGESTIONS = 3;

export type SuggestedQuestionIds = Question[];

export async function getQuestionSuggestions(
    conn: Conn,
    question_id: number
): Promise<SuggestedQuestionIds> {
    let suggestions: SuggestedQuestionIds = [];

    const tagIds = await getTagsOnQuestion(conn, question_id);

    for (
        let numTags = tagIds.length;
        suggestions.length < MAXIMUM_QUESTION_SUGGESTIONS && numTags > 0;
        numTags -= 1
    ) {
        const limit = MAXIMUM_QUESTION_SUGGESTIONS - suggestions.length;

        const topical = await getQuestionsWithTags(
            conn,
            tagIds,
            numTags,
            question_id,
            limit
        );

        suggestions = suggestions.concat(topical);
    }

    return suggestions;
}

export async function getTagsOnQuestion(
    conn: Conn,
    question_id: number
): Promise<number[]> {
    const stmt = SQL`
        SELECT tag_id
        FROM question_tag
        WHERE question_id = ${question_id}`;
    const results = await conn.query(stmt);
    const questionTags = results.asRows() as Pick<QuestionTag, 'tag_id'>[];

    const tagIds = questionTags.map((questionTag) => questionTag.tag_id);

    return tagIds;
}

// Finds up to `limit` questions that have exactly `numTags` tags from the set
// `tagIds`. Will never return a question with id of `not_question_id`.
async function getQuestionsWithTags(
    conn: Conn,
    tagIds: number[],
    numTags: number,
    not_question_id: number,
    limit: number
): Promise<Question[]> {
    const stmt = SQL`
        SELECT question.*
        FROM question_tag 
        LEFT JOIN question ON question_id=question.id
        WHERE question.id != ${not_question_id} AND
              question.id IN (${tagIds})
        GROUP BY question.id
        HAVING COUNT(1) = ${numTags}
        ORDER BY RAND()
        LIMIT ${limit}`;
    const results = await conn.query(stmt);

    const questions = results.asRows() as Pick<
        Question,
        'id' | 'profile_id' | 'prompt' | 'description' | 'created' | 'updated'
    >[];
    return questions;
}
