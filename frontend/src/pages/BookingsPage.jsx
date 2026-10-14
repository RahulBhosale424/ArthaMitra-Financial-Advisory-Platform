import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import StarRating from '../components/StarRating';

export default function BookingsPage() {
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewDrafts, setReviewDrafts] = useState({}); // bookingId -> { rating, comment }
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/bookings/mine').then((res) => setBookings(res.data.data.bookings)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') setMessage('Payment received! Your booking will be confirmed by the expert shortly.');
    if (paymentStatus === 'cancelled') setMessage('Payment was cancelled — your booking is still pending payment.');
  }, [searchParams]);

  const handleCancel = async (id) => {
    await api.patch(`/bookings/${id}/status`, { status: 'cancelled' });
    load();
  };

  const handlePayNow = async (id) => {
    const res = await api.post('/payments/checkout-session', { bookingId: id });
    window.location.href = res.data.data.checkoutUrl;
  };

  const submitReview = async (bookingId) => {
    const draft = reviewDrafts[bookingId] || { rating: 5, comment: '' };
    await api.post('/reviews', { bookingId, rating: draft.rating, comment: draft.comment });
    load();
  };

  const updateDraft = (bookingId, field, value) => {
    setReviewDrafts((prev) => ({ ...prev, [bookingId]: { ...prev[bookingId], [field]: value } }));
  };

  return (
    <div>
      <h2>My Bookings</h2>
      {message && <div className="card">{message}</div>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && bookings.length === 0 && <p className="muted">No bookings yet — find an expert to get started.</p>}

      {bookings.map((b) => (
        <div key={b._id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong>{b.expertProfile?.user?.name}</strong>
              <p className="muted" style={{ margin: '4px 0' }}>{new Date(b.scheduledAt).toLocaleString()}</p>
            </div>
            <span className={`badge ${b.status}`}>{b.status}</span>
          </div>
          <p>Amount: ₹{b.amount} · Payment: {b.paymentStatus}</p>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {b.paymentStatus === 'unpaid' && b.status !== 'cancelled' && (
              <button className="btn" onClick={() => handlePayNow(b._id)}>Pay now</button>
            )}
            {['pending', 'confirmed'].includes(b.status) && (
              <button className="btn secondary" onClick={() => handleCancel(b._id)}>Cancel</button>
            )}
          </div>

          {b.status === 'completed' && (
            <div style={{ marginTop: 12, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              <label>Leave a review</label>
              <StarRating
                value={reviewDrafts[b._id]?.rating || 5}
                onChange={(v) => updateDraft(b._id, 'rating', v)}
              />
              <textarea
                rows={2}
                placeholder="How was your consultation?"
                value={reviewDrafts[b._id]?.comment || ''}
                onChange={(e) => updateDraft(b._id, 'comment', e.target.value)}
              />
              <button className="btn" onClick={() => submitReview(b._id)}>Submit review</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
