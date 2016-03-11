const Errors = require('common-errors');
const ld = require('lodash');
const validator = require('../validator.js');
const isProduction = process.env.NODE_ENV === 'production';

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
      'contentLength',
      'name',
      'description',
      'website',
      'files',
      'parts',
    ];

    static int = [
      'startedAt',
      'uploadedAt',
      'contentLength',
      'parts',
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

      // coerce types
      File.int.forEach(field => {
        if (attributes[field]) {
          attributes[field] = parseInt(attributes[field], 10);
        }
      });

      // remap status to human description
      if (attributes.status) {
        attributes.status = STATUS_MAP[+attributes.status];
      }

      // skip checking in production
      if (isProduction) {
        return;
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
          self: `${host}${attachPoint}/${encodeURIComponent(file.id)}`,
        };

        const owner = file.attributes.owner;
        if (owner) {
          file.links.owner = `${host}${usersAttachPoint}/${encodeURIComponent(owner)}`;
        }
      }

      return file;
    }

    static transform(data, addLink, isPublic) {
      return File.deserialize(data, isPublic).serialize(addLink);
    }

    static deserialize(data, isPublic) {
      return new File(data.uploadId, data, isPublic);
    }
  };
};
