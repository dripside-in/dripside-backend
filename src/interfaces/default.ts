import { Request } from 'express';
import { Document } from 'mongoose';
import { IRoles } from '../types';
import { IUser } from './User/userInterface';

export interface IRequest extends Request {
  files?: any;
  client?: {
    id: Document['_id'];
    name: string;
    role: IRoles;
    status: string;
  };
  query: {
    [name: string]: string;
  };
}

export enum IAccountStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  BLOCKED = 'Blocked',
}

export enum IStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NON_AUTHORITATIVE_INFORMATION = 203,
  NO_CONTENT = 204,
  PERMANENT_REDIRECT = 301,
  TEMPORARY_REDIRECT = 302,
  NOT_MODIFIED = 304,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  INTERNAL_SERVER = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVER_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  NETWORD_TIMEOUT = 599,
}

export interface IDefault extends Document {
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IResponseData {
  message: string;
}

export interface ILoginResponse extends IResponseData {
  results: { accessToken: string; refreshToken: string, user?: IUser };
}

export interface IOtpVerifyResponse extends IResponseData {
  results: { verified: boolean; token?: string };
}

export interface ICheckUsername extends IResponseData {
  available: boolean;
}

export interface IPaginationResponseData extends IResponseData {
  results: object[];
  page: number;
  totalCount: number;
  totalPages: number;
}
