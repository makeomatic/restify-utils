const Errors = require('common-errors');
const ld = require('lodash');
const validator = require('../validator.js');

const isProduction = process.env.NODE_ENV === 'production';
const hasOwnProperty = Object.prototype.hasOwnProperty;
const STATUS_MAP = {
  1: 'pending',
  2: 'uploaded',
  3: 'processed',
  4: 'processing',
  5: 'failed',
};

/**
 * Defines default user class
 */
module.exports = function getFileClass(config) {
  const host = config.host;
  const web = config.web;

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
      'tags',
      'type',
      'uploadedAt',
      'decompressedLength',
      'embed',
      'bucket',
      'temporary',
      'unlisted',
      'controlsData',
      'alias',
      'uploadType',
      'backgroundColor',
      'packed',
      'direct',
    ];

    static int = [
      'startedAt',
      'uploadedAt',
      'contentLength',
      'parts',
    ];

    static boolean = [
      'public',
      'unlisted',
      'temporary',
    ];

    static remapAttributesToInt(field) {
      if (hasOwnProperty.call(this, field)) {
        this[field] = parseInt(this[field], 10);
      }
    }

    static remapAttributesToBoolean(field) {
      if (hasOwnProperty.call(this, field)) {
        this[field] = !!this[field];
      }
    }

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
      File.int.forEach(File.remapAttributesToInt, data.attributes);

      // NOTE: boolean transforms should be applied only when we fix the client
      // so that it can correctly transform 'true' to 1
      // Currently we disable this in production
      if (!isProduction) {
        File.boolean.forEach(File.remapAttributesToBoolean, data.attributes);
      }

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
      const files = config.files || {};
      const users = config.users || {};
      const attachPoint = files.attachPoint || '/files';
      const usersAttachPoint = users.attachPoint || '/users';
      const id = file.id;

      if (addLink) {
        file.links = {
          self: `${host}${attachPoint}/${encodeURIComponent(id)}`,
        };

        const owner = file.attributes.owner;
        if (owner) {
          const alias = encodeURIComponent(owner);
          file.links.owner = `${host}${usersAttachPoint}/${alias}`;

          if (web) {
            file.links.player = `${web}/${alias}/${id}`;
            file.links.user = `${web}/${alias}`;
          }
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
