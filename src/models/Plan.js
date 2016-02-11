const Errors = require('common-errors');
const ld = require('lodash');
const validator = require('../validator.js');

/**
 * Defines default user class
 */
module.exports = function getPlanClass(config) {
  const host = config.host;
  const payments = config.payments || {};
  const attachPoint = payments.attachPoint || 'payments';

  /**
   * @class Plan
   */
  return class Plan {

    constructor(id, attributes = {}) {
      if (!id) {
        throw new Errors.ValidationError('must include id', 400, 'arguments[0]');
      }

      if (!attributes || typeof attributes !== 'object') {
        throw new Errors.ValidationError('attributes must be an object', 400, 'arguments[1]');
      }

      const data = this.data = {
        type: 'plan',
        id,
        attributes,
      };

      const { error } = validator.validateSync('Plan', data);
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
      const plan = ld.clone(this.data);

      if (addLink) {
        plan.links = {
          self: host + attachPoint + '/plans/' + encodeURIComponent(plan.id),
        };
      }

      return plan;
    }

    static transform(data, addLink) {
      return Plan.deserialize(data).serialize(addLink);
    }

    static deserialize(data) {
      return new Plan(data.alias || data.id, data);
    }
  };
};
