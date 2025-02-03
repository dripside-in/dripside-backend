import { ErrorResponse } from '../../classes';
import { artistHelper } from '../../helpers';
import { HttpStatusCode, IStatus } from '../../interfaces';
import { ApiParams } from '../../types';

/**
 * To get all artists
 * @param req
 * @param res
 * @param next
 */
export const getArtists: ApiParams = (req, res, next) => {
  const artistRole = req.client?.role ?? '';
  artistHelper
    .getArtists(
      req.query.timestamp,
      req.query.page,
      req.query.limit,
      req.query.code,
      req.query.name,
      ['SuperAdmin', 'DeveloperAdmin', 'Admin'].includes(artistRole)
        ? [IStatus.ACTIVE, IStatus.INACTIVE]
        : [IStatus.ACTIVE],
      ['SuperAdmin', 'DeveloperAdmin'].includes(artistRole) &&
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
 * To get a particular artist by id
 * @param req - Params : sid
 * @param res
 * @param next
 */
export const getArtistById: ApiParams = (req, res, next) => {
  artistHelper
    .getArtistById(req.params.sid, req.client?.role)
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
 * To add a new artist
 * @param req - Body: { IArtist }
 * @param res
 * @param next
 */
export const addArtist: ApiParams = (req, res, next) => {
  artistHelper
    .addArtist(req.body)
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
 * To edit a particular artist details
 * @param req Params: sid
 * @param res
 * @param next
 */
export const editArtist: ApiParams = (req, res, next) => {
  artistHelper
    .editArtist(req.params.sid, req.body)
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
 * To change a particular artist's state
 * @param req Params: sid
 * @param res
 * @param next
 */
export const changeArtistStatus: ApiParams = (req, res, next) => {
  artistHelper
    .changeArtistStatus(req.params.sid)
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
 * To delete a artist temporarily
 * @param req - Params: sid
 * @param res
 * @param next
 */
export const deleteArtist: ApiParams = (req, res, next) => {
  artistHelper
    .deleteArtist(req.params.sid)
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
 * To restore a artist
 * @param req - Params: sid
 * @param res
 * @param next
 */
export const restoreArtist: ApiParams = (req, res, next) => {
  artistHelper
    .restoreArtist(req.params.sid)
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
 * To delete a artist parmanently
 * @param req - Params: sid
 * @param res
 * @param next
 */
export const pDeleteArtist: ApiParams = (req, res, next) => {
  artistHelper
    .pDeleteArtist(req.params.sid)
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
 * To delete all artist in development mode
 * METHOD : DELETE
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const deleteAllArtist: ApiParams = (req, res, next) => {
  artistHelper
    .deleteAllArtists()
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
