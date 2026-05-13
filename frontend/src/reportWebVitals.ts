import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

export function reportWebVitals(): void {
  onCLS(console.log);
  onFCP(console.log);
  onINP(console.log);
  onLCP(console.log);
  onTTFB(console.log);
}
