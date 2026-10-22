// Vercel Serverless Function entry.
// Every request to /api/* is rewritten here (see vercel.json) and handled by the Express app.
import app from '../backend/src/app';

export default app;
