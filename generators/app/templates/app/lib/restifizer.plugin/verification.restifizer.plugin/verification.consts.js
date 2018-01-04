/**
 * Created by vedi on 17/02/2017.
 */

'use strict';

const { NOT_FOUND } = require('http-statuses');

module.exports = {
  RULES: {
    WRONG_TOKEN_RULE: {
      name: 'BadPassword',
      message: 'The password you provided does not work for this account',
    },
    USER_NOT_FOUND: {
      name: 'UserNotFound',
      message: 'User with specified username cannot be found',
      httpStatus: NOT_FOUND,
    },
  },
};
