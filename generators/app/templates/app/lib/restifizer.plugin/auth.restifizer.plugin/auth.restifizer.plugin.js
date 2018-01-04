/**
 * Created by vedi on 02/07/16.
 */

'use strict';

const crypto = require('crypto');
const _ = require('lodash');
const Bb = require('bluebird');
const { INTERNAL_SERVER_ERROR } = require('http-statuses');
const validateSchema = require('app/lib/validate-schema');
const createAppError = require('app/lib/create-app-error');
const app = require('app/app');
const {
  RULES: {
    BAD_PASSWORD_RULE,
    ALREADY_LINKED_RULE,
    OTHER_ALREADY_LINKED_RULE,
    WRONG_PASSWORD_RESET_TOKEN_RULE,
    INVALID_USERNAME_RULE,
    UNSUPPORTED_SN_VALUE_RULE,
    UNLINK_PRIMARY_ACCOUNT_RULE,
  },
} = require('./auth.consts');

const LOCAL_PROVIDER = 'local';
const {
  schemas: {
    AUTH_CHANGE_PASSWORD_SCHEMA,
    AUTH_FORGOT_PASSWORD_SCHEMA,
  },
  config,
} = app;

/**
 * @apiIgnore
 * @apiGroup User
 * @apiName LogoutUser
 * @api {post} /api/users/logout Logout User
 * @apiDescription Logs out the current user.
 * @apiPermission bearer
 *
 * @apiUse BearerAuthHeader
 * @apiUse EmptySuccess
 */
/**
 * @apiIgnore
 * @apiGroup User
 * @apiName ChangeUserPassword
 * @api {post} /api/users/:_id/change-password Change User Password
 * @apiDescription Changes user password. Only owner or admin can change password.
 *
 * @apiParam {String} password the current password of the user
 * @apiParam {String} newPassword
 *
 * @apiPermission bearer
 *
 * @apiUse BearerAuthHeader
 * @apiUse EmptySuccess
 */

/**
 * @apiIgnore
 * @apiGroup User
 * @apiName ForgotUserPassword
 * @api {post} /api/users/forgot Send Restoration Code
 * @apiDescription Initiates password restoration, sending reset code to email.
 * @apiPermission client
 * @apiParam {String} username email of a user, who restores password
 *
 * @apiUse ClientAuthParams
 * @apiUse EmptySuccess
 */
/**
 * @apiIgnore
 * @apiGroup User
 * @apiName ResetUserPassword
 * @api {post} /api/users/reset/:token Reset User Password
 * @apiDescription Resets user password.
 * @apiPermission client
 *
 * @apiParam {String} token restoration token, received in email
 * @apiParam {String} newPassword new password
 *
 * @apiUse ClientAuthParams
 * @apiUse AuthSuccess
 */
function mongooseFn(schema, options) {
  const { mongoose } = options;
  schema.add({
    username: {
      type: String,
      unique: 'User with this username already exists',
      required: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      default: '',
    },
    salt: {
      type: String,
    },
    provider: {
      type: String,
      default: LOCAL_PROVIDER,
      required: true,
    },
    linkedAccounts: {},
    resetPassword: {
      token: String,
      expires: Date,
    },
    emailVerification: {
      token: String,
      expires: Date,
    },
  });
  schema.statics.logout = function logout(userId) {
    const AccessToken = mongoose.model('AccessToken');
    const RefreshToken = mongoose.model('RefreshToken');
    // remove tokens
    return Bb
      .join(
        RefreshToken.remove({ userId }),
        AccessToken.remove({ userId })
      );
  };
  /**
   * Create instance method for hashing a password
   */
  schema.methods.hashPassword = function hashPassword(password) {
    if (this.salt && password) {
      return crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha1').toString('base64');
    } else {
      return password;
    }
  };
  /**
   * Create instance method for authenticating user
   */
  schema.methods.authenticate = function authenticate(password) {
    return this.hashedPassword === this.hashPassword(password);
  };
  schema
    .virtual('password')
    .set(function setPassword(password) {
      this._plainPassword = password;
      this.salt = Buffer.from(crypto.randomBytes(16).toString('base64'), 'base64');
      this.hashedPassword = this.hashPassword(password);
    })
    .get(function getPassword() {
      return this._plainPassword;
    });
}

function restifizer(restifizerController, options) {
  const { eventBus } = app;
  const { authenticate, profileFilter, Model } = options;

  function normalize(sn, query) {
    const prefix = `linkedAccounts.${sn}`;
    const result = {};
    _.forEach(query.linkedAccounts[sn], (value, key) => {
      result[`${prefix}.${key}`] = value;
    });
    return result;
  }

  restifizerController.snHelpers = {};
  const { sns } = options;
  if (config.isTest) {
    restifizerController.snHelpers.emulation = {
      getProfile(authData) {
        if (!authData) {
          return Bb.reject(INTERNAL_SERVER_ERROR.createError('No emulation data provider'));
        }
        return Bb.resolve({
          id: authData.id,
          email: authData.email,
          name: authData.name,
          firstName: authData.firstName,
          lastName: authData.lastName,
        });
      },
      buildQuery(profile) {
        return { id: profile.id };
      },
      extract(profile) {
        return {
          username: profile.email,
          name: profile.name,
          firstName: profile.firstName,
          lastName: profile.lastName,
        };
      },
    };
  } else if (sns) {
    if (sns.facebook) {
      restifizerController.snHelpers.facebook = new (
        // eslint-disable-next-line import/no-dynamic-require, global-require
        require('./sn-helpers/facebook-helper'))(sns.facebook);
    }
    if (sns.google) {
      restifizerController.snHelpers.google = new (
        // eslint-disable-next-line import/no-dynamic-require, global-require
        require('./sn-helpers/google-plus-helper'))(sns.google);
    }
  }
  restifizerController.getSnHelper = function getSnHelper(sn) {
    if (!config.isTest) {
      return this.snHelpers[sn];
    } else {
      return this.snHelpers.emulation;
    }
  };
  restifizerController.actions.snAuth = restifizerController.normalizeAction({
    auth: ['oauth2-client-password'],
    method: 'post',
    path: 'snAuth/:sn',
    handler: function snAuth(scope) {
      const { params: { sn }, body: { auth } } = scope;
      const snHelper = this.getSnHelper(sn);
      if (!snHelper) {
        throw createAppError(UNSUPPORTED_SN_VALUE_RULE, sn);
      }
      const query = { linkedAccounts: {} };
      let profile;
      return snHelper
        .getProfile(auth)
        .then((result) => {
          profile = result;
          query.linkedAccounts[sn] = snHelper.buildQuery(profile);
          return Model.findOne(normalize(sn, query));
        })
        .then((doc) => {
          if (!doc) {
            query.provider = sn;
            let userData = snHelper.extract(profile);
            if (_.isFunction(profileFilter)) {
              userData = profileFilter.apply(this, userData);
            }
            Object.assign(query, userData);
            return Model.create(query);
          } else {
            doc.set(`linkedAccounts.${sn}`, query.linkedAccounts[sn]);
            return doc.save();
          }
        })
        .then((doc) => {
          if (_.isFunction(authenticate)) {
            return authenticate(doc, scope);
          }
        });
    },
  }, 'snAuth');
  restifizerController.actions.linkAccount = restifizerController.normalizeAction({
    method: 'put',
    path: ':_id/linked-accounts/:sn',
    handler: function linkAccount(scope) {
      const { params, body: { auth } } = scope;
      const { sn } = params;
      delete params.sn;
      const query = { linkedAccounts: {} };
      let profile;
      return this
        .locateModel(scope)
        .then((doc) => {
          scope.affectedDoc = doc;
          const snHelper = this.getSnHelper(sn);
          if (!snHelper) {
            throw createAppError(UNSUPPORTED_SN_VALUE_RULE, sn);
          }
          scope.snHelper = snHelper;
          return snHelper.getProfile(auth);
        })
        .then((result) => {
          profile = result;
          query.linkedAccounts[sn] = scope.snHelper.buildQuery(profile);
          return Model.findOne(normalize(sn, query));
        })
        .then((doc) => {
          // check, if somebody else linked with this data
          if (doc) {
            if (doc.id === scope.affectedDoc.id) {
              throw createAppError(ALREADY_LINKED_RULE);
            } else {
              throw createAppError(OTHER_ALREADY_LINKED_RULE);
            }
          }
          scope.affectedDoc.set(`linkedAccounts.${sn}`, query.linkedAccounts[sn]);
          return scope.affectedDoc.save();
        })
        .then(() => undefined);
    },
  }, 'linkAccount');
  restifizerController.actions.unlinkAccount = restifizerController.normalizeAction({
    method: 'delete',
    path: ':_id/linked-accounts/:sn',
    handler: function linkAccount(scope) {
      const { params } = scope;
      const { sn } = params;
      delete params.sn;
      return this
        .locateModel(scope)
        .then((doc) => {
          scope.affectedDoc = doc;
          const snHelper = this.getSnHelper(sn);
          if (!snHelper) {
            throw createAppError(UNSUPPORTED_SN_VALUE_RULE, sn);
          }
          if (doc.provider === sn) {
            throw createAppError(UNLINK_PRIMARY_ACCOUNT_RULE);
          }
          doc.set(`linkedAccounts.${sn}`, undefined);
          return doc.save();
        })
        .then(() => undefined);
    },
  }, 'unlinkAccount');
  restifizerController.actions.logout = restifizerController.normalizeAction({
    auth: ['bearer'],
    method: 'post',
    path: 'logout',
    handler: function logout(scope) {
      const { user: { _id: userId } } = scope;
      if (!userId) {
        throw INTERNAL_SERVER_ERROR.createError('No user in context');
      }
      return Model
        .logout(userId)
        .then(() => undefined);
    },
  }, 'logout');
  restifizerController.actions.changePassword = restifizerController.normalizeAction({
    auth: ['bearer'],
    method: 'post',
    path: ':_id/change-password',
    handler: function changePassword(scope) {
      const { body, user: { username } } = scope;
      return validateSchema(body, AUTH_CHANGE_PASSWORD_SCHEMA)
        .then((validatedBody) => {
          const { password, newPassword } = validatedBody;
          return Model
            .findOne({ username })
            .then((user) => {
              if (!user.authenticate(password)) {
                throw createAppError(BAD_PASSWORD_RULE);
              }
              user.password = newPassword;
              return user.save();
            })
            .then(() => undefined);
        });
    },
  }, 'changePassword');
  restifizerController.actions.forgot = restifizerController.normalizeAction({
    auth: ['oauth2-client-password'],
    method: 'post',
    path: 'forgot',
    handler: function forgot(scope) {
      const { body, context, transportData: { req } } = scope;
      return validateSchema(body, AUTH_FORGOT_PASSWORD_SCHEMA)
        .then(validatedBody => Model.findOne({
          username: validatedBody.username.toLowerCase(),
        }))
        .then((user) => {
          if (!user) {
            throw createAppError(INVALID_USERNAME_RULE);
          }
          context.user = user;
          return Bb.fromCallback((callback) => {
            crypto.randomBytes(20, callback);
          });
        })
        .then((buffer) => {
          context.user.resetPassword = {
            token: buffer.toString('hex'),
            expires: Date.now() + (1000 * config.security.tokenLife),
          };
          return context.user.save();
        })
        .then(() => {
          eventBus.emit(eventBus.EVENTS.FORGOT_PASSWORD, {
            user: context.user,
            baseUrl: `${req.protocol}://${req.get('host')}`,
          });
          return undefined;
        });
    },
  }, 'forgot');
  restifizerController.actions.reset = restifizerController.normalizeAction({
    auth: ['oauth2-client-password'],
    method: 'post',
    path: 'reset/:token',
    handler: function reset(scope) {
      const { params: { token }, body: { newPassword }, context } = scope;
      if (!newPassword) {
        throw createAppError(WRONG_PASSWORD_RESET_TOKEN_RULE);
      }
      return Model
        .findOne({
          'resetPassword.token': token,
          'resetPassword.expires': {
            $gt: new Date(),
          },
        })
        .then((user) => {
          if (!user) {
            throw createAppError(WRONG_PASSWORD_RESET_TOKEN_RULE);
          }
          context.user = user;
          user.password = newPassword;
          user.resetPassword = undefined;
          return user.save();
        })
        .then(() => {
          eventBus.emit(
            eventBus.EVENTS.RESET_PASSWORD,
            {
              user: context.user,
            }
          );
          return authenticate(context.user, scope);
        });
    },
  }, 'reset');
}

module.exports.restifizer = restifizer;
module.exports.mongoose = mongooseFn;
