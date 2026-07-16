import '../css/ProfileDropdown.css';

function Notifications({ notifications, onMarkAllRead, onClose }) {
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
          <button className="notifications-mark-read" onClick={onMarkAllRead}>Mark all read</button>
        </div>

        <div className="notifications-list">
          {notifications.map((item) => (
            <div key={item.id} className={`notification-item ${item.read ? 'read' : ''}`} style={item.read ? { opacity: 0.6 } : {}}>
              <div className="notification-row">
                {!item.read && <span className="notification-dot" style={{ backgroundColor: dotColor(item.type) }} />}
                <span className="notification-text" style={item.read ? { fontWeight: 'normal' } : { fontWeight: '500' }}>
                  {item.text}
                </span>
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
