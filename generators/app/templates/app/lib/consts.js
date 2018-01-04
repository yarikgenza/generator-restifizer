/**
 * Created by vedi on 10/01/2017.
 */

'use strict';

const { FORBIDDEN } = require('http-statuses');

module.exports = {
  AUTH: {
    BASIC: 'basic',
    BEARER: 'bearer',
    CLIENT: 'oauth2-client-password',
  },
  RULES: {
    ALLOW_FOR_ADMINS_ONLY_RULE: {
      name: 'AllowForAdminsOnly',
      message: 'The action is allowable for admins only',
      httpStatus: FORBIDDEN,
    },
  },
  EVENTS: {
    UPDATE_HEALTH: 'UPDATE_HEALTH',
    FORGOT_PASSWORD: 'FORGOT_PASSWORD',
    RESET_PASSWORD: 'RESET_PASSWORD',
    SEND_EMAIL_VERIFICATION: 'SEND_EMAIL_VERIFICATION',
  },
};
