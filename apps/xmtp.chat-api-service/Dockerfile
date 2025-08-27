FROM node:24-alpine AS base
WORKDIR /usr/src/app

# Enable corepack and use latest yarn
RUN corepack enable && corepack prepare yarn@stable --activate

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install

RUN mkdir -p /temp/prod
COPY package.json tsconfig.json rollup.config.js .yarnrc.yml /temp/prod/
RUN mkdir -p /temp/prod/src
COPY src /temp/prod/src
# install dependencies
RUN cd /temp/prod && yarn

# build the application
RUN cd /temp/prod && yarn build

ENV NODE_ENV=production

FROM base AS release

# copy built application and dependencies
COPY --from=install /temp/prod/dist ./dist
COPY --from=install /temp/prod/package.json ./package.json
COPY --from=install /temp/prod/node_modules ./node_modules

# run the app
ENTRYPOINT [ "node", "./dist/index.js" ]
