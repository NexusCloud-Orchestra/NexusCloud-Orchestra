from app.models.connection import Provider
from app.services.providers.base import BaseProvider, SimulatedProvider
from app.services.providers.aws import AWSProvider
from app.services.providers.gcp import GCPProvider
from app.services.providers.r2 import R2Provider
from app.services.providers.azure import AzureProvider


def get_provider(provider: Provider, credentials: dict, region: str | None = None) -> BaseProvider:
    if provider == Provider.AWS:
        return AWSProvider(credentials, region)
    elif provider == Provider.GCP:
        return GCPProvider(credentials)
    elif provider == Provider.R2:
        return R2Provider(credentials, region)
    elif provider == Provider.AZURE:
        return AzureProvider(credentials)
    else:
        # B2, Oracle, IBM fallback to SimulatedProvider
        return SimulatedProvider()
