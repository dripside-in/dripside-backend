import { Document } from 'mongoose';
import { IDefault, IResponseData, IAccountStatus } from '../index';

export enum UserRoles {
  USER = "User"
}

export interface IUser extends IDefault, Document {
  code: string;
  name: string;
  username: string;
  phone: number;
  email: string;
  password: string;
  role: UserRoles;
  status: IAccountStatus;
  otp: string;
  otpSentedAt?: Date;
  failedOtpVerifyAt?: Date;
  failedOtpAttempt: number;
  lastUsed?: Date;
  lastSync?: Date;
  usedIPaddress: string[];
  lastPassword?: string;
  verified?: Boolean;
  verifiedAt?: Date;
  resetPasswordAccess?: Boolean;
  passwordChanged?: Boolean;
  passwordChangedAt?: Date;
}

export interface IGetUsersResponse extends IResponseData {
  currentPage: number;
  results: IUser[];
  latestCount: number;
  totalCount: number;
  totalPages: number;
}

export interface IUserResponse extends IResponseData {
  results: IUser;
}
