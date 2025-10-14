import express from "express";
import fetch from "node-fetch"; // si tu es en Node >=18, tu peux utiliser globalThis.fetch sans l’importer
import setupLogger from "./logger.js";
import { otelContextMiddleware } from './middleware.js';

const logger = setupLogger();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(otelContextMiddleware);

// --- 1️⃣ /hello ---
app.get("/", (req, res) => {
  console.info("Test toto");
  res.json({ 'hello': 'world' });
});

// --- 2️⃣ /proxy ---
app.get("/proxy", async (req, res) => {
  try {
    const response = await fetch("http://demo-app:8080/error");
    console.log("Entering proxy from node");
    const data = await response.json();
    console.log(data)
    res.status(response.status).send(data);
  } catch (err: any) {
    console.error("Erreur lors du proxy :", err);
    res.status(500).json({ error: "Erreur lors de l'appel au proxy", details: err.message });
  }
});

// --- 3️⃣ /error ---
app.get("/error", (req, res, next) => {
  try {
    // Exemple d’erreur : division par 0
    const a = 42;
    const b = 0;
    console.info("Trying to divide");
    if (b === 0) throw new Error("Division par zéro !");
    const result = a / b;
    res.json({ result });
  } catch (err) {
    next(err); // passer l’erreur au middleware global
  }
});

// --- Middleware global de gestion des erreurs ---
app.use((err, req, res, next) => {
  console.error("Erreur capturée :", err.stack);
  res.status(500).json({
    message: err.message,
    stack: err.stack, // ⚠️ à désactiver en production pour ne pas exposer la stack
  });
});

// --- Démarrage du serveur ---
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});

const shutdown = (signal) => {
  process.exit(0);
};

// Interception des signaux possibles (SIGTERM, SIGINT)
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
