/**
 * 业务需求
 */

import * as http from 'http';
import { createConnection, parseQuery, parseBody, User } from './interface';


async function getUser(userId: string): Promise<User> {
  const connection = await createConnection();
  return connection.exec('select * from user where id = ' + userId) as User;
}

async function updateUser(userId: string, user: User): Promise<User> {
  const connection = await createConnection();
  return connection.exec('update user set xxx where id = ' + user.id) as User;
}

const server = http.createServer((req, res) => {

  if (req.method === 'GET') {
    const query = parseQuery(req.url);
    getUser(query.id).then(user => {
      res.end(user);
    });
  }

  if (req.method === 'POST') {
    const body = parseBody(req) as User;
    updateUser(body.id, body).then(user => {
      res.end(JSON.stringify({
        success: true,
        data: user,
      }));
    });
  }

  // TODO
  
});

server.listen(3000);