/**
 * Created by vedi on 19/11/2016.
 */

'use strict';

const Joi = require('joi');

module.exports = {
  VERIFY_EMAIL_SCHEMA: Joi.object().keys({
    password: Joi.string().required(),
  }).unknown(),
  REGISTER_OR_VERIFY_SCHEMA: Joi.object().keys({
    username: Joi.string().required(),
  }).unknown(),
};
