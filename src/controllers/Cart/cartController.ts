import { ErrorResponse } from '../../classes';
import { cartHelper } from '../../helpers';
import { HttpStatusCode, IStatus } from '../../interfaces';
import { ApiParams } from '../../types';

/**
 * To get all carts
 * @param req
 * @param res
 * @param next
 */
export const getCarts: ApiParams = (req, res, next) => {
  const cartRole = req.client?.role ?? '';
  cartHelper
    .getCarts(
      req.query.timestamp,
      req.query.page,
      req.query.limit,
      req.query.code,
      req.query.name,
      ['SuperAdmin', 'DeveloperAdmin', 'Admin'].includes(cartRole)
        ? [IStatus.ACTIVE, IStatus.INACTIVE]
        : [IStatus.ACTIVE],
      ['SuperAdmin', 'DeveloperAdmin'].includes(cartRole) &&
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
 * To get a particular cart by id
 * @param req - Params : sid
 * @param res
 * @param next
 */
export const getCartById: ApiParams = (req, res, next) => {
  cartHelper
    .getCartById(req.params.sid, req.client?.role)
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
 * To add a new cart
 * @param req - Body: { ICart }
 * @param res
 * @param next
 */
export const addCart: ApiParams = (req, res, next) => {
  cartHelper
    .addCart(req.body)
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
 * To edit a particular cart details
 * @param req Params: sid
 * @param res
 * @param next
 */
export const editCart: ApiParams = (req, res, next) => {
  cartHelper
    .editCart(req.params.sid, req.body)
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
 * To change a particular cart's state
 * @param req Params: sid
 * @param res
 * @param next
 */
export const changeCartStatus: ApiParams = (req, res, next) => {
  cartHelper
    .changeCartStatus(req.params.sid)
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
 * To delete a cart temporarily
 * @param req - Params: sid
 * @param res
 * @param next
 */
export const deleteCart: ApiParams = (req, res, next) => {
  cartHelper
    .deleteCart(req.params.sid)
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
 * To restore a cart
 * @param req - Params: sid
 * @param res
 * @param next
 */
export const restoreCart: ApiParams = (req, res, next) => {
  cartHelper
    .restoreCart(req.params.sid)
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
 * To delete a cart parmanently
 * @param req - Params: sid
 * @param res
 * @param next
 */
export const pDeleteCart: ApiParams = (req, res, next) => {
  cartHelper
    .pDeleteCart(req.params.sid)
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
 * To delete all cart in development mode
 * METHOD : DELETE
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const deleteAllCart: ApiParams = (req, res, next) => {
  cartHelper
    .deleteAllCarts()
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
