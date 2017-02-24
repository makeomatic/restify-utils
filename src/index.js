const ld = require('lodash');
const debug = require('debug')('restify-utils');
const glob = require('glob');
const path = require('path');
const { METHODS } = require('http');

/**
 * Load module, separate it's name and pushed to container
 * @param  {Object} container
 */
function loadModule(container) {
  return function loader(file) {
    debug('loaded file %s', file);
    const parts = file.split('/');
    const name = path.basename(parts.pop(), '.js');
    // eslint-disable-next-line import/no-dynamic-require
    container[name] = require(file);
  };
}

/**
 * Tells where endpoints reside
 * @param  {String} dir
 * @return {Function}
 */
exports.attach = function createAttach(config, endpointsDir, middlewareDir) {
  // load files
  const files = {};
  glob.sync(`${endpointsDir}/*.js`).forEach(loadModule(files));

  // load middleware
  const middleware = {};
  glob.sync(`${middlewareDir}/*.js`).forEach(loadModule(middleware));

  // export shared models
  const models = {};
  glob.sync('./models/*.js', { cwd: __dirname }).forEach(loadModule(models));

  /**
   * Accepts restify server instance and attaches handlers
   * @param  {RestifyServer} server
   * @param  {String}        family
   */
  function attach(server, family, prefix = '/api') {
    config[family].attachPoint = ld.compact([prefix, family]).join('/');

    debug('attaching with family %s and prefix %s', family, prefix);

    ld.forOwn(files, function attachRoute(file, name) {
      debug('attaching file %s', name);

      ld.forOwn(file, function iterateOverProperties(props, method) {
        if (METHODS.indexOf(method.toUpperCase()) === -1 && method.toUpperCase() !== 'DEL') {
          return;
        }
        debug('  attaching method %s', method);

        ld.forOwn(props.handlers, function iterateOverVersionedHandler(handler, versionString) {
          debug('    attaching handler for version %s', versionString);

          ld([props.paths, props.path])
          .flattenDeep()
          .compact()
          .forEach(function attachPath(uriPath, idx, arr) {
            debug('      attaching handler for path %s', uriPath);

            const args = [
              {
                name: `${family}.${name}.${method}`,
                path: `${prefix}/${family + uriPath}`,
                version: versionString.split(','),
              },
            ];

            // if we actually have a regexp in place - modify it
            if (props.regexp) {
              args[0].path = props.regexp(prefix, family, uriPath);
            }

            // we need to make sure that name is unique
            if (arr.length > 1) {
              args[0].name += `.${idx}`;
            }

            if (props.middleware) {
              props.middleware.forEach(function attachMiddleware(middlewareName) {
                debug('      pushed middleware %s', middlewareName);
                args.push(middleware[middlewareName]);
              });
            }

            args.push(handler);
            const attached = server[method](...args);
            if (!attached) {
              console.error('route %s with path %s could not be attached', args[0].name, args[0].path); // eslint-disable-line
            }
          });
        });
      });
    });

    attach.attachModels();
  }

  attach.attachModels = function attachModels() {
    config.models = ld.mapValues(models, generator => generator(config));
  };

  attach.files = files;
  attach.middleware = middleware;

  return attach;
};
