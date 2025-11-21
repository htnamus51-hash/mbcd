"""
Monkeypatch for Pydantic v1 + Python 3.13 compatibility.
Fixes: ForwardRef._evaluate() missing 'recursive_guard' keyword argument.
"""
import sys
from typing import ForwardRef, Any, cast

if sys.version_info >= (3, 13):
    # Python 3.13+ requires recursive_guard as keyword-only argument
    original_evaluate_forwardref = None

    def patched_evaluate_forwardref(type_: ForwardRef, globalns: Any, localns: Any) -> Any:
        """Evaluate ForwardRef with Python 3.13 compatibility."""
        return cast(Any, type_)._evaluate(globalns, localns, recursive_guard=set())

    # Patch the pydantic typing module
    try:
        from pydantic import typing as pydantic_typing
        pydantic_typing.evaluate_forwardref = patched_evaluate_forwardref
    except Exception as e:
        print(f"Warning: Could not apply Pydantic patch: {e}")
