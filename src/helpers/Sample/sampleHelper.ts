import { isValidObjectId } from 'mongoose';
import {
  HttpStatusCode,
  IGetSamplesResponse,
  IResponseData,
  ISample,
  ISampleResponse,
  IStatus,
} from '../../interfaces';
import { Sample } from '../../models';
import { IDeleted } from '../../types';
import { ThrowError } from '../../classes';
import { config } from '../../config';

const NODE_ENV = config.SERVER.SERVER_NODE_ENV;

/**
 * To get all samples except deleted samples
 * @returns ISample[]
 */
export const getSamples = (
  timestamp?: string,
  page?: string,
  limit?: string,
  code?: string,
  name?: string,
  status?: IStatus[],
  deleted: IDeleted = 'NO'
) => {
  return new Promise<IGetSamplesResponse>(async (resolve, reject) => {
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

      const samples = await Sample.find(
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

      const totalCount = await Sample.count({
        ...findCondition,
        ...timestampLTEQuery,
      });

      let latestCount = 0;
      if (Object.keys(timestampGTQuery).length > 0) {
        latestCount = await Sample.count({
          ...findCondition,
          ...timestampGTQuery,
        });
      }

      resolve({
        message: samples.length > 0 ? 'Samples fetched' : 'Sample is empty',
        currentPage: PAGE,
        results: samples,
        latestCount,
        totalCount,
        totalPages: Math.ceil(totalCount / LIMIT),
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Sample fetching failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To get a particular sample by id
 * @param sampleId
 * @returns ISample
 */
export const getSampleById = (sampleId: ISample['_id'], role?: string) => {
  return new Promise<ISampleResponse>(async (resolve, reject) => {
    try {
      if (!sampleId || !isValidObjectId(sampleId)) {
        return reject({
          message: !sampleId ? 'Provide sampleId' : 'sampleId not Valid',
          statusCode: HttpStatusCode.BAD_REQUEST,
        });
      }

      const deleteQuery = !['SuperSample', 'DeveloperSample'].includes(
        role ?? ''
      )
        ? { isDeleted: false }
        : {};
      const deleteProjection = ['SuperSample', 'DeveloperSample'].includes(
        role ?? ''
      )
        ? { isDeleted: 1, deletedAt: 1 }
        : {};

      const sample = await Sample.findOne(
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
          message: 'Sample not found',
          statusCode: HttpStatusCode.NOT_FOUND,
        });
      }
      resolve({
        message: 'Sample details fetched',
        results: sample,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Sample fetching failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To add a new sample
 * @param newSample { ISample }
 * @returns ISample
 */
export const addSample = (newSample: ISample) => {
  return new Promise<ISampleResponse>(async (resolve, reject) => {
    try {
      if (!newSample.name) {
        return reject({
          message: 'Please provide valid name, name, phone and email.',
          statusCode: HttpStatusCode.BAD_REQUEST,
        });
      }

      const isSampleFound: ISample[] = await Sample.find({
        $or: [{ name: newSample.name }],
      });

      if (isSampleFound.length > 0) {
        return reject({
          message: 'Name already exist',
        });
      }

      const sample = new Sample({
        name: newSample.name,
      });

      const editedSample = await sample.save();

      resolve({
        message: `${editedSample.name}'s account created successfully`,
        results: editedSample,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Sample creation failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.name,
      });
    }
  });
};

/**
 * To update a particular sample details
 * @param sampleId
 * @param newSample
 * @returns ISample
 */
export const editSample = (sampleId: ISample['_id'], data: ISample) => {
  return new Promise<ISampleResponse>(async (resolve, reject) => {
    try {
      if (!sampleId || !isValidObjectId(sampleId))
        throw new ThrowError(
          'Provide vaild sample id',
          HttpStatusCode.BAD_REQUEST
        );

      const sample = await Sample.findById(sampleId, {
        code: 1,
        name: 1,
        status: 1,
        createdAt: 1,
      });

      if (!sample)
        throw new ThrowError('Sample not found', HttpStatusCode.NOT_FOUND);

      const { name } = data;

      // New name is already exist from another sample then
      if (name && sample.name != name) {
        const sampleExists = await Sample.findOne({ name });
        if (sampleExists)
          throw new ThrowError(
            'Email already exist for other sample',
            HttpStatusCode.BAD_REQUEST
          );
      }

      sample.name = name || sample.name;

      const editedSample = await sample.save();

      resolve({
        message: `Sample edited successfully`,
        results: editedSample,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Sample editing failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};

/**
 * To change a particular sample's status
 * @param sampleId
 * @returns ISample
 */
export const changeSampleStatus = (sampleId: ISample['_id']) => {
  return new Promise<ISampleResponse>(async (resolve, reject) => {
    try {
      if (!sampleId || !isValidObjectId(sampleId))
        throw new ThrowError(
          'Provide vaild sample id and status',
          HttpStatusCode.BAD_REQUEST
        );

      const sample = await Sample.findById(sampleId, {
        code: 1,
        name: 1,
        status: 1,
        createdAt: 1,
      });

      if (!sample)
        throw new ThrowError('Sample not found', HttpStatusCode.NOT_FOUND);

      sample.status =
        sample.status === IStatus.ACTIVE ? IStatus.INACTIVE : IStatus.ACTIVE;
      const editedSample = await sample.save();

      resolve({
        message: `${editedSample.name} status changed to ${editedSample.status}`,
        results: editedSample,
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
export const deleteSample = (sampleId: ISample['_id']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!sampleId || !isValidObjectId(sampleId))
        throw new ThrowError(
          'Provide valid sample id',
          HttpStatusCode.BAD_REQUEST
        );

      const sample = await Sample.findOne({
        _id: sampleId,
        isDeleted: false,
      });

      if (!sample)
        throw new ThrowError('Sample Not Found', HttpStatusCode.NOT_FOUND);

      sample.status = IStatus.INACTIVE;
      sample.isDeleted = true;
      sample.deletedAt = new Date();
      await sample.save();

      resolve({
        message: `${sample.name} sample was deleted`,
      });
    } catch (error: any) {
      reject({
        message: error.message || error.msg || 'Sample deleting failed',
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
export const restoreSample = (sampleId: ISample['_id']) => {
  return new Promise<ISampleResponse>(async (resolve, reject) => {
    try {
      if (!sampleId || !isValidObjectId(sampleId))
        throw new ThrowError(
          'Provide valid sample id',
          HttpStatusCode.BAD_REQUEST
        );

      const sample = await Sample.findOne(
        {
          _id: sampleId,
          isDeleted: true,
        },
        { name: 1, status: 1, createdAt: 1 }
      );

      if (!sample)
        throw new ThrowError('Sample not found', HttpStatusCode.NOT_FOUND);

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
        message: error.message || error.msg || 'Sample restore failed',
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
export const pDeleteSample = (sampleId: ISample['_id']) => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (!sampleId || !isValidObjectId(sampleId))
        throw new ThrowError(
          'Provide valid sample id',
          HttpStatusCode.BAD_REQUEST
        );

      const sample = await Sample.findOne(
        {
          _id: sampleId,
          isDeleted: true,
        },
        { name: 1, status: 1, createdAt: 1 }
      );

      if (!sample)
        throw new ThrowError('Sample not found', HttpStatusCode.NOT_FOUND);

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
          error.message || error.msg || 'Sample permanently deleting failed',
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
export const deleteAllSamples = () => {
  return new Promise<IResponseData>(async (resolve, reject) => {
    try {
      if (NODE_ENV != 'development')
        throw new ThrowError(
          `In ${NODE_ENV} mode not able to delete permanently!!`,
          HttpStatusCode.FORBIDDEN
        );

      await Sample.deleteMany({});

      resolve({
        message: `All sample deleted permanently`,
      });
    } catch (error: any) {
      reject({
        message:
          error.message || error.msg || 'Sample permanently deleting failed',
        statusCode: error.statusCode || HttpStatusCode.INTERNAL_SERVER,
        code: error.code || error.names,
      });
    }
  });
};
