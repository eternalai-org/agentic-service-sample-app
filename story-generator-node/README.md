# Story Teller - Interactive Story Generator

This project provides example code demonstrating how to integrate and use the **[EternalAI Agentic API](https://eternalai.org/api)** in applications and games.
The included projects show how to:
- Connect and communicate with EternalAI agents
- Generate and edit images

Story Teller - An interactive web application that crafts illustrated stories using EternalAI's text and image generation features. Compose engaging narratives with AI-generated text and stunning visuals. 
- In reader mode, scroll through stories and immerse yourself in the experience; 
- in creator mode, unleash your creativity and let your imagination soar endlessly.

## 🌐 Live Demo
- Access the app: [Story Teller](https://4ee1b8c0f986.ngrok-free.app/)

## 📋 Technical Overview

### Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: HTML + Vanilla JavaScript
- **AI Service**: Eternal AI API
- **Features**: Story generation, Image generation, Export to JSON/Markdown

### Core Features

1. **Story Creation**: Build multi-chapter stories with AI assistance
2. **Image Generation**: Generate illustrations for each story chapter
3. **Story Configuration**: Customize story settings and parameters
4. **Export Capabilities**: Save stories as JSON and Markdown files
5. **Story Builder UI**: Interactive interface for managing story elements

## 🚀 How to Run

### 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Eternal AI API Key** ([Get yours here](https://docs.eternalai.org/api))

---

### Step 1: Install Dependencies

```bash
cd story-generator-node
npm install
```

### Step 2: Start the Server

```bash
npm start
```

Server will run at: `http://localhost:3030`

✅ **Reader Mode** `http://localhost:3030`

### Step 3: Create new story

✅ **Creator Mode** `http://localhost:3030/creator`

---

## 📁 Project Structure

```
story-generator-node/
├── server.js                  # Express server
├── package.json               # Dependencies
├── app_config.json            # API configuration (optional)
├── public/                    # Frontend files
│   ├── index.html             # Landing page
│   ├── creator.html           # Story creation interface
│   ├── story.html             # Story display page
│   ├── app.js                 # Main application logic
│   ├── creator.js             # Story creation UI logic
│   ├── story.js               # Story display logic
│   ├── home.js                # Home page logic
│   ├── styles.css             # Main styles
│   ├── home-styles.css        # Home page styles
│   └── story-styles.css       # Story page styles
├── data/                      # Saved stories (auto-created)
│   └── story_{timestamp}/     # Individual story folders
│       ├── story_data.json    # Story configuration and prompt
│       └── story.md           # Markdown export (optional)
└── sample/                    # Example story files
```

---

## 🎯 API Endpoints

### 1. Save Story

```
POST /save
Body: {
  config: { /* story configuration */ },
  prompt: {
    prompt_text: "story content...",
    /* other prompt data */
  }
}
Response: {
  message: "Saved successfully",
  storyFolder: "story_20231201_120000",
  dataFile: "story_data.json"
}
```

### 2. Export Markdown

```
POST /export
Body: {
  storyFolder: "story_20231201_120000",
  markdown: "# Story content..."
}
Response: {
  message: "Markdown saved successfully",
  file: "story.md"
}
```

### 3. Static Files

```
GET /                          # Serves index.html
GET /creator.html              # Story creation page
GET /story.html                # Story display page
GET /*                         # Other static files from /public
```

---

## 📝 How to Use

### ✍️ Creating a Story

1. **Start Creating**: Click the "Create Story" button on the home page
2. **Enter API Key**: Provide your Eternal AI API key
3. **Configure Story**: Set story parameters (chapters, tone, genre, etc.)
4. **Generate Content**: Use AI to generate story text and images
5. **Edit & Refine**: Manually edit any generated content
6. **Publish**: Save your story to the `/data` folder

### 📖 Story Output

When you click **Publish**, the server saves:
- `story_data.json`: Complete story configuration and content
- `story.md`: Markdown formatted version (if exported)

Files are saved in: `/data/story_{timestamp}/`

### 📂 Viewing Saved Stories

1. Navigate to the `/data` directory
2. Each story has its own timestamped folder
3. Open `story_data.json` to view the complete story data
4. Use `story.md` for a readable markdown version

---

## ⚙️ Configuration

### Server Settings

- **Port**: 3030 (configurable via `PORT` environment variable)
- **Request Size Limit**: 1MB
- **Static Files**: Served from `/public` directory
- **Data Storage**: `/data` directory (auto-created)

### Eternal AI Integration

- **Endpoint**: Configurable via `app_config.json`
- **Default Agent**: gpt-4o-mini (configurable)
- **Request Format**: Standard chat API format
- **Image Generation**: Supports image generation agents

## 🔐 Security Notes

- API keys can be stored in `app_config.json` (add to `.gitignore`)
- No authentication required (add auth for production)
- All origins accepted (configure CORS for production)

---

Made with ❤️ using Eternal AI
