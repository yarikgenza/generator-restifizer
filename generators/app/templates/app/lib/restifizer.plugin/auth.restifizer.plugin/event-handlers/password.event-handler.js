/**
 * Created by vedi on 05/06/16.
 */

'use strict';

const emailService = require('app/lib/services/email.service');

module.exports = (eventBus) => {
  eventBus.on(eventBus.EVENTS.FORGOT_PASSWORD, (event) => {
    emailService.sendForgotEmail(event);
  });

  eventBus.on(eventBus.EVENTS.RESET_PASSWORD, (event) => {
    emailService.sendResetEmail(event);
  });
};
