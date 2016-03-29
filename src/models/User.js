const ld = require('lodash');
const Errors = require('common-errors');
const validator = require('../validator.js');

/**
 * Defines default user class
 */
module.exports = function getUserClass(config) {
  const { host, web } = config;
  const users = config.users || {};
  const attachPoint = users.attachPoint || 'users';
  const { audience } = users;

  /**
   * @class User
   */
  return class User {

    static dataWhiteList = [
      'roles',
      'alias',
      'firstName',
      'lastName',
      'companyName',
      'country',
      'city',
      'gender',
    ];

    constructor(id, attributes = {}, isPublic) {
      if (!id) {
        throw new Errors.ValidationError('must include id', 400, 'arguments[0]');
      }

      if (!attributes || typeof attributes !== 'object') {
        throw new Errors.ValidationError('attributes must be an object', 400, 'arguments[1]');
      }

      const data = this.data = {
        type: 'user',
        id: isPublic ? attributes.alias : id,
        attributes: isPublic ? this.omitPrivateData(attributes) : attributes,
      };

      const result = validator.validateSync('User', data);
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

    omitPrivateData(data) {
      return ld.pick(data, User.dataWhiteList);
    }

    /**
     * Serializes object into json:api output
     * @param  {Boolean} host - resource location
     * @return {Object}
     */
    serialize(addLink) {
      const user = ld.clone(this.data);

      if (addLink) {
        user.links = {
          self: `${host}${attachPoint}/${encodeURIComponent(user.id)}`,
        };

        const alias = user.attributes.alias;
        if (web && alias) {
          user.links.user = `${web}/${alias}`;
        }
      }

      return user;
    }

    static transform(data, addLink) {
      const user = User.deserialize(data);
      return user.serialize(addLink);
    }

    static deserialize(data) {
      return new User(data.username, data.metadata[audience], data.public);
    }
  };
};
