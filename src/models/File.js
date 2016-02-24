const Errors = require('common-errors');
const ld = require('lodash');
const validator = require('../validator.js');

const STATUS_MAP = {
  1: 'pending',
  2: 'uploaded',
  3: 'processed',
};

/**
 * Defines default user class
 */
module.exports = function getFileClass(config) {
  const host = config.host;
  const files = config.files || {};
  const users = config.users || {};
  const attachPoint = files.attachPoint || 'files';
  const usersAttachPoint = users.attachPoint || 'users';

  /**
   * @class User
   */
  return class File {

    static dataWhiteList = [
      'public',
      'contentType',
      'contentLength',
      'humanName',
      'owner',
    ];

    constructor(id, attributes = {}, isPublic) {
      if (!id) {
        throw new Errors.ValidationError('must include id', 400, 'arguments[0]');
      }

      if (!attributes || typeof attributes !== 'object') {
        throw new Errors.ValidationError('attributes must be an object', 400, 'arguments[1]');
      }

      const data = this.data = {
        type: 'file',
        id,
        attributes: isPublic ? ld.pick(attributes, File.dataWhiteList) : attributes,
      };

      if (attributes.startedAt) {
        attributes.startedAt = parseInt(attributes.startedAt, 10);
      }

      if (attributes.contentLength) {
        attributes.contentLength = parseInt(attributes.contentLength, 10);
      }

      if (attributes.status) {
        attributes.status = STATUS_MAP[+attributes.status];
      }

      const { error } = validator.validateSync('File', data);
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
      const file = ld.clone(this.data);

      if (addLink) {
        file.links = {
          self: host + attachPoint + '/' + encodeURIComponent(file.id),
        };

        const owner = file.attributes.owner;
        if (owner) {
          file.links.owner = host + usersAttachPoint + '/' + encodeURIComponent(owner);
        }
      }

      return file;
    }

    static transform(data, addLink, isPublic) {
      return File.deserialize(data, isPublic).serialize(addLink);
    }

    static deserialize(data, isPublic) {
      return new File(data.filename, ld.omit(data, ['filename', 'uploadId', 'location']), isPublic);
    }
  };
};
