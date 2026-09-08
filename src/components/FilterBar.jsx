import React from 'react';

// Cycled by index so every category chip gets a distinct color regardless
// of how many categories a sheet has, using Bootstrap's existing theme
// colors (matches the same palette the homepage tiles use).
const CHIP_THEMES = ['primary', 'success', 'warning', 'danger', 'info', 'secondary'];

const SORT_ICON = {
  none: 'bi-arrow-down-up',
  asc: 'bi-sort-alpha-down',
  desc: 'bi-sort-alpha-up',
};

const SORT_TITLE = {
  none: 'Sort A–Z',
  asc: 'Sorted A–Z — tap for Z–A',
  desc: 'Sorted Z–A — tap to reset',
};

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  categoryColumn,
  categoryOptions,
  selectedCategory,
  setSelectedCategory,
  sortOrder,
  onToggleSort,
}) {
  return (
    <div className="filter-bar-sticky p-3 bg-light rounded-3 border mb-4 shadow-sm">
      <label className="form-label small fw-bold text-secondary mb-1">
        <i className="bi bi-search me-1"></i> Search Contacts:
      </label>
      <div className="d-flex gap-2 mb-3">
        <div className="position-relative flex-grow-1">
          <input
            type="text"
            className="form-control bg-white shadow-none"
            style={{ paddingRight: searchTerm ? '2.5rem' : undefined }}
            placeholder="Type name, phone, or any detail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn tap-target-expand d-flex align-items-center justify-content-center"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
              title="Clear search"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>

        <button
          type="button"
          className={`btn flex-shrink-0 ${sortOrder === 'none' ? 'btn-outline-secondary' : 'btn-secondary'}`}
          onClick={onToggleSort}
          title={SORT_TITLE[sortOrder]}
          aria-label={SORT_TITLE[sortOrder]}
        >
          <i className={`bi ${SORT_ICON[sortOrder]}`}></i>
        </button>
      </div>

      {categoryColumn && categoryOptions.length > 0 && (
        <>
          <label className="form-label small fw-bold text-secondary mb-2 d-block">
            <i className="bi bi-funnel-fill me-1"></i> Filter by {categoryColumn}:
          </label>
          <div className="d-flex gap-2 overflow-auto chip-row">
            <button
              type="button"
              className={`btn rounded-pill flex-shrink-0 px-3 py-2 fw-semibold ${
                selectedCategory === 'all' ? 'btn-dark' : 'btn-outline-secondary'
              }`}
              style={{ fontSize: '0.8125rem' }}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </button>
            {categoryOptions.map(({ value, count }, index) => {
              const theme = CHIP_THEMES[index % CHIP_THEMES.length];
              return (
                <button
                  key={value}
                  type="button"
                  className={`btn rounded-pill flex-shrink-0 px-3 py-2 fw-semibold ${
                    selectedCategory === value ? `btn-${theme}` : `btn-outline-${theme}`
                  }`}
                  style={{ fontSize: '0.8125rem' }}
                  onClick={() => setSelectedCategory(value)}
                >
                  {value} <span className="opacity-75">{count}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
