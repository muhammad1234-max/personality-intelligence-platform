import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Trait display configuration
const traitConfig = {
  extraversion: { name: 'Extraversion', color: '#ef4444', short: 'E' },
  agreeableness: { name: 'Agreeableness', color: '#22c55e', short: 'A' },
  conscientiousness: { name: 'Conscientiousness', color: '#3b82f6', short: 'C' },
  neuroticism: { name: 'Neuroticism', color: '#f59e0b', short: 'N' },
  openness: { name: 'Openness', color: '#8b5cf6', short: 'O' }
};

function AdminPanel({ onLogout, isDark }) {
  const [assessments, setAssessments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  
  // Filters
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterTrait, setFilterTrait] = useState('');
  const [minPercentile, setMinPercentile] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const adminToken = sessionStorage.getItem('adminToken');

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        limit: '20',
        skip: String((page - 1) * 20),
        sort_by: sortBy,
        sort_order: sortOrder
      });
      
      if (filterTrait) params.append('filter_trait', filterTrait);
      if (minPercentile) params.append('min_percentile', minPercentile);
      if (countryFilter) params.append('country', countryFilter);
      
      const response = await fetch(`${API_BASE_URL}/admin/assessments?${params}`, {
        headers: { 'X-Admin-Token': adminToken }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          onLogout();
          return;
        }
        throw new Error('Failed to fetch assessments');
      }
      
      const data = await response.json();
      setAssessments(data.results);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, filterTrait, minPercentile, countryFilter, adminToken, onLogout]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/statistics`, {
        headers: { 'X-Admin-Token': adminToken }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchAssessments();
    fetchStatistics();
  }, [fetchAssessments, fetchStatistics]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/assessments/${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Token': adminToken }
      });
      
      if (response.ok) {
        fetchAssessments();
        fetchStatistics();
      }
    } catch {
      alert('Failed to delete assessment');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/export/csv`, {
        headers: { 'X-Admin-Token': adminToken }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assessments_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      alert('Failed to export CSV');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInterpretation = (percentile) => {
    if (percentile >= 80) return { text: 'Very High', color: 'text-emerald-600 dark:text-emerald-400' };
    if (percentile >= 60) return { text: 'High', color: 'text-blue-600 dark:text-blue-400' };
    if (percentile >= 40) return { text: 'Average', color: 'text-slate-600 dark:text-slate-400' };
    if (percentile >= 20) return { text: 'Low', color: 'text-amber-600 dark:text-amber-400' };
    return { text: 'Very Low', color: 'text-red-600 dark:text-red-400' };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔐</span>
            <h1 className="text-xl font-heading font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition-colors"
            >
              📥 Export CSV
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-5 shadow-sm`}>
              <div className={`text-3xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{statistics.total_assessments}</div>
              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Assessments</div>
            </div>
            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-5 shadow-sm`}>
              <div className={`text-3xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {statistics.completion_stats?.avg_duration_min || 0}m
              </div>
              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Avg Duration</div>
            </div>
            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-5 shadow-sm`}>
              <div className={`text-3xl font-bold ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>
                {Object.keys(statistics.country_distribution || {}).length}
              </div>
              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Countries</div>
            </div>
            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-5 shadow-sm`}>
              <div className="flex gap-1">
                {Object.entries(statistics.trait_averages || {}).slice(0, 5).map(([trait, data]) => (
                  <div 
                    key={trait}
                    className="flex-1 h-8 rounded"
                    style={{ 
                      backgroundColor: traitConfig[trait]?.color || '#666',
                      opacity: (data.mean_percentile || 50) / 100
                    }}
                    title={`${traitConfig[trait]?.name}: ${data.mean_percentile?.toFixed(0)}%`}
                  />
                ))}
              </div>
              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-2`}>Avg Trait Distribution</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-sm mb-6`}>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className={`block text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
              >
                <option value="createdAt">Date</option>
                <option value="name">Name</option>
                <option value="highest_percentile">Highest Percentile</option>
                <option value="overall_score">Overall Score</option>
                <option value="best_trait">Best Trait</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Order</label>
              <select
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
                className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Best Trait</label>
              <select
                value={filterTrait}
                onChange={(e) => { setFilterTrait(e.target.value); setPage(1); }}
                className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
              >
                <option value="">All Traits</option>
                {Object.entries(traitConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Min Percentile</label>
              <input
                type="number"
                value={minPercentile}
                onChange={(e) => { setMinPercentile(e.target.value); setPage(1); }}
                placeholder="e.g., 70"
                className={`px-3 py-2 rounded-lg border text-sm w-24 ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-slate-200'}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Country</label>
              <input
                type="text"
                value={countryFilter}
                onChange={(e) => { setCountryFilter(e.target.value); setPage(1); }}
                placeholder="e.g., Pakistan"
                className={`px-3 py-2 rounded-lg border text-sm w-32 ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-slate-200'}`}
              />
            </div>
            <button
              onClick={() => { setFilterTrait(''); setMinPercentile(''); setCountryFilter(''); setPage(1); }}
              className={`px-3 py-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'} text-sm`}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-sm overflow-hidden`}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Loading assessments...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">{error}</div>
          ) : assessments.length === 0 ? (
            <div className="p-12 text-center">
              <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>No assessments found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDark ? 'bg-slate-700' : 'bg-slate-50'}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase`}>User</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase`}>Traits</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase`}>Best Trait</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase`}>Overall</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase`}>Date</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'} uppercase`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                    {assessments.map((assessment) => (
                      <tr key={assessment._id} className={isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}>
                        <td className="px-4 py-3">
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {assessment.user?.name || 'Anonymous'}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {assessment.user?.country || 'N/A'} • Age: {assessment.user?.age || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {Object.entries(assessment.computed?.traits || {}).map(([trait, data]) => (
                              <div
                                key={trait}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: traitConfig[trait]?.color || '#666' }}
                                title={`${traitConfig[trait]?.name}: ${data.percentile?.toFixed(0)}%`}
                              >
                                {data.percentile?.toFixed(0)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span 
                            className="px-2 py-1 rounded text-xs font-semibold text-white"
                            style={{ backgroundColor: traitConfig[assessment.computed?.best_trait]?.color || '#666' }}
                          >
                            {traitConfig[assessment.computed?.best_trait]?.name || 'N/A'}
                          </span>
                          <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                            {assessment.computed?.best_trait_percentile?.toFixed(0)}%
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {assessment.computed?.overall_score?.toFixed(0)}
                          </div>
                          <div className={getInterpretation(assessment.computed?.overall_score || 50).color + ' text-xs'}>
                            {getInterpretation(assessment.computed?.overall_score || 50).text}
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {formatDate(assessment.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedAssessment(assessment)}
                              className={`px-3 py-1 ${isDark ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} rounded text-xs font-medium`}
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(assessment._id)}
                              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={`px-4 py-3 flex justify-between items-center border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of {total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`px-3 py-1 rounded ${isDark ? 'bg-slate-700 text-white disabled:bg-slate-800' : 'bg-slate-100 disabled:bg-slate-50'} disabled:opacity-50`}
                  >
                    Previous
                  </button>
                  <span className={`px-3 py-1 ${isDark ? 'text-white' : 'text-slate-700'}`}>{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className={`px-3 py-1 rounded ${isDark ? 'bg-slate-700 text-white disabled:bg-slate-800' : 'bg-slate-100 disabled:bg-slate-50'} disabled:opacity-50`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAssessment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedAssessment(null)}>
          <div 
            className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {selectedAssessment.user?.name}
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {selectedAssessment.user?.country} • Age {selectedAssessment.user?.age} • {selectedAssessment.user?.university}
                  </p>
                </div>
                <button onClick={() => setSelectedAssessment(null)} className={`text-2xl ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}>×</button>
              </div>
            </div>
            <div className="p-6">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'} mb-4`}>Trait Scores</h3>
              <div className="space-y-4">
                {Object.entries(selectedAssessment.computed?.traits || {}).map(([trait, data]) => (
                  <div key={trait}>
                    <div className="flex justify-between mb-1">
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{traitConfig[trait]?.name}</span>
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{data.percentile?.toFixed(1)}%</span>
                    </div>
                    <div className={`h-3 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${data.percentile}%`,
                          backgroundColor: traitConfig[trait]?.color
                        }}
                      />
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>
                      Raw Score: {data.rawScore}/50 • {getInterpretation(data.percentile).text}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={`mt-6 pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Overall Score</div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {selectedAssessment.computed?.overall_score?.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Completed</div>
                    <div className={`text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {formatDate(selectedAssessment.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
