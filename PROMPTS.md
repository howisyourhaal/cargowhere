# Project Development Prompts

This document collates all prompts used during the development of **ParkSG** (Singapore Real-Time Carpark Availability Tracker).

---

## Prompt 1: Initial App Build (Frontend Only)

**Request:**
> build a Singapore based carpark app that tracks real time carpark lots availability. build just the frontend for now. I will integrate the backend later.

**Key Deliverables:**
- Interactive Singapore Leaflet Map with custom markers showing available lots and quick zone jumps.
- Real-time lot capacity tracker with percentage gauges and 30-second live polling/simulation.
- Singapore parking fee calculator incorporating HDB, URA, and Mall rate tiers.
- Grace period detector (10–15 mins free) and Sunday Free Parking Scheme detection.
- Parking duration and grace period countdown timer.
- Detailed carpark drawer with 24-hour occupancy trends and direct navigation links.

---

## Prompt 2: GitHub Repository Push

**Request:**
> git push https://[REDACTED_GITHUB_TOKEN]@github.com/howisyourhaal/cargowhere.git

*(Note: Personal access token redacted for security.)*

**Key Deliverables:**
- Initialized Git repository with `main` branch.
- Committed all source code, assets, configurations, and documentation.
- Pushed complete project codebase to `https://github.com/howisyourhaal/cargowhere.git`.

---

## Prompt 3: Serverless LTA DataMall Backend Connection

**Request:**
> 1. Add a server less connection that pulls live data from LTA datamall using the following endpoint:
>
>    ```
>    # Live carpark lots (HDB, LTA and URA):
>    https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
>
>    # Every request needs the header:  AccountKey: <LTA_ACCOUNT_KEY>
>    ```
>
> 2. Store this in /api folder at project root level (not src file)
>
> 3. Include /health.ts and /carparkavailablity.ts within the same sub folder
>
> 4. Do not hardcode any key, I will input them later.

**Key Deliverables:**
- Created `/api/carparkavailablity.ts` connecting to LTA DataMall v2 with dynamic `AccountKey` header from environment variables.
- Created `/api/health.ts` for health checks and LTA configuration status.
- Created `server.ts` mounting `/api` handlers with `vite.middlewares` for full-stack local development.
- Documented `LTA_ACCOUNT_KEY` in `.env.example` without hardcoding any keys.
- Connected frontend `carparkService` to consume `/api/carparkavailablity` live data.

---

## Prompt 4: Error Resolution & Iframe Hardening

**Request:**
> Fix the errors in the app
> `error 0: @https://ais-dev-...run.app/@vite/client:234:39`

**Key Deliverables:**
- Attached HTTP server and disabled HMR WebSocket in `server.ts` to eliminate `WebSocket closed without opened` error in Cloud Run iframe environment.
- Added unhandled rejection listener in `index.html` to suppress harmless WebSocket close events.
- Replaced `window.alert()` with graceful non-blocking fallback in `App.tsx`.
- Converted `window.open()` calls to standard `<a target="_blank" rel="noopener noreferrer">` links to prevent iframe sandbox popup blocks.

---

## Prompt 5: Collate Prompts

**Request:**
> collate all of the prompts and store them as a PROMPTS.md file

**Key Deliverables:**
- Created `/PROMPTS.md` containing the complete chronological record of development prompts, deliverables, and architecture decisions.
