"""Cross-package access to the shared recurrence domain logic.

The mobile clients talk to this backend over HTTP; the backend itself reuses
the recurrence math already implemented and tested in the top-level
``household_tracker`` package instead of duplicating it.
"""
from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from household_tracker.models import RecurrenceRule, RecurrenceType  # noqa: E402

__all__ = ["RecurrenceRule", "RecurrenceType"]
