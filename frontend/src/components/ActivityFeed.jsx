import React, { useEffect, useState } from 'react';

const ActivityFeed = ({ committeeId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`https://civitas-api-d6ox.onrender.com/api/logs/${committeeId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                
                if (response.ok && data.logs) {
                    setLogs(data.logs);
                }
            } catch (err) {
                console.error("Error fetching activity logs:", err);
            } finally {
                setLoading(false);
            }
        };

        if (committeeId) {
            fetchLogs();
        }
    }, [committeeId]);

    const formatTimestamp = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now - date;
        const diffInMins = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMins / 60);

        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins} min ago`;
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getActionIcon = (actionType) => {
        switch (actionType.toUpperCase()) {
            case 'PAYMENT': return '💰';
            case 'REMINDER': return '🔔';
            case 'PAYOUT': return '💸';
            case 'SYSTEM': return '⚙️';
            case 'JOIN': return '👋';
            case 'SPIN': return '🎡';
            default: return '📝';
        }
    };

    if (loading) {
        return (
            <div className="card loading" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                Loading activity trail...
            </div>
        );
    }

    return (
        <div className="card animate-fade-up">
            <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.8rem', marginBottom: '1rem', marginTop: 0 }}>
                Activity Trail
            </h2>
            
            <div className="timeline-container" style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '10px' }}>
                {logs.length === 0 ? (
                    <p style={{ color: '#888', textAlign: 'center', margin: '2rem 0' }}>No recent activity to show.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {logs.map(log => (
                            <li key={log.id} style={{ display: 'flex', gap: '15px', marginBottom: '1.2rem', alignItems: 'flex-start' }}>
                                <div style={{ 
                                    fontSize: '1.4rem', 
                                    background: '#f1f5f9', 
                                    borderRadius: '50%', 
                                    width: '45px', 
                                    height: '45px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    border: '1px solid #e2e8f0'
                                }}>
                                    {getActionIcon(log.action_type)}
                                </div>

                                <div style={{ flex: 1, borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#334155', lineHeight: '1.4' }}>
                                        <strong style={{ color: '#0F4C81' }}>{log.user?.full_name || 'System'}</strong> {log.description}
                                    </p>
                                    <small style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500 }}>
                                        {formatTimestamp(log.created_at)}
                                    </small>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;
