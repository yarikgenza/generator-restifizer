/**
 * Created by vedi on 05/26/16.
 */

'use strict';

const healthService = require('app/lib/services/health.service');

module.exports = () => (req, res, next) => {
  const matchingPath = req.url.match(/^\/health$/);

  if (!matchingPath) {
    return next();
  }

  res.status(healthService.isOk() ? 200 : 503).json(healthService.getData());
};
