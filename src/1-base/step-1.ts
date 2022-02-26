/**
 * 基础
 */

import * as http from 'http';

const server = http.createServer((req, res) => {
  res.end('hello world');
});

server.listen(3000);