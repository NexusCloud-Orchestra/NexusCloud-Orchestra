from dataclasses import dataclass

GB = 1024**3


@dataclass(frozen=True)
class ProviderSpec:
    name: str
    free_bytes: int
    inverse_egress: float
    permanent: bool


PROVIDERS = {
    "r2": ProviderSpec("r2", 10 * GB, 1.0, True),
    "oracle": ProviderSpec("oracle", 20 * GB, 1.0, True),
    "b2": ProviderSpec("b2", 10 * GB, 0.8, True),
    "gcp": ProviderSpec("gcp", 5 * GB, 0.2, True),
    "ibm": ProviderSpec("ibm", 25 * GB, 0.8, True),
    "aws": ProviderSpec("aws", 5 * GB, 0.2, False),
    "azure": ProviderSpec("azure", 5 * GB, 0.2, False),
}


@dataclass(frozen=True)
class PlanSpec:
    name: str
    max_connections: int | None
    max_bytes: int | None
    seats: int


PLANS = {
    "free": PlanSpec("free", 2, 5 * GB, 1),
    "starter": PlanSpec("starter", 7, 50 * GB, 1),
    "pro": PlanSpec("pro", None, None, 1),
    "team": PlanSpec("team", None, None, 10),
}
