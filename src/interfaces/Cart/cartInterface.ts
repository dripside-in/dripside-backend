import { IDefault, IResponseData, IStatus } from '../index';

export interface ICart extends IDefault {
  code: string;
  name: string;
  status: IStatus;
}

export interface IGetCartsResponse extends IResponseData {
  currentPage: number;
  results: ICart[];
  latestCount: number;
  totalCount: number;
  totalPages: number;
}

export interface ICartResponse extends IResponseData {
  results: ICart;
}
