import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [awsForm, setAwsForm] = useState({ accessKeyId: '', secretAccessKey: '', bucketName: '', region: 'us-east-1' });
  const [azureForm, setAzureForm] = useState({ connectionString: '', containerName: '' });
  const [gcpForm, setGcpForm] = useState({ serviceAccountKey: '', bucketName: '' });
  const [oracleForm, setOracleForm] = useState({ tenancyOcid: '', userOcid: '', fingerprint: '', bucketName: '' });
  const [backblazeForm, setBackblazeForm] = useState({ keyId: '', applicationKey: '', bucketName: '' });
  const [cloudflareForm, setCloudflareForm] = useState({ accountId: '', accessKeyId: '', secretAccessKey: '', bucketName: '' });

  const providers = [
    {
      id: 'aws',
      name: 'Amazon AWS S3',
      logo: awsLogo,
      desc: 'Highly scalable, industry-standard Amazon S3 Object Storage.',
      status: 'disconnected',
    },
    {
      id: 'azure',
      name: 'Microsoft Azure Blob Storage',
      logo: azureLogo,
      desc: 'Azure Blob Cache for low latency hybrid cloud workloads.',
      status: 'connected',
    },
    {
      id: 'gcp',
      name: 'Google Cloud Storage',
      logo: gcpLogo,
      desc: 'Google Cloud Storage for analytics-ready object buckets.',
      status: 'connected',
    },
    {
      id: 'oracle',
      name: 'Oracle Cloud Infrastructure',
      logo: oracleLogo,
      desc: 'OCI Object Storage for cold volume archival.',
      status: 'disconnected',
    },
    {
      id: 'backblaze',
      name: 'Backblaze B2',
      logo: backblazeLogo,
      desc: 'Affordable, low-cost Backblaze B2 Cloud Drive.',
      status: 'connected',
    },
    {
      id: 'cloudflare',
      name: 'Cloudflare R2',
      logo: cloudflareLogo,
      desc: 'Zero-egress fee Cloudflare R2 object storage caching.',
      status: 'disconnected',
    },
  ];

  const handleProviderSelect = (providerId) => {
    setSelectedProvider(providerId);
    setIsFormLoaded(true); // Load the form dynamically
    setSuccessMessage('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate connection check
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccessMessage(`Connected to ${providers.find(p => p.id === selectedProvider).name} Successfully!`);
      setTimeout(() => {
        navigate('/clouds');
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content-wrapper">
      <div className="connect-cloud-wrapper">
        <header className="connect-header">
          <h1 className="connect-title">Connect Cloud Provider</h1>
          <p className="connect-subtitle">Select a target cloud provider and enter supervisor credentials to mount virtual storage volumes.</p>
        </header>

        {successMessage && <div className="success-banner">{successMessage}</div>}

        {/* Provider Cards Selection List */}
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span className={`connect-status-badge ${p.status === 'connected' ? 'connected' : 'disconnected'}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Form Loader */}
        {isFormLoaded && selectedProvider && (
          <div className="connect-form-section">
            <div className="connect-form-header">
              <h3 className="connect-form-title">
                Configure {providers.find((p) => p.id === selectedProvider).name} Credentials
              </h3>
              <p className="connect-form-desc">Provide authentication values to verify container permissions.</p>
            </div>

            <form onSubmit={handleFormSubmit}>
              {/* AWS S3 Form */}
              {selectedProvider === 'aws' && (
                <>
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
                    <label className="connect-form-label">Azure Connection String</label>
                    <input
                      type="text"
                      className="connect-form-input"
                      placeholder="DefaultEndpointsProtocol=https;AccountName=..."
                      required
                      value={azureForm.connectionString}
                      onChange={(e) => setAzureForm({ ...azureForm, connectionString: e.target.value })}
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
                </>
              )}

              {/* Google Cloud Form */}
              {selectedProvider === 'gcp' && (
                <>
                  <div className="connect-form-group">
                    <label className="connect-form-label">Service Account JSON Key</label>
                    <textarea
                      className="connect-form-input"
                      style={{ height: '100px', padding: '10px' }}
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
                    <label className="connect-form-label">Target Namespace Bucket Name</label>
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
                    setSelectedProvider(null);
                    setIsFormLoaded(false);
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
