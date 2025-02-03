import { ErrorResponse } from '../../classes';
import { categoryHelper } from '../../helpers';
import { HttpStatusCode, IStatus } from '../../interfaces';
import { ApiParams } from '../../types';

/**
 * To get all categorys
 * @param req
 * @param res
 * @param next
 */
export const getCategorys: ApiParams = (req, res, next) => {
  const categoryRole = req.client?.role ?? '';
  categoryHelper
    .getCategorys(
      req.query.timestamp,
      req.query.page,
      req.query.limit,
      req.query.code,
      req.query.name,
      ['SuperAdmin', 'DeveloperAdmin', 'Admin'].includes(categoryRole)
        ? [IStatus.ACTIVE, IStatus.INACTIVE]
        : [IStatus.ACTIVE],
      ['SuperAdmin', 'DeveloperAdmin'].includes(categoryRole) &&
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
 * To get a particular category by id
 * @param req - Params : sid
 * @param res
 * @param next
 */
export const getCategoryById: ApiParams = (req, res, next) => {
  categoryHelper
    .getCategoryById(req.params.sid, req.client?.role)
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
 * To add a new category
 * @param req - Body: { ICategory }
 * @param res
 * @param next
 */
export const addCategory: ApiParams = (req, res, next) => {
  categoryHelper
    .addCategory(req.body)
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
 * To edit a particular category details
 * @param req Params: sid
 * @param res
 * @param next
 */
export const editCategory: ApiParams = (req, res, next) => {
  categoryHelper
    .editCategory(req.params.sid, req.body)
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
 * To change a particular category's state
 * @param req Params: sid
 * @param res
 * @param next
 */
export const changeCategoryStatus: ApiParams = (req, res, next) => {
  categoryHelper
    .changeCategoryStatus(req.params.sid)
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
 * To delete a category temporarily
 * @param req - Params: sid
 * @param res
 * @param next
 */
export const deleteCategory: ApiParams = (req, res, next) => {
  categoryHelper
    .deleteCategory(req.params.sid)
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
 * To restore a category
 * @param req - Params: sid
 * @param res
 * @param next
 */
export const restoreCategory: ApiParams = (req, res, next) => {
  categoryHelper
    .restoreCategory(req.params.sid)
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
 * To delete a category parmanently
 * @param req - Params: sid
 * @param res
 * @param next
 */
export const pDeleteCategory: ApiParams = (req, res, next) => {
  categoryHelper
    .pDeleteCategory(req.params.sid)
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
 * To delete all category in development mode
 * METHOD : DELETE
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const deleteAllCategory: ApiParams = (req, res, next) => {
  categoryHelper
    .deleteAllCategorys()
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
