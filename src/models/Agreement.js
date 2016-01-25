const Errors = require('common-errors');
const ld = require('lodash');
const validator = require('../validator.js');

/**
 * Defines default Sale class
 */
module.exports = function getSaleClass(config) {
  const host = config.host;
  const payments = config.payments || {};
  const attachPoint = payments.attachPoint || 'payments';

  /**
   * @class Agreement
   */
  return class Agreement {

    constructor(id, attributes = {}) {
      if (!id) {
        throw new Errors.ValidationError('must include id', 400, 'arguments[0]');
      }

      if (!attributes || typeof attributes !== 'object') {
        throw new Errors.ValidationError('attributes must be an object', 400, 'arguments[1]');
      }

      const data = this.data = {
        type: 'agreement',
        id,
        attributes,
      };

      const { error } = validator.validateSync('Agreement', data);
      if (error) {
        throw error;
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
      const agreement = ld.clone(this.data);

      if (addLink) {
        agreement.links = {
          self: host + attachPoint + '/agreements/' + encodeURIComponent(agreement.id),
        };
      }

      return agreement;
    }

    static transform(data, addLink) {
      return Agreement.deserialize(data).serialize(addLink);
    }

    static deserialize(data) {
      const {
        agreement,
        ...other,
      } = data;

      return new Agreement(agreement.id, { ...agreement, ...other });
    }
  };
};
