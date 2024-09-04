'use strict';
import http from 'http';
import path from 'path';
import Koa from 'koa';
import Colors from 'color-cc';
import mdwBodyParser from 'koa-bodyparser';
import { existsSync, ensureDirSync } from 'fs-extra';
import { Printer, Debugger } from './utils/print';
import { formatOptionsByConfig } from './composites/rc';
import { enableRequireTsFile, loadJS, loadTS } from './composites/loader';
import { relPathToCWD, getRootAbsPath, unixifyPath } from './utils/path';
import mdwCommon from './middlewares/common';
import mdwCors from './middlewares/cors';
import mdwFavicon from './middlewares/favicon';
import mdwHdCache from './middlewares/cache';
import mdwRoutes from './middlewares/routes';
import mdwMock from './middlewares/mock';
import { isPortInUse } from './utils/net';
import type { KoaMiddleware, Loosify, MihawkRC } from './com-types';

/**
 * mihawk
 * @param {Loosify<MihawkRC>} config
 */
export default async function mihawk(config?: Loosify<MihawkRC>) {
  Debugger.log('init config:', config);
  const options = formatOptionsByConfig(config);
  Printer.log('options:', options);
  //
  const {
    host,
    port,
    //
    mockDir,
    mockDirPath: MOCKS_ROOT_PATH, //
    mockDataDirPath,
    //
    logicFileExt,
    isTypesctiptMode,
    tsconfigPath,
    //
    routesFilePath,
  } = options;
  const loadLogicFile = isTypesctiptMode ? loadTS : loadJS;

  // 0.detect port in use
  const isPortAlreadyInUse = await isPortInUse(port);
  if (isPortAlreadyInUse) {
    Printer.error(Colors.yellow(`Port ${port} is already in use`));
    process.exit(1);
    // return;
  }

  // 1.ensure mock data dir exists
  ensureDirSync(mockDataDirPath);

  // 2.detect if support typescript mode
  if (isTypesctiptMode) {
    // 启用 ts 模式
    const tsconfig = require(tsconfigPath) || {};
    enableRequireTsFile(tsconfig);
  }

  // 3.load routes file
  let routes: Record<string, string> = {};
  if (existsSync(routesFilePath)) {
    routes = (await loadLogicFile(routesFilePath)) as Record<string, string>;
    Printer.log(`load routes file: ${relPathToCWD(routesFilePath)}`);
  }

  // 4.load diy middleware if exists
  let diyMiddleware: KoaMiddleware | null = null;
  const diyMiddlewareFilePath = path.resolve(MOCKS_ROOT_PATH, `./middleware.${logicFileExt}`);
  const hasDiyMiddlewareFile = existsSync(diyMiddlewareFilePath);
  if (hasDiyMiddlewareFile) {
    Printer.log(`load diy middleware file: ${relPathToCWD(diyMiddlewareFilePath)}`);
    diyMiddleware = (await loadLogicFile(diyMiddlewareFilePath)) as KoaMiddleware;
  }

  // 5. create koa app (http-server instance)
  const app = new Koa();

  // middleware: favicon
  app.use(mdwFavicon(path.resolve(getRootAbsPath(), './assets/favicon.ico')));

  // middleware: common middleware
  app.use(mdwCommon(options));

  // middleware: cors
  app.use(mdwCors(options));

  // middleware: cache middleware
  app.use(mdwHdCache(options));

  // middleware: body parser
  app.use(mdwBodyParser());

  // middleware: special routes mapping
  app.use(mdwRoutes(routes, options));

  // ★ middleware: diy middleware ★
  app.use(diyMiddleware);

  // middleware: mock middleware
  app.use(mdwMock(options));

  //

  /**
   * server configuration
   */
  const server = http.createServer(app.callback());
  // server-event: error
  server.on('error', function (error: any) {
    if (error.syscall !== 'listen') {
      throw error;
    }
    switch (error.code) {
      case 'EACCES':
        Printer.error(Colors.yellow(`MockServer failed! Port ${port} requires elevated privileges`));
        process.exit(1);
        break;
      case 'EADDRINUSE':
        Printer.error(Colors.yellow(`MockServer failed! Port ${port} is already in use`));
        process.exit(1);
        break;
      default:
        Printer.error(error);
        throw error;
    }
  });
  // server-event: listening
  server.on('listening', function () {
    Printer.log(Colors.green('Start mock-server success!'), `${host}:${port}`);
    Printer.log(`Mock Data directory: ${Colors.gray(unixifyPath(mockDir))}`);
  });

  // start
  server.listen(port);

  //
  return server;
}
