import React, { useEffect, useState } from 'react';
import { CheckCircle, Users } from 'lucide-react';
import './SpinningWheel.css';

const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF8C33', '#33FFF6'];

const SpinningWheel = ({ 
    members = [], 
    adminName = "Admin",
    maxSlots = 10,
    winner, 
    isSpinning, 
    mustStartSpinning, 
    prizeNumber, 
    onFinished 
}) => {
    const [rotation, setRotation] = useState(0);
    
    // Construct wheel data with Admin at index 0, then members, then empty slots
    const participants = [];
    // 1. Admin always at index 0
    participants.push({ name: adminName, type: 'admin' });
    
    // 2. Eligible members
    members.forEach(m => participants.push({ name: m.name, type: 'member', user_id: m.user_id }));
    
    // 3. Fill remaining slots with Empty Slot
    const targetCapacity = Math.max(maxSlots, participants.length);
    while (participants.length < targetCapacity) {
        participants.push({ name: 'Empty Slot', type: 'empty' });
    }

    // Apply the requested mapping logic
    const wheelData = participants.map((p, i) => ({
        option: p.name,
        style: { 
            backgroundColor: i === 0 ? '#D4AF37' : (p.type === 'empty' ? '#CBD5E1' : COLORS[(i - 1) % COLORS.length]), 
            textColor: p.type === 'empty' ? '#64748B' : 'white' 
        }
    }));

    const numSegments = wheelData.length;
    const sliceAngle = 360 / numSegments;

    useEffect(() => {
        // If mustStartSpinning is true, the prizeNumber refers to the index in the 'members' prop.
        // In our wheelData, that member is at prizeNumber + 1 because the Admin is at index 0.
        if (mustStartSpinning && prizeNumber !== null) {
            const targetIndex = prizeNumber + 1; // Offset for Admin slot
            const spinRevolutions = 10 * 360; 
            const sliceCenter = (targetIndex * sliceAngle) + (sliceAngle / 2);
            const offset = 360 - sliceCenter;
            const currentMod = rotation % 360;
            const newRotation = rotation - currentMod + spinRevolutions + offset;

            setRotation(newRotation);
            const timer = setTimeout(() => { if (onFinished) onFinished(); }, 4100);
            return () => clearTimeout(timer);
        }
    }, [mustStartSpinning, prizeNumber, sliceAngle, onFinished]);

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
                className="spinning-wheel-wrapper"
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

                    {wheelData.map((segment, index) => {
                        const startAngle = index * sliceAngle;
                        const endAngle = (index + 1) * sliceAngle;
                        const largeArcFlag = sliceAngle > 180 ? 1 : 0;
                        const start = getCoords(startAngle);
                        const end = getCoords(endAngle);
                        const pathData = [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`, 'Z'].join(' ');
                        
                        const midAngle = startAngle + sliceAngle / 2;

                        return (
                            <g key={index}>
                                <path 
                                    d={pathData} 
                                    fill={segment.style.backgroundColor} 
                                    stroke="rgba(255,255,255,0.4)" 
                                    strokeWidth="0.5" 
                                />
                                <g transform={`rotate(${midAngle}, ${cx}, ${cy})`}>
                                    <text 
                                        x="50" y="20" 
                                        fill={segment.style.textColor} 
                                        textAnchor="middle" 
                                        className="wheel-text"
                                        style={{ fontSize: numSegments > 8 ? '2.5px' : '4px', fontWeight: '900' }}
                                    >
                                        {segment.option}
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
            
            <div className="spin-center-btn">
                {isSpinning ? "..." : "SPIN"}
            </div>
        </div>
    );
};

export default SpinningWheel;
