import React, { useEffect, useState } from 'react';
import { CheckCircle, Users } from 'lucide-react';
import './SpinningWheel.css';

const DEFAULT_COLORS = [
    "#0D47A1", // FinTech Blue
    "#D4AF37", // Success Gold
    "#00897B", // Deep Teal
    "#6A1B9A", // Premium Purple
    "#EF6C00", // Energy Orange
    "#2E7D32", // Trust Green
    "#C62828", // Alert Red
    "#283593", // Royal Indigo
    "#AD1457", // Rose Pink
    "#00838F", // Deep Cyan
    "#5D4037", // Professional Brown
    "#455A64"  // Slate grey
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

const SpinningWheel = ({ members = [], winner, isSpinning, onFinished }) => {
    const [rotation, setRotation] = useState(0);
    
    // If no members, we show a gorgeous multi-colored "Demo" wheel
    const isDemo = members.length === 0;
    const activeMembers = isDemo ? [
        { name: 'Member A', user_id: 'a' },
        { name: 'Member B', user_id: 'b' },
        { name: 'Member C', user_id: 'c' },
        { name: 'Member D', user_id: 'd' }
    ] : members;

    const numSegments = activeMembers.length;
    const sliceAngle = 360 / numSegments;

    useEffect(() => {
        if (winner && isSpinning && !isDemo) {
            const winnerIndex = members.findIndex(m => String(m.user_id) === String(winner.user_id));
            if (winnerIndex === -1) return;

            const spinRevolutions = 10 * 360; 
            const sliceCenter = (winnerIndex * sliceAngle) + (sliceAngle / 2);
            const offset = 360 - sliceCenter;
            const currentMod = rotation % 360;
            const newRotation = rotation - currentMod + spinRevolutions + offset;

            setRotation(newRotation);
            const timer = setTimeout(() => { if (onFinished) onFinished(); }, 4100);
            return () => clearTimeout(timer);
        }
    }, [winner, isSpinning, members, sliceAngle, onFinished, isDemo]);

    const cx = 50; const cy = 50; const r = 48;

    const getCoords = (degree) => {
        const radians = (degree - 90) * Math.PI / 180.0;
        return { x: cx + r * Math.cos(radians), y: cy + r * Math.sin(radians) };
    };

    return (
        <div className="spinning-wheel-container">
            {/* The Pointer */}
            <div className="wheel-pointer-svg">
                <svg viewBox="0 0 100 100">
                    <polygon points="15,0 85,0 50,100" fill="#0F2038" stroke="#FFFFFF" strokeWidth="4" />
                </svg>
            </div>
            
            <div 
                className={`spinning-wheel-wrapper ${isDemo ? 'demo-mode' : ''}`}
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 4s cubic-bezier(0.1, 0, 0, 1)' : 'none'
                }}
            >
                <svg viewBox="0 0 100 100" className="wheel-svg">
                    <defs>
                        <filter id="pShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.4"/>
                        </filter>
                    </defs>

                    {activeMembers.map((member, index) => {
                        let color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                        if (index === activeMembers.length - 1 && color === DEFAULT_COLORS[0] && activeMembers.length > 1) {
                            color = DEFAULT_COLORS[1];
                        }
                        
                        const startAngle = index * sliceAngle;
                        const endAngle = (index + 1) * sliceAngle;
                        const largeArcFlag = sliceAngle > 180 ? 1 : 0;
                        const start = getCoords(startAngle);
                        const end = getCoords(endAngle);
                        const pathData = [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`, 'Z'].join(' ');
                        
                        const midAngle = startAngle + sliceAngle / 2;
                        const contrast = getContrastColor(color);

                        return (
                            <g key={member.user_id || index}>
                                <path 
                                    d={pathData} 
                                    fill={color} 
                                    stroke="rgba(255,255,255,0.4)" 
                                    strokeWidth="0.5" 
                                />
                                <g transform={`rotate(${midAngle}, ${cx}, ${cy})`}>
                                    <text 
                                        x="50" y="20" 
                                        fill={contrast} 
                                        textAnchor="middle" 
                                        className="wheel-text"
                                        style={{ fontSize: numSegments > 8 ? '3px' : '4.5px', fontWeight: '900' }}
                                    >
                                        {member.name}
                                    </text>
                                </g>
                            </g>
                        );
                    })}
                    
                    {/* Golden Center Pin */}
                    <circle cx="50" cy="50" r="5" fill="#D4AF37" filter="url(#pShadow)" />
                    <circle cx="50" cy="50" r="2.5" fill="#0F2038" />
                </svg>
            </div>

            {/* Overlays for Demo Mode */}
            {isDemo && (
                <div className="wheel-overlay-message">
                    <div className="glass-notice">
                        <Users size={20} />
                        <span>Waiting for Members</span>
                    </div>
                </div>
            )}
            
            <div className="spin-center-btn">
                {isSpinning ? "..." : "SPIN"}
            </div>
        </div>
    );
};

export default SpinningWheel;
