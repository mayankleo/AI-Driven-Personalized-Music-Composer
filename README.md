
# AI Music Composer

This repository contains an AI-based music composer with separate backend and frontend components. The backend (Python) trains LSTM models on MIDI-derived datasets and generates new music; the frontend (TypeScript + Vite + React) provides a lightweight UI and MIDI playback.

## Goals

- Train sequence models (LSTM) on note/probability sequences derived from MIDI files.
- Provide generation tools to synthesize new MIDI files from trained models.
- Offer a simple frontend to trigger generation and preview/play MIDI output in the browser.

## Prerequisites

- Python 3.8+ (for backend)
- Node.js 16+ / npm (for frontend)
- Recommended (Python packages that the backend may require): `numpy`, `tensorflow`/`keras`, `music21`, `mido` or `pretty_midi`, and `flask`

## Quick start — Backend (PowerShell)

1. (Optional) Create and activate a virtual environment:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
```

2. Install typical packages:

```powershell
pip install -r requirements.txt
```

3. Train a model (example):

```powershell
python trainModel.py
```

Check `trainModel.py` for hyperparameters (epochs, batch size, dataset path). Trained model files are typically saved to `models/`.

4. Generate music from a trained model (example):

```powershell
python generateMusic.py
```

Generated MIDI files are written to the `output/` directory by default.

5. Run the server (if you want the frontend to talk to the backend):

```powershell
python serverapp.py
```

The `serverapp.py` file exposes endpoints the frontend can call (for generation or listing outputs). Open the file to confirm host/port (defaults are commonly `localhost:5000`).

## Quick start — Frontend (PowerShell)

1. From the `ai-music-composer-frontend` directory, install dependencies:

```powershell
cd ai-music-composer-frontend; npm install
```

2. Start the dev server:

```powershell
npm run dev
```

This should open a Vite dev server (often at `http://localhost:5173`). The frontend includes a small MIDI player (`src/MidiPlayer.tsx`) and communicates with the backend's endpoints in `service.ts`.

## Configuration

- Backend dataset path: edit the dataset paths in `trainModel.py` or the top of `generateMusic.py` depending on need.
- Port/host: edit `serverapp.py` to change default host/port or CORS settings for local development.

## Project-specific notes

- If training fails due to GPU memory or TensorFlow version mismatch, try lowering batch size or switching to CPU-only execution (set `TF_CPP_MIN_LOG_LEVEL` or install a CPU-only TensorFlow wheel).

## Troubleshooting

- Error: missing package -> Inspect the top of the failing script for the missing import and pip install it.
- Error: no model files found -> Run `trainModel.py` to produce model checkpoints in `models/` first.
- CORS / frontend can't reach backend -> Ensure `serverapp.py` allows cross-origin requests or proxy dev server requests to the backend in Vite config.

