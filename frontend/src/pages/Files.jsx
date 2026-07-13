import RecentFiles from '../components/RecentFiles';

function Files() {
  return (
    <div className="page-content-wrapper">
      <div className="welcome-header-section">
        <h1 className="welcome-heading">My Files</h1>
        <p className="welcome-subtitle">Browse and manage folders, documents, and backups.</p>
      </div>

      <RecentFiles />
    </div>
  );
}

export default Files;
