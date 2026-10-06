import awsIcon from '../assets/cloud-icons/aws.svg';
import azureIcon from '../assets/cloud-icons/azure.svg';
import gcpIcon from '../assets/cloud-icons/google-cloud.svg';
import r2Icon from '../assets/cloud-icons/cloudflare.svg';
import b2Icon from '../assets/cloud-icons/backblaze.svg';
import ociIcon from '../assets/cloud-icons/oracle.svg';

const META = {
  aws: { name: 'Amazon S3', icon: awsIcon },
  azure: { name: 'Azure Blob', icon: azureIcon },
  gcp: { name: 'Google Cloud Storage', icon: gcpIcon },
  r2: { name: 'Cloudflare R2', icon: r2Icon },
  b2: { name: 'Backblaze B2', icon: b2Icon },
  oracle: { name: 'Oracle OCI', icon: ociIcon },
  ibm: { name: 'IBM Cloud Object Storage', icon: null },
};

export function providerMeta(id) {
  return META[id] || { name: id || 'Provider', icon: null };
}

export function ProviderIcon({ provider, size = 32 }) {
  const meta = providerMeta(provider);
  if (meta.icon) {
    return <img src={meta.icon} alt={meta.name} width={size} height={size} style={{ width: size, height: size }} />;
  }
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--accent-soft)',
        color: 'var(--accent)',
        fontWeight: 800,
        fontSize: size * 0.42,
      }}
      aria-label={meta.name}
    >
      {(provider || '?').slice(0, 2).toUpperCase()}
    </span>
  );
}
