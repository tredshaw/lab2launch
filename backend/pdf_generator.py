"""PDF generation via WeasyPrint — renders an HTML template (Jinja2) to a
print-friendly A4 portrait PDF that mirrors the live site's design tokens
(cream bg, navy ink, lime accents).

System dependencies (Pango, Cairo, HarfBuzz) are installed via Homebrew
locally and via apt in the Render build command — see render.yaml.

macOS dev caveat: SIP strips DYLD_LIBRARY_PATH from processes spawned via
the Apple Command Line Tools Python (which the project's venv is built
on). When that happens, WeasyPrint's `from .text.ffi import pango` can't
locate libgobject. We work around this by detecting macOS, scanning a
small set of common Homebrew lib roots for the dylibs we need, and
patching ctypes.util.find_library to return their absolute paths. On
Linux (Render production), this code path is a no-op.
"""
import os
import sys
from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

_TEMPLATES_DIR = Path(__file__).parent / "templates"


def _patch_macos_dlopen_paths() -> None:
    """On macOS, monkey-patch ctypes.util.find_library so WeasyPrint can
    resolve Pango/Cairo/HarfBuzz dylibs even when DYLD_LIBRARY_PATH is
    stripped by SIP. No-op everywhere else.
    """
    if sys.platform != "darwin":
        return

    candidates = [Path("/opt/homebrew/lib"), Path("/usr/local/lib")]
    lib_root = next((p for p in candidates if p.is_dir()), None)
    if lib_root is None:
        return

    name_map = {
        "gobject-2.0":     "libgobject-2.0.0.dylib",
        "gobject-2.0-0":   "libgobject-2.0.0.dylib",
        "libgobject-2.0-0":"libgobject-2.0.0.dylib",
        "pango-1.0":       "libpango-1.0.0.dylib",
        "pango-1.0-0":     "libpango-1.0.0.dylib",
        "libpango-1.0-0":  "libpango-1.0.0.dylib",
        "pangoft2-1.0":    "libpangoft2-1.0.0.dylib",
        "pangoft2-1.0-0":  "libpangoft2-1.0.0.dylib",
        "libpangoft2-1.0-0":"libpangoft2-1.0.0.dylib",
        "harfbuzz":        "libharfbuzz.0.dylib",
        "harfbuzz-0":      "libharfbuzz.0.dylib",
        "fontconfig":      "libfontconfig.1.dylib",
        "fontconfig-1":    "libfontconfig.1.dylib",
        "libfontconfig-1": "libfontconfig.1.dylib",
        "cairo":           "libcairo.2.dylib",
        "cairo-2":         "libcairo.2.dylib",
        "libcairo-2":      "libcairo.2.dylib",
    }

    import ctypes.util as _ctu
    _orig = _ctu.find_library

    def _patched(name: str):
        result = _orig(name)
        if result:
            return result
        target = name_map.get(name)
        if not target:
            return None
        path = lib_root / target
        return str(path) if path.exists() else None

    _ctu.find_library = _patched


_patch_macos_dlopen_paths()

_DIM_LABELS = [
    ("problem_clarity",      "Problem clarity"),
    ("market_evidence",      "Market evidence"),
    ("competitive_position", "Competitive position"),
    ("team_execution",       "Team & execution"),
    ("risk_awareness",       "Risk awareness"),
]

_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)


def generate_pdf(analysis: dict, project_name: str = "Research Project") -> bytes:
    """Render the gap-analysis report as a PDF.

    `analysis` is the same JSON shape the React Results page consumes:
      plain_english_summary, total_score, stage_label, top_3_actions[],
      dimensions{problem_clarity, market_evidence, ...}, assets[].
    """
    from weasyprint import HTML  # lazy — see module docstring

    template = _env.get_template("pdf_report.html")
    html_str = template.render(
        project_name=project_name or "Untitled project",
        result=analysis or {},
        dim_labels=_DIM_LABELS,
        generated_date=datetime.utcnow().strftime("%-d %b %Y"),
        css_path=str(_TEMPLATES_DIR / "pdf_report.css"),
    )
    return HTML(string=html_str, base_url=str(_TEMPLATES_DIR)).write_pdf()
