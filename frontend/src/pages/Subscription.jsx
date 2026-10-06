import { useEffect, useState } from 'react';
import { Check, CreditCard } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { catalogApi, authApi } from '../lib/api';
import { formatBytes, planLabel } from '../lib/utils';
import Alert from '../components/Alert';

export default function Subscription() {
  const { user, setUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [switching, setSwitching] = useState('');

  useEffect(() => {
    catalogApi
      .plans()
      .then((p) => setPlans(p || []))
      .catch((err) => setError(err.message || 'Could not load plans.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (plan) => {
    if (!user || plan === user.plan || switching) return;
    setError('');
    setNotice('');
    setSwitching(plan);
    try {
      const updated = await authApi.setPlan(plan);
      setUser(updated);
      setNotice(`Your plan is now ${planLabel(updated.plan)}.`);
    } catch (err) {
      if (err.status === 403) {
        setError('Paid upgrades are unavailable until billing is integrated. Downgrades are also refused if they would exceed your current usage.');
      } else {
        setError(err.message || 'Could not change plan.');
      }
    } finally {
      setSwitching('');
    }
  };

  return (
    <div className="page-content-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscription</h1>
          <p className="page-subtitle">
            Your current plan is <strong>{planLabel(user?.plan)}</strong>. Paid upgrades are disabled until billing is integrated — every limit below is enforced today.
          </p>
        </div>
      </div>

      {error ? <Alert type="error">{error}</Alert> : null}
      {notice ? <Alert type="success">{notice}</Alert> : null}

      {loading ? (
        <div className="pricing-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 230 }} />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="card">
          <Alert type="info" title="Plan catalog unavailable">
            The API could not return the plan catalog. Try again shortly.
          </Alert>
        </div>
      ) : (
        <div className="pricing-grid">
          {plans.map((plan) => {
            const isCurrent = user?.plan === plan.name;
            const isPaid = plan.name !== 'free';
            return (
              <div key={plan.name} className={`card plan-card${isCurrent ? ' featured' : ''}`}>
                <div className="plan-card-name">
                  {planLabel(plan.name)}
                  {isCurrent ? <span className="badge badge-accent">Current</span> : null}
                </div>
                <ul className="plan-features">
                  <li><Check size={15} /> {plan.max_connections ? `Up to ${plan.max_connections} cloud connections` : 'Unlimited cloud connections'}</li>
                  <li><Check size={15} /> {plan.max_bytes ? `${formatBytes(plan.max_bytes)} pooled storage` : 'Unlimited pooled storage'}</li>
                  <li><Check size={15} /> {plan.seats} {plan.seats === 1 ? 'seat' : 'seats'}</li>
                </ul>
                <button
                  type="button"
                  className={`btn btn-block ${isCurrent ? 'btn-ghost' : 'btn-primary'}`}
                  disabled={isCurrent || switching === plan.name || (isPaid && plan.name !== 'free')}
                  title={isPaid && !isCurrent ? 'Available once billing is integrated' : undefined}
                  onClick={() => handleSelect(plan.name)}
                >
                  {switching === plan.name ? <span className="spinner" /> : <CreditCard size={14} />}
                  {isCurrent ? 'Current plan' : isPaid ? 'Coming with billing' : 'Switch to Free'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
