# Restify Utils

## Install

`npm i restify-utils -S`

## Usage

### .attach(configuration, endpointsDir, middlewareDir)

returns Function(server, family, prefix = '/api')
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
