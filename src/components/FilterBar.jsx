import React from 'react';

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  categoryColumn,
  categoryOptions,
  selectedCategory,
  setSelectedCategory,
}) {
  return (
    <div className="filter-bar-sticky p-3 bg-light rounded-3 border mb-4 shadow-sm">
      <label className="form-label small fw-bold text-secondary mb-1">
        <i className="bi bi-search me-1"></i> Search Contacts:
      </label>
      <input
        type="text"
        className="form-control bg-white shadow-none mb-3"
        placeholder="Type name, phone, or any detail..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {categoryColumn && categoryOptions.length > 0 && (
        <>
          <label className="form-label small fw-bold text-secondary mb-2 d-block">
            <i className="bi bi-funnel-fill me-1"></i> Filter by {categoryColumn}:
          </label>
          <div className="d-flex gap-2 overflow-auto chip-row">
            <button
              type="button"
              className={`btn rounded-pill flex-shrink-0 px-3 py-2 fw-semibold ${
                selectedCategory === 'all' ? 'btn-primary' : 'btn-outline-secondary'
              }`}
              style={{ fontSize: '0.8125rem' }}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </button>
            {categoryOptions.map(({ value, count }) => (
              <button
                key={value}
                type="button"
                className={`btn rounded-pill flex-shrink-0 px-3 py-2 fw-semibold ${
                  selectedCategory === value ? 'btn-primary' : 'btn-outline-secondary'
                }`}
                style={{ fontSize: '0.8125rem' }}
                onClick={() => setSelectedCategory(value)}
              >
                {value} <span className="opacity-75">{count}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
