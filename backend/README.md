# Backend

## How to install and run

```
yarn install
```

then

```
node src
```

## How to run the tests

With the backend running, do:

```
sh test.sh
```

## List of available routes

### Profiles

```
List     GET  http://localhost:3000/api/profile
Details  GET  http://localhost:3000/api/profile/pdm
Create   POST http://localhost:3000/api/profile
Modify   PUT  http://localhost:3000/api/profile
Login    POST http://localhost:3000/api/login
```

### Questions

```
List     GET  http://localhost:3000/api/question
Details  GET  http://localhost:3000/api/question/2
Create   POST http://localhost:3000/api/question
Modify   PUT  http://localhost:3000/api/question/2
```
