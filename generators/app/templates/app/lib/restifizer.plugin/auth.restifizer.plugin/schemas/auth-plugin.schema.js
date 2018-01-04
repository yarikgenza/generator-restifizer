/**
 * Created by vedi on 19/11/2016.
 */

'use strict';

const Joi = require('joi');

module.exports = {
  AUTH_CHANGE_PASSWORD_SCHEMA: Joi.object().keys({
    password: Joi.string().required(),
    newPassword: Joi.string().required(),
  }).unknown(),

  AUTH_FORGOT_PASSWORD_SCHEMA: Joi.object().keys({
    username: Joi.string().required(),
  }).unknown(),

};
