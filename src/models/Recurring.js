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
   * @class Sale
   */
  return class Recurring {

    constructor(id, attributes = {}) {
      if (!id) {
        throw new Errors.ValidationError('must include id', 400, 'arguments[0]');
      }

      if (!attributes || typeof attributes !== 'object') {
        throw new Errors.ValidationError('attributes must be an object', 400, 'arguments[1]');
      }

      const data = this.data = {
        type: 'recurring',
        id,
        attributes,
      };

      const { error } = validator.validateSync('Recurring', data);
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
      const recurring = ld.clone(this.data);

      if (addLink) {
        recurring.links = {
          self: `${host}${attachPoint}/transactions/${encodeURIComponent(recurring.id)}`,
        };
      }

      return recurring;
    }

    static transform(data, addLink) {
      return Recurring.deserialize(data).serialize(addLink);
    }

    static deserialize(data) {
      const {
        transaction,
        ...other,
      } = data;

      return new Recurring(transaction.transaction_id, { ...transaction, ...other });
    }
  };
};
