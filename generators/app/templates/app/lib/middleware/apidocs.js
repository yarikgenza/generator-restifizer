/**
 * Created by vedi on 07/22/16.
 */

'use strict';

module.exports = (app, express) => {
  app.use('/apidocs', express.static('apidocs'));
};
