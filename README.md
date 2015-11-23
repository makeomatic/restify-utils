# Restify Utils

## Install

`npm i restify-utils -S`

## Usage

### Main function

`const attach = require('restify-utils')(configuration, endpointsDir, middlewareDir)`

returns Function:

1. Function(server, family, prefix = '/api') with extra properties:
2. endpoints
3. middleware

Populates `configuration.models`

Goes through endpoints, that are in format of the following:

```js
exports.VERB = {
  path: '/path/relative/to/prefix/family',
  middleware: [ 'middlewareName' ],
  handlers: {
    '1.0.0': function handler(req, res, next) {

    },
    '1.1.0': function xxx(req, res, next) {

    }
  },
};
```

It will be attached to `VERB ${prefix}/${family}/path/relative/to/prefix/family` with 2 versions: 1.0.0 and 1.1.0

### Endpoints, middleware, models

1. Models - instances of classes in the models folder:

  * User

2. Endpoints - endpoints from the endpointsDir
3. Middleware - middleware from the middlewareDir
