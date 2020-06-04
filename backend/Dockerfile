FROM node:12
WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Build
COPY src src
COPY tsconfig.json ./
RUN yarn build

# Run
COPY public public
COPY sql sql
CMD ["yarn", "start-dev"]
