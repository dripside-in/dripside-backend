import { IDefault, IResponseData, IStatus } from '../index';


export interface IVerificationDetails {
  adhaarCard?: string; // or use a more specific type depending on the actual data
  socialMediaUrls?: string[];
  panCard?: string; // or use a more specific type depending on the actual data
  bankDetails?: string; // or use a more specific type depending on the actual data
}

export interface IArtist extends IDefault {
  code: string;
  name: string;
  status: IStatus;
  verificationDocuments: IVerificationDetails;
}

export interface IGetArtistsResponse extends IResponseData {
  currentPage: number;
  results: IArtist[];
  latestCount: number;
  totalCount: number;
  totalPages: number;
}

export interface IArtistResponse extends IResponseData {
  results: IArtist;
}
