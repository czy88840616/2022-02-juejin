/**
 * 鉴权和校验
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
  
  callback(req, res) {
    for (const route of this.routes) {
      if (matchRoute(req)) {
        route.routerHandler(req, res);
      }
    }
  }
}


class Arceus {

  server;
  middlewares = [];

  use(middleware) {
    this.middlewares.push(middleware);
  }

  listen(port: number) {
    let index = -1;
    const self = this;

    function callback(req, res) {
      return function dispatch(this: Arceus, pos: number, err?: Error | null) {
        const handler = this.middlewares[pos];
        index = pos;

        function next(err?: Error | null) {
          if (pos < index) {
            throw new TypeError('`next()` called multiple times');
          }
          return dispatch.bind(self, pos + 1, err);
        }

        if (err || index === this.middlewares.length) {
          return next(err);
        }

        try {
          return handler(req, res, next);
        } catch (err) {
          if (index > pos) throw err;
          return next(err);
        }
      }
    }

    this.server = http.createServer((req, res) => {
      return callback(req, res).bind(this, 0);
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
    getUser(query.id).then(user => {
      res.end(user);
    });
  } else {
    res.end(JSON.stringify({
      success: false,
      message: 'error'
    }))
  }
  
})

router.post('/', permissionCheck, (req, res) => {
  const body = parseBody(req) as User;

  // 校验的逻辑
  if (validateUser(body)) {
    // 正常的逻辑
    updateUser(body.id, body).then(user => {
      res.end(JSON.stringify({
        success: true,
        data: user,
      }));
    });
  } else {
    res.end(JSON.stringify({
      success: false,
      message: 'error'
    }))
  }
  
})

app.use((req, res, next) => {
  getUserFromSession(req);
  next();
});

app.use(router.callback);

app.listen(3000);