## Description

ShareFreeCore based on [Nest](https://github.com/nestjs/nest) framework.

## Installation

```bash
$ npm install
```

## Running the app locally

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

## Running the app locally in Docker

```bash
# build docker image
$ docker build -t share-free-core:1.0.0 .
# run
$ docker run -p 80:80 share-free-core:1.0.0
# verify
$ verify that the application is accessible at http://localhost/
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

This application is deployed in Azure
