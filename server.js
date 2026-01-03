import express from "express";
import cors from "cors";
import fetch from "node-fetch";

import { TASK_1, TASK_2, TASK_3 } from "./subjects.js";

const app = express();
app.use(cors());
app.use(express.json());

// ==========================
// OUTIL : choisir au hasard
// ==========================
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// ==========================
// 1️⃣ GÉNÉRER PLUSIEURS COMBINAISONS
// ==========================
app.get("/generate-combinations", (req, res) => {
  const n = Number(req.query.n || 3);
  const combinations = [];

  for (let i = 0; i < n; i++) {
    combinations.push({
      id: i + 1,
      t1: randomItem(TASK_1),
      t2: randomItem(TASK_2),
      t3: randomItem(TASK_3)
    });
  }

  res.json(combinations);
});

// ==========================
// 2️⃣ CORRECTION AI (TCF)
// ==========================
app.post("/correct-ee", async (req, res) => {
  const { task, subject, text } = req.body;

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Clé OpenAI manquante" });
  }

  const prompt = `
Tu es un examinateur officiel du TCF Canada pour l’épreuve d’Expression Écrite.

RÈGLES CRITIQUES :
- Hors-sujet = 0/20
- Respect strict du nombre de mots
- Correction rigoureuse (grammaire, lexique, cohérence)
- Niveau estimé A1 à C2

FORMAT DE SORTIE (JSON UNIQUEMENT) :
{
  "note_sur_20": 0,
  "niveau_estime": "A1-C2",
  "points_forts": [],
  "points_faibles": [],
  "axes_amelioration": [],
  "correction_detaillee": "",
  "feedback_pedagogique": ""
}

TÂCHE ${task}
SUJET :
${subject}

TEXTE DU CANDIDAT :
${text}
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      })
    });

    const data = await response.json();

    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    res.json(parsed);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la correction AI" });
  }
});

// ==========================
// DÉMARRER LE SERVEUR
// ==========================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Serveur lancé sur le port", PORT);
});
