import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { environment } from '../environments/environment';

export const firebaseApp = initializeApp(environment.firebase);

// Only try analytics in the browser and when supported
if (typeof window !== 'undefined') {
  isSupported()
    .then((ok: boolean) => {
      if (ok) getAnalytics(firebaseApp);
    })
    .catch(() => {});
}