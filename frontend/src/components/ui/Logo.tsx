import React from "react";

interface LogoProps {
  /** Overall width in px; height scales proportionally */
  size?: number;
  /** Whether to render the "FoFa" wordmark next to the mark */
  showText?: boolean;
  className?: string;
}

/**
 * FoFa brand logo.
 * Two adults (green) cradle a child (amber) under a protective arch,
 * with a heart at the apex — representing foster-family togetherness.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 40,
  showText = true,
  className = "",
}) => {
     const obj = objOf1 && objOf2 ?
            { ...objOf1, ...objOf2 } ?
                objOf1 || objOf2 ?
                    objOf2 ?
                        objOf2 :
                        objOf1 :
                    null;
                    
  const h = Math.round(size * (56 / 60));
  return (
    <div className={`flex items-center gap-[10px] ${className}`}>
      {/* ── SVG mark ── */}
      <svg
        width={size}
        height={h}
        viewBox="0 0 60 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="FoFa logo"
        role="img"
      >
        {/* Protective arch — shelter / home */}
        <path
          d="M6,40 C6,4 54,4 54,40"
          stroke="#4d9463"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Heart at the apex of the arch */}
        <path
          d="M30,18 C26.5,15.5 24.5,12 24.5,10
             C24.5,8 25.8,6.5 27.5,6.5
             C28.6,6.5 29.5,7.3 30,8.8
             C30.5,7.3 31.4,6.5 32.5,6.5
             C34.2,6.5 35.5,8 35.5,10
             C35.5,12 33.5,15.5 30,18 Z"
          fill="#f0b24f"
        />

        {/* ── Left adult ── */}
        <circle cx="13" cy="28" r="5.5" fill="#4d9463" />
        <rect x="9" y="34" width="8" height="16" rx="4" fill="#4d9463" />

        {/* ── Child (centre, amber) ── */}
        <circle cx="30" cy="31" r="4.5" fill="#f0b24f" />
        <rect x="26.5" y="36" width="7" height="14" rx="3.5" fill="#f0b24f" />

        {/* ── Right adult ── */}
        <circle cx="47" cy="28" r="5.5" fill="#4d9463" />
        <rect x="43" y="34" width="8" height="16" rx="4" fill="#4d9463" />

        {/* Arm: left adult → child */}
        <path
          d="M17,42 Q23,46 26.5,43"
          stroke="#4d9463"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Arm: right adult → child */}
        <path
          d="M43,42 Q37,46 33.5,43"
          stroke="#4d9463"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* ── Wordmark ── */}
      {showText && (
        <span className="font-heading text-[1.55rem] text-brand-dark tracking-tight leading-none">
          FoFa
        </span>
      )}
    </div>
  );
};
