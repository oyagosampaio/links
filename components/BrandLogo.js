import { BRAND } from '../lib/brand';
import { appHost } from '../lib/stripe';

export default function BrandLogo({ showText = true, size = 32 }) {
  return (
    <div className="logo">
      <div className="logo-mark" style={{ width: size, height: size }}>
        <img src={BRAND.logo} alt={BRAND.name} width={size} height={size} />
      </div>
      {showText && (
        <div>
          <div className="logo-text">{BRAND.name}</div>
          <div className="logo-sub">{appHost()}</div>
        </div>
      )}
    </div>
  );
}
