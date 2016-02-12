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
   * @class Transaction
   */
  return class Transaction {

    constructor(id, attributes = {}) {
      if (!id) {
        throw new Errors.ValidationError('must include id', 400, 'arguments[0]');
      }

      if (!attributes || typeof attributes !== 'object') {
        throw new Errors.ValidationError('attributes must be an object', 400, 'arguments[1]');
      }

      const data = this.data = {
        type: 'transaction',
        id,
        attributes,
      };

      attributes.humanDescription = this.remapDescription(attributes.type);

      const { error } = validator.validateSync('Transaction', data);
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

    remapDescription(type) {
      switch (type) {
        case 0:
          return 'Cloud Service subscription';
        case 1:
          return 'Extra 3D models purchase';
        case 2:
          return '3D Printing service charge';
        default:
          process.stderr.write('unexpected transaction type\n');
          return '';
      }
    }

    /**
     * Serializes object into json:api output
     * @param  {Boolean} host - resource location
     * @return {Object}
     */
    serialize(addLink) {
      const transaction = ld.clone(this.data);

      if (addLink) {
        transaction.links = {
          self: host + attachPoint + '/transactions/' + encodeURIComponent(transaction.id),
        };
      }

      return transaction;
    }

    static transform(data, addLink) {
      return Transaction.deserialize(data).serialize(addLink);
    }

    static deserialize(data) {
      return new Transaction(data.id, data);
    }
  };
};
