import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const EXPERT_TYPE_LABELS = {
  tax: 'Tax Consultant',
  retirement: 'Retirement Planning Expert',
  insurance: 'Insurance Advisor',
  investments: 'Investment Advisor',
  general: 'General Financial Advisor',
};

export default function ChatPage() {
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [phase, setPhase] = useState('loading'); // loading | chatting | processing | done | error
  const [summary, setSummary] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!socket || !connected) return;

    socket.emit('chat:start', {}, (ack) => {
      if (!ack.success) {
        setPhase('error');
        return;
      }
      setSessionId(ack.sessionId);
      if (ack.status === 'in_progress') setPhase('chatting');
      if (ack.status === 'processing') setPhase('processing');
      if (ack.status === 'scored') setPhase('done');
    });

    const onBotMessage = (msg) => {
      setMessages((prev) => [...prev, { sender: 'bot', text: msg.text }]);
    };
    const onProcessing = () => setPhase('processing');
    const onSummary = (data) => {
      setSummary(data);
      setPhase('done');
    };
    const onError = (err) => {
      setMessages((prev) => [...prev, { sender: 'bot', text: err.message }]);
      setPhase('error');
    };

    socket.on('chat:bot_message', onBotMessage);
    socket.on('chat:processing', onProcessing);
    socket.on('chat:summary', onSummary);
    socket.on('chat:error', onError);

    return () => {
      socket.off('chat:bot_message', onBotMessage);
      socket.off('chat:processing', onProcessing);
      socket.off('chat:summary', onSummary);
      socket.off('chat:error', onError);
    };
  }, [socket, connected]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;

    setMessages((prev) => [...prev, { sender: 'user', text: input }]);
    socket.emit('chat:message', { sessionId, text: input }, (ack) => {
      if (!ack?.success) {
        setMessages((prev) => [...prev, { sender: 'bot', text: ack?.message || 'Something went wrong' }]);
      }
    });
    setInput('');
  };

  const scoreColor = (score) => {
    if (score >= 70) return '#1a7f37';
    if (score >= 40) return '#d4a017';
    return '#b3261e';
  };

  if (!connected) {
    return <div className="card">Connecting to chat...</div>;
  }

  return (
    <div>
      <h2>Financial Health Check</h2>
      <p className="muted">Answer a few quick questions and get a free health score + roadmap.</p>

      {phase !== 'done' && (
        <div className="card">
          <div className="chat-window">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.sender}`}>{m.text}</div>
            ))}
            {phase === 'processing' && (
              <div className="chat-bubble bot">Generating your report... this takes a few seconds.</div>
            )}
            <div ref={scrollRef} />
          </div>

          {phase === 'chatting' && (
            <form className="chat-input-row" onSubmit={sendMessage}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer..."
                autoFocus
              />
              <button className="btn" type="submit">Send</button>
            </form>
          )}
        </div>
      )}

      {phase === 'done' && summary && (
        <div className="card">
          <h3>Your Financial Health Report</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="score-ring" style={{ background: scoreColor(summary.score) }}>
              {summary.score}
            </div>
            <div>
              <p style={{ margin: 0 }}>out of 100</p>
              <p className="muted" style={{ margin: 0 }}>
                Suggested expert: <strong>{EXPERT_TYPE_LABELS[summary.suggestedExpertType]}</strong>
              </p>
            </div>
          </div>

          {summary.roadmap && (
            <ul style={{ marginTop: 16 }}>
              {summary.roadmap.map((point, i) => <li key={i}>{point}</li>)}
            </ul>
          )}

          <button
            className="btn"
            onClick={() => navigate(`/experts?specialty=${summary.suggestedExpertType}`)}
          >
            Find a {EXPERT_TYPE_LABELS[summary.suggestedExpertType]}
          </button>
        </div>
      )}
    </div>
  );
}
