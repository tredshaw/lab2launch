#!/bin/bash
# Lab2Launch dev server — sets Homebrew lib path for WeasyPrint (macOS)
export DYLD_LIBRARY_PATH="/opt/homebrew/lib:${DYLD_LIBRARY_PATH}"
exec venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8000
