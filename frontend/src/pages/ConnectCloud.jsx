import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CloudUpload, CheckCircle2 } from 'lucide-react';
import { catalogApi, connectionApi } from '../lib/api';
import { formatBytes, detailsToFieldErrors } from '../lib/utils';
import { ProviderIcon, providerMeta } from '../components/providers';
import Alert from '../components/Alert';

// Credential fields per the API contract's provider table.
const PROVIDER_FORMS = {
  aws: {
    region: { required: true, hint: 'AWS region, e.g. us-east-1' },
    credentials: [
      { key: 'aws_access_key_id', label: 'Access key ID', placeholder: 'AKIAIOSFODNN7EXAMPLE' },
      { key: 'aws_secret_access_key', label: 'Secret access key', placeholder: '', secret: true },
    ],
  },
  r2: {
    region: { required: false, hint: 'Optional for R2' },
    credentials: [
      { key: 'account_id', label: 'Account ID', placeholder: '32 hex characters' },
      { key: 'aws_access_key_id', label: 'Access key ID', placeholder: 'R2 access key' },
      { key: 'aws_secret_access_key', label: 'Secret access key', placeholder: '', secret: true },
    ],
  },
  b2: {
    region: { required: true, hint: 'B2 S3 region, e.g. us-west-004' },
    credentials: [
      { key: 'aws_access_key_id', label: 'Application key ID', placeholder: '' },
      { key: 'aws_secret_access_key', label: 'Application key', placeholder: '', secret: true },
    ],
  },
  ibm: {
    region: { required: true, hint: 'IBM COS region, e.g. us-south' },
    credentials: [
      { key: 'aws_access_key_id', label: 'Access key ID', placeholder: '' },
      { key: 'aws_secret_access_key', label: 'Secret access key', placeholder: '', secret: true },
    ],
  },
  azure: {
    region: { required: false, hint: 'Optional; bucket name is the container' },
    credentials: [
      { key: 'account_name', label: 'Storage account name', placeholder: '' },
      { key: 'account_key', label: 'Account key', placeholder: '', secret: true },
    ],
  },
  gcp: {
    region: { required: false, hint: 'Optional' },
    credentials: [
      { key: 'service_account_json', label: 'Service account JSON', placeholder: '{ "type": "service_account", ... }', multiline: true, secret: true },
    ],
  },
  oracle: {
    region: { required: true, hint: 'OCI region, e.g. ap-mumbai-1' },
    credentials: [
      { key: 'tenancy_id', label: 'Tenancy OCID', placeholder: 'ocid1.tenancy.oc1...' },
      { key: 'user_id', label: 'User OCID', placeholder: 'ocid1.user.oc1...' },
      { key: 'fingerprint', label: 'API key fingerprint', placeholder: '' },
      { key: 'namespace', label: 'Namespace', placeholder: '' },
      { key: 'private_key', label: 'Private key (PEM)', placeholder: '-----BEGIN PRIVATE KEY-----', multiline: true, secret: true },
    ],
  },
};

const STEPS = ['Provider', 'Credentials', 'Done'];

export default function ConnectCloud() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [catalog, setCatalog] = useState([]);
  const [provider, setProvider] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [bucketName, setBucketName] = useState('');
  const [region, setRegion] = useState('');
  const [creds, setCreds] = useState({});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    catalogApi.providers().then((p) => setCatalog(p || [])).catch(() => setCatalog([]));
  }, []);

  const form = provider ? PROVIDER_FORMS[provider] : null;
  const freeBytes = useMemo(
    () => catalog.find((p) => p.name === provider)?.free_bytes,
    [catalog, provider]
  );

  const selectProvider = (id) => {
    setProvider(id);
    setCreds({});
    setRegion('');
    setErrors({});
    setError('');
  };

  const validate = () => {
    const next = {};
    if (!displayName.trim()) next.display_name = 'Give this connection a name.';
    if (!bucketName.trim()) next.bucket_name = 'Bucket / container name is required.';
    if (form?.region.required && !region.trim()) next.region = 'Region is required for this provider.';
    (form?.credentials || []).forEach((c) => {
      if (!String(creds[c.key] || '').trim()) next[c.key] = `${c.label} is required.`;
    });
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setErrors({});
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        provider,
        display_name: displayName.trim(),
        bucket_name: bucketName.trim(),
        region: region.trim() || undefined,
        credentials: Object.fromEntries(
          Object.entries(creds).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
        ),
      };
      const conn = await connectionApi.create(payload);
      setCreated(conn);
      setStep(2);
    } catch (err) {
      if (err.status === 502) {
        setError('The provider rejected the connection. Check credentials, bucket access, region and the bucket CORS policy.');
      } else {
        setError(err.message || 'Could not create the connection.');
      }
      setErrors((prev) => ({ ...prev, ...detailsToFieldErrors(err.details) }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content-wrapper" style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Connect a cloud</h1>
          <p className="page-subtitle">
            Credentials are encrypted with AES-256-GCM and never displayed again after this form.
          </p>
        </div>
      </div>

      <ol className="wizard-steps">
        {STEPS.map((label, i) => (
          <li key={label} className={`wizard-step${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}>
            <span className="wizard-dot">{i < step ? '✓' : i + 1}</span> {label}
          </li>
        ))}
      </ol>

      {error ? <Alert type="error">{error}</Alert> : null}

      {step === 0 ? (
        <div className="grid grid-3">
          {Object.keys(PROVIDER_FORMS).map((id) => {
            const spec = catalog.find((p) => p.name === id);
            return (
              <button
                key={id}
                type="button"
                className={`card provider-tile${provider === id ? ' selected' : ''}`}
                onClick={() => selectProvider(id)}
                style={{ textAlign: 'left', cursor: 'pointer', border: provider === id ? '1px solid var(--accent)' : undefined }}
              >
                <ProviderIcon provider={id} size={34} />
                <div>
                  <div className="provider-tile-name">{providerMeta(id).name}</div>
                  <div className="provider-tile-meta">
                    {spec ? `~${formatBytes(spec.free_bytes)} free tier (estimate)` : 'Free-tier estimate unavailable'}
                  </div>
                </div>
              </button>
            );
          })}
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-primary" disabled={!provider} onClick={() => setStep(1)}>
              Continue <ArrowRight size={15} />
            </button>
          </div>
        </div>
      ) : null}

      {step === 1 && form ? (
        <form className="card" style={{ maxWidth: 640 }} onSubmit={handleSubmit}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ProviderIcon provider={provider} size={34} />
              <div>
                <h3 className="card-title">{providerMeta(provider).name}</h3>
                {freeBytes ? <p className="card-subtitle">~{formatBytes(freeBytes)} free tier (estimate)</p> : null}
              </div>
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="display_name">Connection name</label>
            <input
              id="display_name"
              className={`input${errors.display_name ? ' has-error' : ''}`}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Personal S3"
            />
            {errors.display_name ? <span className="field-error">{errors.display_name}</span> : null}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="bucket_name">Bucket / container name</label>
            <input
              id="bucket_name"
              className={`input${errors.bucket_name ? ' has-error' : ''}`}
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              placeholder="my-bucket"
            />
            {errors.bucket_name ? <span className="field-error">{errors.bucket_name}</span> : null}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="region">
              Region {form.region.required ? '' : <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>}
            </label>
            <input
              id="region"
              className={`input${errors.region ? ' has-error' : ''}`}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder={form.region.hint}
            />
            {errors.region ? <span className="field-error">{errors.region}</span> : null}
          </div>

          {form.credentials.map((c) => (
            <div className="field" key={c.key}>
              <label className="field-label" htmlFor={c.key}>{c.label}</label>
              {c.multiline ? (
                <textarea
                  id={c.key}
                  className={`textarea${errors[c.key] ? ' has-error' : ''}`}
                  value={creds[c.key] || ''}
                  onChange={(e) => setCreds((prev) => ({ ...prev, [c.key]: e.target.value }))}
                  placeholder={c.placeholder}
                  spellCheck={false}
                />
              ) : (
                <input
                  id={c.key}
                  type={c.secret ? 'password' : 'text'}
                  className={`input${errors[c.key] ? ' has-error' : ''}`}
                  value={creds[c.key] || ''}
                  onChange={(e) => setCreds((prev) => ({ ...prev, [c.key]: e.target.value }))}
                  placeholder={c.placeholder}
                  autoComplete="off"
                  spellCheck={false}
                />
              )}
              {errors[c.key] ? <span className="field-error">{errors[c.key]}</span> : null}
            </div>
          ))}

          <Alert type="info">
            The bucket/container must allow CORS PUT from this app's origin for direct uploads to work.
          </Alert>

          <div className="modal-actions" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setStep(0)} disabled={submitting}>
              <ArrowLeft size={15} /> Back
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : <CloudUpload size={15} />}
              {submitting ? 'Verifying…' : 'Verify & connect'}
            </button>
          </div>
        </form>
      ) : null}

      {step === 2 && created ? (
        <div className="card" style={{ maxWidth: 640, textAlign: 'center', padding: 44 }}>
          <div className="empty-state-icon" style={{ margin: '0 auto 14px' }}>
            <CheckCircle2 size={26} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>Connection verified</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 420, margin: '0 auto 22px' }}>
            "{created.display_name}" is now part of your storage pool. Its credentials are stored
            encrypted and will never be shown again.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/clouds')}>View clouds</button>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/files')}>Upload a file</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
