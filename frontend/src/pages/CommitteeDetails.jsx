import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CommitteeDetails = () => {
    const { id } = useParams();

    return (
        <div className="container dashboard-section">
            <Link to="/committees" className="btn btn-text" style={{ paddingLeft: 0, marginBottom: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-blue)' }}>
                <ArrowLeft size={20} /> Back to Committees
            </Link>

            <div className="card">
                <h2>Committee Details Page</h2>
                <p>Viewing details for Committee ID: <strong>{id}</strong></p>
                <p>This is a placeholder component for the committee details view.</p>
            </div>
        </div>
    );
};

export default CommitteeDetails;
