export type SQLDate = string;

export function isDate(value: any) {
    return typeof value === 'string' &&
           value.search(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/) === 0;
}

export function isId(value: any) {
    return Number.isInteger(value) &&
           0 <= value;
}

export function isInteger(value: any, min: number, max: number) {
    return Number.isInteger(value) &&
           min <= value &&
           value <= max;
}

export function isText(value: any, max: number) {
    return typeof value === 'string' &&
           value.length <= max;
}

export function isVarchar(value: any, min: number, max: number) {
    return typeof value === 'string' &&
           min <= value.length &&
           value.length <= max;
}
