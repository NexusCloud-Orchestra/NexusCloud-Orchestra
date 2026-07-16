import React from 'react';
import { Shield } from 'lucide-react';

function EmergencySupport() {
  return (
    <div className="emergency-card">
      <div className="emergency-info-wrapper">
        <Shield className="emergency-icon" size={24} />
        <div>
          <h4 className="emergency-title">Need immediate assistance?</h4>
          <p className="emergency-desc">
            Enterprise customers receive priority support 24/7. We typically respond within 15 minutes.
          </p>
        </div>
      </div>
      <button className="emergency-button" onClick={() => alert('Routing call/ticket to Priority SLA Queue...')}>
        Contact Priority Support
      </button>
    </div>
  );
}

export default EmergencySupport;
