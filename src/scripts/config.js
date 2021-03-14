import { cookie } from './storage/cookie';

export const Config = {
  api: process.env.API_URL || 'https://api.github.com',
  apiStatus: process.env.STATUS_URL || 'https://status.github.com/api/status.json',
  site: process.env.SITE_URL || 'https://github.com',
  id: process.env.OAUTH_CLIENT_ID || 'GITHUB_CLIENT_ID',
  url: process.env.GATEKEEPER_HOST,
  username: cookie.get('username'),
  auth: 'oauth',
};
