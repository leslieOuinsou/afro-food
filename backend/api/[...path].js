import { app, connectDB } from '../server.js';

export default async function handler(req, res) {
  if (req.method !== 'OPTIONS') {
    await connectDB();
  }
  return app(req, res);
}
