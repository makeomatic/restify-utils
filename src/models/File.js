const Errors = require('common-errors');
const ld = require('lodash');
const validator = require('../validator.js');

/**
 * Defines default user class
 */
module.exports = function getUserClass(config) {
  const { host, attachPoint } = config;

  /**
   * @class User
   */
  return class File {

    constructor(id, attributes = {}) {
      if (!id) {
        throw new Errors.ValidationError('must include id', 400, 'arguments[0]');
      }

      if (!attributes || typeof attributes !== 'object') {
        throw new Errors.ValidationError('attributes must be an object', 400, 'arguments[1]');
      }

      this.data = {
        id,
        attributes,
      };

      const result = validator.validateSync('File', this.data);
      if (result.error) {
        throw result.error;
      }
    }

    get id() {
      return this.data.id;
    }

    get attributes() {
      return this.data.attributes || {};
    }

    /**
     * Serializes object into json:api output
     * @param  {Boolean} host - resource location
     * @return {Object}
     */
    serialize(addLink) {
      const file = {
        type: 'file',
        id: this.id,
        attributes: this.attributes,
      };

      if (addLink) {
        file.links = {
          self: host + attachPoint + '/' + file.id,
        };
      }

      return file;
    }

    static transform(data, addLink) {
      return File.deserialize(data).serialize(addLink);
    }

    static deserialize(data) {
      return new File(data.filename, ld.omit(data, [ 'filename', 'uploadId', 'location' ]));
    }
  };
};
