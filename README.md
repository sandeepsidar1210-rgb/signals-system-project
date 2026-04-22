# Signals and Systems Virtual Lab 🎛️📈

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-2F855A?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js 18+" />
  <img src="https://img.shields.io/badge/Frontend-Interactive-2563EB?style=for-the-badge" alt="Interactive Frontend" />
  <img src="https://img.shields.io/badge/Focus-Signals%20%26%20Systems-0F766E?style=for-the-badge" alt="Signals and Systems" />
  <img src="https://img.shields.io/badge/Learning-Visual%20First-DC2626?style=for-the-badge" alt="Visual First Learning" />
</p>

<p align="center">
  An interactive, simulation-driven lab for learning <strong>Signals and Systems</strong> through visual experiments,
  guided explanations, and hands-on signal analysis.
</p>

---

## 📚 Table of Contents

- [Why This Project](#why-this-project)
- [Feature Highlights](#feature-highlights)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Screenshot Gallery](#screenshot-gallery)
- [Deployment](#deployment)
- [Security Notes](#security-notes)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Why This Project

Signals and Systems concepts become clearer when learners can manipulate and visualize signals directly. This project provides a virtual lab where students can:

- 📊 Generate and inspect signals.
- 🔁 Explore convolution and decomposition interactively.
- 🧪 Test operations step-by-step with immediate visual feedback.
- 🤖 Use a tutor/chat backend for guided support.

## ✨ Feature Highlights

- 🎯 Interactive modules: convolution, decomposition, operations, signal generation, experiments.
- 🧩 Reusable UI system: graph components, explanation panels, guided learning blocks.
- 🖥️ Two-server architecture: main app + optional tutor backend.
- 🏫 Classroom-ready setup for local labs and lightweight deployment.

## 🛠️ Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| Optional AI | Gemini API |
| Tooling | npm, VS Code tasks |

## 🗂️ Project Structure

| Path | Description |
| --- | --- |
| `public/` | Static frontend assets served by Express |
| `pages/` | Topic pages (convolution, decomposition, operations, etc.) |
| `components/` | Reusable UI blocks |
| `js/` | Signal processing and page logic scripts |
| `backend/` | Tutor/chat backend service |
| `server.js` | Main app entry point |

## ⚡ Quick Start

### 1. ✅ Prerequisites

- Node.js 18+
- npm

### 2. 📦 Install Dependencies

```bash
# from project/
npm install

# from project/backend/
npm install
```

### 3. ▶️ Run the Main App

```bash
# from project/
npm start
```

Main app: http://localhost:3000

### 4. 🤖 Run the Tutor Backend

```bash
# from project/backend/
npm start
```

Backend API: http://localhost:5000

You can also run the VS Code task: **Start Tutor Backend**.

## 🖼️ Screenshot Gallery

These screenshots highlight key parts of the platform experience.

Using images from the `screenshot/` folder:

- `home.png`
- `ai-tutor.png`
- `convolution-lab.png`
- `test-yourself.png`

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="https://raw.githubusercontent.com/sandeepsidar1210-rgb/signals-system-project/main/screenshot/home.png" alt="Home dashboard with hero section and signal preview" width="100%" />
      <p><strong>🏠 Home Experience</strong><br/>Beautiful landing page with navigation, hero CTA, and live signal preview.</p>
    </td>
    <td width="50%" valign="top">
      <img src="https://raw.githubusercontent.com/sandeepsidar1210-rgb/signals-system-project/main/screenshot/ai-tutor.png" alt="AI Tutor chat interface explaining convolution" width="100%" />
      <p><strong>🤖 AI Tutor</strong><br/>In-context assistant for conceptual explanations and graph-based guidance.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="https://raw.githubusercontent.com/sandeepsidar1210-rgb/signals-system-project/main/screenshot/convolution-lab.png" alt="Convolution lab with custom signals and output graph" width="100%" />
      <p><strong>🌊 Convolution Lab</strong><br/>Custom signal inputs, parameter controls, and multi-plot output visualization.</p>
    </td>
    <td width="50%" valign="top">
      <img src="https://raw.githubusercontent.com/sandeepsidar1210-rgb/signals-system-project/main/screenshot/test-yourself.png" alt="Self assessment interface with MCQ and scoring" width="100%" />
      <p><strong>📝 Self Assessment</strong><br/>Quiz-based learning with progress, difficulty, and score tracking.</p>
    </td>
  </tr>
</table>

## 🚢 Deployment

### Option A: Single Service 🌐

1. Deploy from `project/`.
2. Install dependencies.
3. Set runtime environment variables.
4. Run `npm start`.

### Option B: Split Frontend + Backend 🔀

1. Deploy frontend assets from `project/`.
2. Deploy backend from `project/backend/`.
3. Configure frontend API base URL for deployed backend.

## 🔐 Security Notes

- 🔒 Never commit real secrets in `.env` files.
- 🧰 Keep credentials in local env vars or platform secret stores.
- 📝 Use placeholders in docs.

Example environment variables:

```env
PORT=<app_port>
NODE_ENV=production
GEMINI_API_KEY=<optional_api_key>
```

## 🤝 Contributing

- 🎨 Improve visualizations and learning flow.
- 🧠 Add new signal experiments.
- 📘 Expand guided learning explanations.

PRs are welcome.

## 📄 License

Add your preferred license text (MIT is a common choice).
