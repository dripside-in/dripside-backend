import { IDefault, IResponseData, IStatus } from '../index';

export interface ICategory extends IDefault {
  code: string;
  name: string;
  image: string;
  status: IStatus;
}

export interface IGetCategorysResponse extends IResponseData {
  currentPage: number;
  results: ICategory[];
  latestCount: number;
  totalCount: number;
  totalPages: number;
}

export interface ICategoryResponse extends IResponseData {
  results: ICategory;
}
