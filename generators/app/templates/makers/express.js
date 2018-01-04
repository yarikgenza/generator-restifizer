'use strict';

/**
 * Module dependencies.
 */
const express = require('express');
const multipart = require('connect-multiparty');
const bodyParser = require('body-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const log = require('config/log')(module);
/* eslint-disable import/no-dynamic-require, global-require */
module.exports = (app) => {
  // Initialize express app
  const expressApp = express();
  const multipartMiddleware = multipart();

  expressApp.enable('trust proxy');
  require('app/lib/middleware/istanbul')(expressApp);
  expressApp.use(require('app/lib/middleware/health-check')());
  // Passing the request url to environment locals
  expressApp.use((req, res, next) => {
    res.locals.url = `${req.protocol}://${req.headers.host}${req.url}`;
    next();
  });
  expressApp.use(require('app/lib/middleware/cross-domain')(expressApp));
  // Should be placed before express.static
  expressApp.use(compress({
    filter(req, res) {
      return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
    },
    level: 9,
  }));
  // app.use('/apidocs', express.static('apidocs'));
  require('app/lib/middleware/apidocs')(expressApp, express);
  // Showing stack errors
  expressApp.set('showStackError', true);
  require('app/lib/middleware/init-view-engine')(expressApp);
  require('app/lib/middleware/i18n')(expressApp);

  // Environment dependent middleware
  if (process.env.NODE_ENV !== 'production') {
    require('app/lib/middleware/debug-logger')(expressApp, log);
  } else if (process.env.NODE_ENV === 'production') {
    expressApp.locals.cache = 'memory';
  }
  // Request body parsing middleware should be above methodOverride
  expressApp.use(bodyParser.urlencoded({
    extended: true,
    limit: '200mb',
  }));

  expressApp.use(bodyParser.json());
  expressApp.use(multipartMiddleware);
  expressApp.use(require('app/lib/middleware/extract-client-oauth2')());
  expressApp.use(methodOverride());
  // Enable jsonp
  expressApp.enable('jsonp callback');
  require('app/lib/middleware/testing')(expressApp);
  require('app/lib/middleware/oauthifizer')(expressApp);
  require('app/lib/middleware/helmet')(expressApp);
  require('app/lib/middleware/socket-io')(expressApp);
  require('app/lib/middleware/restifizer')(expressApp, log, app.controllers);
  require('app/lib/middleware/restifizer-files')(expressApp, log, app.fileControllers);
  require('app/lib/middleware/jobs-testing')(expressApp);
  require('app/lib/middleware/handle-errors')(expressApp);
  app.expressApp = expressApp;
};
