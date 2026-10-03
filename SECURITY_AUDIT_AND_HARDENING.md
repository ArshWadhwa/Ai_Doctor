# Medly Health AI — Security Audit & Hardening Report

## 1. Executive Summary

A comprehensive application security audit and remediation was performed across both the frontend React client and the FastAPI backend for Medly Health AI. Multiple vulnerabilities ranging from client secret exposure and local file inclusion (LFI) to unbounded upload DoS vectors and verbose console credential leakage were identified and patched.

All vulnerabilities described below have been **fully resolved** in the codebase, and the production frontend bundle has been rebuilt cleanly.

---

## 2. Vulnerabilities Identified & Remediations Applied

### 🚨 Vulnerability 1: Secret Exposure in Client-Side Build
* **Severity:** High
* **Issue:** `frontend/.env` contained `REACT_APP_OPENROUTER_API_KEY=sk-or-v1-...`.
* **Risk & Potential Attack:** In Create React App / Webpack, any environment variable prefixed with `REACT_APP_` is compiled directly into the client-side JavaScript bundle (`build/static/js/main.*.js`). Anyone opening browser devtools or inspecting the network bundle could extract this API key, run up API charges, and abuse OpenRouter AI quotas.
* **Remediation:**
  - Removed `REACT_APP_OPENROUTER_API_KEY` completely from `frontend/.env`.
  - Verified the frontend never calls OpenRouter directly (all AI calls route securely through `backend/main.py`).
  - Rebuilt the frontend bundle and verified zero secret keys exist in the generated assets.
  - *Recommendation:* Rotate this OpenRouter API key in your OpenRouter dashboard since it was previously committed to local config.

---

### 🚨 Vulnerability 2: Arbitrary File Read / Path Traversal (LFI)
* **Severity:** High
* **Location:** `backend/main.py` (`/download-audio/{filename}`)
* **Issue:** The audio download endpoint had the following fallback logic:
  ```python
  elif os.path.exists(safe_name):
      return FileResponse(path=safe_name, media_type="audio/mpeg", ...)
  ```
* **Risk & Potential Attack:** If a user requested `/download-audio/main.py` or `/download-audio/render.yaml`, `safe_name` evaluated to the file name in the current working directory. The server would read and return backend source code or configuration files as an audio stream.
* **Remediation:**
  - Implemented strict filename regex matching: `^[a-zA-Z0-9_\-]+\.mp3$`.
  - Canonicalized the path using `os.path.realpath(AUDIO_DIR)` and `os.path.realpath(...)`.
  - Added an assertion that the resolved file path strictly begins within `AUDIO_DIR`.
  - Completely deleted the dangerous `os.path.exists(safe_name)` fallback.

---

### 🚨 Vulnerability 3: Broken Object Level Authorization (BOLA / IDOR)
* **Severity:** High
* **Location:** `backend/main.py` (`GET /medical-consultation`)
* **Issue:** The endpoint executed `supabase.table("consultations").select("*").limit(limit)` without requiring a `user_id` or authentication check.
* **Risk & Potential Attack:** Any anonymous visitor or malicious actor could send a GET request to `/medical-consultation` and view every patient's private consultations, symptoms, transcriptions, and clinical analyses in the entire database.
* **Remediation:**
  - Mandated the `user_id` query parameter for record fetching.
  - Enforced strict UUID format validation (`is_valid_uuid`).
  - Scoped the database query strictly to the requesting user: `.eq("user_id", user_id)`.

---

### 🚨 Vulnerability 4: Denial of Service (DoS) via Unbounded File Uploads
* **Severity:** Medium
* **Location:** `backend/main.py` (`/transcribe-audio`, `/analyze-image`, `/medical-consultation`, `/text-to-speech`)
* **Issue:** Uploaded files (`audio.read()`, `image.read()`) were read into server RAM with no maximum file size limit, and input text had no upper bound.
* **Risk & Potential Attack:** An attacker could upload a 500MB+ audio or image payload, causing memory exhaustion (OOM), crashing the Python process, or submitting massive strings to exhaust ElevenLabs/gTTS/LLM tokens.
* **Remediation:**
  - Set `MAX_AUDIO_SIZE_BYTES = 15 * 1024 * 1024` (15 MB maximum). Returns `413 Payload Too Large` if exceeded.
  - Set `MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024` (10 MB maximum). Returns `413 Payload Too Large` if exceeded.
  - Enforced image MIME-type allowlist: `image/jpeg`, `image/png`, `image/webp`.
  - Set `MAX_TEXT_INPUT_LENGTH = 4000` characters for consultation descriptions and speech generation.
  - Set `MAX_CHAT_MESSAGE_LENGTH = 1000` characters for health insights chat queries.

---

### 🚨 Vulnerability 5: Sensitive Credential & Session Logging in Browser Console
* **Severity:** Medium
* **Location:** `frontend/src/services/supabase.ts`, `database.ts`, `api.ts`, `AuthContext.tsx`
* **Issue:** The frontend was printing sensitive debug logs to the browser console:
  - `console.log('Supabase signIn called with:', { email, passwordLength: password.length })`
  - `console.log('Sign up successful, user:', result.data?.user)` (dumped full user record, identity tokens, and metadata)
  - `console.log('Supabase Config:', { url: supabaseUrl, keyLength: supabaseAnonKey.length })`
  - `console.log('API Base URL:', API_BASE_URL)`
* **Risk & Potential Attack:** Anyone looking at DevTools (or malicious browser extensions capturing console events) could observe user email addresses, password character lengths, and full user metadata. It also looked unpolished and unprofessional.
* **Remediation:**
  - Removed all `console.log` statements leaking credentials, user objects, or configuration data.
  - Verified with `grep` that zero `console.log` statements remain in `frontend/src`.

---

### 🚨 Vulnerability 6: Unsanitized UUIDs and Parameter Injection
* **Severity:** Low-Medium
* **Location:** `backend/main.py` (`/api/health-insights/*`)
* **Issue:** `user_id` was accepted as an arbitrary string and passed into database query filters without format validation.
* **Risk & Potential Attack:** Unexpected input formats or injection strings could cause unhandled server exceptions or unintended database lookups.
* **Remediation:**
  - Added standard UUID validator:
    ```python
    def is_valid_uuid(val: str) -> bool:
        return bool(re.match(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$', val.strip()))
    ```
  - Validated all `user_id` route and body parameters across `/medical-consultation`, `/api/health-insights/{user_id}`, `/api/health-insights`, and `/api/health-insights/chat`.

---

### 🚨 Vulnerability 7: Verbose Server Startup Credential Logging
* **Severity:** Low
* **Location:** `backend/main.py`
* **Issue:** The backend printed partial keys, key lengths, and raw proxy debug outputs directly to stdout on every server start.
* **Remediation:** Replaced debug print statements with standard, sanitized Python logging (`logger.info("Supabase client initialized successfully")`).

---

## 3. Files Modified During Hardening

| File | Changes Made |
| :--- | :--- |
| `frontend/.env` | Removed leaked `REACT_APP_OPENROUTER_API_KEY`. |
| `frontend/src/services/database.ts` | Removed config console logs. |
| `frontend/src/services/supabase.ts` | Removed auth credential and response logging. |
| `frontend/src/services/api.ts` | Removed development / production mode console logs. |
| `frontend/src/contexts/AuthContext.tsx` | Removed user object and email console logs. |
| `backend/main.py` | Added file size limits, MIME type validation, UUID validation, fixed LFI in audio downloads, and secured consultation access control. |
| `frontend/build/` | Recompiled production bundle with all security fixes applied. |

---

## 4. Operational Best Practices & Next Steps

1. **Rotate the OpenRouter API Key:** Since the OpenRouter key was previously placed in `frontend/.env`, log into your [OpenRouter Dashboard](https://openrouter.ai/keys) and regenerate it. Place the new key exclusively in `backend/.env` or your Render deployment environment variables.
2. **Supabase Row Level Security (RLS):** Ensure that Row Level Security is enabled on your `consultations` table in Supabase so that clients querying directly with the anon key can only read and insert their own records (`auth.uid() = user_id`).
