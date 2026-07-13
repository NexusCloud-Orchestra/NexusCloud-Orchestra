import '../css/Tables.css';

function getRelativeTime(dateTimeStr) {
  try {
    const rTime = new Date(dateTimeStr).getTime();
    const now = new Date().getTime();
    const diffMs = now - rTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } catch (e) {
    return 'recently';
  }
}

function getActionText(action, meta) {
  const filename = meta?.filename || 'a file';
  const connName = meta?.display_name || 'a cloud provider';
  
  switch (action) {
    case 'REGISTER': return 'Created account and signed up';
    case 'LOGIN': return 'Signed in successfully';
    case 'CONNECT': return `Linked cloud storage provider "${connName}"`;
    case 'UPLOAD': return `Uploaded file "${filename}"`;
    case 'DOWNLOAD': return `Downloaded file "${filename}"`;
    case 'DELETE': return `Deleted file "${filename}"`;
    case 'CREDENTIAL_ACCESS': return 'Reset credentials / password';
    default: return `${action} action performed`;
  }
}

function ActivityTimeline({ events }) {
  const defaultActivities = [
    { text: 'Uploaded Project_Design_v2.pdf', time: '10 mins ago', user: 'Demo User', provider: 'AWS S3' },
    { text: 'Connected AWS S3 bucket "nexus-prod-storage"', time: '1 hour ago', user: 'Demo User', provider: 'AWS' },
    { text: 'Deleted Temp Folder & cache chunks', time: '4 hours ago', user: 'Demo User', provider: 'Global' },
    { text: 'Created Shared Folder "Team Collaboration"', time: '1 day ago', user: 'Demo User', provider: 'Google Drive' },
    { text: 'Backup completed successfully', time: '1 day ago', user: 'System Agent', provider: 'Backblaze B2' },
  ];

  const mappedActivities = events ? events.map(evt => ({
    text: getActionText(evt.action, evt.meta),
    time: getRelativeTime(evt.created_at),
    user: 'Demo User',
    provider: evt.meta?.provider || 'Nexus'
  })) : null;

  const activitiesList = mappedActivities && mappedActivities.length > 0 ? mappedActivities : (events ? [] : defaultActivities);

  return (
    <div className="table-container" style={{ padding: '24px' }}>
      <h3 className="table-title" style={{ marginBottom: '20px' }}>Recent Activity</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activitiesList.length === 0 ? (
          <div style={{ color: '#6B7280', fontSize: '13.5px', padding: '10px 0' }}>No activity logs recorded yet.</div>
        ) : (
          activitiesList.map((act, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '18px', marginTop: '2px' }}>⏱️</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#111827' }}>{act.text}</span>
                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#6B7280' }}>
                  <span>{act.time}</span>
                  <span>•</span>
                  <span>By {act.user}</span>
                  <span>•</span>
                  <span style={{ color: '#2563EB', fontWeight: 500, textTransform: 'uppercase' }}>{act.provider}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ActivityTimeline;
