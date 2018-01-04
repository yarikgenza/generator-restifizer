/**
 * Created by vedi on 10/10/15.
 */

'use strict';

const consolidate = require('consolidate');

module.exports = (app) => {
  // Set up engine
  app.engine('server.view.html', consolidate.swig);

  // Set views path and view engine
  app.set('view engine', 'server.view.html');
  app.set('views', './app/views');
};
