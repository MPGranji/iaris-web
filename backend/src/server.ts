// Local development server. On Vercel, api/index.ts imports the app directly.
import app from './app';
import { env, hasDatabase } from './config/env';

app.listen(env.port, () => {
  console.log(`IARIS API → http://localhost:${env.port}/api  (data: ${hasDatabase ? 'PostgreSQL' : 'static content'})`);
});
