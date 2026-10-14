import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';

const SPECIALTIES = ['tax', 'retirement', 'insurance', 'investments', 'general'];

export default function ExpertDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const specialty = searchParams.get('specialty') || '';
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get('/experts', { params: specialty ? { specialty } : {} })
      .then((res) => setExperts(res.data.data.experts))
      .catch(() => setError('Could not load experts'))
      .finally(() => setLoading(false));
  }, [specialty]);

  return (
    <div>
      <h2>Find an Expert</h2>

      <div className="card">
        <label>Filter by specialty</label>
        <select
          value={specialty}
          onChange={(e) => setSearchParams(e.target.value ? { specialty: e.target.value } : {})}
        >
          <option value="">All specialties</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading && <p className="muted">Loading experts...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && experts.length === 0 && (
        <p className="muted">No verified experts found for this specialty yet.</p>
      )}

      <div className="expert-grid">
        {experts.map((exp) => (
          <div key={exp._id} className="card">
            <h3 style={{ margin: '0 0 4px' }}>{exp.user?.name}</h3>
            <p className="muted" style={{ margin: '0 0 8px' }}>
              {exp.specialty?.join(', ')} · {exp.yearsExperience || 0} yrs experience
            </p>
            <p style={{ margin: '0 0 8px' }}>
              ⭐ {exp.ratingAvg?.toFixed(1) || 'New'} ({exp.ratingCount} reviews)
            </p>
            <p style={{ margin: '0 0 12px', fontWeight: 600 }}>
              {exp.consultationFee ? `₹${exp.consultationFee}` : 'Fee not set yet'}
            </p>
            <Link className="btn" to={`/experts/${exp._id}`}>View & Book</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
