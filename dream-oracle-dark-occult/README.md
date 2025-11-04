# Dream Tales 

This project provides example code demonstrating how to integrate and use the **[EternalAI Agentic API](https://eternalai.org/api)** in applications and games.
The included projects show how to:
- Connect and communicate with EternalAI agents
- Generate and edit images
- Create short videos and animations from text prompts

About Dream Tales: A mystical web application that transforms written dream descriptions into visual and animated interpretations using AI-powered chat, image generation, and image-to-video conversion.

## Live Demo
- Access the app: [Dream Tale](https://39e2ecf874c0.ngrok-free.app/)
 
## Technical Overview

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

## How to Run

### Prerequisites

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

**Open browser:** `http://localhost:3030`

And then input Eternal AI API Key to use the app. 

---

## ???? Project Structure

```
dream-oracle-dark-occult/
????????? server.js                  # Express server with API proxies
????????? index.html                 # Main UI
????????? package.json               # Dependencies
????????? app_config.example.json    # Example config template
????????? assets/                    # Static assets (images, fonts)
????????? scripts/
???   ????????? dreamTales.js          # Main dream interpretation logic, update your own prompts here
???   ????????? nightmare.js           # Nightmare theme/styling
???   ????????? radialVisualizer.js    # Interactive radial visualization
```

---

## How to Use

### Dream Interpretation Flow

1. **Enter Your Dream**: Type or paste your dream description
2. **AI Analysis**: The AI analyzes and interprets your dream symbolism
3. **Visual Generation**: Generate images based on dream themes
4. **Animation**: Convert static images into animated sequences
5. **Explore**: Use the radial visualizer to interact with dream elements

---

## Configuration

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

## 🔐 Security Notes

- API keys can be stored in `app_config.json` (add to `.gitignore`)
- No authentication required (add auth for production)
- All origins accepted (configure CORS for production)

---

Made with ?????? using Eternal AI
