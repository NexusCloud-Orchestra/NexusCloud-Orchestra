import React from 'react';

function LanguageSelector({
  language,
  dateFormat,
  timeFormat,
  onChangeLanguage,
  onChangeDateFormat,
  onChangeTimeFormat,
}) {
  const languages = [
    { id: 'en', name: 'English' },
    { id: 'ta', name: 'தமிழ்' },
    { id: 'hi', name: 'Hindi' },
    { id: 'fr', name: 'French' },
    { id: 'de', name: 'German' },
    { id: 'ja', name: 'Japanese' },
  ];

  const dateFormats = [
    { id: 'DD/MM/YYYY', name: 'DD/MM/YYYY' },
    { id: 'MM/DD/YYYY', name: 'MM/DD/YYYY' },
    { id: 'YYYY-MM-DD', name: 'YYYY-MM-DD' },
  ];

  const timeFormats = [
    { id: '12h', name: '12-hour Clock' },
    { id: '24h', name: '24-hour Clock' },
  ];

  return (
    <div className="appearance-section-card">
      <div className="appearance-grid-two-cols">
        {/* Section 11: Language */}
        <div>
          <h3 className="appearance-section-title">Language</h3>
          <p className="appearance-section-desc">Change the display language for settings and dashboard metadata.</p>
          
          <select
            value={language}
            onChange={(e) => onChangeLanguage(e.target.value)}
            className="appearance-select"
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Section 12: Date & Time Format */}
        <div>
          <h3 className="appearance-section-title">Date & Time Format</h3>
          <p className="appearance-section-desc">Choose local time display preferences.</p>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={dateFormat}
              onChange={(e) => onChangeDateFormat(e.target.value)}
              className="appearance-select"
              style={{ maxWidth: '150px' }}
            >
              {dateFormats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <select
              value={timeFormat}
              onChange={(e) => onChangeTimeFormat(e.target.value)}
              className="appearance-select"
              style={{ maxWidth: '150px' }}
            >
              {timeFormats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LanguageSelector;
