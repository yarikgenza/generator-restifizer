'use strict';

module.exports = {
  port: process.env.PORT || 1341,
  mongo: process.env.MONGO_URL || 'mongodb://localhost/<%= name %>-test',

  coverageEnabled: false,
};
