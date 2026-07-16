import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

function FAQAccordion() {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      q: 'How do I connect AWS S3?',
      a: 'Go to the Cloud Providers page, click "Connect Cloud", choose Amazon AWS, and enter your Access Key, Secret Key, and target bucket region. Ensure the IAM user has correct s3:PutObject and s3:GetObject permissions.',
    },
    {
      q: 'How do I connect Azure Blob?',
      a: 'Navigate to Cloud Providers, select Azure Blob Storage, and enter your account name and SAS Token / access key. This establishes the orchestration bridge.',
    },
    {
      q: 'How do I connect Google Cloud?',
      a: 'Under Cloud Providers, select Google Cloud Storage and upload your service account private key JSON file to establish secure bucket links.',
    },
    {
      q: 'How do I connect Oracle Cloud?',
      a: 'Integrate Oracle Cloud Infrastructure (OCI) buckets via our S3 compatibility layer. Go to Cloud Providers, choose Oracle, and provide your endpoint URI and credentials.',
    },
    {
      q: 'How do I connect Backblaze B2?',
      a: 'Optimize storage by connecting Backblaze B2. Navigate to Cloud Providers, choose Backblaze B2, and input your Application Key and Key ID.',
    },
    {
      q: 'How do I connect Cloudflare R2?',
      a: 'Set up zero-egress Cloudflare R2 object storage volumes by providing your access keys and R2 account credentials under the Cloud Providers tab.',
    },
    {
      q: 'How do I upload files?',
      a: 'Navigate to "My Files", drag and drop any file or click "Browse Files" in the drag zone. Vanguard Smart Router automatically determines the optimal cloud target.',
    },
    {
      q: 'How do I create folders?',
      a: 'Inside the file browser (My Files page), select "Create Folder" from the quick action menu, specify a name, and Nexus Cloud will initialize the prefix namespace.',
    },
    {
      q: 'How do I restore deleted files?',
      a: 'Deleted objects are placed in the trash bin for up to 30 days depending on your subscription package. Access trash from the storage dashboard to restore files.',
    },
    {
      q: 'How do I change my subscription?',
      a: 'Go to the Subscription settings panel, review plans (Free, Pro, Enterprise), and select upgrade. Payments are processed securely via Stripe billing portal.',
    },
    {
      q: 'How do I reset my password?',
      a: 'Click "Forgot Password" on the login portal, enter your registered email address, and follow the password reset link sent to your inbox.',
    },
    {
      q: 'How do I enable Dark Mode?',
      a: 'Go to Settings -> Appearance. Under the Theme Selector module, select "Dark Theme" or sync with system preferences.',
    },
  ];

  const handleToggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-list">
      {faqs.map((faq, idx) => (
        <div
          key={idx}
          className={`faq-item ${activeIndex === idx ? 'active' : ''}`}
        >
          <button className="faq-trigger" onClick={() => handleToggle(idx)}>
            <span>{faq.q}</span>
            <ChevronRight
              className="faq-chevron"
              size={18}
              style={{ transform: activeIndex === idx ? 'rotate(90deg)' : 'none' }}
            />
          </button>
          {activeIndex === idx && <div className="faq-content">{faq.a}</div>}
        </div>
      ))}
    </div>
  );
}

export default FAQAccordion;
