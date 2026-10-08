import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileDrawer } from './MobileDrawer';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { useNavigate } from 'react-router-dom';
import { Search, FolderSync, Cloud, Network, Shield, ExternalLink, HelpCircle } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Keyboard shortcut ⌘K or Ctrl+K for search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = [
    { title: 'AWS S3 Primary Bucket', category: 'Cloud Connection', path: '/clouds' },
    { title: 'Google Cloud Storage Asia', category: 'Cloud Connection', path: '/clouds' },
    { title: 'Cloudflare R2 Zero-Egress Rule', category: 'Routing Policy', path: '/routing' },
    { title: 'genome_sequencing_dataset_v4.tar.gz', category: 'Managed File', path: '/files' },
    { title: 'financial_ledger_q3_audit.parquet', category: 'Managed File', path: '/files' },
  ].filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    try {
      return localStorage.getItem('nexuscloud_sidebar_pinned') === 'true';
    } catch {
      return false;
    }
  });

  const handleTogglePin = () => {
    setIsSidebarPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nexuscloud_sidebar_pinned', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex w-full text-slate-900 font-sans">
      {/* Persistent Desktop Sidebar: Sticky & Fixed to Left Side */}
      <Sidebar
        isPinned={isSidebarPinned}
        onTogglePin={handleTogglePin}
        onOpenHelp={() => setHelpOpen(true)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      {/* Main Content Area - Resilient responsive layout with smooth padding */}
      <div
        className={`flex-1 min-w-0 flex flex-col transition-[padding] duration-200 ease-out ${
          isSidebarPinned ? 'md:pl-[256px]' : 'md:pl-[68px]'
        }`}
      >
        <Topbar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main className="flex-1 min-w-0 bg-slate-50/60">
          {children}
        </main>
      </div>

      {/* Global Quick Search Modal (⌘K) */}
      <Modal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Search Multi-Cloud Infrastructure"
        description="Jump to files, cloud targets, or intelligent routing policies."
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name, cloud bucket, or region…"
              className="w-full h-10 pl-9 pr-4 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-950 focus:border-slate-950"
            />
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSearchOpen(false);
                  navigate(item.path);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-slate-100 text-xs transition-colors cursor-pointer group"
              >
                <span className="font-medium text-slate-900 group-hover:text-blue-600">
                  {item.title}
                </span>
                <span className="text-[11px] text-slate-500 px-2 py-0.5 rounded bg-slate-100 border border-slate-200/60">
                  {item.category}
                </span>
              </button>
            ))}
            {searchResults.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-500">
                No matching infrastructure items found.
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Help & Architecture Modal */}
      <Modal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="NexusCloud Control Plane Documentation"
        description="Intelligent BYOC storage orchestration & multi-cloud placement engine."
      >
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <h4 className="font-semibold text-slate-900 text-xs mb-1">BYOC Architecture</h4>
            <p>
              NexusCloud operates on a "Bring Your Own Cloud" paradigm. Your storage buckets (AWS S3, Google Cloud, Azure Blob, Cloudflare R2, Backblaze B2) stay entirely in your accounts. NexusCloud connects as an orchestration and routing control plane.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 text-xs">Core Capabilities:</h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Zero-Egress Tier Placement:</strong> Routes read-intensive files to zero-egress providers like Cloudflare R2.</li>
              <li><strong>Hot/Cold Storage Rebalancing:</strong> Archives older datasets to Backblaze B2 or Azure Archive tiers.</li>
              <li><strong>Unified API Gateway:</strong> Upload once; files are placed with cryptographically verified checksums.</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};
