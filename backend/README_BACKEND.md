# Ghost Mode — Backend

Small **Node.js + Express** API for the AI Coach. Your phone talks to **this server** — never to OpenAI directly. Your OpenAI key stays in `backend/.env` on your computer only.

## What it does

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Check if the server is running (and if OpenAI is configured) |
| `POST /chat` | Get a coach reply — **real OpenAI** when configured, **mock** as fallback |

Crisis phrases (self-harm, suicide, etc.) always return the **988 safety message** — never AI coaching.

---

## Beginner setup (step by step)

### 1. Install Node.js

If you do not have Node yet, download it from [nodejs.org](https://nodejs.org) (LTS version is fine).

### 2. Install backend packages

Open a terminal in the Ghost Mode project folder:

```bash
cd backend
npm install
```

### 3. Add your OpenAI API key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys) and create a key.
2. Copy `backend/.env.example` to `backend/.env`:

   ```bash
   copy .env.example .env
   ```

   (On Mac/Linux: `cp .env.example .env`)

3. Open `backend/.env` in a text editor and paste your key:

   ```env
   OPENAI_API_KEY=sk-your-real-key-here
   PORT=3001
   ```

**Important:** Never put this key in the mobile app, `app.json`, or GitHub. Only in `backend/.env`.

### 4. Start the server

```bash
npm start
```

You should see:

```
Ghost Mode backend running on http://localhost:3001
OpenAI connected — real AI replies when the API succeeds.
```

If you skipped the key, you will see a warning and the server still runs with **mock replies only**.

### 5. Connect your phone (Expo Go)

1. Your PC and iPhone must be on the **same Wi‑Fi**.
2. Find your PC’s IP (Windows: `ipconfig`, look for IPv4 like `192.168.x.x` or `10.0.x.x`).
3. In the project root `.env` (or in `services/aiService.js`), set:

   ```env
   EXPO_PUBLIC_COACH_API_URL=http://YOUR_PC_IP:3001
   ```

4. Restart Expo: `npx expo start --clear`
5. Open **AI Coach** — status should show **Backend connected**.

If the backend is off or unreachable, the app uses **built-in mock replies** (no crash).

---

## Endpoints

### `GET /health`

**With OpenAI key:**

```json
{ "ok": true, "mode": "openai", "openaiConfigured": true }
```

**Without key (mock only):**

```json
{ "ok": true, "mode": "mock", "openaiConfigured": false }
```

### `POST /chat`

**Body:**

```json
{
  "messages": [
    { "role": "user", "content": "I miss them" }
  ]
}
```

**Response (OpenAI success):**

```json
{
  "reply": "…real AI coach text…",
  "crisis": false,
  "source": "backend",
  "mode": "openai"
}
```

**Response (mock fallback — no key or OpenAI error):**

```json
{
  "reply": "…mock coach text…",
  "crisis": false,
  "source": "backend",
  "mode": "mock"
}
```

**Crisis response:**

```json
{
  "reply": "Ghost Mode is not crisis support…",
  "crisis": true,
  "source": "backend",
  "mode": "mock"
}
```

---

## How replies are chosen

1. **Crisis check first** — safety message, no OpenAI call.
2. **OpenAI** — if `OPENAI_API_KEY` is set and the API works.
3. **Mock fallback** — if the key is missing, OpenAI errors, or the network fails.

The mobile app also has its own mock fallback if the whole backend is unreachable.

---

## AI personality

The coach is configured to be:

- Supportive breakup recovery coach
- **Not** a therapist
- Short, calm, emotionally intelligent
- Encourages no-contact, journaling, breathing, and waiting before texting

Instructions live in `backend/coachPrompt.js` (server-side only).

---

## Project files

| File | What it does |
|------|----------------|
| `server.js` | Starts Express, `/health`, mounts chat routes |
| `routes/chat.js` | `POST /chat` — crisis check, OpenAI, mock fallback |
| `openaiCoach.js` | Calls OpenAI SDK (key from `.env` only) |
| `coachPrompt.js` | Coach personality / system prompt |
| `crisisSafety.js` | Detects crisis language, returns 988 message |
| `mockCoach.js` | Backup replies when OpenAI is off or fails |
| `.env` | Your secrets (OpenAI key) — **never commit** |

---

## Security

- API keys stay in `backend/.env` on your machine or hosting provider
- Do **not** put secrets in the React Native app or commit `.env` files
- Add `backend/.env` to `.gitignore` if it is not already ignored

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| App says “Offline · App mock” | Start backend (`npm start`), same Wi‑Fi, correct IP in app |
| Always mock replies from backend | Check `OPENAI_API_KEY` in `backend/.env`, restart server |
| OpenAI errors in terminal | Check billing/credits at platform.openai.com; mock still works |
| `npm install` fails | Run from `backend/` folder, Node 18+ recommended |
