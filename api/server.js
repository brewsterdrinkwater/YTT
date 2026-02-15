import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow your frontend domains
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://walt-tab.com',
  'https://www.walt-tab.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed) || allowed === '*')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// DeepSeek proxy endpoint for Quick Share
app.post('/api/analyze', async (req, res) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { url, source } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const prompt = buildAnalysisPrompt(url, source || 'website');

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes URLs and extracts relevant information for a personal life-tracking app. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return res.status(response.status).json({
        error: `DeepSeek API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();

    // Extract the content from DeepSeek response
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Could not parse analysis result' });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    res.json({
      title: parsed.title || 'Untitled',
      description: parsed.description || '',
      source: source || 'website',
      sourceReason: parsed.sourceReason || `Saved from ${source || 'website'}`,
      thumbnail: parsed.thumbnail,
      suggestedCategory: parsed.suggestedCategory || 'uncategorized',
      confidence: parsed.confidence || 'low',
      extractedItems: parsed.extractedItems || [],
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze URL', details: error.message });
  }
});

function buildAnalysisPrompt(url, source) {
  return `Analyze this ${source} URL and extract relevant information for a personal life-tracking app.

URL: ${url}

The app has these list categories:
- grocery: Food items to buy
- recipes: Recipes with ingredients
- restaurants: Restaurants, cafes, bars to visit
- places: Travel destinations, attractions, landmarks
- watchlist: Movies, TV shows, documentaries
- reading: Books, articles, blogs
- music: Songs, albums, artists, playlists
- uncategorized: If none of the above fit

Please analyze the content and respond with JSON only (no markdown):
{
  "title": "Clear, concise title",
  "description": "Brief description of what this is",
  "sourceReason": "Why this might have been saved (e.g., 'Food recommendation from Instagram', 'Travel inspiration video')",
  "suggestedCategory": "one of the categories above",
  "confidence": "high/medium/low - how confident are you this is the right category?",
  "extractedItems": [
    {
      "type": "category",
      "name": "item name",
      "details": "optional details",
      "quantity": "for groceries",
      "unit": "for groceries"
    }
  ]
}

For recipes, extract individual ingredients as grocery items.
For restaurant/place videos, extract the specific venue.
For watchlists, extract the movie/show name.
For music, extract artist and song/album.

If you can't determine the category with reasonable confidence, use "uncategorized" and set confidence to "low".

Important: Based on the URL structure and domain, infer what type of content this likely is. For example:
- instagram.com/reel/* - likely food, places, or lifestyle content
- youtube.com/watch* - could be anything, look at URL parameters
- spotify.com - music
- imdb.com - movies/shows
- yelp.com - restaurants
- tripadvisor.com - places/restaurants`;
}

app.listen(PORT, () => {
  console.log(`Walt-Tab API server running on port ${PORT}`);
});
