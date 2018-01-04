/**
 * Created by vedi on 11/23/15.
 */

'use strict';

const crypto = require('crypto');
const { URL } = require('url');
const Bb = require('bluebird');
const _ = require('lodash');
const HTTP_STATUSES = require('http-statuses');
const BaseController = require('app/lib/base.restifizer.controller');
const authPlugin = require('app/lib/restifizer.plugin/auth.restifizer.plugin');
const verificationPlugin = require('app/lib/restifizer.plugin/verification.restifizer.plugin');

const {
  config,
  eventBus,
  modelProvider: { User },
} = require('app/app');

/**
 * @apiDefine UserRequest
 * @apiParam {String} username username, used for signing in
 * @apiParam {String} password
 *
 */

/**
 * @apiDefine UserResponse
 * @apiSuccess {String} username username, used for signing in
 * @apiSuccess {String(ISODate)} createdAt
 * @apiSuccess {String(ISODate)} updatedAt
 */

/**
 * @apiGroup User
 * @apiName GetUsers
 * @api {get} /api/users Get User List
 * @apiDescription Returns array of users.
 * @apiPermission bearer, admin
 *
 * @apiUse BearerAuthHeader
 * @apiUse UserResponse
 */

/**
 * @apiGroup User
 * @apiName GetUser
 * @api {get} /api/users/:_id Get User
 * @apiDescription Returns user by id. Regular users can get only own profile.
 * @apiPermission bearer
 *
 * @apiParam {String} _id user id, you can use "me" shortcut.
 *
 * @apiUse BearerAuthHeader
 * @apiUse UserResponse
 */

/**
 * @apiGroup User
 * @apiName UpdateUser
 * @api {patch} /api/users/:_id Update User
 * @apiDescription Updates user by id. Regular users can update only own profile.
 * @apiPermission bearer
 *
 * @apiParam {String} _id user id, you can use "me" shortcut.
 *
 * @apiUse BearerAuthHeader
 * @apiUse UserRequest
 * @apiUse UserResponse
 */

/**
 * @apiGroup User
 * @apiName RemoveUser
 * @api {delete} /api/users/:_id Remove User
 * @apiDescription Removes user by id. Regular users can remove only own profile.
 * @apiPermission bearer
 *
 * @apiParam {String} _id user id, you can use "me" shortcut.
 *
 * @apiUse BearerAuthHeader
 * @apiUse EmptySuccess
 */
class UserController extends BaseController {
  constructor(options = {}) {
    const DEFAULT_FIELDS = [
      'provider',
      'username',
      'createdAt',
      'updatedAt',
      'password',
      'auth',
      'emailVerified',
    ];
    const PUBLIC_FIELDS = _.without(DEFAULT_FIELDS, ['provider', 'password', 'auth', 'balance']);

    Object.assign(options, {
      dataSource: {
        type: 'mongoose',
        options: {
          model: User,
        },
      },
      path: '/api/users',
      fields: DEFAULT_FIELDS,
      readOnlyFields: [
        'createdAt',
        'updatedAt',
      ],
      defaultFields: DEFAULT_FIELDS,
      publicFields: PUBLIC_FIELDS,
      smartPut: true,
      actions: {
        default: BaseController.createAction({
          auth: [BaseController.AUTH.BEARER],
        }),

        insert: BaseController.createAction({
          enabled: false,
        }),

        update: BaseController.createAction({
          auth: [BaseController.AUTH.BEARER],
        }),

        /**
         * @apiGroup User
         * @apiName GetUsersPublic
         * @api {get} /api/users/public Get Public Profiles of Users
         * @apiDescription Returns user list with public fields.
         * @apiPermission bearer
         *
         * @apiParam {String} _id user id, you can use "me" shortcut.
         *
         * @apiUse BearerAuthHeader
         * @apiUse UserResponse
         */
        publicProfiles: {
          method: 'get',
          path: 'public',
          priority: -1,
        },

        /**
         * @apiGroup User
         * @apiName GetUserPublic
         * @api {get} /api/users/:_id/public Get Public Profile of User
         * @apiDescription Returns public fields of a user by id.
         * @apiPermission bearer
         *
         * @apiParam {String} _id user id, you can use "me" shortcut.
         *
         * @apiUse BearerAuthHeader
         * @apiUse UserResponse
         */
        publicProfile: {
          method: 'get',
          path: ':_id/public',
        },
      },

      plugins: [
        /**
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
        {
          plugin: authPlugin.restifizer,
          options: {
            Model: User,
            authenticate: (doc, scope) => this._authenticate(doc, scope),
            sns: {
              facebook: {
                fieldsToFetch: 'first_name,last_name',
              },
              google: {
                audiences: [config.google.webClientId],
              },

            },
          },
        },
        /**
         * @apiGroup User
         * @apiName VerifyUserEmail
         * @api {post} /api/users/verify-email/:token Verify User Email
         * @apiDescription Verifies user email.
         * @apiPermission client
         *
         * @apiParam {String} token verification token, received in email
         * @apiParam {String} password new password
         *
         * @apiUse ClientAuthParams
         * @apiUse AuthSuccess
         */

        /**
         * @apiGroup User
         * @apiName RegisterOrVerify
         * @api {put} /api/users/register-or-verify/:username Register or verify user
         * @apiDescription Initiates email verification (optionally creates user if needed).
         * @apiPermission client
         *
         * @apiParam {String} username username
         *
         * @apiUse ClientAuthParams
         * @apiUse UserResponse
         */

        /**
         * @apiGroup User
         * @apiName CheckVerificationToken
         * @api {get} /api/users/check-verification-token/:token Check verification token
         * @apiDescription Checks verification token
         * @apiPermission client
         *
         * @apiParam {String} token token
         *
         * @apiUse ClientAuthParams
         * @apiUse UserResponse
         */

        {
          plugin: verificationPlugin.restifizer,
          options: {
            Model: User,
            authenticate: (doc, scope) => this._authenticate(doc, scope),
          },
        },
      ],
    });

    super(options);

    this.authDelegate = this.transports[0].app.oAuthifizer.authDelegate;
    if (!this.authDelegate) {
      throw new Error('"authDelegate" must be provided');
    }
  }

  publicProfiles(scope) {
    return this.select(scope);
  }

  publicProfile(scope) {
    return this.selectOne(scope);
  }

  assignFilter(queryParams, fieldName, scope) {
    return (!scope.isUpdate() || fieldName !== 'password') &&
      super.assignFilter(queryParams, fieldName, scope);
  }

  pre(scope) {
    const params = scope.getParams();
    const user = scope.getUser();
    if (!scope.isInsert() && params._id === 'me') {
      params._id = user.id;
    }

    // do not allow list selecting
    if (scope.isSelect() && !scope.isSelectOne()) {
      throw HTTP_STATUSES.FORBIDDEN.createError();
    }
  }

  async afterSave(scope) {
    // user is signing up
    if (scope.inserting) {
      const { model: user } = scope;
      await this._sendEmailVerification(scope, user);
    }
  }

  async _sendEmailVerification(scope, user) {
    const { locale } = scope;
    const { origin } = new URL(scope.referrer);
    const baseUrl = `${origin}/${config.urls.verifyEmail}`;
    await this._generateEmailVerification(user);
    eventBus.emit(eventBus.EVENTS.SEND_EMAIL_VERIFICATION, { user, locale, baseUrl });
  }

  _generateEmailVerification(user) {
    return Bb
      .fromCallback((callback) => {
        crypto.randomBytes(20, callback);
      })
      .then((buffer) => {
        user.emailVerification = {
          token: buffer.toString('hex'),
          expires: Date.now() + (1000 * config.security.emailVerificationTokenLife),
        };

        return user.save();
      });
  }

  _authenticate(user, scope) {
    scope.setUser(user);
    return Bb
      .try(() => {
        const { body, client, user } = scope;
        if (!client && user && user.isAdmin()) {
          // for admins we're fetching client data from the request
          return this.authDelegate
            .findClient({
              clientId: body.client_id,
              clientSecret: body.client_secret,
            });
        } else {
          return client;
        }
      })
      .then((client) => {
        if (client) {
          return Bb
            .join(
              this.authDelegate.createAccessToken({ user, client }),
              this.authDelegate.createRefreshToken({ user, client })
            )
            .then(([accessToken, refreshToken]) => ({
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_in: config.security.tokenLife,
              token_type: 'bearer',
            }));
        }
      });
  }
}

module.exports = UserController;
