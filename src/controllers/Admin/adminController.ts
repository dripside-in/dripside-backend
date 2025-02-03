import { ErrorResponse } from '../../classes';
import { adminHelper } from '../../helpers';
import { HttpStatusCode, IAccountStatus } from '../../interfaces';
import { ApiParams } from '../../types';
import { setCookies } from '../../functions';
import { config } from '../../config';

const { SERVER_ACCESS_TOKEN_KEY, SERVER_REFRESH_TOKEN_KEY } = config.SERVER;

/**
 * To get all admins
 * @param req
 * @param res
 * @param next
 */
export const getAdmins: ApiParams = (req, res, next) => {
  const adminRole = req.client?.role ?? '';
  adminHelper
    .getAdmins(
      req.query.timestamp,
      req.query.page,
      req.query.limit,
      req.query.role,
      req.query.name,
      req.query.username,
      req.query.email,
      req.query.phone,
      ['SuperAdmin', 'DeveloperAdmin', 'Admin'].includes(adminRole)
        ? [
            IAccountStatus.PENDING,
            IAccountStatus.ACTIVE,
            IAccountStatus.INACTIVE,
            IAccountStatus.BLOCKED,
            IAccountStatus.ACCEPTED,
            IAccountStatus.REJECTED,
          ]
        : [IAccountStatus.ACTIVE],
      ['SuperAdmin', 'DeveloperAdmin'].includes(adminRole) &&
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
 * To get a particular admin by id
 * @param req - Params : aid
 * @param res
 * @param next
 */
export const getAdminById: ApiParams = (req, res, next) => {
  adminHelper
    .getAdminById(req.params.aid, req.client?.role)
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
 * Get a particular admin's profile
 * METHOD : GET
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const getAdminProfile: ApiParams = (req, res, next) => {
  adminHelper
    .getAdminById(req.client!.id, req.client!.role)
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
 * To login a admin
 * @param req - Body: { username and password }
 * @param res
 * @param next
 */
export const adminLogin: ApiParams = (req, res, next) => {
  adminHelper
    .adminLogin(
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
 * To upgrade a particular admin's access token by refresh token
 * @param req
 * @param res
 * @param next
 */
export const upgradeAdminAccessToken: ApiParams = (req, res, next) => {
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
    adminHelper
      .upgradeAdminAccessToken(refreshToken)
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
 * To add a new admin
 * @param req - Body: { IAdmin }
 * @param res
 * @param next
 */
export const addAdmin: ApiParams = (req, res, next) => {
  adminHelper
    .addAdmin(req.body)
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
 * To edit a particular admin details
 * @param req Params: aid
 * @param res
 * @param next
 */
export const editAdmin: ApiParams = (req, res, next) => {
  adminHelper
    .editAdmin(req.params.aid, req.body)
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
 * To update particular admin profile
 * @param req Params: aid, Body: { IAdmin }
 * @param res
 * @param next
 */
export const updateAdminProfile: ApiParams = (req, res, next) => {
  adminHelper
    .updateAdminProfile(req.client?.id, req.body)
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
 * To change a particular admin's state
 * @param req Params: adminId,status
 * @param res
 * @param next
 */
export const changeAdminStatus: ApiParams = (req, res, next) => {
  adminHelper
    .changeAdminStatus(req.params.aid, req.body.status)
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
 * To change a particular admin's username
 * @param req Params: adminId,newUsername
 * @param res
 * @param next
 */
export const changeAdminUsername: ApiParams = (req, res, next) => {
  adminHelper
    .changeAdminUsername(req.client!.id, req.body.username)
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
 * To change a particular admin's email
 * @param req Params: adminId,newEmail
 * @param res
 * @param next
 */
export const changeAdminEmail: ApiParams = (req, res, next) => {
  adminHelper
    .changeAdminEmail(req.client!.id, req.body.email)
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
 * To change a particular admin's phone
 * @param req Params: adminId,newPhone
 * @param res
 * @param next
 */
export const changeAdminPhone: ApiParams = (req, res, next) => {
  adminHelper
    .changeAdminPhone(req.client!.id, req.body.phone)
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
 * To change a particular admin's password
 * @param req Params: adminId,currentPassword,newPassword
 * @param res
 * @param next
 */
export const changeAdminPassword: ApiParams = (req, res, next) => {
  adminHelper
    .changeAdminPassword(
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
export const forgotAdminPassword: ApiParams = (req, res, next) => {
  adminHelper
    .forgotAdminPassword(req.body.email)
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
 * To change admin password
 * METHOD : PATCH
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const resetAdminPassword: ApiParams = (req, res, next) => {
  adminHelper
    .resetAdminPassword(req.body.token, req.body.password)
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
 * To send a credentials to admin email
 * @param req Params: aid,status
 * @param res
 * @param next
 */
export const sentLoginCredentials: ApiParams = (req, res, next) => {
  adminHelper
    .sentLoginCredentials(req.params.aid)
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
 * To check a particular admin's username
 * @param req Query username
 * @param res
 * @param next
 */
export const checkAdminUsername: ApiParams = (req, res, next) => {
  adminHelper
    .checkAdminUsername(req.query.username.toString())
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
 * To delete a admin temporarily
 * @param req - Params: aid
 * @param res
 * @param next
 */
export const deleteAdmin: ApiParams = (req, res, next) => {
  adminHelper
    .deleteAdmin(req.params.aid)
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
 * To restore a admin
 * @param req - Params: aid
 * @param res
 * @param next
 */
export const restoreAdmin: ApiParams = (req, res, next) => {
  adminHelper
    .restoreAdmin(req.params.aid)
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
 * To delete a admin parmanently
 * @param req - Params: aid
 * @param res
 * @param next
 */
export const pDeleteAdmin: ApiParams = (req, res, next) => {
  adminHelper
    .pDeleteAdmin(req.params.aid)
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
 * To delete all admin in development mode
 * METHOD : DELETE
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const deleteAllAdmin: ApiParams = (req, res, next) => {
  adminHelper
    .deleteAllAdmins()
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
