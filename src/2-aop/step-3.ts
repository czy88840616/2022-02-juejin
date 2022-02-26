/**
 * 返回和错误处理
 */

import * as http from 'http';
import { createConnection, parseQuery, parseBody, User, matchRoute, getPermission, getUserFromSession } from './interface';

class Router {

  private routes = [];

  get(routerPath: string, ...middlewares: Function[]) {
    const routerHandler = middlewares.pop();

    this.routes.push({
      method: 'GET',
      routerPath,
      routerHandler,
      middlewares,
    })
  }

  post(routerPath: string, ...middlewares: Function[]) {
    const routerHandler = middlewares.pop();

    this.routes.push({
      method: 'POST',
      routerPath,
      routerHandler,
      middlewares
    })
  }
  
  callback(req, res, next) {
    for (const route of this.routes) {
      if (matchRoute(req)) {
        const fn = route.routerHandler(req, res)
        Promise.resolve(fn).then(data => {
          next(null, data);
        });
      }
    }
  }
}

class Arceus {

  server;
  middlewares = [];
  errorHandler;
  resultHandlers = [];

  use(middleware) {
    this.middlewares.push(middleware);
  }

  useErrorHandler(errorHandler) {
    this.errorHandler = errorHandler;
  }

  useResultHandler(resultHandler) {
    this.resultHandlers.push(resultHandler);
  }

  listen(port: number) {
    let index = -1;
    const self = this;

    function callback(req, res) {
      return function dispatch(this: Arceus, pos: number, err?: Error | null, result?: any) {

        if (err) {
          throw err;;
        }

        const handler = this.middlewares[pos];
        index = pos;

        function next(err?: Error | null, result?) {
          if (pos < index) {
            throw new TypeError('`next()` called multiple times');
          }
          return dispatch.bind(self, pos + 1, err, result);
        }

        if (err || index === this.middlewares.length) {
          return next(err);
        }

        try {
          result = handler(req, res, next);
          next(null, result);
        } catch (err) {
          if (index > pos) throw err;
          return next(err);
        }
      }
    }

    this.server = http.createServer((req, res) => {
      try {
        let result = callback(req, res).bind(this, 0);
        for (const resultHandler of this.resultHandlers) {
          result = resultHandler(result, req, res);
        }
        res.end(typeof result === 'object' ? JSON.stringify(result) : result);
      } catch(err) {
        if (this.errorHandler) {
          this.errorHandler(err, req, res);
        } else {
          res.statusCode = 500;
          res.end('Internal Error');
        }
      }
    });
    this.server.listen(port);
  }
}

async function getUser(userId: string): Promise<User> {
  const connection = await createConnection();
  return connection.exec('select * from user where id = ' + userId) as User;
}

async function updateUser(userId: string, user: User): Promise<User> {
  const connection = await createConnection();
  return connection.exec('update user set xxx where id = ' + user.id) as User;
}

function validateId(id: string): boolean {
  // TODO
  return true;
}

function validateUser(user: User): boolean {
  // TODO
  return true;
}

const permissionList = {
  admin: {
    allow: '*',
  },
  development: {
    allow: [
      '/api/*'
    ],
  },
  user: {
    allow: [
      '/'
    ],
  }
}

function permissionCheck(req, res, next) {
  if (getPermission(req, permissionList)) {
    next();
  } else {
    next(new Error('check fail'));
  }
}

const app = new Arceus();
const router = new Router();

router.get('/', permissionCheck, (req, res) => {
  const query = parseQuery(req.url);

  // 校验的逻辑
  if (validateId(query.id)) {
    // 正常的逻辑
    return getUser(query.id);
  } else {
    return {
      success: false,
      message: 'error'
    };
  }
  
})

router.post('/', permissionCheck, (req, res) => {
  const body = parseBody(req) as User;

  // 校验的逻辑
  if (validateUser(body)) {
    // 正常的逻辑
    updateUser(body.id, body).then(user => {
      return {
        success: true,
        data: user,
      };
    });
  } else {
    return {
      success: false,
      message: 'error'
    };
  }
  
})

app.use((req, res, next) => {
  getUserFromSession(req);
  next();
});

app.use(router.callback);

// 返回处理

app.useResultHandler((value, req, res) => {
  if (typeof value === 'string') {
    return {
      success: true,
      data: value,
    }
  }
});

// 错误兜底
app.useErrorHandler((err, req, res) => {
  if (err.name === 'xxxxError' && req.path === '/api') {
    res.end(JSON.stringify({
      success: false,
      message: err.message,
    }));
  }
});

app.listen(3000);