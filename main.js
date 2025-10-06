import express from "express";
import fetch from "node-fetch"; // si tu es en Node >=18, tu peux utiliser globalThis.fetch sans l’importer

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1️⃣ /hello ---
app.get("/", (req, res) => {
  res.send("Hello World");
});

// --- 2️⃣ /proxy ---
app.get("/proxy", async (req, res) => {
  try {
    const response = await fetch("http://127.0.0.1:8080/proxy");
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (err) {
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
