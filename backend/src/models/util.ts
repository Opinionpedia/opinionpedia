export type SQLDate = string;

export function isId(value: any): boolean {
    return Number.isInteger(value) &&
           0 <= value;
}

export function isInteger(value: any, min: number, max: number): boolean {
    return Number.isInteger(value) &&
           min <= value &&
           value <= max;
}

export function isText(value: any, max: number): boolean {
    return typeof value === 'string' &&
           value.length <= max;
}

export function isVarchar(value: any, min: number, max: number): boolean {
    return typeof value === 'string' &&
           min <= value.length &&
           value.length <= max;
}
