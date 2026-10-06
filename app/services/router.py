from dataclasses import dataclass

from app.services.catalog import PROVIDERS

WEIGHT_CAPACITY = 0.40
WEIGHT_EGRESS = 0.30
WEIGHT_PERMANENCE = 0.20
WEIGHT_FIT = 0.10


@dataclass(frozen=True)
class Candidate:
    connection: object
    free_bytes: int


@dataclass(frozen=True)
class Evaluation:
    """Score components for one candidate, each already multiplied by its weight."""
    candidate: Candidate
    eligible: bool
    capacity: float = 0.0
    egress: float = 0.0
    permanence: float = 0.0
    fit: float = 0.0

    @property
    def score(self) -> float | None:
        if not self.eligible:
            return None
        return self.capacity + self.egress + self.permanence + self.fit


class SmartRouter:
    """Deterministic weighted placement policy from PRD FR-001."""

    def evaluate(self, candidates: list[Candidate], size_bytes: int) -> list[Evaluation]:
        max_free = max((c.free_bytes for c in candidates if c.free_bytes >= size_bytes), default=0)
        results = []
        for candidate in candidates:
            if candidate.free_bytes < size_bytes or max_free == 0:
                results.append(Evaluation(candidate, False))
                continue
            spec = PROVIDERS[candidate.connection.provider]
            results.append(Evaluation(
                candidate, True,
                capacity=WEIGHT_CAPACITY * candidate.free_bytes / max_free,
                egress=WEIGHT_EGRESS * spec.inverse_egress,
                permanence=WEIGHT_PERMANENCE * (1.0 if spec.permanent else 0.5),
                fit=WEIGHT_FIT * (candidate.free_bytes - size_bytes) / candidate.free_bytes,
            ))
        return results

    @staticmethod
    def best(evaluations: list[Evaluation]) -> Evaluation | None:
        eligible = [e for e in evaluations if e.eligible]
        if not eligible:
            return None
        return max(eligible, key=lambda e: (e.score, str(e.candidate.connection.id)))

    def select(self, candidates: list[Candidate], size_bytes: int) -> Candidate | None:
        chosen = self.best(self.evaluate(candidates, size_bytes))
        return chosen.candidate if chosen else None
