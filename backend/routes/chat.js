const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

let trafficRulesContext = '';


try {
  const dataPath = path.join(__dirname, '../../public/data/trafficRules.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const jsonData = JSON.parse(rawData);
  
  trafficRulesContext = JSON.stringify(jsonData);
} catch (err) {
  console.error('Failed to load trafficRules.json for AI context:', err);
}


router.post('/', async (req, res) => {
  try {
    const { messages } = req.body; 

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    
    
    const contents = messages.map((m) => ({
      role: m.role === 'bot' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const systemInstruction = `You are DriveLegal AI, an expert traffic law assistant.
You help users understand traffic fines, penalties, and rules globally, with a strong focus on India.
Use your general knowledge to answer questions about any region or country.
If the user asks about a specific fine and you find it in the provided database, prioritize the database's exact fine amount.
Keep your answers concise, accurate, and format them using Markdown.
Here is the complete traffic rules database in JSON format:
${trafficRulesContext}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.1, 
      }
    });

    res.json({ reply: response.text });

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Internal server error processing the chat request.' });
  }
});

module.exports = router;
