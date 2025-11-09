```ts
import { useEffect } from 'react';


export default function useFocusTrap(containerRef: React.RefObject<HTMLElement>, enabled: boolean) {
useEffect(() => {
if (!enabled) return;
const el = containerRef.current;
if (!el) return;


const focusable = el.querySelectorAll<HTMLElement>(
'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
);
const first = focusable[0];
const last = focusable[focusable.length - 1];


const onKey = (e: KeyboardEvent) => {
if (e.key !== 'Tab') return;
if (focusable.length === 0) return;
if (e.shiftKey && document.activeElement === first) {
e.preventDefault();
last?.focus();
} else if (!e.shiftKey && document.activeElement === last) {
e.preventDefault();
first?.focus();
}
};


document.addEventListener('keydown', onKey);
first?.focus();
return () => document.removeEventListener('keydown', onKey);
}, [containerRef, enabled]);
}
```
