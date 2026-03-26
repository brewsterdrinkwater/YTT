import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Rate Limiter — in-memory, per-IP, sliding window
// Designed for 5-10 concurrent users sharing the same API keys.
// ---------------------------------------------------------------------------

class RateLimiter {
  constructor(windowMs, maxRequests) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.hits = new Map(); // key -> [timestamps]
    setInterval(() => this._cleanup(), 5 * 60 * 1000);
  }

  _cleanup() {
    const cutoff = Date.now() - this.windowMs;
    for (const [key, timestamps] of this.hits) {
      const valid = timestamps.filter(t => t > cutoff);
      if (valid.length === 0) this.hits.delete(key);
      else this.hits.set(key, valid);
    }
  }

  check(key) {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const timestamps = (this.hits.get(key) || []).filter(t => t > cutoff);
    if (timestamps.length >= this.maxRequests) {
      return { allowed: false, remaining: 0, retryAfterMs: timestamps[0] + this.windowMs - now };
    }
    timestamps.push(now);
    this.hits.set(key, timestamps);
    return { allowed: true, remaining: this.maxRequests - timestamps.length };
  }
}

// Per-IP rate limits (sliding window)
const weatherLimiter = new RateLimiter(60 * 60 * 1000, 30);   // 30 req/hr/IP
const analyzeLimiter = new RateLimiter(60 * 60 * 1000, 20);   // 20 req/hr/IP
const researchLimiter = new RateLimiter(60 * 60 * 1000, 15);  // 15 req/hr/IP

function rateLimitMiddleware(limiter) {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const result = limiter.check(key);
    res.set('X-RateLimit-Remaining', String(result.remaining));
    if (!result.allowed) {
      res.set('Retry-After', String(Math.ceil(result.retryAfterMs / 1000)));
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000),
      });
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// Request Queue — serializes DeepSeek API calls to avoid overwhelming the API
// ---------------------------------------------------------------------------

class RequestQueue {
  constructor(concurrency = 2) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this._drain();
    });
  }

  _drain() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const { fn, resolve, reject } = this.queue.shift();
      this.running++;
      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.running--;
          this._drain();
        });
    }
  }

  get pending() { return this.queue.length; }
}

// 2 concurrent DeepSeek calls max (prevents API abuse with shared key)
const deepseekQueue = new RequestQueue(2);

// ---------------------------------------------------------------------------
// Response Cache — avoids duplicate API calls for the same content
// ---------------------------------------------------------------------------

class ResponseCache {
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.cache = new Map();
    setInterval(() => this._cleanup(), 10 * 60 * 1000);
  }

  _cleanup() {
    const now = Date.now();
    for (const [key, { expiresAt }] of this.cache) {
      if (now > expiresAt) this.cache.delete(key);
    }
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { this.cache.delete(key); return null; }
    return entry.data;
  }

  set(key, data) {
    this.cache.set(key, { data, expiresAt: Date.now() + this.ttlMs });
  }
}

const researchCache = new ResponseCache(24 * 60 * 60 * 1000); // 24 hours
const weatherCache = new ResponseCache(30 * 60 * 1000);        // 30 minutes
const analyzeCache = new ResponseCache(60 * 60 * 1000);        // 1 hour

// ---------------------------------------------------------------------------
// CORS configuration
// ---------------------------------------------------------------------------

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://walt-tab.com',
  'https://www.walt-tab.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed) || allowed === '*')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

// Trust proxy for accurate req.ip behind Railway/Vercel
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    queue: { pending: deepseekQueue.pending, running: deepseekQueue.running },
  });
});

// ---------------------------------------------------------------------------
// Weather proxy — with rate limiting + server-side caching
// ---------------------------------------------------------------------------

app.get('/api/weather/:city', rateLimitMiddleware(weatherLimiter), async (req, res) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Weather API key not configured' });
  }

  const cities = {
    nyc: { lat: 40.7128, lon: -74.006 },
    nashville: { lat: 36.1627, lon: -86.7816 },
  };

  const city = cities[req.params.city];
  if (!city) {
    return res.status(400).json({ error: 'Invalid city. Use "nyc" or "nashville".' });
  }

  // Check cache first
  const cacheKey = `weather-${req.params.city}`;
  const cached = weatherCache.get(cacheKey);
  if (cached) {
    res.set('X-Cache', 'HIT');
    res.set('Cache-Control', 'public, max-age=1800');
    return res.json(cached);
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}&units=imperial`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenWeatherMap API error:', response.status, errorText);
      return res.status(response.status).json({ error: 'Weather API error' });
    }

    const data = await response.json();
    weatherCache.set(cacheKey, data);

    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', 'public, max-age=1800');
    res.json(data);
  } catch (error) {
    console.error('Weather fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// ---------------------------------------------------------------------------
// Quick Share analysis — rate limited + queued + cached
// ---------------------------------------------------------------------------

app.post('/api/analyze', rateLimitMiddleware(analyzeLimiter), async (req, res) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { url, source } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Check cache
    const cacheKey = `analyze-${url}`;
    const cached = analyzeCache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    const prompt = buildAnalysisPrompt(url, source || 'website');

    // Queue the DeepSeek call
    const data = await deepseekQueue.enqueue(async () => {
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
            { role: 'user', content: prompt }
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API error:', response.status, errorText);
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      return response.json();
    });

    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Could not parse analysis result' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const result = {
      title: parsed.title || 'Untitled',
      description: parsed.description || '',
      source: source || 'website',
      sourceReason: parsed.sourceReason || `Saved from ${source || 'website'}`,
      thumbnail: parsed.thumbnail,
      suggestedCategory: parsed.suggestedCategory || 'uncategorized',
      confidence: parsed.confidence || 'low',
      extractedItems: parsed.extractedItems || [],
    };

    analyzeCache.set(cacheKey, result);
    res.set('X-Cache', 'MISS');
    res.json(result);

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
- restaurants: Restaurants, cafes, bars, food spots to visit (include cuisine type, neighborhood/city, and price range if possible)
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
      "details": "optional details (for restaurants: include cuisine type and location)",
      "quantity": "for groceries",
      "unit": "for groceries"
    }
  ],
  "googleMapsSearchQuery": "If this is a restaurant/place, provide a Google Maps search query (e.g., 'Restaurant Name City') or null"
}

INSTAGRAM-SPECIFIC GUIDANCE:
- Instagram reels/posts about food are VERY common. If the URL is from Instagram and contains food-related content, categorize as "restaurants" with high confidence.
- For Instagram food content, extract the specific restaurant/cafe name, cuisine type, city, and neighborhood when mentioned.
- Instagram travel content should be categorized as "places".
- Instagram recipe content should extract individual ingredients as grocery items AND create a recipe entry.
- For Instagram posts tagging a location or business, extract that as a restaurant or place.

For recipes, extract individual ingredients as grocery items.
For restaurant/place content, extract the specific venue with cuisine type and location details.
For watchlists, extract the movie/show name.
For music, extract artist and song/album.

If you can't determine the category with reasonable confidence, use "uncategorized" and set confidence to "low".

Important: Based on the URL structure and domain, infer what type of content this likely is. For example:
- instagram.com/reel/* or /p/* - most commonly food, restaurants, or places content. Default to "restaurants" for food-related content.
- youtube.com/watch* - could be anything, look at URL parameters
- spotify.com - music
- imdb.com - movies/shows
- yelp.com - restaurants (high confidence)
- tripadvisor.com - places/restaurants (high confidence)
- google.com/maps - places/restaurants (high confidence)`;
}

// ---------------------------------------------------------------------------
// Deep Research Agent — rate limited + queued + cached
// ---------------------------------------------------------------------------

app.post('/api/research', rateLimitMiddleware(researchLimiter), async (req, res) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check cache
    const cacheKey = `research-${name.toLowerCase().trim()}`;
    const cached = researchCache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    const prompt = buildResearchPrompt(name);

    // Queue the DeepSeek call
    const data = await deepseekQueue.enqueue(async () => {
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
              content: 'You are a meticulous research assistant. Always respond with valid JSON only - no markdown, no backticks, no explanation.'
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 4000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API error:', response.status, errorText);
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      return response.json();
    });

    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Could not parse research result' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    researchCache.set(cacheKey, parsed);
    res.set('X-Cache', 'MISS');
    res.json(parsed);

  } catch (error) {
    console.error('Research error:', error);
    res.status(500).json({ error: 'Failed to research', details: error.message });
  }
});

function buildResearchPrompt(name) {
  return `Research "${name}" and return ONLY valid JSON (no markdown, no backticks, no explanation).

CRITICAL RULES:
- Return ONLY the JSON object, nothing else
- Use null for unknown values, not "Unknown"
- For controversies, ONLY include if documented in credible sources with specific evidence
- Prioritize primary sources (interviews, speeches, official records) and reputable secondary sources (NYT, WaPo, Guardian, peer-reviewed work)
- NO AI-generated content, listicles, or fluff pieces
- Verify facts from multiple sources before including

Return this exact JSON structure:
{
  "name": "Full Official Name",
  "category": "artist|author|actor|leader|scientist|athlete|other",
  "birthYear": 1950,
  "deathYear": null,
  "birthPlace": "City, State/Country",
  "summary": "One paragraph bio focusing on significance",

  "leaderInfo": {
    "include": true,
    "highSchool": "School Name, Location",
    "college": "University Name, Degree, Year",
    "fraternity": "Fraternity name or null",
    "positions": ["List of major positions held"]
  },

  "famousFor": ["Top 3-5 most notable accomplishments"],

  "controversies": {
    "sexualMisconduct": [{"allegation": "description", "year": 2020, "source": "credible source", "outcome": "resolved/ongoing/etc"}],
    "domesticViolence": [],
    "racism": []
  },

  "timeline": [
    {"year": 1970, "title": "Work Title", "type": "album|book|film|role|achievement", "significance": "Why it matters", "link": "official or reputable URL"}
  ],

  "deepCuts": [
    {"title": "Underrated Work", "year": 1975, "why": "Why this deserves more attention", "link": "URL"}
  ],

  "sources": [
    {"title": "Source Title", "type": "primary|secondary", "url": "URL", "description": "What this source provides"}
  ],

  "actionLinks": {
    "spotify": "https://open.spotify.com/artist/... or null",
    "kindle": "https://www.amazon.com/kindle-dbs/... or null",
    "imdb": "https://www.imdb.com/name/... or null",
    "wikipedia": "https://en.wikipedia.org/wiki/..."
  }
}

If the person is not a leader/CEO/president, set leaderInfo.include to false and leave other leaderInfo fields null.
For timeline, include 8-15 significant works/events in chronological order.
For deepCuts, include 3-5 underrated or overlooked works.
For sources, include 5-8 high-quality primary and secondary sources only.`;
}

app.listen(PORT, () => {
  console.log(`Walt-Tab API server running on port ${PORT}`);
  console.log(`Rate limits: Weather 30/hr, Analyze 20/hr, Research 15/hr per IP`);
  console.log(`DeepSeek queue concurrency: ${deepseekQueue.concurrency}`);
});
