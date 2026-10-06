import { app, connectDB } from '../server.js';

export default async function handler(req, res) {
  // Preflight : ne pas attendre PostgreSQL (sinon timeout / erreur sans headers CORS côté edge)
  if (req.method !== 'OPTIONS') {
    await connectDB();
  }
  return app(req, res);
}
