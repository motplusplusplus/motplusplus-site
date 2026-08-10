"""
Body text must never be truncated by a writer.

WHY THIS EXISTS. `scrape-events.py` carried the line

    body = body[:3000]   # Trim very long (keep first 3000 chars ≈ ~5 paragraphs)

and the two Wayback scrapers carried `return text[:3000]`. Between them they wrote
41 `event.description` values and 5 `event.vnDescription` values into Sanity cut
mid-word at ~3000 characters — "…to reject the traditions of the institut". Nothing
recorded that anything had been removed, so the loss was invisible for as long as
nobody counted characters, and the tails had to be recovered from a Wayback archive
years later. Eleven were recoverable. The rest are still short.

A cap is not a formatting choice. It is silent, permanent data loss at the only
point in the pipeline where the full text was ever in memory.

THE RULE. A writer stores what it extracted. If text is too long for a display,
the display truncates it — at render, reversibly, where the stored value is intact.
Never at write time.

This module is the runtime half of the guard. The static half is
`scripts/check-no-body-truncation.mjs`, wired into `npm run validate`, which fails
if a slice reappears in any writer's source.
"""


class BodyTruncationError(RuntimeError):
    """Raised when a body field looks mechanically cut rather than complete."""


# Round numbers a hand-written cap tends to land on.
SUSPECT_CAPS = (500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 8000, 10000)

# A complete body ends in terminal punctuation, a closing quote, or a bracket.
_TERMINAL = ('.', '!', '?', '"', '”', '’', ')', ']', '…')


def looks_truncated(value: str) -> bool:
    """True when `value` ends at a suspiciously round length AND mid-sentence."""
    if not value:
        return False
    stripped = value.rstrip()
    n = len(stripped)
    if stripped.endswith(_TERMINAL):
        return False
    return any(abs(n - cap) <= 2 for cap in SUSPECT_CAPS)


def assert_untruncated(field: str, value: str, source: str = '') -> str:
    """
    Return `value` unchanged, or raise if it looks like a cap was reintroduced.

    Call this at the point a body field is handed to a writer, passing the URL or
    identifier it came from so a failure names the document it would have damaged.
    """
    if looks_truncated(value):
        raise BodyTruncationError(
            f"{field} is {len(value.rstrip())} chars and ends mid-sentence "
            f"({value.rstrip()[-40:]!r})"
            + (f" — from {source}" if source else '')
            + ".\nThis is the ~3000-char cap signature. A writer must store the full "
              "extracted text; truncate at render instead. See scripts/_bodyguard.py."
        )
    return value
