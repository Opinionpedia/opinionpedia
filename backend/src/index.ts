import express, { Request, Response } from 'express';

import setupApi from './routes/index.js';

const app = express();
const api = express.Router();

//
// Backend API
//
app.use('/api', api);

setupApi(api);

//
// Frontend HTML
//
const indexRoutes = [
    '/$',
    '/signup$',
    '/login$',
    '/logout$',
    '/about$',
];
function index(req: Request, res: Response) {
    res.sendFile('public/index.html', {
        root: process.cwd(),
    });
}
for (const route of indexRoutes) {
    app.use(route, index);
}

app.use(express.static('public'));

//
// Have a 404 page for all other situations.
//
function send404(req: Request, res: Response) {
    res.sendFile('public/404.html', {
        root: process.cwd(),
    });
}
app.use('/', send404);

///
/// Listen on port 4000.
///
app.listen(4000, () => {
    console.log('Listening on port 4000');
});
