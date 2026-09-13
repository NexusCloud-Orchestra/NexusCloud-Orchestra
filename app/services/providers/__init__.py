from app.models.connection import Provider
from app.services.providers.base import BaseProvider, SimulatedProvider
from app.services.providers.aws import AWSProvider
from app.services.providers.gcp import GCPProvider
from app.services.providers.r2 import R2Provider
from app.services.providers.azure import AzureProvider


def get_provider(provider: Provider, bucket_name: str, credentials: dict, region: str | None = None) -> BaseProvider:
    if provider == Provider.AWS:
        return AWSProvider(bucket_name, credentials, region)
    elif provider == Provider.GCP:
        return GCPProvider(bucket_name, credentials, region)
    elif provider == Provider.R2:
        return R2Provider(bucket_name, credentials, region)
    elif provider == Provider.AZURE:
        return AzureProvider(bucket_name, credentials, region)
    else:
        # B2, Oracle, IBM fallback to SimulatedProvider
        return SimulatedProvider(bucket_name, credentials, region)
