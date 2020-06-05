export type SQLDate = string;

export function isId(value: unknown): boolean {
    return Number.isInteger(value) &&
           0 <= (value as number);
}

export function isInteger(value: unknown, min: number, max: number): boolean {
    return Number.isInteger(value) &&
           min <= (value as number) &&
           (value as number) <= max;
}

export function isText(value: unknown, max: number): boolean {
    return typeof value === 'string' &&
           value.length <= max;
}

export function isVarchar(value: unknown, min: number, max: number): boolean {
    return typeof value === 'string' &&
           min <= value.length &&
           value.length <= max;
}
