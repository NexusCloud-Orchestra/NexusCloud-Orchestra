import '../css/ProfileDropdown.css';

function Notifications({ onClose }) {
  const notifications = [
    { id: 1, text: 'Storage allocation almost full (AWS S3 exceeds 90%)', type: 'warning', time: '10m ago' },
    { id: 2, text: 'Nightly backup successful', type: 'success', time: '8h ago' },
    { id: 3, text: 'File "Project.pdf" shared with team members', type: 'info', time: '1d ago' },
    { id: 4, text: 'Google Drive connection disconnected', type: 'danger', time: '2d ago' },
  ];

  const dotColor = (type) => {
    if (type === 'warning') return '#F59E0B';
    if (type === 'success') return '#16A34A';
    if (type === 'danger') return '#DC2626';
    return '#2563EB';
  };

  return (
    <>
      {/* Backdrop to close the panel */}
      <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, background: 'transparent' }} />

      <div className="notifications-dropdown">
        <div className="notifications-header">
          <span className="notifications-title">Notifications</span>
          <button className="notifications-mark-read">Mark all read</button>
        </div>

        <div className="notifications-list">
          {notifications.map((item) => (
            <div key={item.id} className="notification-item">
              <div className="notification-row">
                <span className="notification-dot" style={{ backgroundColor: dotColor(item.type) }} />
                <span className="notification-text">{item.text}</span>
              </div>
              <span className="notification-time">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Notifications;
