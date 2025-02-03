/* Imported Modules */
import { Response, NextFunction } from 'express';
import { IAdmin, IRequest, IUser } from '../interfaces';

/* Custom Types */
export type ApiParams = (
  request: IRequest,
  response: Response,
  next: NextFunction
) => void;

export type LoggerParams = (
  namespace: string,
  message: string,
  additional?: object | string
) => void;

export type IDeleted = 'YES' | 'NO' | 'BOTH';

export type IRoles = 'Guest' | IAdmin['role'] | IUser['role'];
