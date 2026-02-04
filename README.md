# LLM Search Bot Agent

An intelligent search assistant powered by LLM with LangGraph, featuring multi-turn conversations, streaming responses, and structured filter extraction.

## 🚀 Features

- **Natural Language Search**: Convert natural language queries to structured search filters
- **Multi-turn Conversations**: Support for progressive refinement, condition modification, and topic changes
- **Streaming Responses**: Real-time SSE streaming for responsive UI
- **Confidence Scoring**: Distinguish between explicit (DIRECT) and inferred (GUESS) filters
- **Completeness Evaluation**: Automatic detection of missing search criteria
- **Cross-domain Context**: Support pivoting from company search to person search
- **Few-shot Prompting**: Comprehensive examples for accurate filter extraction

## 📋 Tech Stack

- **Next.js 14+** (App Router)
- **React 18+**
- **LangChain.js** / **LangGraph.js**
- **TypeScript**
- **Tailwind CSS**

## 🛠️ Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd llm-search-bot-agent

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local and add your OpenAI API key
# OPENAI_API_KEY=your-api-key-here
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/chat/route.ts   # Streaming API endpoint
│   ├── page.tsx            # Main chat page
│   └── layout.tsx          # Root layout
│
├── agent/                  # LangGraph Agent
│   ├── graph.ts            # Main agent graph
│   ├── state.ts            # Agent state definition
│   ├── checkpointer.ts     # Session persistence
│   └── nodes/              # Graph nodes
│       ├── intent-classifier.ts
│       ├── filter-extractor.ts
│       ├── completeness-checker.ts
│       ├── query-rewriter.ts
│       └── response-generator.ts
│
├── prompts/                # Prompt templates
│   ├── few-shot-examples.ts
│   ├── intent-classification.ts
│   ├── filter-extraction.ts
│   └── clarification.ts
│
├── types/                  # TypeScript types
│   ├── filters.ts
│   ├── conversation.ts
│   └── events.ts
│
├── lib/                    # Utilities
│   └── stream.ts           # SSE streaming
│
└── components/             # React components
    ├── ChatWindow.tsx
    ├── MessageBubble.tsx
    └── FilterDisplay.tsx
```

## 📊 Agent Flow

```
User Input
    │
    ▼
┌─────────────────┐
│ Intent Classifier│ ──→ new_search / refine / modify / confirm / cross_domain
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Query Rewriter  │ ──→ Expand ambiguous terms
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Filter Extractor│ ──→ Extract structured filters with confidence
└─────────────────┘
    │
    ▼
┌─────────────────┐
│Completeness Check│ ──→ Detect missing fields
└─────────────────┘
    │
    ▼
┌─────────────────┐
│Response Generator│ ──→ Generate natural response
└─────────────────┘
    │
    ▼
SSE Stream Output
```

## 🧪 Test Cases

### Basic Functionality

| Test | Input | Expected |
|------|-------|----------|
| TC-01 | "Find CTOs in Singapore" | Extract titles, locations |
| TC-02 | "Find senior engineers at startups in tech" | Extract titles, seniorities, companyHeadcount, industries |
| TC-03 | "Find marketing directors with 5+ years in Europe" | Extract titles, yearsOfExperience, locations |

### Multi-turn Conversation

| Test | Scenario | Expected |
|------|----------|----------|
| TC-04 | "Find engineers" → "in SF" → "tech industry" | Accumulate filters |
| TC-05 | "Find CTOs in Singapore" → "Change to Tokyo" | Modify location only |
| TC-06 | "Find engineers" → "Find designers in NY" | Detect new search |

### Clarification Flow

| Test | Input | Expected |
|------|-------|----------|
| TC-07 | "Find engineers" | Ask for location/industry |
| TC-08 | Agent asks location → "Any" | Accept and don't ask again |

### Streaming

| Test | Expected |
|------|----------|
| TC-09 | heartbeat → progress → content → filters → done |

### Bonus

| Test | Input | Expected |
|------|-------|----------|
| TC-10 | "Find tech leaders" | Expand or ask for clarification |
| TC-11 | "Find AI startups" → "CTOs at these companies?" | Cross-domain pivot |

## 📝 API Reference

### POST /api/chat

Send a chat message and receive streaming response.

**Request:**
```json
{
  "message": "Find CTOs in Singapore",
  "sessionId": "optional-session-id"
}
```

**Response:** Server-Sent Events stream

```
data: {"type":"heartbeat","data":{"timestamp":1234},"timestamp":1234}

data: {"type":"progress","data":{"node":"classify_intent","status":"started"},"timestamp":1234}

data: {"type":"content","data":{"chunk":"I found...","isComplete":false},"timestamp":1234}

data: {"type":"filters","data":{"filters":{...},"meta":{...}},"timestamp":1234}

data: {"type":"done","data":{"success":true},"timestamp":1234}
```

### GET /api/chat?sessionId=xxx

Get session state.

## 🔧 Configuration

Environment variables in `.env.local`:

```bash
# Required
OPENAI_API_KEY=your-api-key

# Optional
OPENAI_MODEL=gpt-4-turbo-preview  # Default model
```

## 📄 License

MIT
