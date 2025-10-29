
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Listing, Game } from '../types';

let ai: GoogleGenAI | null = null;

const getAIClient = () => {
  if (!ai) {
    if (!window.process?.env?.API_KEY || window.process.env.API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      console.error("Gemini API key is not set in environment variables or is a placeholder.");
      return null;
    }
    ai = new GoogleGenAI({ apiKey: window.process.env.API_KEY });
  }
  return ai;
};

export const calculateDealScore = async (listing: Partial<Listing>, game: Game): Promise<number | null> => {
  const client = getAIClient();
  if (!client) return null;

  const relevantData = game.columns
    .filter(col => col.is_numeric || col.id === 'price' || col.id === 'currency')
    .map(col => {
      const value = (listing as any)[col.id] ?? listing.game_specific_data?.[col.id];
      return `- ${col.label}: ${value}`;
    })
    .join('\n');

  const prompt = `
    Analyze the following ${game.name} account listing and provide a 'deal score' from 1 to 100, where 100 is an amazing deal and 1 is a very bad deal. 
    Consider all available numeric factors, especially the price in relation to the account's assets.
    
    Account Details:
    - Price: ${listing.price} ${listing.currency}
    ${relevantData}
    
    Based on this data, what is the deal score?
    
    Respond with only a single integer number between 1 and 100 and nothing else.
  `;

  try {
    const response: GenerateContentResponse = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text.trim();
    const score = parseInt(text, 10);

    if (!isNaN(score) && score >= 1 && score <= 100) {
      return score;
    } else {
      console.warn("Gemini returned a non-numeric or out-of-range score:", text);
      return null;
    }
  } catch (error) {
    console.error("Error calculating deal score with Gemini:", error);
    return null;
  }
};
