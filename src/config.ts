// Explicit opt-in to development mode.
export const development: boolean = process.env.NODE_ENV === 'development';

// Explicit opt-in to production mode.
export const production: boolean = process.env.NODE_ENV === 'production';

if (development) {
    console.log('Running in development mode');
} else if (production) {
    console.log('Running in production mode');
} else {
    console.warn('Not running in development or production mode, consider ' +
                 'setting NODE_ENV to "development" or "production"');
}
