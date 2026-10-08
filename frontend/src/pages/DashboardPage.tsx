import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { DashboardHero } from '../components/dashboard/DashboardHero';
import { CloudTopologyMap } from '../components/dashboard/CloudTopologyMap';
import { StorageDistributionDonut } from '../components/dashboard/StorageDistributionDonut';
import { QuotaOverview } from '../components/dashboard/QuotaOverview';
import { RoutingIntelligence } from '../components/dashboard/RoutingIntelligence';
import { ProviderHealthGrid } from '../components/dashboard/ProviderHealthGrid';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';
import { RecentFilesPreview } from '../components/dashboard/RecentFilesPreview';
import {
  dashboardService,
  CloudProviderConnection,
  ManagedFile,
  SystemHealth,
  RoutingDecision,
  ActivityEvent,
} from '../services/dashboard.service';

export const DashboardPage: React.FC = () => {
  const [connections, setConnections] = useState<CloudProviderConnection[]>([]);
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [decisions, setDecisions] = useState<RoutingDecision[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [connRes, sysHealth, managedFiles, activityEvents] = await Promise.all([
          dashboardService.getCloudConnections(),
          dashboardService.getSystemHealth(),
          dashboardService.getManagedFiles(),
          dashboardService.getActivityFeed(),
        ]);
        setConnections(connRes.connections);
        setHealth(sysHealth);
        setFiles(managedFiles);
        setDecisions(dashboardService.getRoutingDecisions());
        setActivity(activityEvents);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <AppShell>
      <div className="flex flex-col min-w-0">
        {/* Hero Section with Atmospheric Mountain/Cloud Background & Metric Rail */}
        <DashboardHero connections={connections} files={files} health={health} />

        {/* Dashboard Content Container */}
        <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* Main Visual Centerpiece: Redesigned Cloud Infrastructure Map */}
          <CloudTopologyMap connections={connections} />

          {/* Row 1: Storage Distribution (Donut) & Quota Overview (Bars) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StorageDistributionDonut connections={connections} />
            <QuotaOverview connections={connections} />
          </div>

          {/* Row 2: Routing Intelligence & Provider Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RoutingIntelligence decisions={decisions} />
            <ProviderHealthGrid connections={connections} />
          </div>

          {/* Row 3: Recent Activity Feed & Files Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivityFeed events={activity} />
            <RecentFilesPreview files={files} />
          </div>
        </div>
      </div>
    </AppShell>
  );
};
