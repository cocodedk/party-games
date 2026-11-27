import { LOCALHOST } from '../web/shared/constants.js';

/** The URL players reach the server on: PUBLIC_URL, else the first LAN IPv4 address, else localhost. */
export function baseUrl(env, interfaces, port) {
  if (env.PUBLIC_URL) return env.PUBLIC_URL.replace(/\/+$/, '');
  const lan = Object.values(interfaces).flat().find((a) => a.family === 'IPv4' && !a.internal);
  const host = lan ? lan.address : LOCALHOST;
  return port ? `http://${host}:${port}` : `http://${host}`;
}
