// Safety-sign pictograms drawn on a 48 px grid. They are decorative: the sign's text names the action.
type PictogramProps = { className?: string };

/** House shaking on a seismic trace. */
export function EarthquakePictogram({ className }: PictogramProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        transform="rotate(-7 24 33)"
        d="M24 7.5 37.5 19v14H10.5V19L24 7.5ZM20.5 33v-8.5h7V33h-7Z"
      />
      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <path d="M6.5 13.5c-2.6 3.8-2.6 8.2 0 12" />
        <path d="M41.5 13.5c2.6 3.8 2.6 8.2 0 12" />
      </g>
      <path
        d="M3 41h9l3-4.5 4 8 4-7.5 3 5 3-1h16"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Emergency beacon. */
export function BeaconPictogram({ className }: PictogramProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M14 35V25.5a10 10 0 0 1 20 0V35H14Zm4.5-9.5a5.5 5.5 0 0 1 5.5-5.5v3a2.5 2.5 0 0 0-2.5 2.5h-3Z"
      />
      <rect x="10" y="36.5" width="28" height="5.5" rx="1.5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M24 4.5v4.5" />
        <path d="m10.5 9.5 3.2 3.2" />
        <path d="m37.5 9.5-3.2 3.2" />
        <path d="M4.5 22.5H9" />
        <path d="M39 22.5h4.5" />
      </g>
    </svg>
  );
}
