import React, { useState, useEffect, useRef } from 'react';
import { Users, TrendingUp, Shield, Plus, Lock, Globe, Calendar, DollarSign, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import '../App.css';

const MyCommittees = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('active');
  const [committees, setCommittees] = useState([]);
  const [myActiveCommittees, setMyActiveCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('member');
  const [joiningId, setJoiningId] = useState(null);

  // Carousel State
  const scrollRef = useRef(null);
  const requestRef = useRef();
  const [isPaused, setIsPaused] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showJoinPrivateModal, setShowJoinPrivateModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    visibility: 'public', // Default to Public
    monthly_amount: '',
    total_pot: '',
    max_members: 10,
    description: ''
  });

  // Bilingual Helper
  const getBilingualText = (text) => {
    if (!text) return '';
    if (!text.includes('|')) return text;
    const parts = text.split('|');
    return i18n.language === 'ur' ? (parts[1] || parts[0]).trim() : parts[0].trim();
  };

  // Auto-Scroll Carousel Logic
  useEffect(() => {
    const animateScroll = () => {
      if (scrollRef.current && !isPaused) {
        scrollRef.current.scrollLeft += 1;
        if (scrollRef.current.scrollLeft >= (scrollRef.current.scrollWidth - scrollRef.current.clientWidth)) {
          scrollRef.current.scrollLeft = 0;
        }
      }
      requestRef.current = requestAnimationFrame(animateScroll);
    };

    requestRef.current = requestAnimationFrame(animateScroll);

    return () => cancelAnimationFrame(requestRef.current);
  }, [isPaused]);

  // Manual Scroll Navigation
  const scrollLeftNav = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
  };

  const scrollRightNav = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
  };

  // 1. Fetch Committees
  const fetchCommittees = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:3000/api/committees');
      if (!response.ok) {
        throw new Error(t('common.error'));
      }
      const data = await response.json();
      const uniqueData = data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      setCommittees(uniqueData);
    } catch (err) {
      console.error("Error fetching committees:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCommittees = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://127.0.0.1:3000/api/committees/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(t('common.error'));
      }
      const data = await response.json();
      const uniqueData = data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      setMyActiveCommittees(uniqueData);
    } catch (err) {
      console.error("Error fetching user committees:", err);
    }
  };

  useEffect(() => {
    fetchCommittees();
    fetchMyCommittees();

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserRole(parsedUser.role || 'member');
      } catch (e) {
        console.error("Role parse error", e);
      }
    }
  }, []);

  // Form Handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'visibility' && value === 'public') {
        newData.monthly_amount = '';
        newData.total_pot = '';
      }
      if (name === 'monthly_amount' || name === 'max_members') {
        const contribution = parseFloat(name === 'monthly_amount' ? value : prev.monthly_amount) || 0;
        const members = parseInt(name === 'max_members' ? value : prev.max_members) || 0;
        newData.total_pot = contribution * members;
      }
      return newData;
    });
  };

  const [submitting, setSubmitting] = useState(false);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (formData.visibility === 'public') {
      const allowedAmounts = [5000, 10000, 25000, 50000, 100000];
      if (!allowedAmounts.includes(Number(formData.monthly_amount))) {
        alert("Public committees must use one of the preset denominations (5,000, 10,000, 25,000, 50,000, 100,000).");
        return;
      }
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // Auto-translate to Urdu if no pipe symbol is provided
      let finalName = formData.name;
      if (!finalName.includes('|')) {
         try {
             const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ur&dt=t&q=${encodeURIComponent(finalName)}`);
             const data = await res.json();
             const urduText = data[0][0][0];
             if (urduText) {
                 finalName = `${finalName} | ${urduText}`;
             }
         } catch (e) {
             console.error("Auto-translation failed:", e);
         }
      }

      const payload = { ...formData, name: finalName };

      const response = await fetch('http://127.0.0.1:3000/api/committees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('common.error'));
      }

      alert(t('common.success'));
      setShowModal(false);
      setFormData({
        name: '',
        visibility: 'public',
        monthly_amount: '',
        total_pot: '',
        max_members: 10,
        description: ''
      });
      fetchCommittees();
      fetchMyCommittees();

    } catch (err) {
      console.error("Error creating committee:", err);
      alert(`${t('common.error')}: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinCommittee = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setJoiningId(id);
      const response = await fetch(`http://127.0.0.1:3000/api/committees/${id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('common.error'));
      }

      alert(t('common.success'));
      fetchCommittees();
      fetchMyCommittees();
      setActiveTab('active');
    } catch (err) {
      console.error("Error joining committee:", err);
      alert(`${t('common.error')}: ${err.message}`);
    } finally {
      setJoiningId(null);
    }
  };

  const handleJoinPrivateSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('http://127.0.0.1:3000/api/committees/join-with-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ invite_code: inviteCodeInput })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('common.error'));
      }
      
      alert(t('common.success'));
      setShowJoinPrivateModal(false);
      setInviteCodeInput('');
      fetchCommittees();
      fetchMyCommittees();
      setActiveTab('active');
    } catch (err) {
      console.error("Error joining private committee:", err);
      alert(`${t('common.error')}: ${err.message}`);
    }
  };

  const publicCircles = committees;
  const activeCircles = myActiveCommittees;

  if (loading && committees.length === 0) return <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>{t('common.loading')}</div>;

  return (
    <div className="container my-committees-page">
      <div className="flex flex-col gap-4 mb-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="header-content">
            <h2 className="text-3xl font-extrabold text-blue-900 mb-1">{t('committees.management')}</h2>
            <p className="text-gray-600 max-w-md">{t('committees.manage_circles')}</p>
          </div>

          {userRole === 'committee leader' && (
            <button className="btn btn-gold w-full md:w-auto py-3 px-6 flex items-center justify-center shadow-md hover:shadow-lg transition-all" onClick={() => setShowModal(true)}>
              <Plus size={20} className="mr-2" />
              {t('committees.create_new')}
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <button
              className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl transition-all duration-300 ${activeTab === 'active' ? 'bg-blue-50 text-blue-700 font-bold border-b-4 border-blue-700 shadow-sm' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('active')}
            >
              <Users size={20} />
              <span className="whitespace-nowrap text-lg">{t('committees.my_active')}</span>
            </button>
            <button
              className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl transition-all duration-300 ${activeTab === 'explore' ? 'bg-blue-50 text-blue-700 font-bold border-b-4 border-blue-700 shadow-sm' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('explore')}
            >
              <Globe size={20} />
              <span className="whitespace-nowrap text-lg">{t('committees.explore_public')}</span>
            </button>
          </div>
          
          <button 
            className="btn btn-outline w-full lg:w-auto flex items-center justify-center gap-2 py-3 px-6 border-2 border-blue-100 text-blue-700 hover:bg-blue-50 hover:border-blue-200 rounded-xl transition-all font-semibold shadow-sm" 
            onClick={() => setShowJoinPrivateModal(true)}
          >
            <Lock size={18} />
            <span className="whitespace-nowrap text-lg">{t('committees.join_private')}</span>
          </button>
        </div>
      </div>

      <div 
        className="relative w-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <button 
          onClick={scrollLeftNav}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 bg-blue-900/80 text-white rounded-full shadow-lg hover:bg-blue-950 transition p-1.5 flex items-center justify-center cursor-pointer border-none backdrop-blur-sm"
        >
          <ChevronLeft size={18} />
        </button>

        <button 
          onClick={scrollRightNav}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 bg-blue-900/80 text-white rounded-full shadow-lg hover:bg-blue-950 transition p-1.5 flex items-center justify-center cursor-pointer border-none backdrop-blur-sm"
        >
          <ChevronRight size={18} />
        </button>

        <div ref={scrollRef} className="flex overflow-x-auto gap-4 pb-4 w-full hide-scrollbar">
          {activeTab === 'active' ? (
          activeCircles.length === 0 ? (
            <div className="empty-state w-full flex-shrink-0" style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f9f9f9', borderRadius: '12px' }}>
              <p>{t('committees.empty_state')}</p>
            </div>
          ) : (
            activeCircles.map(circle => (
              <div key={circle.id} className="committee-card active-card flex-shrink-0 w-[85vw] sm:w-[300px] flex flex-col h-full">
                <div className="card-header">
                  <h3>{getBilingualText(circle.title)}</h3>
                  <span className="type-badge active">
                    <Shield size={12} /> {circle.visibility === 'private' ? t('committees.private') : t('committees.public')}
                  </span>
                </div>

                <div className="card-financials flex justify-between items-center w-full px-4 py-2 border-y border-gray-100 my-2">
                  <div className="financial-item flex flex-col items-center">
                    <small className="text-gray-500 text-xs uppercase tracking-wider mb-1">{t('committees.contribution')}</small>
                    <span className="amount font-bold text-blue-900 whitespace-nowrap">PKR {Number(circle.slot_amount).toLocaleString()}</span>
                  </div>
                  <div className="financial-separator h-10 w-px bg-gray-200 mx-4"></div>
                  <div className="financial-item flex flex-col items-center">
                    <small className="text-gray-500 text-xs uppercase tracking-wider mb-1">{t('committees.target_pot')}</small>
                    <span className="amount font-bold text-blue-900 whitespace-nowrap">PKR {Number(circle.total_amount).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-auto w-full">
                  <div className="card-details">
                    <div className="detail-row">
                      <Users size={16} />
                      <span>{circle.members} / {circle.max_members} {t('committees.members_count')}</span>
                    </div>
                    <div className="detail-row">
                      <Calendar size={16} />
                      <span>{t('committees.starts')}: {circle.start_date ? new Date(circle.start_date).toLocaleDateString() : 'TBD'}</span>
                    </div>
                  </div>

                  <Link to={`/committees/${circle.id}`} className="btn btn-primary full-width" style={{ textAlign: 'center', display: 'block' }}>
                    {t('committees.open_dashboard')}
                  </Link>
                </div>
              </div>
            ))
          )
        ) : (
          publicCircles.map(circle => (
            <div key={circle.id} className="committee-card public-card flex-shrink-0 w-[85vw] sm:w-[300px] flex flex-col h-full">
              <div className="card-header">
                <h3>{getBilingualText(circle.title)}</h3>
                <span className="type-badge public">
                  <Globe size={12} /> {circle.visibility === 'private' ? t('committees.private') : t('committees.public')}
                </span>
              </div>

              <div className="card-financials flex justify-between items-center w-full px-4 py-2 border-y border-gray-100 my-2">
                <div className="financial-item flex flex-col items-center">
                  <small className="text-gray-500 text-xs uppercase tracking-wider mb-1">{t('committees.contribution')}</small>
                  <span className="amount font-bold text-blue-900 whitespace-nowrap">PKR {Number(circle.slot_amount).toLocaleString()}</span>
                </div>
                <div className="financial-separator h-10 w-px bg-gray-200 mx-4"></div>
                <div className="financial-item flex flex-col items-center">
                  <small className="text-gray-500 text-xs uppercase tracking-wider mb-1">{t('committees.target_pot')}</small>
                  <span className="amount font-bold text-blue-900 whitespace-nowrap">PKR {Number(circle.total_amount).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-auto w-full">
                <div className="card-details">
                  <div className="detail-row">
                    <Users size={16} />
                    <span>{circle.members} / {circle.max_members} {t('committees.members_count')}</span>
                  </div>
                  <div className="detail-row">
                    <Calendar size={16} />
                    <span>{t('committees.starts')}: {circle.start_date ? new Date(circle.start_date).toLocaleDateString() : 'TBD'}</span>
                  </div>
                </div>

                <button
                  className="btn btn-primary full-width"
                  onClick={() => handleJoinCommittee(circle.id)}
                  disabled={joiningId === circle.id || circle.members >= circle.max_members}
                >
                  {joiningId === circle.id ? t('common.loading') : (circle.members >= circle.max_members ? t('common.full') : t('committees.join_committee'))}
                </button>
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{t('committees.modal_create_title')}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="custom-modal-form">
              <div>
                <label className="custom-label">{t('committees.visibility')}</label>
                <div className="visibility-toggle">
                  <div 
                    className={`visibility-option ${formData.visibility === 'public' ? 'active' : 'inactive'}`}
                    onClick={() => handleInputChange({ target: { name: 'visibility', value: 'public' } })}
                  >
                    {t('committees.public')}
                  </div>
                  <div 
                    className={`visibility-option ${formData.visibility === 'private' ? 'active' : 'inactive'}`}
                    onClick={() => handleInputChange({ target: { name: 'visibility', value: 'private' } })}
                  >
                    {t('committees.private')}
                  </div>
                </div>
                {formData.visibility === 'private' && (
                  <small style={{ color: '#1e3a8a', fontStyle: 'italic', display: 'block', marginTop: '0.25rem' }}>
                    {t('committees.private_notice')}
                  </small>
                )}
              </div>

              <div>
                <label className="custom-label">{t('committees.committee_name')}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder={t('committees.committee_name')}
                  className="custom-input"
                />
              </div>

              <div>
                <label className="custom-label">{t('committees.max_members')}</label>
                <input
                  type="number"
                  name="max_members"
                  value={formData.max_members}
                  onChange={handleInputChange}
                  min="2"
                  required
                  className="custom-input"
                />
              </div>

              <div className="grid-2-col">
                <div>
                  <label className="custom-label">{t('committees.monthly_contribution_label')}</label>
                  {formData.visibility === 'public' ? (
                    <div className="preset-grid">
                      {[5000, 10000, 25000, 50000, 100000].map(amount => (
                        <div 
                          key={amount}
                          onClick={() => setFormData(prev => ({ ...prev, monthly_amount: amount, total_pot: amount * prev.max_members }))}
                          className={`preset-btn ${formData.monthly_amount === amount ? 'active' : 'inactive'}`}
                        >
                          {amount >= 1000 ? `${amount/1000}k` : amount}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="number"
                      name="monthly_amount"
                      value={formData.monthly_amount}
                      onChange={handleInputChange}
                      required
                      placeholder="5000"
                      className="custom-input"
                    />
                  )}
                </div>
                <div>
                  <label className="custom-label">{t('committees.total_pot_label')}</label>
                  <input
                    type="number"
                    name="total_pot"
                    value={formData.total_pot}
                    readOnly
                    className="custom-input readonly"
                  />
                </div>
              </div>

              <div>
                <label className="custom-label">{t('committees.description')}</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="custom-input"
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn-create" disabled={submitting}>
                  {submitting ? t('common.loading') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinPrivateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{t('committees.modal_join_private_title')}</h3>
              <button className="close-btn" onClick={() => setShowJoinPrivateModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleJoinPrivateSubmit} className="create-committee-form">
              <div className="form-group">
                <label>{t('committees.invite_code')}</label>
                <input
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  required
                  placeholder={t('committees.enter_code')}
                  style={{ textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center', fontSize: '1.2rem', padding: '0.8rem' }}
                  maxLength={6}
                />
              </div>
              <div className="modal-footer flex flex-col sm:flex-row gap-2 mt-6">
                <button type="button" className="btn btn-text sm:w-auto" style={{ color: '#666' }} onClick={() => setShowJoinPrivateModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary w-full sm:w-auto">{t('committees.join_committee')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCommittees;
