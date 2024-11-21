/**
 * @description: mihawk config
 */
const host = '0.0.0.0';
const port = 9527;

//
export default {
  host,
  port,
  https: false,
  cors: true,
  cache: false,
  watch: true,
  mockDir: 'mocks',
  mockDataFileType: 'json',
  mockLogicFileType: 'ts',
  autoCreateMockLogicFile: true,
  logConfig: null,
  socketConfig: {
    port,
    host,
    secure: false,
    stomps: false,
  },
};
