import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="scroll-top-btn fixed bottom-6 right-6 z-40 w-10 h-10 bg-brand-700 text-white rounded-full shadow-jira-lg flex items-center justify-center hover:bg-brand-800 active:bg-brand-900 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      aria-label="Scroll to top"
    >
      <ArrowUp size={18} />
    </button>
  );
};

export default ScrollToTopButton;
