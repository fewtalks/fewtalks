import { GoogleGenAI, Type, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Fail fast helper for long-running requests
function withTimeout<T>(promise: Promise<T>, ms: number, onTimeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(onTimeoutMessage)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const tweetResponseSchema = {
    type: Type.OBJECT,
    properties: {
      tweets: {
        type: Type.ARRAY,
        description: "An array of distinct, high-quality tweets.",
        items: {
          type: Type.STRING,
          description: "A single tweet, under 280 characters, generated from the provided text.",
        },
      },
      imagePrompt: {
        type: Type.STRING,
        description: "A concise, descriptive prompt for generating an image that is highly relevant to the provided text content. This should be a creative interpretation, not just a summary."
      }
    },
    required: ["tweets", "imagePrompt"],
};

export const generateTweetsFromText = async (
    sourceContent: string,
    sourceType: 'text' | 'url',
    tone: string,
    language: string,
    numTweets: number,
    includeHashtags: boolean
): Promise<{ tweets: string[]; imagePrompt: string; }> => {
    
    const hashtagInstruction = includeHashtags ? "Use relevant hashtags where appropriate." : "Do not use any hashtags.";
    
    const sourceInstruction = sourceType === 'text'
        ? `Here is the long-form text:\n---\n${sourceContent}\n---`
        : `Analyze the content of the following URL and use its main content as the source text:\n${sourceContent}`;
    
    const prompt = `You are an expert social media manager specializing in crafting viral content for Twitter/X.
Your task is to analyze the following source text and generate two things:
1. An array of exactly ${numTweets} distinct, high-quality, and engaging tweets.
2. A concise, descriptive prompt for an AI image generator that visually represents the core idea of the text.

Guidelines for Tweets:
- Each tweet must be under 280 characters.
- The tone must be **${tone}**.
- The language for the tweets must be **${language}**. This is very important.
- ${hashtagInstruction}

Guideline for Image Prompt:
- The prompt should be creative and visually descriptive, suitable for a model like DALL-E or Midjourney.

${sourceInstruction}

Return the output strictly as a JSON object following this format: {"tweets": ["tweet1", "tweet2", ...], "imagePrompt": "A descriptive prompt"}.
Do not include any other text, explanations, or markdown formatting like \`\`\`json. Just the raw JSON object.`;

  try {
     const config = sourceType === 'text'
      ? {
          responseMimeType: "application/json",
          responseSchema: tweetResponseSchema,
          temperature: 0.7,
        }
      : {
          tools: [{ googleSearch: {} }],
          temperature: 0.7,
        };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: config,
    });

    const jsonString = response.text.trim();
    // In case the response is wrapped in markdown ```json ... ```
    const cleanedJsonString = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    
    const result = JSON.parse(cleanedJsonString);

    if (result && Array.isArray(result.tweets) && result.imagePrompt) {
      return { tweets: result.tweets, imagePrompt: result.imagePrompt };
    } else {
      throw new Error("Invalid response format from AI.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate content from Gemini API.");
  }
};

export const getTopNews = async (query: string = 'Top trending news', mode: 'topic' | 'location' = 'topic'): Promise<string[]> => {
    const promptInstruction = (query === 'Top trending news' && mode === 'topic')
    ? `List the top 10 most recent and trending news headlines from Google News.`
    : `List the top 10 most recent and trending news headlines about ${mode === 'topic' ? `the topic "${query}"` : `the location "${query}"`} from Google News.`;

  const prompt = `${promptInstruction}
Return ONLY a JSON object with a single key "headlines" which is an array of 10 headline strings.
Do not include any other text, explanations, or markdown formatting like \`\`\`json. Just the raw JSON object.`;

  try {
    const headlinesResponseSchema = {
      type: Type.OBJECT,
      properties: {
        headlines: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["headlines"],
    };

    const response = await withTimeout(
      ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: headlinesResponseSchema,
        temperature: 0,
      },
      }),
      15000,
      "News request timed out. Please try again."
    );

    const textResponse = response.text.trim();
    const cleanedJsonString = textResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    
    const result = JSON.parse(cleanedJsonString);

    if (result && Array.isArray(result.headlines) && result.headlines.length > 0) {
      return result.headlines.slice(0, 10);
    } else {
      console.warn("News response from AI was not in the expected format.", result);
      throw new Error("Invalid news format from AI.");
    }
  } catch (error: any) {
    console.error("Error fetching top news from Gemini API:", error);
    const message = typeof error?.message === 'string' ? error.message : 'Failed to fetch top news.';
    throw new Error(message);
  }
};


export const generateImage = async (prompt: string, style: string): Promise<string> => {
    let fullPrompt: string;

    // Customize prompts for specific styles to get better results
    switch (style) {
        case 'Character Art':
            fullPrompt = `High-quality character concept art of a character described as: "${prompt}". Style: detailed, vibrant, digital painting, full body shot unless specified otherwise.`;
            break;
        case 'Anime/Manga':
            fullPrompt = `A high-quality anime/manga style illustration of: "${prompt}". Style should be vibrant, clean lines, dynamic pose.`;
            break;
        case 'Photorealistic':
            fullPrompt = `A photorealistic, high-resolution photograph of: "${prompt}". Focus on details, lighting, and textures to make it look like a real photo.`;
            break;
        case 'Cartoon':
             fullPrompt = `A fun, stylized cartoon illustration of: "${prompt}". Style: simple shapes, bold outlines, bright colors.`;
             break;
        default:
            fullPrompt = `A high-quality, detailed image of: ${prompt}. The style must be: ${style}.`;
    }
  
    try {
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
      });
  
      const base64ImageBytes = response.generatedImages[0]?.image?.imageBytes;

      if (base64ImageBytes) {
        return base64ImageBytes;
      }
      
      throw new Error("No image data found in the AI response.");
  
    } catch (error) {
      console.error("Error calling Gemini Image API:", error);
      throw new Error("Failed to generate image from Gemini API.");
    }
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: mimeType,
        },
    };
    const textPart = {
        text: prompt,
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini Vision API:", error);
        throw new Error("Failed to analyze image.");
    }
};