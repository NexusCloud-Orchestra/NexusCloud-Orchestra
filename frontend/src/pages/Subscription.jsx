import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import awsLogo from '../assets/cloud-icons/aws.svg';
import azureLogo from '../assets/cloud-icons/azure.svg';
import gcpLogo from '../assets/cloud-icons/google-cloud.svg';
import oracleLogo from '../assets/cloud-icons/oracle.svg';
import backblazeLogo from '../assets/cloud-icons/backblaze.svg';
import cloudflareLogo from '../assets/cloud-icons/cloudflare.svg';
import '../css/Subscription.css';

function Subscription() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    const token = localStorage.getItem('nexus_access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (token === 'mock_demo_token') {
      const savedPlan = localStorage.getItem('mock_user_plan') || 'free';
      setUser({
        first_name: 'Demo',
        last_name: 'User',
        email: 'demo@nexus.com',
        plan: savedPlan,
      });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        localStorage.removeItem('nexus_access_token');
        navigate('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async (targetPlan) => {
    if (!user) return;
    const token = localStorage.getItem('nexus_access_token');
    if (token === 'mock_demo_token') {
      localStorage.setItem('mock_user_plan', targetPlan);
      setUser((prev) => ({ ...prev, plan: targetPlan }));
      const limit = targetPlan === 'free' ? 2 : targetPlan === 'pro' ? 4 : 6;
      setSelectedProviders((prev) => prev.slice(0, limit));
      setAlertMessage('');
      return;
    }

    setIsUpdatingPlan(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: targetPlan }),
      });
      if (res.ok) {
        setUser((prev) => ({ ...prev, plan: targetPlan }));
        const limit = targetPlan === 'free' ? 2 : targetPlan === 'pro' ? 4 : 6;
        setSelectedProviders((prev) => prev.slice(0, limit));
        setAlertMessage('');
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to update subscription plan.');
      }
    } catch (err) {
      console.error('Error updating plan:', err);
      alert('Network error updating plan.');
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const providers = [
    { id: 'aws', name: 'Amazon AWS S3', logo: awsLogo, desc: 'Enterprise-grade AWS S3 object storage.' },
    { id: 'azure', name: 'Microsoft Azure', logo: azureLogo, desc: 'Azure Blob Storage for secure cloud assets.' },
    { id: 'gcp', name: 'Google Cloud', logo: gcpLogo, desc: 'Google Cloud Storage for modern application buckets.' },
    { id: 'oracle', name: 'Oracle Cloud', logo: oracleLogo, desc: 'OCI Object Storage for reliable data backup.' },
    { id: 'backblaze', name: 'Backblaze B2', logo: backblazeLogo, desc: 'High-performance, cost-effective cloud drive.' },
    { id: 'cloudflare', name: 'Cloudflare R2', logo: cloudflareLogo, desc: 'Zero egress fee Cloudflare object storage.' },
  ];

  const currentPlan = user?.plan ? user.plan.toLowerCase() : 'free';
  const maxAllowed = currentPlan === 'free' ? 2 : currentPlan === 'pro' ? 4 : 6;

  const handleToggleProvider = (providerId) => {
    setAlertMessage('');
    if (selectedProviders.includes(providerId)) {
      setSelectedProviders((prev) => prev.filter((p) => p !== providerId));
    } else {
      if (selectedProviders.length >= maxAllowed) {
        if (currentPlan === 'free') {
          setAlertMessage('You have reached your Free plan limit. Upgrade to Pro to connect up to 4 cloud providers.');
        } else if (currentPlan === 'pro') {
          setAlertMessage('You have reached your Pro plan limit. Upgrade to Enterprise to connect up to 6 cloud providers.');
        }
        return;
      }
      setSelectedProviders((prev) => [...prev, providerId]);
    }
  };

  const handleConnectSelected = () => {
    if (selectedProviders.length === 0) return;
    navigate(`/connect-cloud?selected=${selectedProviders.join(',')}`);
  };

  if (loading) {
    return (
      <div className="page-content-wrapper" style={{ padding: '80px 0', textAlign: 'center', color: '#6B7280' }}>
        <p>Loading subscription details...</p>
      </div>
    );
  }

  return (
    <div className="page-content-wrapper">
      <div className="subscription-container">
        {/* Page Header */}
        <header className="subscription-header">
          <h1 className="subscription-title">Subscription Management</h1>
          <p className="subscription-subtitle">
            Scale your multi-cloud capacity. Select a plan and connect cloud storage endpoints up to your plan limit.
          </p>
        </header>

        {/* Plan Pricing Cards */}
        <div className="pricing-grid">
          {/* FREE PLAN */}
          <div className={`pricing-card ${currentPlan === 'free' ? 'popular' : ''}`}>
            <span className="plan-name">Free</span>
            <div className="plan-price">
              ₹0<span>/month</span>
            </div>
            <ul className="plan-features">
              <li>
                <span className="feature-check">✓</span> Connect ANY 2 Cloud Providers
              </li>
              <li>
                <span className="feature-check">✓</span> Secure File Upload
              </li>
              <li>
                <span className="feature-check">✓</span> File Download
              </li>
              <li>
                <span className="feature-check">✓</span> Basic File Sharing
              </li>
              <li>
                <span className="feature-check">✓</span> Community Support
              </li>
            </ul>
            {currentPlan === 'free' ? (
              <button className="plan-btn current" disabled>Current Plan</button>
            ) : (
              <button 
                onClick={() => handleUpgradePlan('free')} 
                className="plan-btn"
                disabled={isUpdatingPlan}
              >
                Downgrade to Free
              </button>
            )}
          </div>

          {/* PRO PLAN */}
          <div className={`pricing-card ${currentPlan === 'pro' ? 'popular' : ''}`}>
            <span className="popular-badge">Most Popular</span>
            <span className="plan-name">Pro</span>
            <div className="plan-price">
              ₹249<span>/month</span>
            </div>
            <ul className="plan-features">
              <li>
                <span className="feature-check">✓</span> Connect ANY 4 Cloud Providers
              </li>
              <li>
                <span className="feature-check">✓</span> Everything in Free
              </li>
              <li>
                <span className="feature-check">✓</span> Faster Cloud Synchronization
              </li>
              <li>
                <span className="feature-check">✓</span> Storage Analytics
              </li>
              <li>
                <span className="feature-check">✓</span> Priority Email Support
              </li>
            </ul>
            {currentPlan === 'pro' ? (
              <button className="plan-btn current" disabled>Current Plan</button>
            ) : (
              <button 
                onClick={() => handleUpgradePlan('pro')} 
                className="plan-btn btn-primary"
                disabled={isUpdatingPlan}
              >
                Upgrade to Pro
              </button>
            )}
          </div>

          {/* ENTERPRISE PLAN */}
          <div className={`pricing-card ${currentPlan === 'enterprise' ? 'popular' : ''}`}>
            <span className="plan-name">Enterprise</span>
            <div className="plan-price">
              ₹729<span>/month</span>
            </div>
            <ul className="plan-features">
              <li>
                <span className="feature-check">✓</span> Connect ANY 6 Cloud Providers
              </li>
              <li>
                <span className="feature-check">✓</span> Everything in Pro
              </li>
              <li>
                <span className="feature-check">✓</span> AI Storage Insights
              </li>
              <li>
                <span className="feature-check">✓</span> Team Collaboration
              </li>
              <li>
                <span className="feature-check">✓</span> API Access
              </li>
              <li>
                <span className="feature-check">✓</span> Premium Support
              </li>
            </ul>
            {currentPlan === 'enterprise' ? (
              <button className="plan-btn current" disabled>Current Plan</button>
            ) : (
              <button 
                onClick={() => handleUpgradePlan('enterprise')} 
                className="plan-btn btn-primary"
                disabled={isUpdatingPlan}
              >
                Upgrade to Enterprise
              </button>
            )}
          </div>
        </div>

        {/* Cloud Providers Selection Section */}
        <section className="selection-section">
          <h2 className="section-title">Choose Your Cloud Providers</h2>
          <p className="section-desc">
            Select the cloud targets to authenticate and mount. Current limits allow mounting up to <strong>{maxAllowed}</strong> clouds.
          </p>

          {/* Alert Message */}
          {alertMessage && (
            <div className="limit-alert-banner">
              <span>⚠️</span>
              <span>{alertMessage}</span>
            </div>
          )}

          {/* Provider Card Grid */}
          <div className="provider-grid">
            {providers.map((p) => {
              const isSelected = selectedProviders.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => handleToggleProvider(p.id)}
                  className={`provider-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="provider-icon-col">
                    <img src={p.logo} alt={p.name} className="provider-icon" />
                  </div>
                  <div className="provider-info-col">
                    <h4 className="provider-name">{p.name}</h4>
                    <p className="provider-desc">{p.desc}</p>
                  </div>
                  <div className="provider-checkbox-col">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="provider-checkbox"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selection Status Summary */}
          <div className="summary-bar">
            <div className="summary-left">
              <div className="summary-item">
                <span className="summary-label">Current Usage</span>
                <span className="summary-value">
                  {selectedProviders.length} / {maxAllowed}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Selected Providers</span>
                <div className="selected-list">
                  {selectedProviders.length === 0 ? (
                    <span className="summary-none-selected">None Selected</span>
                  ) : (
                    selectedProviders.map((id) => {
                      const p = providers.find((prov) => prov.id === id);
                      return (
                        <span key={id} className="selected-badge">
                          <span className="selected-check">✓</span>
                          {p?.name.split(' ')[0] || id.toUpperCase()}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            <div>
              <button
                onClick={handleConnectSelected}
                className="connect-action-btn"
                disabled={selectedProviders.length === 0}
              >
                Connect Cloud
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Subscription;
