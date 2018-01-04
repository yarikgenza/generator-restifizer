/**
 * Created by vedi on 16/02/2017.
 */

'use strict';

const _ = require('lodash');
const Bb = require('bluebird');
const Joi = Bb.promisifyAll(require('joi'));
const HTTP_STATUSES = require('http-statuses');

const type = 'app';

module.exports = (value, schema, httpStatus = HTTP_STATUSES.BAD_REQUEST) => Joi
    .validateAsync(value, schema)
    .catch((err) => {
      // transforming to more generic way
      const details = _.reduce(err.details, (result, { type: kind, path, value, message }) => {
        result[path] = { kind, path, value, message };
        return result;
      }, {});
      throw httpStatus.createError(err.message, { error: 'SchemaValidationError', type, details });
    });

