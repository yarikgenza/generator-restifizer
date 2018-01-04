/**
 * Created by vedi on 02/07/16.
 */

'use strict';

const _ = require('lodash');
const Bb = require('bluebird');

const createAppError = require('app/lib/create-app-error');
const { RULES: {
  CANNOT_FIND_MATCHING_RESOURCE,
} } = require('app/lib/consts');

function mongooseFn(schema, options) {
  const mongoose = options.mongoose;

  options = _.merge({
    array: {
      options: [{
        type: mongoose.Schema.Types.ObjectId,
      }],
    },
    noCounter: false,
    counter: {
      options: {
        type: Number,
        default: 0,
      },
    },
  }, options || {});

  if (!options.array.path) {
    throw new Error('options.array.path is not provided');
  }

  if (!options.noCounter && !options.counter.path) {
    options.counter.path = `${options.array.path}Counter`;
  }

  schema.path(options.array.path, options.array.options);

  if (!options.noCounter) {
    schema.path(options.counter.path, options.counter.options);
  }
}

function restifizer(restifizerController, options) {
  options = _.merge({
    noCounter: false,
    multi: true,
    readOnly: false,
    allowDelete: true,
    supportPost: false,
    supportPut: true,
    fieldsToFetch: [],
    pre: restifizerController.pre,
    extractItemIds: scope => (scope.params.itemId ? [scope.params.itemId] : scope.body),
  }, options || {});

  const Model = options.Model;
  const arrayFieldName = options.array;
  const counterFieldName = `${arrayFieldName}Counter`;
  const path = options.path;
  const afterGet = options.afterGet;
  const afterPut = options.afterPut;
  const afterDelete = options.afterDelete;
  const beforeSavePut = options.beforeSavePut;
  const beforeSaveDelete = options.beforeSaveDelete;
  const extractItemIds = options.extractItemIds;
  const readOnly = options.readOnly;
  const allowDelete = options.allowDelete;
  const multi = options.multi;
  const supportPost = options.supportPost;
  const supportPut = options.supportPut;
  const fieldsToFetch = options.fieldsToFetch;
  if (fieldsToFetch.indexOf(arrayFieldName) < 0) {
    fieldsToFetch.push(arrayFieldName);
  }

  const extractFieldList = function extractFieldList() {
    return _.pick(this.fieldMap, fieldsToFetch);
  };

  function buildConditions(scope) {
    const result = scope.owner.buildConditions(scope);

    // it's aliens
    delete scope.source.itemId;

    return result;
  }

  function putToArray(scope) {
    return Bb
      .try(() => {
        if (_.isFunction(this.pre)) {
          return this.pre(scope);
        }
      })
      .then(() => Model.findOne({ _id: scope.params._id }, fieldsToFetch.join(' ')))
      .then((doc) => {
        if (!doc) {
          throw createAppError(CANNOT_FIND_MATCHING_RESOURCE);
        }

        scope.itemIds = extractItemIds(scope);

        scope.added = doc[arrayFieldName].addToSet(...scope.itemIds);

        if (!options.noCounter) {
          doc[counterFieldName] = doc[arrayFieldName].length;
        }

        return Bb
          .try(() => {
            if (_.isFunction(beforeSavePut) && scope.added) {
              return beforeSavePut(doc, scope);
            }
          })
          .then(() => doc.save());
      })
      .then(() => this.locateModel(scope))
      .then((doc) => {
        scope.result = this.dataSource.toObject(doc);

        return this.post(doc, scope);
      })
      .then(() => {
        scope.newContent = true;

        return scope.result[arrayFieldName];
      });
  }

  function postPut(result, scope) {
    return Bb
      .try(() => {
        if (_.isFunction(afterPut) && scope.added) {
          return afterPut(result, scope);
        }
      })
      .then(() => result);
  }

  function deleteFromArray(scope) {
    return Bb
      .try(() => {
        if (_.isFunction(this.pre)) {
          return this.pre(scope);
        }
      })
      .then(() => Model.findOne({ _id: scope.params._id }, arrayFieldName))
      .then((doc) => {
        if (!doc) {
          throw createAppError(CANNOT_FIND_MATCHING_RESOURCE);
        }

        scope.itemIds = extractItemIds(scope);

        const lengthBefore = doc[arrayFieldName].length;
        doc[arrayFieldName].pull(...scope.itemIds);

        if (!options.noCounter) {
          doc[counterFieldName] = doc[arrayFieldName].length;
        }

        scope.removed = lengthBefore > doc[arrayFieldName].length;

        return Bb
          .try(() => {
            if (_.isFunction(beforeSaveDelete) && scope.added) {
              return beforeSaveDelete(doc, scope);
            }
          })
          .then(() => doc.save());
      })
      .then((doc) => {
        scope.result = this.dataSource.toObject(doc);

        return this.post(doc, scope);
      })
      .then(() => undefined);
  }

  function postDelete(result, scope) {
    return Bb
      .try(() => {
        if (_.isFunction(afterDelete) && scope.removed) {
          return afterDelete(result, scope);
        }
      })
      .then(() => result);
  }

  if (!readOnly) {
    if (supportPut) {
      restifizerController.actions[`${arrayFieldName}Put`] = restifizerController.normalizeAction({
        method: 'put',
        path: `:_id/${path}/:itemId`,
        extractFieldList,
        buildConditions,
        pre: options.pre,
        post: postPut,
        handler: putToArray,
      }, `${arrayFieldName}Put`);

      if (multi) {
        restifizerController.actions[`${arrayFieldName}PutMulti`] = restifizerController.normalizeAction({
          method: 'put',
          path: `:_id/${path}`,
          extractFieldList,
          buildConditions,
          pre: options.pre,
          post: postPut,
          handler: putToArray,
        }, `${arrayFieldName}PutMulti`);
      }
    }

    if (supportPost) {
      if (multi) {
        restifizerController.actions[`${arrayFieldName}PostMulti`] = restifizerController.normalizeAction({
          method: 'post',
          path: `:_id/${path}`,
          extractFieldList,
          buildConditions,
          pre: options.pre,
          post: postPut,
          handler: putToArray,
        }, `${arrayFieldName}PostMulti`);
      }
    }
  }

  restifizerController.actions[`${arrayFieldName}Get`] = restifizerController.normalizeAction({
    method: 'get',
    path: `:_id/${path}`,
    priority: -1,
    extractFieldList,
    buildConditions,
    queryPipe: function queryPipe(query, scope) {
      const pagination = this.getPagination(scope);
      const limit = parseInt(pagination.limit, 10);
      const page = pagination.page;
      const skip = (page - 1) * limit;

      query.slice(arrayFieldName, skip, limit);
    },
    pre: options.pre,
    post: function post(result, scope) {
      return Bb
        .try(() => {
          if (_.isFunction(afterGet)) {
            return afterGet(result, scope);
          }
        })
        .then(() => result);
    },
    handler(scope) {
      return this
        .locateModel(scope)
        .then((doc) => {
          doc = this.dataSource.toObject(doc);
          return this.post(doc, scope);
        })
        .then(doc => doc[arrayFieldName]);
    },
  }, `${arrayFieldName}Get`);

  if (!readOnly && allowDelete) {
    restifizerController.actions[`${arrayFieldName}Delete`] = restifizerController.normalizeAction({
      method: 'delete',
      path: `:_id/${path}/:itemId`,
      pre: options.pre,
      post: postDelete,
      handler: deleteFromArray,
    }, `${arrayFieldName}Delete`);

    if (multi) {
      restifizerController.actions[`${arrayFieldName}DeleteMulti`] = restifizerController.normalizeAction({
        method: 'delete',
        path: `:_id/${path}`,
        pre: options.pre,
        post: postDelete,
        handler: deleteFromArray,
      }, `${arrayFieldName}DeleteMulti`);
    }
  }
}

module.exports.restifizer = restifizer;
module.exports.mongoose = mongooseFn;
