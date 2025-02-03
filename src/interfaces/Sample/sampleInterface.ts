import { IDefault, IResponseData, IStatus } from '../index';

export interface ISample extends IDefault {
  code: string;
  name: string;
  status: IStatus;
}

export interface IGetSamplesResponse extends IResponseData {
  currentPage: number;
  results: ISample[];
  latestCount: number;
  totalCount: number;
  totalPages: number;
}

export interface ISampleResponse extends IResponseData {
  results: ISample;
}
