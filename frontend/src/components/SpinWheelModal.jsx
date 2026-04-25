import React, { useState } from 'react';
import { X, Trophy } from 'lucide-react';
import apiRequest from '../services/api';
import './SpinWheelModal.css';

const SpinWheelModal = ({ wheelMembers, committeeId, onClose, onWinnerDrawn }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [winner, setWinner] = useState(null);
    const [error, setError] = useState(null);

    // Number of segments
    const numSegments = wheelMembers.length;
    const degreesPerSegment = numSegments > 0 ? 360 / numSegments : 0;

    const cx = 50;
    const cy = 50;
    const r = 50;

    const getCoords = (degree) => {
        const radians = (degree - 90) * Math.PI / 180.0;
        return {
            x: cx + r * Math.cos(radians),
            y: cy + r * Math.sin(radians)
        };
    };

    const DEFAULT_COLORS = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#F9A03F",
        "#9D85FF", "#FF9F1C", "#2EC4B6", "#E71D36",
        "#8338EC", "#3A86FF", "#FF006E", "#FB5607"
    ];

    function getLuminance(hex) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        let r = parseInt(hex.slice(0, 2), 16) / 255;
        let g = parseInt(hex.slice(2, 4), 16) / 255;
        let b = parseInt(hex.slice(4, 6), 16) / 255;
        r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function getContrastColor(hexColor) {
        return getLuminance(hexColor) > 0.179 ? '#0F2038' : '#FFFFFF';
    }

    const handleSpin = async () => {
        if (isSpinning || winner) return;

        setIsSpinning(true);
        setError(null);

        try {
            const response = await apiRequest(`/committees/${committeeId}/draw`, {
                method: 'POST'
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to draw next winner');
            }

            const data = await response.json();
            const drawnWinner = data.winner;

            // Find which index the drawn winner is at, to visually stop the wheel there
            const winnerIndex = wheelMembers.findIndex(m => m.user_id === drawnWinner.user_id);

            if (winnerIndex === -1) {
                // Fallback if index not found somehow
                setWinner(drawnWinner);
                setIsSpinning(false);
                onWinnerDrawn(drawnWinner);
                return;
            }

            // Calculate rotation
            // We want the winner segment to end up pointing UP (0 degrees)
            // Or pointing RIGHT (90 degrees). Let's assume the ticker is at the TOP.
            // Segment centers: 
            // segment 0 center is at degreesPerSegment / 2.

            const spinRevolutions = 5 * 360; // Spin 5 times

            // To make segment N be at the top, we need to counter-rotate by its center angle
            // The segment angle starts at: index * degreesPerSegment
            const segmentCenter = (winnerIndex * degreesPerSegment) + (degreesPerSegment / 2);

            // Target rotation = base spins + (360 - segmentCenter)
            const targetRotation = rotation + spinRevolutions + (360 - segmentCenter);

            // We must adjust targetRotation so it strictly replaces the local mapping
            // Actually, simply setting rotation to `current + some_large_number_plus_offset` works.

            // But let's just use absolute target rotation:
            const totalRotation = spanRevolutions(targetRotation, rotation, winnerIndex);

            setRotation(totalRotation);

            // Wait for CSS transition (4s) to finish
            setTimeout(() => {
                setIsSpinning(false);
                setWinner(drawnWinner);
                // Report to parent
                onWinnerDrawn(drawnWinner);
            }, 4000);

        } catch (err) {
            console.error("Error spinning wheel:", err);
            setError(err.message);
            setIsSpinning(false);
        }
    };

    // Helper to calculate exact rotation value to prevent reverse spin
    const spanRevolutions = (base, current, index) => {
        const offset = 360 - ((index * degreesPerSegment) + (degreesPerSegment / 2));
        const spins = 1800; // 5 spins
        // Math to ensure strictly increasing rotation
        const remainder = current % 360;
        return current + spins + offset - remainder;
    }



    return (
        <div className="modal-overlay">
            <div className="modal-content wheel-modal-content">
                <button className="btn-close" onClick={onClose} disabled={isSpinning}>
                    <X size={24} />
                </button>

                <h2>Draw Next Winner 🎡</h2>
                <p className="text-muted">Spin the wheel to assign the next payout slot.</p>

                {error && <div className="error-message">{error}</div>}

                <div className="wheel-container" style={{ position: 'relative', width: '300px', margin: '0 auto 20px auto' }}>
                    <div className="wheel-pointer-svg" style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: '30px', height: '30px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                        <svg viewBox="0 0 100 100">
                            <polygon points="10,0 90,0 50,100" fill="#0F2038" stroke="#FFFFFF" strokeWidth="5" />
                        </svg>
                    </div>
                    
                    <div
                        className="wheel-svg-wrapper"
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                            width: '100%',
                            aspectRatio: '1/1',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                        }}
                    >
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
                            {numSegments === 0 ? (
                                 <circle cx="50" cy="50" r="50" fill="#e2e8f0" />
                            ) : numSegments === 1 ? (
                                <g>
                                    <circle cx="50" cy="50" r="50" fill={DEFAULT_COLORS[0]} />
                                    <text 
                                        x="50" 
                                        y="25" 
                                        fill={getContrastColor(DEFAULT_COLORS[0])} 
                                        textAnchor="middle" 
                                        dominantBaseline="middle"
                                        style={{ fontSize: '5px', fontWeight: '700', fontFamily: 'sans-serif' }}
                                    >
                                        {wheelMembers[0].name.split(' ')[0]}
                                    </text>
                                </g>
                            ) : (
                                wheelMembers.map((member, index) => {
                                    let color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                                    if (index === wheelMembers.length - 1 && color === DEFAULT_COLORS[0] && wheelMembers.length > 1) {
                                        color = DEFAULT_COLORS[1];
                                    }

                                    const startAngle = index * degreesPerSegment;
                                    const endAngle = (index + 1) * degreesPerSegment;
                                    const largeArcFlag = degreesPerSegment > 180 ? 1 : 0;

                                    const start = getCoords(startAngle);
                                    const end = getCoords(endAngle);

                                    const pathData = [
                                        `M ${cx} ${cy}`,
                                        `L ${start.x} ${start.y}`,
                                        `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
                                        'Z'
                                    ].join(' ');

                                    const midAngle = startAngle + degreesPerSegment / 2;
                                    const textContrast = getContrastColor(color);
                                    const displayName = member.name.split(' ')[0];

                                    return (
                                        <g key={member.user_id || index}>
                                            <path d={pathData} fill={color} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                                            <g transform={`rotate(${midAngle}, ${cx}, ${cy})`}>
                                                <text
                                                    x="50"
                                                    y="35"
                                                    fill={textContrast}
                                                    textAnchor="start"
                                                    dominantBaseline="middle"
                                                    transform="rotate(-90, 50, 35)"
                                                    style={{
                                                        fontSize: '5px',
                                                        fontWeight: '700',
                                                        fontFamily: 'Inter, sans-serif',
                                                        letterSpacing: '0.2px',
                                                        pointerEvents: 'none',
                                                        userSelect: 'none'
                                                    }}
                                                >
                                                    {displayName}
                                                </text>
                                            </g>
                                        </g>
                                    );
                                })
                            )}
                            <circle cx="50" cy="50" r="4" fill="#0F2038" />
                            <circle cx="50" cy="50" r="2" fill="#FFFFFF" />
                        </svg>
                    </div>
                </div>

                {!winner ? (
                    <button
                        className="btn btn-primary btn-spin"
                        onClick={handleSpin}
                        disabled={isSpinning || numSegments === 0}
                    >
                        {isSpinning ? 'Spinning...' : 'SPIN THE WHEEL!'}
                    </button>
                ) : (
                    <div className="winner-announcement">
                        <Trophy size={32} className="icon-gold" />
                        <h3>{winner.name} won Slot #{winner.slot_number}!</h3>
                        <button className="btn btn-secondary" onClick={onClose}>Finish</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpinWheelModal;
