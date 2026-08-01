# Gemini Integration Setup Guide

## Quick Start

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev)
2. Click "Get API Key"
3. Create a new API key

### 2. Setup Environment Variables

**Local Development (`.env.local`):**

```env
# Required: Gemini API Key
VITE_GEMINI_API_KEY=your_actual_api_key_here

# Authentication - Users credentials (JSON format)
# Format: [{"email":"user@example.com","password":"pass123","name":"User Name"}]
VITE_AUTH_USERS=[{"email":"demo@example.com","password":"demo1234","name":"Demo User"},{"email":"admin@example.com","password":"admin123","name":"Admin"}]

# Optional: Default model (default is gemini-2.5-flash)
VITE_DEFAULT_MODEL=gemini-2.5-flash
```

**Vercel Deployment:**

1. Go to Vercel Project Settings → Environment Variables
2. Add these variables for `Production`, `Preview`, `Development`:

| Name                  | Value               | Notes                                 |
| --------------------- | ------------------- | ------------------------------------- |
| `VITE_GEMINI_API_KEY` | Your Gemini API Key | **Required**                          |
| `VITE_AUTH_USERS`     | JSON array of users | **Required** - see format below       |
| `VITE_DEFAULT_MODEL`  | Model name          | Optional, default: `gemini-2.5-flash` |

**Auth Users Format (JSON):**

```json
[
  {
    "email": "demo@example.com",
    "password": "demo1234",
    "name": "Demo User"
  },
  {
    "email": "admin@example.com",
    "password": "admin123",
    "name": "Admin"
  }
]
```

**Available Models:**

- `gemini-2.5-flash` (recommended, default)
- `gemini-2.0-flash`
- `gemini-1.5-pro`
- `gemini-1.5-flash`

### 3. Authentication

The app includes built-in authentication:

- Users must login with email and password
- Credentials are stored in `VITE_AUTH_USERS` environment variable
- Session persists in localStorage until logout
- Add/remove users by updating `VITE_AUTH_USERS` JSON in Vercel dashboard

### 4. Model Selection

- Users can select AI model from dropdown in chat interface
- Default model is set via `VITE_DEFAULT_MODEL` environment variable
- Selected model is saved to localStorage per user session
- Change persists across page refreshes

### 5. Available Hooks & Services

#### `useGemini()` Hook

```tsx
import { useGemini } from "@/hooks/useGemini";

const MyComponent = () => {
  const {
    messages, // Array of chat messages
    loading, // Loading state
    error, // Error message if any
    generateContent, // Generate one-off responses
    sendMessage, // Send chat messages
    clearMessages, // Clear chat history
    streamContent, // Stream responses
  } = useGemini();

  // Generate single response
  await generateContent("What is AI?");

  // Send chat message
  await sendMessage("Tell me more");

  // Stream response
  const stream = await streamContent("Explain quantum computing");
};
```

#### `GeminiService` Class

```tsx
import { geminiService } from "@/lib/gemini";

// One-off generation
const response = await geminiService.generateContent("Your prompt");

// Chat conversation
const chat = await geminiService.startChat();
const reply = await chat.sendMessage("Hello");

// Streaming
const stream = await geminiService.streamContent("Your prompt");

// Change model dynamically
geminiService.setModel("gemini-1.5-pro");
```

### 6. Example Component

Use the `<GeminiChat />` component:

```tsx
import { GeminiChat } from "@/components/GeminiChat";

export const MyPage = () => {
  return <GeminiChat />;
};
```

## Troubleshooting

**"Invalid email or password"**

- Verify credentials in `VITE_AUTH_USERS` environment variable
- Check email and password are correct (case-sensitive for password)
- Make sure JSON format is valid

**"VITE_GEMINI_API_KEY environment variable is not set"**

- Make sure `.env.local` has `VITE_GEMINI_API_KEY` defined
- Restart dev server after adding env variable

**"VITE_AUTH_USERS not configured"**

- Add `VITE_AUTH_USERS` JSON to `.env.local`
- Verify JSON format is valid (use JSONLint to validate)

**API Key not working on Vercel**

- Check Environment Variables in Vercel dashboard
- Ensure all three variables are set: `VITE_GEMINI_API_KEY`, `VITE_AUTH_USERS`, `VITE_DEFAULT_MODEL`
- Verify they are set for correct environments
- Try redeploying the project

**Rate limiting errors**

- Gemini API has usage limits
- Check your usage at [Google AI Studio](https://ai.google.dev)

## Deployment Checklist

Before deploying to Vercel:

- [ ] Gemini API Key obtained from [Google AI Studio](https://ai.google.dev)
- [ ] `.env.local` filled with all required variables
- [ ] Valid JSON in `VITE_AUTH_USERS`
- [ ] Build passes locally: `npm run build`
- [ ] Tested login with at least one user account
- [ ] Vercel Environment Variables configured
- [ ] Project pushed to GitHub

## Available Models

All these models are available through model selector:

- `gemini-2.5-flash` ⭐ (recommended, default)
- `gemini-2.0-flash`
- `gemini-1.5-pro`
- `gemini-1.5-flash`

Change default via `VITE_DEFAULT_MODEL` environment variable.

## Resources

- [Google AI Documentation](https://ai.google.dev/docs)
- [Generative AI Node.js SDK](https://github.com/google/generative-ai-js)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
