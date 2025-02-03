/* Installed Imported Modules */
import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

/* Custom Imported Modules */
import { db, config } from './config';
import { logMiddleware, errorHandler } from './middlewares';
import { HttpStatusCode } from './interfaces';
import v1Router from './routers/v1Router';

/* Config Variables */
const app = express();
const {
  DOCUMENTATION_REDIRECTION,
  DOCUMENTATION_URL,
  SERVER_VIEWS_PATH,
  SERVER_NODE_ENV,
  SERVER_API_LOG_STATUS,
} = config.SERVER;
const { CLIENT_REDIRECTION, CLIENT_DOMAIN } = config.CLIENT;

/* Middlewares */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: ['*', 'http://localhost:3000'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  })
);

/* IF MONGOOSE connection */
db.connect();

/* All Api Logs */
if (SERVER_NODE_ENV === 'development' || SERVER_API_LOG_STATUS === 'ENABLE') {
  app.use(logMiddleware);
}

/* Base Route */
app.get('/', (req: Request, res: Response) => {
  if (CLIENT_REDIRECTION === 'YES') {
    return res.redirect(HttpStatusCode.PERMANENT_REDIRECT, CLIENT_DOMAIN);
  }
  res.status(HttpStatusCode.OK).sendFile(SERVER_VIEWS_PATH + 'welcome.html');
});

/* Routes */
app.use('/api/v1', v1Router);

/* Documentation Route */
// app.get('/api-docs', (req: Request, res: Response) => {
//   if (DOCUMENTATION_REDIRECTION === 'YES' && DOCUMENTATION_URL) {
//     return res.redirect(HttpStatusCode.PERMANENT_REDIRECT, DOCUMENTATION_URL);
//   }
//   res.status(HttpStatusCode.NOT_FOUND).sendFile(SERVER_VIEWS_PATH + '404.html');
// });

const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');


const currentPath = process.cwd();
const userSwaggerPath = path.join(currentPath,'src', 'docs', 'user-swagger.yaml');
const artistSwaggerPath  = path.join(currentPath,'src', 'docs', 'artist-swagger.yaml');

const userSwaggerDocument  = YAML.load(userSwaggerPath);
const artistSwaggerDocument   = YAML.load(artistSwaggerPath);

const mergedSwaggerDocument = {
  ...userSwaggerDocument,
  paths: {
    ...userSwaggerDocument.paths,
    ...artistSwaggerDocument.paths
  }
};




app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(mergedSwaggerDocument));


/* 404 Route */
app.use('*', (req: Request, res: Response) => {
  res.status(HttpStatusCode.NOT_FOUND).sendFile(SERVER_VIEWS_PATH + '404.html');
});

/* Error Handler */
app.use(errorHandler);

export default app;
