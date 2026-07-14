import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../config';
import awsLogo from '../assets/cloud-icons/aws.svg';
import azureLogo from '../assets/cloud-icons/azure.svg';
import gcpLogo from '../assets/cloud-icons/google-cloud.svg';
import oracleLogo from '../assets/cloud-icons/oracle.svg';
import backblazeLogo from '../assets/cloud-icons/backblaze.svg';
import cloudflareLogo from '../assets/cloud-icons/cloudflare.svg';
import '../css/ConnectCloud.css';
import '../css/SecurityCards.css';

function ConnectCloud() {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const selectedQuery = queryParams.get('selected');
  const initialSelected = selectedQuery ? selectedQuery.split(',') : [];

  const [selectedQueue, setSelectedQueue] = useState(initialSelected);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Connection forms states
  const [awsForm, setAwsForm] = useState({ accountId: '', accessKeyId: '', secretAccessKey: '', bucketName: '', region: 'us-east-1' });
  const [azureForm, setAzureForm] = useState({ storageAccount: '', containerName: '', accountKey: '' });
  const [gcpForm, setGcpForm] = useState({ projectId: '', serviceAccountKey: '', bucketName: '' });
  const [oracleForm, setOracleForm] = useState({ tenancyOcid: '', userOcid: '', privateKey: '', fingerprint: '', bucketName: '' });
  const [backblazeForm, setBackblazeForm] = useState({ keyId: '', applicationKey: '', bucketName: '' });
  const [cloudflareForm, setCloudflareForm] = useState({ accountId: '', accessKeyId: '', secretAccessKey: '', bucketName: '' });

  const providers = [
    {
      id: 'aws',
      name: 'Amazon AWS S3',
      logo: awsLogo,
      desc: 'Highly scalable, industry-standard Amazon S3 Object Storage.',
    },
    {
      id: 'azure',
      name: 'Microsoft Azure',
      logo: azureLogo,
      desc: 'Azure Blob Cache for low latency hybrid cloud workloads.',
    },
    {
      id: 'gcp',
      name: 'Google Cloud',
      logo: gcpLogo,
      desc: 'Google Cloud Storage for analytics-ready object buckets.',
    },
    {
      id: 'oracle',
      name: 'Oracle Cloud',
      logo: oracleLogo,
      desc: 'OCI Object Storage for cold volume archival.',
    },
    {
      id: 'backblaze',
      name: 'Backblaze B2',
      logo: backblazeLogo,
      desc: 'Affordable, low-cost Backblaze B2 Cloud Drive.',
    },
    {
      id: 'cloudflare',
      name: 'Cloudflare R2',
      logo: cloudflareLogo,
      desc: 'Zero-egress fee Cloudflare R2 object storage caching.',
    },
  ];

  // Set initial selected provider if query param is present
  useEffect(() => {
    if (selectedQueue.length > 0 && currentQueueIndex < selectedQueue.length) {
      const provId = selectedQueue[currentQueueIndex];
      setSelectedProvider(provId);
      setIsFormLoaded(true);
    } else if (selectedQueue.length === 0) {
      setSelectedProvider(null);
      setIsFormLoaded(false);
    }
  }, [selectedQueue, currentQueueIndex]);

  const handleProviderSelect = (providerId) => {
    if (selectedQueue.length > 0) return; // In queue mode, selection is locked
    setSelectedProvider(providerId);
    setIsFormLoaded(true);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const token = localStorage.getItem('nexus_access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    let payload = {
      provider: selectedProvider,
      display_name: providers.find((p) => p.id === selectedProvider).name,
      bucket_name: '',
      region: null,
      credentials: {},
    };

    // Gather credentials and details depending on provider
    if (selectedProvider === 'aws') {
      payload.bucket_name = awsForm.bucketName;
      payload.region = awsForm.region;
      payload.credentials = {
        aws_account_id: awsForm.accountId,
        access_key_id: awsForm.accessKeyId,
        secret_access_key: awsForm.secretAccessKey,
      };
    } else if (selectedProvider === 'azure') {
      payload.bucket_name = azureForm.containerName;
      payload.credentials = {
        storage_account: azureForm.storageAccount,
        connection_string: `DefaultEndpointsProtocol=https;AccountName=${azureForm.storageAccount};AccountKey=${azureForm.accountKey};EndpointSuffix=core.windows.net`,
        account_key: azureForm.accountKey,
      };
    } else if (selectedProvider === 'gcp') {
      payload.bucket_name = gcpForm.bucketName;
      try {
        const saJson = JSON.parse(gcpForm.serviceAccountKey);
        payload.credentials = {
          project_id: gcpForm.projectId,
          service_account_json: saJson,
        };
      } catch (err) {
        setErrorMessage('Service Account JSON is not valid JSON format.');
        setIsSubmitting(false);
        return;
      }
    } else if (selectedProvider === 'oracle') {
      payload.bucket_name = oracleForm.bucketName;
      payload.credentials = {
        tenancy_ocid: oracleForm.tenancyOcid,
        user_ocid: oracleForm.userOcid,
        private_key: oracleForm.privateKey,
        fingerprint: oracleForm.fingerprint,
      };
    } else if (selectedProvider === 'backblaze') {
      payload.bucket_name = backblazeForm.bucketName;
      payload.credentials = {
        access_key_id: backblazeForm.keyId,
        secret_access_key: backblazeForm.applicationKey,
      };
    } else if (selectedProvider === 'cloudflare') {
      payload.bucket_name = cloudflareForm.bucketName;
      payload.credentials = {
        cloudflare_account_id: cloudflareForm.accountId,
        access_key_id: cloudflareForm.accessKeyId,
        secret_access_key: cloudflareForm.secretAccessKey,
        endpoint_url: `https://${cloudflareForm.accountId}.r2.cloudflarestorage.com`,
      };
    }

    if (token === 'mock_demo_token') {
      // Mock demo connection saving
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccessMessage(`Connected to ${payload.display_name} successfully (Demo Mode)!`);
      proceedNext();
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMessage(`Connected to ${payload.display_name} successfully!`);
        proceedNext();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.detail || 'Connection validation failed. Please check credentials.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error validating cloud connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const proceedNext = () => {
    setTimeout(() => {
      if (selectedQueue.length > 0 && currentQueueIndex + 1 < selectedQueue.length) {
        setSuccessMessage('');
        setCurrentQueueIndex((prev) => prev + 1);
      } else {
        // Complete
        navigate('/clouds');
      }
    }, 1200);
  };

  const currentProviderDetails = providers.find((p) => p.id === selectedProvider);

  return (
    <div className="page-content-wrapper">
      <div className="connect-cloud-wrapper">
        <header className="connect-header">
          <h1 className="connect-title">
            {selectedQueue.length > 0
              ? `Connect Clouds (Step ${currentQueueIndex + 1} of ${selectedQueue.length})`
              : 'Connect Cloud Provider'}
          </h1>
          <p className="connect-subtitle">
            {selectedQueue.length > 0
              ? `Configure credentials for the selected cloud providers sequentially.`
              : 'Select a target cloud provider and enter supervisor credentials to mount virtual storage volumes.'}
          </p>
        </header>

        {successMessage && <div className="success-banner">{successMessage}</div>}
        {errorMessage && <div className="error-banner" style={{ background: '#fde7e9', border: '1px solid #e81123', color: '#a80000', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', fontSize: '13.5px' }}>{errorMessage}</div>}

        {/* Hide selection list if we are in sequential setup queue mode */}
        {selectedQueue.length === 0 && (
          <div className="connect-providers-list">
            {providers.map((p) => {
              const isSelected = selectedProvider === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleProviderSelect(p.id)}
                  className={`connect-provider-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="connect-provider-icon-wrapper">
                    <img src={p.logo} alt={`${p.name} logo`} className="connect-provider-icon" />
                  </div>
                  
                  <div className="connect-provider-details">
                    <div className="connect-provider-name-row">
                      <span className="connect-provider-name">{p.name}</span>
                      {isSelected && <span className="connect-selected-checkmark">✓</span>}
                    </div>
                    <p className="connect-provider-desc">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Form Loader */}
        {isFormLoaded && selectedProvider && (
          <div className="connect-form-section" style={{ marginTop: '24px' }}>
            <div className="connect-form-header" style={{ borderBottom: '1px solid #eaeaea', paddingBottom: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={currentProviderDetails?.logo} alt="" style={{ width: '32px', height: '32px' }} />
                <div>
                  <h3 className="connect-form-title" style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                    Configure {currentProviderDetails?.name} Credentials
                  </h3>
                  <p className="connect-form-desc" style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#605e5c' }}>
                    Provide connection keys to mount this cloud.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleFormSubmit}>
              {/* AWS S3 Form */}
              {selectedProvider === 'aws' && (
                <>
                  <div className="connect-form-group">
                    <label className="connect-form-label">AWS Account ID</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="123456789012"
                      required
                      value={awsForm.accountId}
                      onChange={(e) => setAwsForm({ ...awsForm, accountId: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">AWS Access Key ID</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      required
                      value={awsForm.accessKeyId}
                      onChange={(e) => setAwsForm({ ...awsForm, accessKeyId: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">AWS Secret Access Key</label>
                    <input
                      type="password"
                      className="connect-form-input"
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      required
                      value={awsForm.secretAccessKey}
                      onChange={(e) => setAwsForm({ ...awsForm, secretAccessKey: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Target Bucket Name</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="nexus-prod-storage"
                      required
                      value={awsForm.bucketName}
                      onChange={(e) => setAwsForm({ ...awsForm, bucketName: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">AWS Region</label>
                    <select
                      className="connect-form-input"
                      value={awsForm.region}
                      onChange={(e) => setAwsForm({ ...awsForm, region: e.target.value })}
                    >
                      <option value="us-east-1">us-east-1 (N. Virginia)</option>
                      <option value="us-west-2">us-west-2 (Oregon)</option>
                      <option value="eu-west-1">eu-west-1 (Ireland)</option>
                      <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                    </select>
                  </div>
                </>
              )}

              {/* Azure Blob Form */}
              {selectedProvider === 'azure' && (
                <>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Storage Account Name</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="mystorageaccount"
                      required
                      value={azureForm.storageAccount}
                      onChange={(e) => setAzureForm({ ...azureForm, storageAccount: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Blob Container Name</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="azure-blob-nexus"
                      required
                      value={azureForm.containerName}
                      onChange={(e) => setAzureForm({ ...azureForm, containerName: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Account Key</label>
                    <input
                      type="password"
                      className="connect-form-input"
                      placeholder="Storage Account Access Key"
                      required
                      value={azureForm.accountKey}
                      onChange={(e) => setAzureForm({ ...azureForm, accountKey: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Google Cloud Form */}
              {selectedProvider === 'gcp' && (
                <>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Project ID</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="google-cloud-project-id"
                      required
                      value={gcpForm.projectId}
                      onChange={(e) => setGcpForm({ ...gcpForm, projectId: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Service Account JSON Key</label>
                    <textarea
                      className="connect-form-input"
                      style={{ height: '120px', padding: '10px', fontFamily: 'monospace' }}
                      placeholder='{ "type": "service_account", ... }'
                      required
                      value={gcpForm.serviceAccountKey}
                      onChange={(e) => setGcpForm({ ...gcpForm, serviceAccountKey: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Target Bucket Name</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="gcp-backup-orchestra"
                      required
                      value={gcpForm.bucketName}
                      onChange={(e) => setGcpForm({ ...gcpForm, bucketName: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Oracle Cloud Form */}
              {selectedProvider === 'oracle' && (
                <>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Tenancy OCID</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="ocid1.tenancy.oc1..."
                      required
                      value={oracleForm.tenancyOcid}
                      onChange={(e) => setOracleForm({ ...oracleForm, tenancyOcid: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">User OCID</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="ocid1.user.oc1..."
                      required
                      value={oracleForm.userOcid}
                      onChange={(e) => setOracleForm({ ...oracleForm, userOcid: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Private Key (PEM format)</label>
                    <textarea
                      className="connect-form-input"
                      style={{ height: '120px', padding: '10px', fontFamily: 'monospace' }}
                      placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                      required
                      value={oracleForm.privateKey}
                      onChange={(e) => setOracleForm({ ...oracleForm, privateKey: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Key Fingerprint</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="20:3b:97:13:55..."
                      required
                      value={oracleForm.fingerprint}
                      onChange={(e) => setOracleForm({ ...oracleForm, fingerprint: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Target Bucket Name</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="oracle-cold-vault"
                      required
                      value={oracleForm.bucketName}
                      onChange={(e) => setOracleForm({ ...oracleForm, bucketName: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Backblaze B2 Form */}
              {selectedProvider === 'backblaze' && (
                <>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Backblaze Key ID</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="003e62f0a8d79f00000000001"
                      required
                      value={backblazeForm.keyId}
                      onChange={(e) => setBackblazeForm({ ...backblazeForm, keyId: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Application Key</label>
                    <input
                      type="password"
                      className="connect-form-input"
                      placeholder="K003e6f0a8d79f00000000001"
                      required
                      value={backblazeForm.applicationKey}
                      onChange={(e) => setBackblazeForm({ ...backblazeForm, applicationKey: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Target Bucket Name</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="backblaze-b2-storage"
                      required
                      value={backblazeForm.bucketName}
                      onChange={(e) => setBackblazeForm({ ...backblazeForm, bucketName: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Cloudflare R2 Form */}
              {selectedProvider === 'cloudflare' && (
                <>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Cloudflare Account ID</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="d79f0a8d79f00000000001abc"
                      required
                      value={cloudflareForm.accountId}
                      onChange={(e) => setCloudflareForm({ ...cloudflareForm, accountId: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">R2 Access Key ID</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      required
                      value={cloudflareForm.accessKeyId}
                      onChange={(e) => setCloudflareForm({ ...cloudflareForm, accessKeyId: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">R2 Secret Access Key</label>
                    <input
                      type="password"
                      className="connect-form-input"
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      required
                      value={cloudflareForm.secretAccessKey}
                      onChange={(e) => setCloudflareForm({ ...cloudflareForm, secretAccessKey: e.target.value })}
                    />
                  </div>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Target Bucket Name</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="cloudflare-r2-storage"
                      required
                      value={cloudflareForm.bucketName}
                      onChange={(e) => setCloudflareForm({ ...cloudflareForm, bucketName: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="connect-actions-row">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedQueue.length > 0) {
                      navigate('/subscription');
                    } else {
                      setSelectedProvider(null);
                      setIsFormLoaded(false);
                    }
                  }}
                  className="security-button security-button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="security-button security-button-primary"
                >
                  {isSubmitting ? 'Verifying Credentials...' : 'Continue & Mount'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConnectCloud;
