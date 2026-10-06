-- Numéro de commande généré par séquence (atomique, sans collision en cas de commandes simultanées)
CREATE SEQUENCE IF NOT EXISTS "commande_numero_seq" START 1;
SELECT setval('commande_numero_seq', (SELECT COUNT(*) + 1 FROM "commandes"), false);
