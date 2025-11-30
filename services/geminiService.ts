import { GoogleGenAI } from "@google/genai";
import { SongResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const identifySong = async (audioBlob: Blob): Promise<SongResult | null> => {
  try {
    const base64Audio = await blobToBase64(audioBlob);
    console.log(`Analyzing audio blob size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

    // Improved prompt for higher accuracy using search grounding
    const promptText = `
      You are an expert music recognition AI with access to real-time Google Search data.
      
      YOUR TASK: Identify the song in the audio clip with 100% accuracy.
      
      STEP 1 (LISTEN): 
      - Listen carefully to the audio. 
      - Transcribe *every single word* of lyrics you can hear. This is critical.
      - Identify the melody, tempo, and any distinctive instruments (e.g. guitar riff, synth, bass).
      
      STEP 2 (SEARCH):
      - Use the 'googleSearch' tool to search for the transcribed lyrics in quotes.
      - Search for the visual/audio description combined with any genre clues.
      - Look specifically for matches on YouTube, Spotify, and Genius.
      
      STEP 3 (VERIFY):
      - Compare the audio you heard with the search results.
      - If the search results confirm the lyrics and sound, select that song.
      - If you are not sure, choose the best match but lower the confidence score.

      STEP 4 (OUTPUT):
      Return ONLY a valid JSON object with this structure:
      {
        "artist": "Exact Artist Name",
        "title": "Exact Song Title",
        "genre": "Genre",
        "funFact": "A brief interesting fact about this specific track",
        "confidence": 95
      }

      NOTE: 
      - If the audio is silence or noise and no music is detected, return null.
      - Do NOT use markdown formatting (no \`\`\`json). Just the raw JSON string.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            text: promptText
          },
          {
            inlineData: {
              mimeType: audioBlob.type || 'audio/webm',
              data: base64Audio,
            },
          }
        ],
      },
      config: {
        // High urgency to use search for verification
        tools: [{ googleSearch: {} }],
        temperature: 0.4, // Lower temperature for more deterministic/factual results
      }
    });

    const text = response.text;
    if (!text) return null;

    let parsedData: SongResult | null = null;

    // Helper to find and parse JSON from the response text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            parsedData = JSON.parse(jsonMatch[0]) as SongResult;
        } catch (e) {
            console.error("Failed to parse JSON from response:", e);
            // Fallback cleanup
            try {
              const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
              const secondaryMatch = cleanJson.match(/\{[\s\S]*\}/);
              if (secondaryMatch) {
                parsedData = JSON.parse(secondaryMatch[0]);
              }
            } catch (e2) {
               console.error("Secondary JSON parse failed", e2);
            }
        }
    }

    if (!parsedData) return null;

    // Extract grounding chunks (source links) from the search tool
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchLinks = chunks
      .map(chunk => chunk.web?.uri)
      .filter((uri): uri is string => !!uri);

    // Add unique links to the result
    parsedData.searchLinks = [...new Set(searchLinks)];

    return parsedData;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};