import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import apiRequest from '../services/api';

const TrustScoreCard = ({ initialScore }) => {
    const { t } = useTranslation();
    const [score, setScore] = useState(initialScore || 75);
    const [isLoading, setIsLoading] = useState(!initialScore);

    useEffect(() => {
        const fetchScore = async () => {
            try {
                const response = await apiRequest('/trust/score');
                const data = await response.json();
                if (response.ok && data.trust_score !== undefined) {
                    setScore(data.trust_score);
                }
            } catch (err) {
                console.error("Error fetching trust score:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (!initialScore) {
            fetchScore();
        }
    }, [initialScore]);

    // Color logic based on score
    const getScoreColor = (value) => {
        if (value > 80) return '#10b981'; // Green (Excellent)
        if (value >= 50) return '#f59e0b'; // Gold (Good)
        return '#ef4444'; // Red (Needs Improvement)
    };

    const getScoreLabel = (value) => {
        if (value > 80) return t('common.excellent');
        if (value >= 50) return t('common.good');
        return t('common.needs_improvement');
    };

    const scoreColor = getScoreColor(score);

    return (
        <div className="w-full h-full p-6 md:p-8 flex flex-col justify-center">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShieldCheck size={24} className="text-blue-600" /> {t('common.trust_score')}
            </h2>
            <div className="trust-score-display flex flex-col items-center">
                <div 
                    className={`score-circle flex flex-col items-center justify-center rounded-full border-8 transition-colors duration-500`}
                    style={{ 
                        borderColor: `${scoreColor}20`, // Light version for background
                        borderTopColor: scoreColor,     // Active color
                        width: '180px',
                        height: '180px'
                    }}
                >
                    <span className="score-value text-4xl font-extrabold text-slate-900">
                        {isLoading ? '...' : score}
                    </span>
                    <span 
                        className="score-label text-xs font-bold uppercase tracking-wider mt-1"
                        style={{ color: scoreColor }}
                    >
                        {isLoading ? t('common.loading') : getScoreLabel(score)}
                    </span>
                </div>
                <p className="mt-4 text-slate-500 text-sm text-center">
                    {t('dashboard.verified_member')}
                </p>
            </div>
        </div>
    );
};

export default TrustScoreCard;
