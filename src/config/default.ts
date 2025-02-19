import dotenv from 'dotenv';
import path from 'path';

// Root Path
const SERVER_ROOT_PATH = path.join(__dirname, '../../');

const NODE_ENV = process.env.NODE_ENV;
const ENV_CONFIG =
  typeof NODE_ENV === 'string'
    ? { path: SERVER_ROOT_PATH + '.env.' + NODE_ENV }
    : {};

dotenv.config(ENV_CONFIG);

// App
const APP_NAME = process.env.APP_NAME || 'APP_NAME';
const APP = {
  APP_NAME,
};

// Server Config
const DOTENV_STATE = process.env.DOTENV_STATE || false;
const SERVER_NODE_ENV = process.env.SERVER_NODE_ENV || 'development';
const SERVER_API_LOG_STATUS = process.env.SERVER_API_LOG_STATUS || 'DISABLE';
const SERVER_DEBUG_LOG_STATUS =
  process.env.SERVER_DEBUG_LOG_STATUS || 'DISABLE';
const SERVER_ERROR_LOG_STATUS =
  process.env.SERVER_ERROR_LOG_STATUS || 'DISABLE';
const SERVER_HOST = process.env.SERVER_HOST || '0.0.0.0';
const SERVER_DOMAIN = process.env.SERVER_DOMAIN || 'localhost';
const SERVER_PORT = process.env.SERVER_PORT || 4000;

const SERVER_ACCESS_TOKEN_KEY =
  process.env.SERVER_ACCESS_TOKEN_KEY || 'AccessToken';
const SERVER_ACCESS_SESSION_KEY =
  process.env.SERVER_ACCESS_SESSION_KEY || 'AccessSession';
const SERVER_ACCESS_TOKEN_EXPIRE =
  process.env.SERVER_ACCESS_TOKEN_EXPIRE || '86400000'; // 1day
const SERVER_REFRESH_TOKEN_KEY =
  process.env.SERVER_REFRESH_TOKEN_KEY || 'RefreshToken';
const SERVER_REFRESH_SESSION_KEY =
  process.env.SERVER_REFRESH_SESSION_KEY || 'RefreshSession';
const SERVER_REFRESH_TOKEN_EXPIRE =
  process.env.SERVER_REFRESH_TOKEN_EXPIRE || '31557600000'; // 1yr

const SERVER_UPLOADS_PATH = SERVER_ROOT_PATH + 'public/uploads/';
const SERVER_VIEWS_PATH = SERVER_ROOT_PATH + 'public/views/';
const SERVER_IMAGES_PATH = SERVER_ROOT_PATH + 'public/images/';

const DOCUMENTATION_REDIRECTION = process.env.DOCUMENTATION_REDIRECTION || 'NO';
const DOCUMENTATION_URL = process.env.DOCUMENTATION_URL;

const SERVER = {
  DOTENV_STATE,
  SERVER_NODE_ENV,
  SERVER_API_LOG_STATUS,
  SERVER_DEBUG_LOG_STATUS,
  SERVER_ERROR_LOG_STATUS,
  SERVER_HOST,
  SERVER_DOMAIN,
  SERVER_PORT,
  SERVER_ACCESS_TOKEN_KEY,
  SERVER_ACCESS_SESSION_KEY,
  SERVER_ACCESS_TOKEN_EXPIRE,
  SERVER_REFRESH_TOKEN_KEY,
  SERVER_REFRESH_SESSION_KEY,
  SERVER_REFRESH_TOKEN_EXPIRE,
  SERVER_ROOT_PATH,
  SERVER_UPLOADS_PATH,
  SERVER_VIEWS_PATH,
  SERVER_IMAGES_PATH,
  DOCUMENTATION_URL,
  DOCUMENTATION_REDIRECTION,
};

// Client Config
const CLIENT_REDIRECTION = process.env.CLIENT_REDIRECTION || 'NO';
const CLIENT_HOST = process.env.CLIENT_HOST || '0.0.0.0';
const CLIENT_DOMAIN = process.env.CLIENT_DOMAIN || 'localhost';
const CLIENT_PORT = process.env.CLIENT_PORT || 3000;
const CLIENT_ADMIN_HOST = process.env.CLIENT_ADMIN_HOST || '0.0.0.0';
const CLIENT_ADMIN_DOMAIN = process.env.CLIENT_ADMIN_DOMAIN || 'localhost';
const CLIENT_ADMIN_PORT = process.env.CLIENT_ADMIN_PORT || 'localhost';

const CLIENT = {
  CLIENT_REDIRECTION,
  CLIENT_HOST,
  CLIENT_DOMAIN,
  CLIENT_PORT,
  CLIENT_ADMIN_HOST,
  CLIENT_ADMIN_DOMAIN,
  CLIENT_ADMIN_PORT,
};

// Moongose config
const MONGO_USER = process.env.MONGO_USER || 'MONGO_USER';
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || 'MONGO_PASSWORD';
const MONGO_HOST = process.env.MONGO_HOST || 'MONGO_HOST';
const MONGO_PORT = process.env.MONGO_PORT || 'MONGO_PORT';
const MONGO_DATABASE = process.env.MONGO_DATABASE || 'MONGO_DATABASENAME';
const MONGO_SRV = process.env.MONGO_SRV || 'NO';

const MONGO = {
  MONGO_USER,
  MONGO_HOST,
  MONGO_PASSWORD,
  MONGO_DATABASE,
  MONGO_PORT,
  MONGO_SRV,
};

/* Mongo Collections */
const MONGO_COLLECTIONS = {
  ADMINS: 'Admins',
  USERS: 'Users',
  SAMPLES: 'Samples',
  ARTISTS : "Artists",
  CATEGORY : "Category",
  CART : "Cart"
};

const JWT_ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'secret';
const JWT_ACCESS_TOKEN__SECRET =
  process.env.JWT_ACCESS_TOKEN__SECRET || JWT_ACCESS_TOKEN_SECRET;
const JWT_ACCESS_TOKEN_EXPIRE = process.env.JWT_ACCESS_TOKEN_EXPIRE || '1y';
const JWT_REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_TOKEN_SECRET || 'secret';
const JWT_REFRESH_TOKEN_EXPIRE = process.env.JWT_REFRESH_TOKEN_EXPIRE || '1y';
const JWT_ACTIVATION_TOKEN_SECRET =
  process.env.JWT_ACTIVATION_TOKEN_SECRET || 'secret';
const JWT_ACTIVATION_TOKEN_EXPIRE =
  process.env.JWT_ACTIVATION_TOKEN_EXPIRE || '1y';
const JWT_RESET_TOKEN_SECRET = process.env.JWT_RESET_TOKEN_SECRET || 'secret';
const JWT_RESET_TOKEN_EXPIRE = process.env.JWT_RESET_TOKEN_EXPIRE || '1y';
const JWT_TOKEN_ISSUER = process.env.JWT_TOKEN_ISSUER || '1y';

const JWT = {
  JWT_ACCESS_TOKEN_SECRET,
  JWT_ACCESS_TOKEN__SECRET,
  JWT_ACCESS_TOKEN_EXPIRE,
  JWT_REFRESH_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_EXPIRE,
  JWT_ACTIVATION_TOKEN_SECRET,
  JWT_ACTIVATION_TOKEN_EXPIRE,
  JWT_RESET_TOKEN_SECRET,
  JWT_RESET_TOKEN_EXPIRE,
  JWT_TOKEN_ISSUER,
};

const OTP_EXPIRE_TIME = process.env.OTP_EXPIRE_TIME || '5'; // By minutes
const MIN_OTP_FAILED_ATTEMPT = process.env.MIN_OTP_FAILED_ATTEMPT || '5'; // By Minutes
const OTP_FAILED_RESET_TIME = process.env.OTP_FAILED_RESET_TIME || '5'; // By Hours

const OTP_SETTINGS = {
  OTP_EXPIRE_TIME: parseInt(OTP_EXPIRE_TIME),
  MIN_OTP_FAILED_ATTEMPT: parseInt(MIN_OTP_FAILED_ATTEMPT),
  OTP_FAILED_RESET_TIME: parseInt(OTP_FAILED_RESET_TIME),
};

const SETTINGS = {
  OTP_SETTINGS,
};

const config = {
  MONGO,
  SERVER,
  CLIENT,
  APP,
  JWT,
  MONGO_COLLECTIONS,
  SETTINGS,
};

export default config;
