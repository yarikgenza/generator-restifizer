/**
 * Created by vedi on 26/05/16.
 */

'use strict';

const _ = require('lodash');

class HealthService {

  constructor() {
    this.data = {};
    this.failedStatuses = {};
  }

  getData() {
    return this.data;
  }

  isOk() {
    return _.keys(this.failedStatuses).length === 0;
  }

  updateData(key, status, value) {
    this.data[key] = value || status;
    if (status) {
      delete this.failedStatuses[key];
    } else {
      this.failedStatuses[key] = true;
    }
  }
}

module.exports = new HealthService();
