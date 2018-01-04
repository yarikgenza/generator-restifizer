/**
 * Created by vedi on 05/06/16.
 */

'use strict';

const emailService = require('app/lib/services/email.service');

module.exports = (eventBus) => {
  eventBus.on(eventBus.EVENTS.SEND_EMAIL_VERIFICATION, (event) => {
    emailService.sendEmailVerificationEmail(event);
  });
};
