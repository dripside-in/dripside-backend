import { ErrorResponse } from '../classes';
import { verifyToken } from '../utils';
import { adminHelper, userHelper } from '../helpers';
import { config } from '../config';
import { ApiParams } from '../types';
import { IAccountStatus } from '../interfaces';
import mongoose from 'mongoose';

const { SERVER_ACCESS_TOKEN_KEY } = config.SERVER;

export const superAdminAccess: ApiParams = async (req, res, next) => {
  try {
    if (
      !req.headers.authorization ||
      !req.headers.authorization?.includes('Bearer')
    ) {
      throw new ErrorResponse('Unathenticated', 403);
    }
    const authorizationToken = req.headers.authorization.split(' ')[1];
    const cookieToken = req.cookies[SERVER_ACCESS_TOKEN_KEY];

    if (
      !authorizationToken ||
      !cookieToken ||
      authorizationToken != cookieToken
    ) {
      throw new ErrorResponse('Unathenticated', 403);
    }

    const decoded = await verifyToken(authorizationToken, 'AccessToken');

    if (decoded.role === 'SuperAdmin' || decoded.role === 'DeveloperAdmin') {
      const admin = await (
        await adminHelper.checkAdminStatus(decoded.id, [IAccountStatus.ACTIVE])
      ).results;

      req.client = {
        id: admin.id,
        name: admin.name,
        status: admin.status,
        role: admin.role,
      };
      return next();
    } else {
      return next(new ErrorResponse('Unathenticated', 403));
    }
  } catch (error: any) {
    return next(new ErrorResponse('Unathenticated', error.statusCode || 403));
  }
};

export const adminAccess: ApiParams = async (req, res, next) => {
  try {
    if (
      !req.headers.authorization ||
      !req.headers.authorization?.includes('Bearer')
    ) {
      throw new ErrorResponse('Unathenticated', 403);
    }
    const authorizationToken = req.headers.authorization.split(' ')[1];
    const cookieToken = req.cookies[SERVER_ACCESS_TOKEN_KEY];

    if (
      !authorizationToken ||
      !cookieToken ||
      authorizationToken != cookieToken
    ) {
      throw new ErrorResponse('Unathenticated', 403);
    }

    const decoded = await verifyToken(authorizationToken, 'AccessToken');

    if (
      decoded.role === 'SuperAdmin' ||
      decoded.role === 'DeveloperAdmin' ||
      decoded.role === 'Admin'
    ) {
      const admin = await (
        await adminHelper.checkAdminStatus(decoded.id, [IAccountStatus.ACTIVE])
      ).results;

      req.client = {
        id: admin.id,
        name: admin.name,
        status: admin.status,
        role: admin.role,
      };
      return next();
    } else {
      return next(new ErrorResponse('Unathenticated', 403));
    }
  } catch (error: any) {
    return next(new ErrorResponse('Unathenticated', error.statusCode || 403));
  }
};

export const userAccess: ApiParams = async (req, res, next) => {
  try {
    if (
      !req.headers.authorization ||
      !req.headers.authorization?.includes('Bearer')
    ) {
      throw new ErrorResponse('Unathenticated', 403);
    }
    const authorizationToken = req.headers.authorization.split(' ')[1];
    const cookieToken = req.cookies[SERVER_ACCESS_TOKEN_KEY];

    if (
      !authorizationToken ||
      !cookieToken ||
      authorizationToken != cookieToken
    ) {
      throw new ErrorResponse('Unathenticated', 403);
    }

    const decoded = await verifyToken(authorizationToken, 'AccessToken');

    if (decoded.role === 'User') {
      const user = await (
        await userHelper.checkUserStatus(decoded.id, [IAccountStatus.ACTIVE])
      ).results;

      req.client = {
        id: user.id,
        name: user.name,
        status: user.status,
        role: user.role,
      };
      return next();
    } else {
      return next(new ErrorResponse('Unathenticated', 403));
    }
  } catch (error: any) {
    return next(new ErrorResponse('Unathenticated', error.statusCode || 403));
  }
};

export const allRoleAccess: ApiParams = async (req, res, next) => {
  try {
    if (
      !req.headers.authorization ||
      !req.headers.authorization?.includes('Bearer')
    ) {
      throw new ErrorResponse('Unathenticated', 403);
    }
    const authorizationToken = req.headers.authorization.split(' ')[1];
    const cookieToken = req.cookies[SERVER_ACCESS_TOKEN_KEY];

    if (
      !authorizationToken ||
      !cookieToken ||
      authorizationToken != cookieToken
    ) {
      throw new ErrorResponse('Unathenticated', 403);
    }

    const decoded = await verifyToken(authorizationToken, 'AccessToken');

    if (['SuperAdmin', 'DeveloperAdmin', 'Admin'].includes(decoded.role)) {
      const admin = await (
        await adminHelper.checkAdminStatus(decoded.id, [IAccountStatus.ACTIVE])
      ).results;

      req.client = {
        id: admin.id,
        name: admin.name,
        status: admin.status,
        role: admin.role,
      };
      return next();
    } else if (decoded.role === 'User') {
      const user = await (
        await userHelper.checkUserStatus(decoded.id, [IAccountStatus.ACTIVE])
      ).results;

      req.client = {
        id: user.id,
        name: user.name,
        status: user.status,
        role: user.role,
      };
      return next();
    } else {
      return next(new ErrorResponse('Unathenticated', 403));
    }
  } catch (error: any) {
    return next(new ErrorResponse('Unathenticated', error.statusCode || 403));
  }
};

export const guestAccess: ApiParams = async (req, res, next) => {
  try {
    if (
      !req.headers.authorization ||
      !req.headers.authorization?.includes('Bearer')
    ) {
      const guestId = new mongoose.Types.ObjectId();
      req.client = {
        id: guestId.toString(),
        name: 'Guest',
        status: 'Active',
        role: 'Guest',
      };
      return next();
    }
    const authorizationToken = req.headers.authorization.split(' ')[1];
    const cookieToken = req.cookies[SERVER_ACCESS_TOKEN_KEY];
    if (
      !authorizationToken ||
      !cookieToken ||
      authorizationToken != cookieToken
    ) {
      throw new ErrorResponse('Unathenticated', 403);
    }

    const decoded = (await verifyToken(authorizationToken, 'AccessToken'))
      .payload;

    if (['SuperAdmin', 'DeveloperAdmin', 'Admin'].includes(decoded.role)) {
      const admin = await (
        await adminHelper.checkAdminStatus(decoded.id, [IAccountStatus.ACTIVE])
      ).results;

      req.client = {
        id: admin.id,
        name: admin.name,
        status: admin.status,
        role: admin.role,
      };
      return next();
    } else if (decoded.role === 'User') {
      const user = await (
        await userHelper.checkUserStatus(decoded.id, [IAccountStatus.ACTIVE])
      ).results;

      req.client = {
        id: user.id,
        name: user.name,
        status: user.status,
        role: user.role,
      };
      return next();
    } else {
      return next(new ErrorResponse('Unathenticated', 403));
    }
  } catch (error: any) {
    return next(new ErrorResponse('Unathenticated', error.statusCode || 403));
  }
};
