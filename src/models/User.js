const Errors = require('common-errors');
const validator = require('../validator.js');

/**
 * Defines default user class
 */
module.exports = function getUserClass(config) {
  const { host } = config;
  const users = config.users || {};
  const attachPoint = users.attachPoint || 'users';
  const { audience } = users;

  /**
   * @class User
   */
  return class User {

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

      const result = validator.validateSync('User', this.data);
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

    isAdmin() {
      const { roles } = this.data.attributes;
      return roles && roles.indexOf('admin') !== -1;
    }

    /**
     * Serializes object into json:api output
     * @param  {Boolean} host - resource location
     * @return {Object}
     */
    serialize(addLink) {
      const user = {
        type: 'user',
        id: this.data.id,
        attributes: this.data.attributes,
      };

      if (addLink) {
        user.links = {
          self: host + attachPoint + '/' + encodeURIComponent(user.id),
        };
      }

      return user;
    }

    static transform(data, addLink) {
      const user = User.deserialize(data);
      return user.serialize(addLink);
    }

    static deserialize(data) {
      return new User(data.username, data.metadata[audience]);
    }
  };
};
