import React from 'react';
import HelpHeader from '../components/HelpHeader';
import QuickHelpCards from '../components/QuickHelpCards';
import FAQAccordion from '../components/FAQAccordion';
import CloudGuides from '../components/CloudGuides';
import SupportTicketForm from '../components/SupportTicketForm';
import SystemStatus from '../components/SystemStatus';
import CloudStatusTable from '../components/CloudStatusTable';
import DownloadsSection from '../components/DownloadsSection';
import CommunitySection from '../components/CommunitySection';
import FeedbackSection from '../components/FeedbackSection';
import EmergencySupport from '../components/EmergencySupport';
import Footer from '../components/Footer';

import '../css/HelpSupport.css';
import '../css/Cards.css';
import '../css/Forms.css';
import '../css/Responsive.css';

function HelpSupport() {
  return (
    <div className="helpsupport-page-container">
      {/* Page Header */}
      <HelpHeader />

      {/* SECTION 2: Quick Help */}
      <div className="helpsupport-section">
        <h2 className="helpsupport-section-title">Quick Help</h2>
        <QuickHelpCards />
      </div>

      {/* SECTION 4: Cloud Setup Guides */}
      <div className="helpsupport-section">
        <h2 className="helpsupport-section-title">Cloud Setup Guides</h2>
        <CloudGuides />
      </div>

      {/* SECTION 6 & 7: System & Connection Status */}
      <div className="helpsupport-section">
        <h2 className="helpsupport-section-title">System & Connection Status</h2>
        <div className="helpsupport-grid-2col" style={{ alignItems: 'start' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>Service Status</h3>
            <SystemStatus />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>Connected Clouds</h3>
            <CloudStatusTable />
          </div>
        </div>
      </div>

      {/* SECTION 3 & 5: FAQ & Tickets */}
      <div className="helpsupport-section">
        <div className="helpsupport-grid-2col" style={{ alignItems: 'start' }}>
          <div>
            <h2 className="helpsupport-section-title">Frequently Asked Questions</h2>
            <FAQAccordion />
          </div>
          <div>
            <h2 className="helpsupport-section-title">Create Support Ticket</h2>
            <SupportTicketForm />
          </div>
        </div>
      </div>

      {/* SECTION 8: Downloads */}
      <div className="helpsupport-section">
        <h2 className="helpsupport-section-title">Downloads & Resources</h2>
        <DownloadsSection />
      </div>

      {/* SECTION 9: Community */}
      <div className="helpsupport-section">
        <h2 className="helpsupport-section-title">Community & Updates</h2>
        <CommunitySection />
      </div>

      {/* SECTION 10 & 11: Feedback & Urgent SLAs */}
      <div className="helpsupport-section">
        <div className="helpsupport-grid-2col" style={{ alignItems: 'stretch' }}>
          <FeedbackSection />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <EmergencySupport />
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default HelpSupport;
