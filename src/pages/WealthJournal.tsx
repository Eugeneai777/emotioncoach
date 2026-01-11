import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WealthJournal() {
  const navigate = useNavigate();

  // Redirect to check-in page with journal tab
  useEffect(() => {
    navigate('/wealth-camp-checkin?tab=archive', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
    </div>
  );
}
