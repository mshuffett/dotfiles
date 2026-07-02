"""Transcript-replay regression-eval harness (Claude Agent SDK).

Recreate the exact decision context in which a mistake happened and measure,
across k runs and a condition matrix (e.g. RED = no guardrail, GREEN =
guardrail active), whether a target misbehavior reproduces.
"""

from .core import ReplayConfig, Arm, run_matrix

__all__ = ["ReplayConfig", "Arm", "run_matrix"]
