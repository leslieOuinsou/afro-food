import { app, connectDB } from '../server.js';

export default async function handler(req, res) {
  // Connexion DB assurée
  await connectDB();

  // On passe la main à l'app Express qui gère le CORS
  return app(req, res);
}
