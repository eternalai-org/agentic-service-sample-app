import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3030;
const __dirname = path.resolve();

// Load config
let appConfig = { apiKey: '', apiEndpoint: '', agent: '' };
try {
  const configPath = path.join(__dirname, 'app_config.json');
  if (fs.existsSync(configPath)) {
    appConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (err) {
  console.error('Failed to load app_config.json:', err.message);
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function pad(n){ return String(n).padStart(2, '0'); }
function isoDatetime(){
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

app.post('/save', async (req, res) => {
  try {
    const { config, prompt } = req.body;
    if (!prompt || !prompt.prompt_text) {
      return res.status(400).json({ error: 'Missing prompt_text' });
    }

    const dt = isoDatetime();
    const folderName = `story_${dt}`;
    const storyDir = path.join(dataDir, folderName);

    // Create story folder
    if (!fs.existsSync(storyDir)) {
      fs.mkdirSync(storyDir, { recursive: true });
    }

    config.created_at = config.created_at || new Date().toISOString();
    prompt.created_at = prompt.created_at || new Date().toISOString();

    // Merge config and prompt into one file
    const mergedData = {
      prompt: prompt,
      config: config,
      created_at: new Date().toISOString()
    };

    const dataPath = path.join(storyDir, 'story_data.json');
    fs.writeFileSync(dataPath, JSON.stringify(mergedData, null, 2));

    return res.json({
      message: 'Saved successfully',
      storyFolder: folderName,
      dataFile: 'story_data.json'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save markdown export
app.post('/export', async (req, res) => {
  try {
    const { storyFolder, markdown } = req.body;
    if (!storyFolder || !markdown) {
      return res.status(400).json({ error: 'Missing storyFolder or markdown' });
    }

    const storyDir = path.join(dataDir, storyFolder);

    // Create folder if it doesn't exist
    if (!fs.existsSync(storyDir)) {
      fs.mkdirSync(storyDir, { recursive: true });
    }

    const mdPath = path.join(storyDir, 'story.md');
    fs.writeFileSync(mdPath, markdown, 'utf-8');

    return res.json({
      message: 'Markdown saved successfully',
      file: 'story.md'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Publish story
app.post('/api/publish', async (req, res) => {
  try {
    const { storyFolder, title, author, description, coverImage } = req.body;

    if (!storyFolder || !title || !author || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const storyDir = path.join(dataDir, storyFolder);
    const dataPath = path.join(storyDir, 'story_data.json');

    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: 'Story data not found' });
    }

    // Read existing data
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Add publish info
    data.published = true;
    data.title = title;
    data.author = author;
    data.description = description;
    data.coverImage = coverImage || '';
    data.publishedAt = new Date().toISOString();

    // Save updated data
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    return res.json({
      message: 'Story published successfully',
      folder: storyFolder
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all published stories
app.get('/api/stories', async (req, res) => {
  try {
    const folders = fs.readdirSync(dataDir).filter(f => {
      const stat = fs.statSync(path.join(dataDir, f));
      return stat.isDirectory();
    });

    const stories = [];

    for (const folder of folders) {
      const dataPath = path.join(dataDir, folder, 'story_data.json');
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

        // Only include published stories
        if (data.published) {
          stories.push({
            folder: folder,
            title: data.title || 'Untitled Story',
            author: data.author || 'Anonymous',
            description: data.description || 'No description',
            coverImage: data.coverImage || '',
            publishedAt: data.publishedAt || data.created_at,
            createdAt: data.created_at
          });
        }
      }
    }

    // Sort by published date, newest first
    stories.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    return res.json(stories);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single story data
app.get('/api/story/:folder', async (req, res) => {
  try {
    const { folder } = req.params;
    const dataPath = path.join(dataDir, folder, 'story_data.json');

    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    if (!data.published) {
      return res.status(403).json({ error: 'Story not published' });
    }

    return res.json({
      title: data.title,
      author: data.author,
      description: data.description,
      coverImage: data.coverImage,
      publishedAt: data.publishedAt,
      createdAt: data.created_at
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get story markdown content
app.get('/api/story/:folder/content', async (req, res) => {
  try {
    const { folder } = req.params;
    const mdPath = path.join(dataDir, folder, 'story.md');

    if (!fs.existsSync(mdPath)) {
      return res.status(404).send('Story content not found');
    }

    const markdown = fs.readFileSync(mdPath, 'utf-8');
    res.setHeader('Content-Type', 'text/plain');
    return res.send(markdown);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Proxy endpoint for story generation (streaming)
app.post('/api/generate-story', async (req, res) => {
  try {
    console.log('=== Story Generation Request ===');
    console.log('Request headers:', req.headers);
    console.log('Request body type:', typeof req.body);
    console.log('Request body:', req.body);
    console.log('Body keys:', Object.keys(req.body || {}));

    const { promptText } = req.body;

    if (!promptText) {
      console.error('Missing promptText in request');
      console.error('Available body:', JSON.stringify(req.body));
      return res.status(400).json({
        error: 'Missing promptText',
        receivedBody: req.body,
        receivedKeys: Object.keys(req.body || {})
      });
    }

    console.log('Forwarding story generation request to API...');
    console.log('API Endpoint:', appConfig.apiEndpoint);
    console.log('Chat Agent:', appConfig.chatAgent);

    // Forward request to actual API with API key from config
    const response = await fetch(appConfig.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': appConfig.apiKey
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: promptText
              }
            ]
          }
        ],
        agent: appConfig.chatAgent,
        stream: true
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'API request failed' });
    }

    // Set streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response back to client using ReadableStream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Forward the chunk to the client
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
    } catch (streamErr) {
      console.error('Streaming error:', streamErr);
      res.end();
    }

  } catch (err) {
    console.error('Story generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Proxy endpoint for image prompt generation (streaming)
app.post('/api/generate-image-prompt', async (req, res) => {
  try {
    const { promptText } = req.body;

    if (!promptText) {
      return res.status(400).json({ error: 'Missing promptText' });
    }

    // Forward request to actual API with API key from config
    const response = await fetch(appConfig.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': appConfig.apiKey
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: promptText
              }
            ]
          }
        ],
        agent: appConfig.chatAgent,
        stream: true
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'API request failed' });
    }

    // Set streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response back to client using ReadableStream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Forward the chunk to the client
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
    } catch (streamErr) {
      console.error('Streaming error:', streamErr);
      res.end();
    }

  } catch (err) {
    console.error('Image prompt generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Proxy endpoint for image generation
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    // Forward request to actual API with API key from config
    const response = await fetch(appConfig.imageEndpoint, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-api-key': appConfig.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        agent: appConfig.imageAgent
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'API request failed' });
    }

    const data = await response.json();
    return res.json(data);

  } catch (err) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Proxy endpoint for image result polling
app.get('/api/image-result', async (req, res) => {
  try {
    const { request_id } = req.query;

    if (!request_id) {
      return res.status(400).json({ error: 'Missing request_id' });
    }

    // Forward request to actual API with API key from config
    const response = await fetch(`${appConfig.resultEndpoint}?agent=${appConfig.imageAgent}&request_id=${request_id}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-api-key': appConfig.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'API request failed' });
    }

    const data = await response.json();
    return res.json(data);

  } catch (err) {
    console.error('Image result polling error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve the creator page at /creator
app.get('/creator', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'creator.html'));
});

// Serve the story viewer at /story
app.get('/story', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'story.html'));
});

// Serve generated files
app.use('/data', express.static(dataDir));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
