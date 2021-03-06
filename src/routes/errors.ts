import { development } from '../config.js';

export class HTTPError extends Error {
    statusCode: number;
    statusMessage?: string;

    constructor(message?: string) {
        super(message);
        this.statusCode = 500;
        this.statusMessage = 'Internal Server Error';
    }
}

class HTTP400BadRequestError extends HTTPError {
    constructor(message?: string) {
        super(message);
        this.statusCode = 400;
        this.statusMessage = 'Bad Request';
    }
}

class HTTP403ForbiddenError extends HTTPError {
    constructor(message?: string) {
        super(message);
        this.statusCode = 403;
        this.statusMessage = 'Forbidden';
    }
}

class HTTP404NotFoundError extends HTTPError {
    constructor(message?: string) {
        super(message);
        this.statusCode = 404;
        this.statusMessage = 'Not Found';
    }
}

export class HTTP500InternalServerError extends HTTPError {
    constructor(message?: string) {
        super(message);
        this.statusCode = 500;
        this.statusMessage = 'Internal Server Error';
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class HTTP501NotImplementedError extends HTTPError {
    constructor(message?: string) {
        super(message);
        this.statusCode = 501;
        this.statusMessage = 'Not Implemented';
    }
}

class HTTP503ServiceNotAvailableError extends HTTPError {
    constructor(message?: string) {
        super(message);
        this.statusCode = 503;
        this.statusMessage = 'Service Not Available';
    }
}

// Is the database up?
export class CouldNotConnectDBError extends HTTP503ServiceNotAvailableError {
    constructor(err: Error) {
        if (development) {
            super('Could not connect to database');
        } else {
            super();
        }
        console.error(err);
    }
}

export class MissingAuthorizationError extends HTTP403ForbiddenError {
    constructor() {
        super('Missing Authorization header');
    }
}

export class NotOwnerError extends HTTP403ForbiddenError {
    constructor() {
        super('Not owner');
    }
}

export class IncorrectPassword extends HTTP403ForbiddenError {
    constructor() {
        super('Incorrect password');
    }
}

export class InvalidAuthorizationError extends HTTP400BadRequestError {
    constructor() {
        super('Invalid Authorization header: malformed or expired value');
    }
}

// HTTP client issued a request with a parameter or body that is malformed.
export class InvalidParametersError extends HTTP400BadRequestError {
    constructor() {
        super('Invalid request parameters');
    }
}

export class NotAvailableInProductionError extends HTTP403ForbiddenError {
    constructor() {
        super('Not available in production');
    }
}

// SQL INSERT or UPDATE fails due to a FOREIGN KEY constraint.
export class ReferencedResourceNotFound extends HTTP404NotFoundError {
    constructor() {
        super('Referenced resource not found');
    }
}

// SQL INSERT or UPDATE failed due to a UNIQUE constraint.
export class ResourceAlreadyExistsDBError extends HTTP400BadRequestError {
    constructor() {
        super('Already exists');
    }
}

export class ResourceNotFoundError extends HTTP404NotFoundError {}

// Some type of database error we didn't expect to get. If we are getting this,
// it might be a sign that we could add code to handle it properly.
export class UnknownDBError extends HTTP500InternalServerError {
    constructor(err: Error) {
        if (development) {
            super(
                "Unknown database error. This shouldn't happen and is " +
                    'probably a bug! Please report it.'
            );
        } else {
            super();
        }
        console.error(err);
    }
}
