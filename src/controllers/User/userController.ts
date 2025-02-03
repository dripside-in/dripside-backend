import { ErrorResponse } from '../../classes';
import { setCookies } from '../../functions';
import { userHelper } from '../../helpers';
import { HttpStatusCode, IAccountStatus } from '../../interfaces';
import { ApiParams } from '../../types';
import { config } from '../../config';

const { SERVER_ACCESS_TOKEN_KEY, SERVER_REFRESH_TOKEN_KEY } = config.SERVER;

/**
 * To get all users
 * @param req
 * @param res
 * @param next
 */
export const getUsers: ApiParams = (req, res, next) => {
  const userRole = req.client?.role ?? '';
  userHelper
    .getUsers(
      req.query.timestamp,
      req.query.page,
      req.query.limit,
      req.query.role,
      req.query.name,
      req.query.username,
      req.query.email,
      req.query.phone,
      ['SuperSample', 'DeveloperSample', 'Admin'].includes(userRole)
        ? [
            IAccountStatus.PENDING,
            IAccountStatus.ACTIVE,
            IAccountStatus.INACTIVE,
            IAccountStatus.BLOCKED,
            IAccountStatus.ACCEPTED,
            IAccountStatus.REJECTED,
          ]
        : [IAccountStatus.ACTIVE],
      ['SuperAdmin', 'DeveloperAdmin'].includes(userRole) &&
        req.query.deleted !== 'NO'
        ? req.query.deleted === 'YES'
          ? 'YES'
          : 'BOTH'
        : 'NO'
    )
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To get a particular user by id
 * @param req - Params : uid
 * @param res
 * @param next
 */
export const getUserById: ApiParams = (req, res, next) => {
  userHelper
    .getUserById(req.params.uid, req.client?.role)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * Get a particular user's profile
 * METHOD : GET
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const getUserProfile: ApiParams = (req, res, next) => {
  userHelper
    .getUserById(req.client!.id, req.client!.role)
    .then((response) => {
      res.status(200).json({
        success: true,
        ...response,
      });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To login a user
 * @param req - Body: { username and password }
 * @param res
 * @param next
 */
export const userLogin: ApiParams = (req, res, next) => {
  userHelper
    .userLogin(
      req.body.username,
      req.body.email,
      req.body.phone,
      req.body.password
    )
    .then(async ({ message, results }) => {
      await setCookies('AccessToken', results.accessToken, res);
      await setCookies('RefreshToken', results.refreshToken, res);
      res.status(HttpStatusCode.OK).json({
        success: true,
        message,
        results: { token: results.accessToken },
      });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To upgrade a particular user's access token by refresh token
 * @param req
 * @param res
 * @param next
 */
export const upgradeUserAccessToken: ApiParams = (req, res, next) => {
  const accessToken: string = req.cookies[SERVER_ACCESS_TOKEN_KEY];
  const refreshToken: string = req.cookies[SERVER_REFRESH_TOKEN_KEY];

  if (!accessToken && !refreshToken) {
    return next(
      new ErrorResponse('Unauthonticated Request', HttpStatusCode.UNAUTHORIZED)
    );
  }

  if (accessToken && refreshToken) {
    return next(
      new ErrorResponse(
        'AccessToken and RefreshToken Already Exist',
        HttpStatusCode.UNAUTHORIZED
      )
    );
  }

  if (!accessToken && refreshToken) {
    userHelper
      .upgradeUserAccessToken(refreshToken)
      .then(async ({ message, results }) => {
        await setCookies('AccessToken', results.accessToken, res);
        await setCookies('RefreshToken', results.refreshToken, res);
        res.status(HttpStatusCode.OK).json({
          success: true,
          message,
          results: { token: results.accessToken },
        });
      })
      .catch((error: any) => {
        return next(
          new ErrorResponse(error.message, error.statusCode, error.code)
        );
      });
  }
};

/**
 * To sent a otp for particular user by phone
 * @param req - Body: { phone }
 * @param res
 * @param next
 */
export const sentOTP: ApiParams = (req, res, next) => {
  userHelper
    .sentOTP(req.body.phone)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};
/**
 * To verify a otp for particular user by phone and otp code
 * @param req - Body: { phone, otp }
 * @param res
 * @param next
 */
export const verifyOTP: ApiParams = (req, res, next) => {
  userHelper
    .verifyOTP(req.body.phone, req.body.otp)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To add a new user
 * @param req - Body: { IUser }
 * @param res
 * @param next
 */
export const addUser: ApiParams = (req, res, next) => {
  userHelper
    .addUser(req.body)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To registration a new user
 * @param req - Body: { IUser }
 * @param res
 * @param next
 */
export const userRegistration: ApiParams = (req, res, next) => {
  userHelper
    .userRegistration(req.body)
    .then(async ({ message, results }) => {
      await setCookies('AccessToken', results.accessToken, res);
      await setCookies('RefreshToken', results.refreshToken, res);
      res.status(HttpStatusCode.OK).json({
        success: true,
        message,
        results: { token: results.accessToken },
      });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To edit a particular user details
 * @param req Params: uid
 * @param res
 * @param next
 */
export const editUser: ApiParams = (req, res, next) => {
  userHelper
    .editUser(req.params.uid, req.body)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To update particular user profile
 * @param req Params: uid, Body: { IUser }
 * @param res
 * @param next
 */
export const updateUserProfile: ApiParams = (req, res, next) => {
  userHelper
    .updateUserProfile(req.client?.id, req.body)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To change a particular user's state
 * @param req Params: userId,status
 * @param res
 * @param next
 */
export const changeUserStatus: ApiParams = (req, res, next) => {
  userHelper
    .changeUserStatus(req.params.uid, req.body.status)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To change a particular user's username
 * @param req Params: userId,newUsername
 * @param res
 * @param next
 */
export const changeUserUsername: ApiParams = (req, res, next) => {
  userHelper
    .changeUserUsername(req.client!.id, req.body.username)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To change a particular user's email
 * @param req Params: userId,newEmail
 * @param res
 * @param next
 */
export const changeUserEmail: ApiParams = (req, res, next) => {
  userHelper
    .changeUserEmail(req.client!.id, req.body.email)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To change a particular user's phone
 * @param req Params: userId,newPhone
 * @param res
 * @param next
 */
export const changeUserPhone: ApiParams = (req, res, next) => {
  userHelper
    .changeUserPhone(req.client!.id, req.body.phone)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To change a particular user's password
 * @param req Params: userId,currentPassword,newPassword
 * @param res
 * @param next
 */
export const changeUserPassword: ApiParams = (req, res, next) => {
  userHelper
    .changeUserPassword(
      req.client!.id,
      req.body.currentPassword,
      req.body.newPassword
    )
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To send a reset link to email
 * METHOD : PATCH
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const forgotUserPassword: ApiParams = (req, res, next) => {
  userHelper
    .forgotUserPassword(req.body.email)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({
        success: true,
        ...response,
      });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To change user password
 * METHOD : PATCH
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const resetUserPassword: ApiParams = (req, res, next) => {
  userHelper
    .resetUserPassword(req.body.token, req.body.password)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({
        success: true,
        ...response,
      });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To send a credentials to user email
 * @param req Params: uid,status
 * @param res
 * @param next
 */
export const sentLoginCredentials: ApiParams = (req, res, next) => {
  userHelper
    .sentLoginCredentials(req.params.uid)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To check a particular user's username
 * @param req Query username
 * @param res
 * @param next
 */
export const checkUserUsername: ApiParams = (req, res, next) => {
  userHelper
    .checkUserUsername(req.query.username.toString())
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To delete a user temporarily
 * @param req - Params: uid
 * @param res
 * @param next
 */
export const deleteUser: ApiParams = (req, res, next) => {
  userHelper
    .deleteUser(req.params.uid)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To restore a user
 * @param req - Params: uid
 * @param res
 * @param next
 */
export const restoreUser: ApiParams = (req, res, next) => {
  userHelper
    .restoreUser(req.params.uid)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To delete a user parmanently
 * @param req - Params: uid
 * @param res
 * @param next
 */
export const pDeleteUser: ApiParams = (req, res, next) => {
  userHelper
    .pDeleteUser(req.params.uid)
    .then((response) => {
      res.status(HttpStatusCode.OK).json({ success: true, ...response });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};

/**
 * To delete all user in development mode
 * METHOD : DELETE
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const deleteAllUser: ApiParams = (req, res, next) => {
  userHelper
    .deleteAllUsers()
    .then((response) => {
      res.status(HttpStatusCode.OK).json({
        success: true,
        ...response,
      });
    })
    .catch((error: any) => {
      return next(
        new ErrorResponse(error.message, error.statusCode, error.code)
      );
    });
};
