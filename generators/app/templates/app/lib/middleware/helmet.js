/**
 * Created by vedi on 12/10/15.
 */

'use strict';

const helmet = require('helmet');

module.exports = (app) => {
  app.use(helmet.xssFilter());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.ieNoOpen());
  app.use(helmet.noSniff());
};
