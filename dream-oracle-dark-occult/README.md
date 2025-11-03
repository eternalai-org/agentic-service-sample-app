# Dream Tales - Dream Oracle Dark Occult

A mystical web application that transforms written dream descriptions into visual and animated interpretations using AI-powered chat, image generation, and image-to-video conversion.

## 🌐 Live Demo
- Create Eternal AI account and [get your API key](https://docs.eternalai.org/api)
- Access the app: [Dream Tale](https://39e2ecf874c0.ngrok-free.app/)
 
## 📋 Project Overview

### Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: HTML + Vanilla JavaScript
- **AI Service**: Eternal AI API
- **Features**: Chat streaming, Image generation, Image-to-video conversion

### Core Features

1. **Dream Interpretation**: Chat with AI to analyze and interpret your dreams
2. **Visual Generation**: Convert dream descriptions into AI-generated images
3. **Dream Animation**: Transform static dream images into short video clips
4. **Radial Visualizer**: Interactive visualization interface for dream exploration

## 🚀 How to Run

### 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Eternal AI API Key** ([Get yours here](https://docs.eternalai.org/api))

---

### Step 1: Install Dependencies

```bash
cd dream-oracle-dark-occult
npm install
```

### Step 2: Start the Server

```bash
npm start
```

Server will run at: `http://localhost:3030`

✅ **Open browser:** `http://localhost:3030`

And then input Eternal AI API Key to use the app. 

---

## 📁 Project Structure

```
dream-oracle-dark-occult/
├── server.js                  # Express server with API proxies
├── index.html                 # Main UI
├── package.json               # Dependencies
├── app_config.json            # API configuration (gitignored)
├── app_config.example.json    # Example config template
├── assets/                    # Static assets (images, fonts)
├── scripts/
│   ├── dreamTales.js          # Main dream interpretation logic
│   ├── nightmare.js           # Nightmare theme/styling
│   └── radialVisualizer.js    # Interactive radial visualization
```

---

## 📝 How to Use

### 🌙 Dream Interpretation Flow

1. **Enter Your Dream**: Type or paste your dream description
2. **AI Analysis**: The AI analyzes and interprets your dream symbolism
3. **Visual Generation**: Generate images based on dream themes
4. **Animation**: Convert static images into animated sequences
5. **Explore**: Use the radial visualizer to interact with dream elements

---

## ⚙️ Configuration

### Server Settings

- **Port**: 3030 (configurable via `PORT` environment variable)
- **File Upload Limit**: 10MB
- **CORS**: Disabled (single-origin app)

### Eternal AI Integration

- **Chat Endpoint**: `https://agentic.eternalai.org/chat`
- **Image Endpoint**: `https://agentic.eternalai.org/prompt`
- **Result Endpoint**: `https://agentic.eternalai.org/result`
- **Streaming**: Supported for chat responses
- **Timeout**: Varies by agent (typically 1-5 minutes)

---

## 🔧 Troubleshooting

### Server doesn't start

```bash
# Check Node.js version (18+)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### API requests fail

- Verify your API key in `app_config.json`
- Check your internet connection
- Review browser console and server logs for error details

### Images don't generate

- Ensure you have a valid Eternal AI API key
- Check that the image agent is properly configured
- Some requests may take longer - wait for completion

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "node-fetch": "^3.3.0"
  }
}
```

---

## 🔐 Security Notes

- `app_config.json` contains your API key - never commit this file
- API key is sent from client (consider server-side storage for production)
- Add rate limiting for production deployments

---

Made with ❤️ using Eternal AI
