# Signals and Systems Virtual Lab

An interactive web project for learning core Signals and Systems concepts with visual simulations and guided explanations.

## Features

- Interactive signal experiments for convolution, decomposition, operations, and signal generation.
- Guided learning components with dynamic graph behavior.
- Built-in tutor/chat endpoint powered by Gemini API with a fallback mode.
- Frontend and backend structure that supports local development and deployment.

## Project Structure

Key folders:

- `public/`: Static frontend assets served by Express.
- `pages/`, `components/`, `js/`: Source files for feature pages and reusable UI logic.
- `backend/`: Separate backend service (default port `5000`) for tutor APIs.
- `server.js`: Main server (default port `3000`) that can serve frontend and API routes.

## Prerequisites

- Node.js 18+ (recommended)
- npm

## Environment Variables

Create `.env` files as needed:

- `project/.env` for the main server.
- `project/backend/.env` for the backend server.

Supported variables:

- `PORT`: Server port (optional).
- `GEMINI_API_KEY`: API key for Gemini-powered tutor responses (optional, fallback mode works without it).
- `NODE_ENV`: Set to `production` in production environments.

## Install Dependencies

From `project/`:

```bash
npm install
```

From `project/backend/`:

```bash
npm install
```

## Run Locally

### Main app server (serves frontend)

From `project/`:

```bash
npm start
```

Default URL: `http://localhost:3000`

### Backend server

From `project/backend/`:

```bash
npm start
```

Default URL: `http://localhost:5000`

In VS Code, you can also use the provided task: `Start Tutor Backend`.

## Screenshots

Add screenshots to a folder such as `project/assets/screenshots/` and reference them here.

Example:

```md
![Home Page](assets/screenshots/home.png)
![Convolution Lab](assets/screenshots/convolution.png)
![Operations Lab](assets/screenshots/operations.png)
```

Tip: Use consistent image sizes for cleaner GitHub rendering.

## Deployment

### Option 1: Single server deployment

Use this if you run the app through `project/server.js`.

1. Install dependencies:

	```bash
	npm install
	```

2. Set environment variables on your host:

	- `NODE_ENV=production`
	- `PORT=<your_port>`
	- `GEMINI_API_KEY=<your_key>` (optional)

3. Start the app:

	```bash
	npm start
	```

### Option 2: Split frontend and backend deployment

Use this if the backend is hosted separately from static frontend assets.

1. Deploy frontend from `project/public` (or through your chosen static hosting flow).
2. Deploy backend service from `project/backend`:

	```bash
	cd backend
	npm install
	npm start
	```

3. Set backend environment variables (`NODE_ENV`, `PORT`, `GEMINI_API_KEY`) in your hosting platform.
4. Ensure frontend API calls point to your deployed backend URL.

## Contributors

Add contributors here:

- Sandeep Sidar (project owner)
- Add contributor names as the team grows

## Notes

- In production, secrets should be provided through platform environment variables.
- If `GEMINI_API_KEY` is not set, chat routes use fallback tutor responses.

## License

Add your preferred license here.
