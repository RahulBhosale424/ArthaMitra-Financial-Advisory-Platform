export default function StarRating({ value, onChange, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div style={{ fontSize: '1.4rem', cursor: readOnly ? 'default' : 'pointer' }}>
      {stars.map((star) => (
        <span
          key={star}
          onClick={() => !readOnly && onChange?.(star)}
          style={{ color: star <= value ? '#d4a017' : '#e5e7eb' }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
