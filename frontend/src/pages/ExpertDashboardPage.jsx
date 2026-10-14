import { useEffect, useState } from 'react';
import api from '../api/client';

const SPECIALTIES = ['tax', 'retirement', 'insurance', 'investments', 'general'];

export default function ExpertDashboardPage() {
  const [profileForm, setProfileForm] = useState({
    specialty: [],
    bio: '',
    yearsExperience: '',
    consultationFee: '',
  });
  const [bookings, setBookings] = useState([]);
  const [saveMessage, setSaveMessage] = useState('');

  const loadBookings = () => {
    api.get('/bookings/expert').then((res) => setBookings(res.data.data.bookings)).catch(() => {});
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const toggleSpecialty = (s) => {
    setProfileForm((prev) => ({
      ...prev,
      specialty: prev.specialty.includes(s)
        ? prev.specialty.filter((x) => x !== s)
        : [...prev.specialty, s],
    }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaveMessage('');
    try {
      await api.post('/experts/profile', {
        ...profileForm,
        yearsExperience: Number(profileForm.yearsExperience) || 0,
        consultationFee: Number(profileForm.consultationFee) || 0,
      });
      setSaveMessage('Profile saved. An admin needs to verify your profile before it appears publicly.');
    } catch (err) {
      setSaveMessage(err.response?.data?.message || 'Could not save profile');
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      loadBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update booking');
    }
  };

  return (
    <div>
      <h2>Expert Dashboard</h2>

      <div className="card">
        <h3>Your profile</h3>
        <form onSubmit={saveProfile}>
          <label>Specialties</label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            {SPECIALTIES.map((s) => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'auto' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={profileForm.specialty.includes(s)}
                  onChange={() => toggleSpecialty(s)}
                />
                {s}
              </label>
            ))}
          </div>
          <label>Bio</label>
          <textarea
            rows={3}
            value={profileForm.bio}
            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
          />
          <label>Years of experience</label>
          <input
            type="number"
            value={profileForm.yearsExperience}
            onChange={(e) => setProfileForm({ ...profileForm, yearsExperience: e.target.value })}
          />
          <label>Consultation fee (₹)</label>
          <input
            type="number"
            value={profileForm.consultationFee}
            onChange={(e) => setProfileForm({ ...profileForm, consultationFee: e.target.value })}
          />
          {saveMessage && <p className="muted">{saveMessage}</p>}
          <button className="btn" type="submit">Save profile</button>
        </form>
      </div>

      <div className="card">
        <h3>Your bookings</h3>
        {bookings.length === 0 && <p className="muted">No bookings yet.</p>}
        {bookings.map((b) => (
          <div key={b._id} style={{ borderTop: '1px solid var(--color-border)', padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{b.user?.name}</strong>
                <p className="muted" style={{ margin: '4px 0' }}>{new Date(b.scheduledAt).toLocaleString()}</p>
              </div>
              <span className={`badge ${b.status}`}>{b.status}</span>
            </div>
            <p className="muted">Payment: {b.paymentStatus}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {b.status === 'pending' && (
                <>
                  <button className="btn" onClick={() => updateBookingStatus(b._id, 'confirmed')}>Confirm</button>
                  <button className="btn secondary" onClick={() => updateBookingStatus(b._id, 'cancelled')}>Cancel</button>
                </>
              )}
              {b.status === 'confirmed' && (
                <>
                  <button className="btn" onClick={() => updateBookingStatus(b._id, 'completed')}>Mark completed</button>
                  <button className="btn secondary" onClick={() => updateBookingStatus(b._id, 'cancelled')}>Cancel</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
