export async function createConnection(): Promise<any> {
  // TODO mysql connection
  return {} as {exec: any}
}

export interface User {
  id: string;
  sex: 'male' | 'female';
  age: number;
}

export function parseQuery(url: string): Record<string, string> {
  return {};
}

export function parseBody(req): Record<string, any> {
  return {};
}

export function matchRoute(req): boolean {
  // TODO
  return true;
}

export function getUserFromSession(req) {
  req.user = 'harry';
}

export function getPermission(req, permissionList): boolean {
  // TODO
  return true;
}