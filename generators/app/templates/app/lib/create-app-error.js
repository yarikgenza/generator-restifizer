/**
 * Created by vedi on 16/02/2017.
 */

'use strict';

const { BAD_REQUEST } = require('http-statuses');

function createAppError(rule, value) {
  const { message, name, httpStatus = BAD_REQUEST } = rule;
  return httpStatus.createError(message, {
    type: 'app',
    error: 'RulesViolation',
    details: {
      rule: name,
      value,
    },
  });
}

module.exports = createAppError;
