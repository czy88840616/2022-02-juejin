/**
 * 框架雏形
 */

import * as http from 'http';
import { createConnection, parseQuery, parseBody, User, matchRoute } from './interface';


async function getUser(userId: string): Promise<User> {
  const connection = await createConnection();
  return connection.exec('select * from user where id = ' + userId) as User;
}

async function updateUser(userId: string, user: User): Promise<User> {
  const connection = await createConnection();
  return connection.exec('update user set xxx where id = ' + user.id) as User;
}

class Router {

  private routes = [];

  get(routerPath: string, routerHandler: Function) {
    this.routes.push({
      method: 'GET',
      routerPath,
      routerHandler,
    })
  }

  post(routerPath: string, routerHandler: Function) {
    this.routes.push({
      method: 'POST',
      routerPath,
      routerHandler,
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
    this.server = http.createServer((req, res) => {
      for (const middleware of this.middlewares) {
        middleware(req, res);
      }
    
      // TODO
      
    });
    this.server.listen(port);
  }
}

const app = new Arceus();
const router = new Router();

router.get('/', (req, res) => {
  const query = parseQuery(req.url);
  getUser(query.id).then(user => {
    res.end(user);
  });
})

router.post('/', (req, res) => {
  const body = parseBody(req) as User;
  updateUser(body.id, body).then(user => {
    res.end(JSON.stringify({
      success: true,
      data: user,
    }));
  });
})

app.use((req, res) => {
  console.log('hello world', req.url);
});

app.use(router.callback);

app.listen(3000);