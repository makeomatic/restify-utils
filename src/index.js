const ld = require('lodash');
const debug = require('debug')('restify-utils');
const glob = require('glob');
const path = require('path');

/**
 * Load module, separate it's name and pushed to container
 * @param  {Object} container
 */
function loadModule(container) {
  return function loader(file) {
    debug('loaded file %s', file);
    const parts = file.split('/');
    const name = path.basename(parts.pop(), '.js');
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
    config.attachPoint = ld.compact([family, prefix]).join('/');
    config.family = family;

    debug('attaching with family %s and prefix %s', family, prefix);

    ld.forOwn(files, function attachRoute(file, name) {
      debug('attaching file %s', name);

      ld.forOwn(file, function iterateOverProperties(props, method) {
        debug('  attaching method %s and path %s', method, props.path);

        ld.forOwn(props.handlers, function iterateOverVersionedHandler(handler, versionString) {
          debug('    attaching handler for version %s', versionString);

          const args = [
            {
              name: `${family}.${name}.${method}`,
              path: `${prefix}/${family + props.path}`,
              version: versionString.split(','),
            },
          ];

          if (props.middleware) {
            props.middleware.forEach(function attachMiddleware(middlewareName) {
              debug('      pushed middleware %s', middlewareName);
              args.push(middleware[middlewareName]);
            });
          }

          args.push(handler);
          server[method].apply(server, args);
        });
      });
    });
  }

  attach.files = files;
  attach.middleware = middleware;
  attach.models = ld.mapValues(models, generator => {
    return generator(config);
  });

  return attach;
};
