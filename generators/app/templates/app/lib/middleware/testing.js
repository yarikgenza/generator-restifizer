/**
 * Created by vedi on 05/26/16.
 */

'use strict';

const emailService = require('app/lib/services/email.service');
const { config } = require('app/app');

module.exports = (app) => {
  if (process.env.NODE_ENV !== 'production') {
    app.get('/testing/sent-emails', (req, res) => {
      const { sentEmails } = emailService;
      emailService.sentEmails = [];
      res.json(sentEmails).end();
    });
  }

  if (config.isTest) {
    app.use((req, res, next) => {
      // backend needs it to put it in email
      // browser will send referrer automatically
      req.headers.referer = `${req.protocol}://${req.headers.host}`;
      next();
    });
  }
};
