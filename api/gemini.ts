import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!process.env.API_KEY) {
        console.error('FATAL: API_KEY environment variable is not set.');
        return res.status(503).json({ message: 'Service Unavailable: AI service is not configured.' });
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { prompt } = req.body;
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ message: 'A "prompt" string is required in the request body.' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are Mason, a helpful assistant for LynxAI, a premium feature from Lynix Technology and Coding. Be friendly, concise, and helpful. Introduce yourself in the first message."
            }
        });
        
        return res.status(200).json({ text: response.text });

    } catch (error) {
        console.error('Gemini API call failed on the backend:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown internal error occurred.';
        return res.status(500).json({ message: `An error occurred while contacting the AI assistant: ${errorMessage}` });
    }
}