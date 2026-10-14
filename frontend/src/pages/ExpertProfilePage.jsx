import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ExpertProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/experts/${id}`).then((res) => setProfile(res.data.data.profile));
    api.get(`/reviews/expert/${id}`).then((res) => setReviews(res.data.data.reviews));
  }, [id]);

  const handleBook = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');
    setSubmitting(true);
    try {
      const res = await api.post('/bookings', {
        expertProfileId: id,
        scheduledAt: new Date(scheduledAt).toISOString(),
        notes,
      });
      const bookingId = res.data.data.booking._id;

      // Immediately kick off payment for the booking just created — the
      // booking exists in 'pending'/'unpaid' state until Stripe's webhook
      // confirms payment (see PHASE-4-README for why that's the only source
      // of truth for paymentStatus).
      const checkoutRes = await api.post('/payments/checkout-session', { bookingId });
      window.location.href = checkoutRes.data.data.checkoutUrl; // redirect to Stripe
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Booking failed');
      setSubmitting(false);
    }
  };

  if (!profile) return <p className="muted">Loading...</p>;

  return (
    <div>
      <div className="card">
        <h2 style={{ margin: '0 0 4px' }}>{profile.user?.name}</h2>
        <p className="muted">{profile.specialty?.join(', ')} · {profile.yearsExperience || 0} yrs experience</p>
        <p>{profile.bio}</p>
        <p style={{ fontWeight: 600 }}>
          ⭐ {profile.ratingAvg?.toFixed(1) || 'New'} ({profile.ratingCount} reviews) ·{' '}
          {profile.consultationFee ? `₹${profile.consultationFee} / session` : 'Fee not set'}
        </p>
      </div>

      {user?.role === 'client' && profile.consultationFee != null && (
        <div className="card">
          <h3>Book a consultation</h3>
          <form onSubmit={handleBook}>
            <label>Date & time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
            <label>Notes (optional)</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            {bookingError && <p className="error-text">{bookingError}</p>}
            {bookingSuccess && <p style={{ color: 'var(--color-success)' }}>{bookingSuccess}</p>}
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? 'Redirecting to payment...' : `Book & pay ₹${profile.consultationFee}`}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Reviews</h3>
        {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
        {reviews.map((r) => (
          <div key={r._id} style={{ borderTop: '1px solid var(--color-border)', padding: '10px 0' }}>
            <strong>{r.user?.name}</strong> — {'★'.repeat(r.rating)}
            <p style={{ margin: '4px 0 0' }}>{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
