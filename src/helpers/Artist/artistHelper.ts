import { isValidObjectId } from 'mongoose';
import {
  HttpStatusCode,
  IGetArtistsResponse,
  IResponseData,
  IArtist,
  IArtistResponse,
  IStatus,
} from '../../interfaces';
import { Artist } from '../../models';
import { IDeleted } from '../../types';
import { ThrowError } from '../../classes';
import { config } from '../../config';

const NODE_ENV = config.SERVER.SERVER_NODE_ENV;

/**
 * To get all samples except deleted samples
 * @returns IArtist[]
 */
export const getArtists = (
  timestamp?: string,
  page?: string,
  limit?: string,
  code?: string,
  name?: string,
  status?: IStatus[],
  deleted: IDeleted = 'NO'
) => {
  return new Promise<IGetArtistsResponse>(async (resolve, reject) => {
    try {
      const PAGE = parseInt(page ?? '1');
      const LIMIT = parseInt(limit ?? '10');

      // Queries
      const timestampGTQuery =
        timestamp && !isNaN(Date.parse(timestamp))
          ? { createdAt: { $gt: timestamp } }
          : {};
      const timestampLTEQuery =
        timestamp && !isNaN(Date.parse(timestamp))
          ? { createdAt: { $lte: timestamp } }
          : {};
      const codeQuery = code ? { code: new RegExp(code, 'i') } : {};
      const nameQuery = name ? { name: new RegExp(name, 'i') } : {};
      const statusQuery = status ? { status: status } : {};
      const deleteQuery =
        deleted != 'BOTH' ? { isDeleted: deleted === 'YES' } : {};
      const deleteProjection =
        deleted === 'BOTH' || deleted === 'YES'
          ? { isDeleted: 1, deletedAt: 1 }
          : {};

      // find condition
      const findCondition = {
        ...codeQuery,
        ...nameQuery,
        ...statusQuery,
        ...deleteQuery,
      };

      const samples = await Artist.find(
        { ...findCondition, ...timestampLTEQuery },
        {
          code: 1,
          name: 1,
          status: 1,
          createdAt: 1,
          ...deleteProjection,
        }
      )
        .sort({ createdAt: -1 })
        .limit(LIMIT === -1 ? 0 : LIMIT)
        .skip(LIMIT === -1 ? 0 : LIMIT * (PAGE - 1));

      const totalCount = await Artist.count({
        ...findCondition,
        ...timestampLTEQuery,
      });

      let latestCount = 0;
      if (Object.keys(timestampGTQuery).length > 0) {
        latestCount = await Artist.count({
          ...findCondition,
          ...timestampGTQuery,
        });
      }

      resolve({
        message: samples.length > 0 ? 'Artists fetched' : 'Artist is empty',
        currentPage: PAGE,
        results: samples,
        latestCount,
        totalCount,
        totalPages: Math.ceil(totalCount / LIMIT),
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Artist fetching failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To get a particular sample by id
 * @param sampleId
 * @returns IArtist
 */
export const getArtistById = (sampleId: IArtist['_id'], role?: string) => {
  return new Promise<IArtistResponse>(async (resolve, reject) => {
    try {
      if (!sampleId || !isValidObjectId(sampleId)) {
        return reject({
          message: !sampleId ? 'Provide sampleId' : 'sampleId not Valid',
          statusCode: HttpStatusCode.BAD_REQUEST,
        });
      }

      const deleteQuery = !['SuperArtist', 'DeveloperArtist'].includes(
        role ?? ''
      )
        ? { isDeleted: false }
        : {};
      const deleteProjection = ['SuperArtist', 'DeveloperArtist'].includes(
        role ?? ''
      )
        ? { isDeleted: 1, deletedAt: 1 }
        : {};

      const sample = await Artist.findOne(
        { _id: sampleId, ...deleteQuery },
        {
          code: 1,
          name: 1,
          email: 1,
          phone: 1,
          status: 1,
          createdAt: 1,
          ...deleteProjection,
        }
      );

      if (!sample) {
        return reject({
          message: 'Artist not found',
          statusCode: HttpStatusCode.NOT_FOUND,
        });
      }
      resolve({
        message: 'Artist details fetched',
        results: sample,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Artist fetching failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To add a new sample
 * @param newArtist { IArtist }
 * @returns IArtist
 */
export const addArtist = (newArtist: IArtist) => {
  return new Promise<IArtistResponse>(async (resolve, reject) => {
    try {
      if (!newArtist.name) {
        return reject({
          message: 'Please provide valid name, name, phone and email.',
          statusCode: HttpStatusCode.BAD_REQUEST,
        });
      }

      const isArtistFound: IArtist[] = await Artist.find({
        $or: [{ name: newArtist.name }],
      });

      if (isArtistFound.length > 0) {
        return reject({
          message: 'Name already exist',
        });
      }

      const sample = new Artist({
        name: newArtist.name,
      });

      const editedArtist = await sample.save();

      resolve({
        message: `${editedArtist.name}'s account created successfully`,
        results: editedArtist,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Artist creation failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To update a particular sample details
 * @param sampleId
 * @param newArtist
 * @returns IArtist
 */
export const editArtist = (sampleId: IArtist['_id'], data: IArtist) => {
  return new Promise<IArtistResponse>(async (resolve, reject) => {
    try {
      if (!sampleId || !isValidObjectId(sampleId))
        throw new ThrowError(
          'Provide vaild sample id',
          HttpStatusCode.BAD_REQUEST
        );

      const sample = await Artist.findById(sampleId, {
        code: 1,
        name: 1,
        status: 1,
        createdAt: 1,
      });

      if (!sample)
        throw new ThrowError('Artist not found', HttpStatusCode.NOT_FOUND);

      const { name } = data;

      // New name is already exist from another sample then
      if (name && sample.name != name) {
        const sampleExists = await Artist.findOne({ name });
        if (sampleExists)
          throw new ThrowError(
            'Email already exist for other sample',
            HttpStatusCode.BAD_REQUEST
          );
      }

      sample.name = name || sample.name;

      const editedArtist = await sample.save();

      resolve({
        message: `Artist edited successfully`,
        results: editedArtist,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Artist editing failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To change a particular sample's status
 * @param sampleId
 * @returns IArtist
 */
export const changeArtistStatus = (sampleId: IArtist['_id']) => {
  return new Promise<IArtistResponse>(async (resolve, reject) => {
    try {
      if (!sampleId || !isValidObjectId(sampleId))
        throw new ThrowError(
          'Provide vaild sample id and status',
          HttpStatusCode.BAD_REQUEST
        );

      const sample = await Artist.findById(sampleId, {
        code: 1,
        name: 1,
        status: 1,
        createdAt: 1,
      });

      if (!sample)
        throw new ThrowError('Artist not found', HttpStatusCode.NOT_FOUND);

      sample.status =
        sample.status === IStatus.ACTIVE ? IStatus.INACTIVE : IStatus.ACTIVE;
      const editedArtist = await sample.save();

      resolve({
        message: `${editedArtist.name} status changed to ${editedArtist.status}`,
        results: editedArtist,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Status changing failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To update particular sample profile
 * @param sampleId
 * @returns message
 */
export const deleteArtist = (sampleId: IArtist['_id']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!sampleId || !isValidObjectId(sampleId))
        throw new ThrowError(
          'Provide valid sample id',
          HttpStatusCode.BAD_REQUEST
        );

      const sample = await Artist.findOne({
        _id: sampleId,
        isDeleted: false,
      });

      if (!sample)
        throw new ThrowError('Artist Not Found', HttpStatusCode.NOT_FOUND);

      sample.status = IStatus.INACTIVE;
      sample.isDeleted = true;
      sample.deletedAt = new Date();
      await sample.save();

      resolve({
        message: `${sample.name} sample was deleted`,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Artist deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To restore a sample
 * @param sampleId
 * @returns message
 */
export const restoreArtist = (sampleId: IArtist['_id']) => {
  return new Promise<IArtistResponse>(async (resolve, reject) => {
    try {
      if (!sampleId || !isValidObjectId(sampleId))
        throw new ThrowError(
          'Provide valid sample id',
          HttpStatusCode.BAD_REQUEST
        );

      const sample = await Artist.findOne(
        {
          _id: sampleId,
          isDeleted: true,
        },
        { name: 1, status: 1, createdAt: 1 }
      );

      if (!sample)
        throw new ThrowError('Artist not found', HttpStatusCode.NOT_FOUND);

      sample.status = IStatus.ACTIVE;
      sample.isDeleted = false;
      sample.deletedAt = undefined;

      const editedsample = await sample.save();

      resolve({
        message: `${editedsample.name} sample was restored`,
        results: editedsample,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Artist restore failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To delete a sample parmanently
 * @param sampleId
 * @returns message
 */
export const pDeleteArtist = (sampleId: IArtist['_id']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!sampleId || !isValidObjectId(sampleId))
        throw new ThrowError(
          'Provide valid sample id',
          HttpStatusCode.BAD_REQUEST
        );

      const sample = await Artist.findOne(
        {
          _id: sampleId,
          isDeleted: true,
        },
        { name: 1, status: 1, createdAt: 1 }
      );

      if (!sample)
        throw new ThrowError('Artist not found', HttpStatusCode.NOT_FOUND);

      if (NODE_ENV != 'development')
        throw new ThrowError(
          `In ${NODE_ENV} mode not able to delete permanently!!`,
          HttpStatusCode.FORBIDDEN
        );

      await sample.deleteOne();
      resolve({
        message: `${sample.name} sample was deleted permanently`,
      });
    } catch (error: any) {
      reject({
        message:
          error.message || error.msg || 'Artist permanently deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To delete all sample parmanently
 * @returns message
 */
export const deleteAllArtists = () => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (NODE_ENV != 'development')
        throw new ThrowError(
          `In ${NODE_ENV} mode not able to delete permanently!!`,
          HttpStatusCode.FORBIDDEN
        );

      await Artist.deleteMany({});

      resolve({
        message: `All sample deleted permanently`,
      });
    } catch (error: any) {
      reject({
        message:
          error.message || error.msg || 'Artist permanently deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};
