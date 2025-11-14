import { useCallback, useState } from 'react';

// Hook simple para feedback temporal (toast-like)
export default function useFeedback(initial = '') {
  const [feedback, setFeedback] = useState(initial);

  const show = useCallback((msg, ms = 2000) => {
    setFeedback(msg);
    if (ms > 0) setTimeout(() => setFeedback(''), ms);
  }, []);

  return { feedback, show, setFeedback };
}