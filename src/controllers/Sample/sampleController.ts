import { ErrorResponse } from '../../classes';
import { sampleHelper } from '../../helpers';
import { HttpStatusCode, IStatus } from '../../interfaces';
import { ApiParams } from '../../types';

/**
 * To get all samples
 * @param req
 * @param res
 * @param next
 */
export const getSamples: ApiParams = (req, res, next) => {
  const sampleRole = req.client?.role ?? '';
  sampleHelper
    .getSamples(
      req.query.timestamp,
      req.query.page,
      req.query.limit,
      req.query.code,
      req.query.name,
      ['SuperAdmin', 'DeveloperAdmin', 'Admin'].includes(sampleRole)
        ? [IStatus.ACTIVE, IStatus.INACTIVE]
        : [IStatus.ACTIVE],
      ['SuperAdmin', 'DeveloperAdmin'].includes(sampleRole) &&
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
 * To get a particular sample by id
 * @param req - Params : sid
 * @param res
 * @param next
 */
export const getSampleById: ApiParams = (req, res, next) => {
  sampleHelper
    .getSampleById(req.params.sid, req.client?.role)
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
 * To add a new sample
 * @param req - Body: { ISample }
 * @param res
 * @param next
 */
export const addSample: ApiParams = (req, res, next) => {
  sampleHelper
    .addSample(req.body)
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
 * To edit a particular sample details
 * @param req Params: sid
 * @param res
 * @param next
 */
export const editSample: ApiParams = (req, res, next) => {
  sampleHelper
    .editSample(req.params.sid, req.body)
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
 * To change a particular sample's state
 * @param req Params: sid
 * @param res
 * @param next
 */
export const changeSampleStatus: ApiParams = (req, res, next) => {
  sampleHelper
    .changeSampleStatus(req.params.sid)
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
 * To delete a sample temporarily
 * @param req - Params: sid
 * @param res
 * @param next
 */
export const deleteSample: ApiParams = (req, res, next) => {
  sampleHelper
    .deleteSample(req.params.sid)
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
 * To restore a sample
 * @param req - Params: sid
 * @param res
 * @param next
 */
export const restoreSample: ApiParams = (req, res, next) => {
  sampleHelper
    .restoreSample(req.params.sid)
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
 * To delete a sample parmanently
 * @param req - Params: sid
 * @param res
 * @param next
 */
export const pDeleteSample: ApiParams = (req, res, next) => {
  sampleHelper
    .pDeleteSample(req.params.sid)
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
 * To delete all sample in development mode
 * METHOD : DELETE
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const deleteAllSample: ApiParams = (req, res, next) => {
  sampleHelper
    .deleteAllSamples()
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
