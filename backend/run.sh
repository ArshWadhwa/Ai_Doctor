#!/bin/bash

# Navigate to backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Detect virtual environment
if [ -d "$SCRIPT_DIR/../.venv" ]; then
    VENV_DIR="$SCRIPT_DIR/../.venv"
elif [ -d "$SCRIPT_DIR/.venv" ]; then
    VENV_DIR="$SCRIPT_DIR/.venv"
else
    VENV_DIR=""
fi

if [ -n "$VENV_DIR" ]; then
    source "$VENV_DIR/bin/activate"
    echo "Using virtual environment at: $VENV_DIR"
fi

# Run FastAPI server with uvicorn
echo "Starting Medly FastAPI Backend on http://0.0.0.0:8000 ..."
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

