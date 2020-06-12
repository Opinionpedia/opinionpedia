FROM node:12
WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Lint and build
COPY src src
COPY .eslintrc.json tsconfig.json ./
RUN yarn lint && yarn build

# Run
COPY public public
COPY sql sql
CMD ["yarn", "start-dev"]
