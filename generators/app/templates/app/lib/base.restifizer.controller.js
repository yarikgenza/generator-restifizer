/**
 * Created by vedi on 07/05/14.
 */

'use strict';

const _ = require('lodash');
const Restifizer = require('restifizer');

const { consts: { AUTH }, eventBus } = require('app/app');

const defaultAction = {
  enabled: true,
  auth: [AUTH.BEARER],
};

/**
 * @apiDefine bearer used, when user already authenticated
 */

/**
 * @apiDefine client used for not authenticated requests
 */

/**
 * @apiDefine BearerAuthHeader used, when user already authenticated
 * @apiHeader {String} Authorization access token value in format: "Bearer {{accessToken}}".
 */

/**
 * @apiDefine ClientAuthParams used for not authenticated requests
 * @apiParam {String} client_id
 * @apiParam {String} client_secret
 */

/**
 * @apiDefine EmptySuccess
 * @apiSuccess (204) {empty} empty
 */

/**
 * @apiDefine AuthSuccess
 * @apiSuccess {String} access_token
 * @apiSuccess {String} refresh_token
 * @apiSuccess {Number} expires_in
 * @apiSuccess {String=bearer} token_type
 */

/**
 * @apiGroup OAuth2
 * @apiName GetTokenWithPassword
 * @api {post} /oauth Sign in
 * @apiUse ClientAuthParams
 * @apiParam {String=password} grant_type
 * @apiParam {String} username
 * @apiParam {String} password
 * @apiUse AuthSuccess
 */

/**
 * @apiGroup OAuth2
 * @apiName GetTokenWithRefreshToken
 * @api {post} /oauth Refresh token
 * @apiUse ClientAuthParams
 * @apiParam {String=refresh_token} grant_type
 * @apiParam {String} refresh_token
 * @apiUse AuthSuccess
 */

class BaseController extends Restifizer.Controller {
  constructor(options) {
    super(options || { actions: { default: defaultAction } });
  }

  static createAction(options) {
    return _.defaults(options, defaultAction);
  }

  static getName() {
    return this.name.charAt(0).toLowerCase() + this.name.replace('Controller', '').slice(1);
  }

  getClient(scope) {
    return scope.getClient();
  }

  createScope(controller, transport) {
    const result = super.createScope(controller, transport);

    if (transport.transportName === 'express') {
      result.getUser = function getUser() {
        return result.transportData.req.user;
      };
      result.setUser = function setUser() {
        // Do nothing, passport will inject user by access token in every request
      };
      result.getClient = function getClient() {
        const user = this.getUser();
        return user && user.clientId ? user : undefined;
      };
      result.getLocale = function getLocale() {
        return result.transportData.req.getLocale();
      };
      result.getReferrer = function getReferrer() {
        return result.transportData.req.headers.referer;
      };

      Object.defineProperties(result, {
        user: {
          get() {
            return this.getUser();
          },
          set() {
            // Do nothing, passport will inject user by access token in every request
          },
        },
        client: {
          get() {
            return this.getClient();
          },
        },
        locale: {
          get() {
            return this.getLocale();
          },
        },
        referrer: {
          get() {
            return this.getReferrer();
          },
        },
      });
    } else {
      throw new Error(`Unsupported transport: ${transport.transportName}`);
    }

    return result;
  }

  afterChange(scope) {
    const name = this.constructor.getName();
    let type;

    if (scope.isInsert() || scope.inserting) {
      type = eventBus.ENTITY_EVENT_TYPES.INSERT;
    } else if (scope.isUpdate()) {
      type = eventBus.ENTITY_EVENT_TYPES.UPDATE;
    } else if (scope.isDelete()) {
      type = eventBus.ENTITY_EVENT_TYPES.REMOVE;
    } else {
      throw new Error('Illegal status');
    }

    eventBus.emitDeferred(eventBus.ENTITY_EVENT_SPACE, `${name}.${type}`, scope.model);
  }

  sendResult(scope) {
    const { restfulResult: result, transportData: { res } } = scope;

    // apply i18n for errors
    if (result && result.error && result.message) {
      result.message = res.__(result.message);
    }

    return super.sendResult(scope);
  }
}

BaseController.AUTH = AUTH;

module.exports = BaseController;
