const PharmacyLogo = ({ size = 36, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Campus Health Kiosk logo"
  >
    {/* Cross symbol — pharmacy green */}
    <rect x="18" y="6" width="12" height="36" rx="2" fill="#166534" />
    <rect x="6" y="18" width="36" height="12" rx="2" fill="#166534" />
    {/* Inner highlight */}
    <rect x="21" y="9" width="6" height="30" rx="1" fill="#4ade80" opacity="0.35" />
    <rect x="9" y="21" width="30" height="6" rx="1" fill="#4ade80" opacity="0.35" />
    {/* Small pill accent bottom-right */}
    <ellipse cx="38" cy="38" rx="5" ry="3" transform="rotate(-35 38 38)" fill="#16a34a" opacity="0.7" />
    <ellipse cx="38" cy="38" rx="3" ry="1.5" transform="rotate(-35 38 38)" fill="#bbf7d0" opacity="0.5" />
  </svg>
);

export default PharmacyLogo;
