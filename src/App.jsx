import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE = {
  favorites: 'jobbank_favorites_v1',
  ui: 'jobbank_ui_v1',
}

const JOBS = [
  {
    id: 'jb-1001',
    title: 'Long haul truck driver',
    employer: 'Northern Freight Ltd.',
    location: 'Calgary, AB',
    workplace: 'On the road',
    type: 'Full-time',
    tags: ['Urgent', 'Verified'],
    postedAt: '2026-03-11',
  },
  {
    id: 'jb-1002',
    title: 'Restaurant manager',
    employer: 'Lakeside Eats',
    location: 'Toronto, ON',
    workplace: 'On site',
    type: 'Permanent',
    tags: ['New'],
    postedAt: '2026-03-10',
  },
  {
    id: 'jb-1003',
    title: 'Food and beverage server',
    employer: 'Prairie Hotel',
    location: 'Regina, SK',
    workplace: 'On site',
    type: 'Part-time',
    tags: ['New'],
    postedAt: '2026-03-10',
  },
  {
    id: 'jb-1004',
    title: 'Nanny',
    employer: 'Private household',
    location: 'Vancouver, BC',
    workplace: 'On site',
    type: 'Full-time',
    tags: ['Verified'],
    postedAt: '2026-03-09',
  },
  {
    id: 'jb-1005',
    title: 'Software developer',
    employer: 'Maple Stack Inc.',
    location: 'Ottawa, ON',
    workplace: 'Hybrid',
    type: 'Full-time',
    tags: ['Featured', 'Verified'],
    postedAt: '2026-03-08',
  },
  {
    id: 'jb-1006',
    title: 'Warehouse associate',
    employer: 'North Star Supply',
    location: 'Winnipeg, MB',
    workplace: 'On site',
    type: 'Temporary',
    tags: ['New'],
    postedAt: '2026-03-08',
  },
  {
    id: 'jb-1007',
    title: 'Receptionist, medical clinic',
    employer: 'Downtown Health',
    location: 'Halifax, NS',
    workplace: 'On site',
    type: 'Permanent',
    tags: ['Verified'],
    postedAt: '2026-03-07',
  },
  {
    id: 'jb-1008',
    title: 'Kitchen cabinet installer',
    employer: 'Cedar & Co.',
    location: 'Edmonton, AB',
    workplace: 'On site',
    type: 'Contract',
    tags: ['New'],
    postedAt: '2026-03-06',
  },
  {
    id: 'jb-1009',
    title: 'Salesperson – retail',
    employer: 'Aurora Outfitters',
    location: 'Montréal, QC',
    workplace: 'On site',
    type: 'Part-time',
    tags: ['New'],
    postedAt: '2026-03-06',
  },
  {
    id: 'jb-1010',
    title: 'General farm worker – harvesting',
    employer: 'Green Valley Farms',
    location: 'Abbotsford, BC',
    workplace: 'On site',
    type: 'Seasonal',
    tags: ['Urgent'],
    postedAt: '2026-03-05',
  },
]

const TAGS = ['New', 'Urgent', 'Featured', 'Verified']
const TYPES = ['Full-time', 'Part-time', 'Permanent', 'Temporary', 'Contract', 'Seasonal']
const WORKPLACE = ['On site', 'Hybrid', 'Remote', 'On the road']

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

function formatPosted(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.max(0, Math.floor((now.valueOf() - date.valueOf()) / 86400000))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

function Heart({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className={active ? 'jb-heart on' : 'jb-heart'}>
      <path d="M12 21s-7-4.4-9.4-8.4C.2 9.3 2.1 6.2 5.5 6.1c1.7 0 3.1.8 4 2.1.9-1.3 2.3-2.1 4-2.1 3.4.1 5.3 3.2 2.9 6.5C19 16.6 12 21 12 21z" />
    </svg>
  )
}

function App() {
  const [favorites, setFavorites] = useState(() => new Set(readJson(STORAGE.favorites, /** @type {string[]} */ ([]))))
  const [ui, setUi] = useState(() =>
    readJson(STORAGE.ui, {
      keyword: '',
      location: '',
      sort: 'relevance',
      page: 1,
      sidebarOpen: false,
      tags: /** @type {Record<string, boolean>} */ (Object.fromEntries(TAGS.map((t) => [t, false]))),
      types: /** @type {Record<string, boolean>} */ (Object.fromEntries(TYPES.map((t) => [t, false]))),
      workplace: /** @type {Record<string, boolean>} */ (Object.fromEntries(WORKPLACE.map((t) => [t, false]))),
      posted: 'any', // any | 3 | 7 | 14
    }),
  )

  useEffect(() => {
    writeJson(STORAGE.favorites, Array.from(favorites))
  }, [favorites])

  useEffect(() => {
    writeJson(STORAGE.ui, ui)
  }, [ui])

  const activeFilters = useMemo(() => {
    const activeTags = Object.entries(ui.tags)
      .filter(([, on]) => on)
      .map(([k]) => k)
    const activeTypes = Object.entries(ui.types)
      .filter(([, on]) => on)
      .map(([k]) => k)
    const activeWorkplace = Object.entries(ui.workplace)
      .filter(([, on]) => on)
      .map(([k]) => k)
    return { activeTags, activeTypes, activeWorkplace }
  }, [ui.tags, ui.types, ui.workplace])

  const results = useMemo(() => {
    const keyword = ui.keyword.trim().toLowerCase()
    const location = ui.location.trim().toLowerCase()
    const postedDays = ui.posted === 'any' ? null : Number(ui.posted)

    let items = JOBS
      .filter((job) => (keyword ? `${job.title} ${job.employer}`.toLowerCase().includes(keyword) : true))
      .filter((job) => (location ? job.location.toLowerCase().includes(location) : true))
      .filter((job) => {
        if (postedDays == null) return true
        const diff = Math.floor((new Date().valueOf() - new Date(job.postedAt).valueOf()) / 86400000)
        return diff <= postedDays
      })
      .filter((job) => {
        if (activeFilters.activeTags.length === 0) return true
        return activeFilters.activeTags.some((t) => job.tags.includes(t))
      })
      .filter((job) => {
        if (activeFilters.activeTypes.length === 0) return true
        return activeFilters.activeTypes.includes(job.type)
      })
      .filter((job) => {
        if (activeFilters.activeWorkplace.length === 0) return true
        return activeFilters.activeWorkplace.includes(job.workplace)
      })

    if (ui.sort === 'newest') {
      items = [...items].sort((a, b) => new Date(b.postedAt).valueOf() - new Date(a.postedAt).valueOf())
    } else if (ui.sort === 'saved') {
      items = [...items].sort((a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id)))
    }

    return items
  }, [activeFilters, favorites, ui.keyword, ui.location, ui.posted, ui.sort])

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize))
  const page = Math.min(Math.max(1, ui.page), totalPages)
  const pageItems = results.slice((page - 1) * pageSize, page * pageSize)

  function setUiSafe(patch) {
    setUi((prev) => ({ ...prev, ...patch }))
  }

  function toggleFavorite(id) {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const hasAnyFacet =
    activeFilters.activeTags.length + activeFilters.activeTypes.length + activeFilters.activeWorkplace.length > 0 ||
    ui.posted !== 'any'

  return (
    <div className="jb">
      <div className="jb-topbar">
        <div className="jb-container jb-topbar-inner">
          <div className="jb-gov">
            <span className="jb-flag" aria-hidden="true" />
            <div className="jb-gov-text">
              <div className="jb-gov-name">Job Listing in Canada</div>
              <div className="jb-gov-sub">Gouvernement du Canada</div>
            </div>
          </div>
          <button className="jb-link" type="button">
            Français
          </button>
        </div>
      </div>

      <header className="jb-header">
        <div className="jb-container jb-header-inner">
          <div className="jb-brand">
            <div className="jb-brand-mark" aria-hidden="true">
              Find Job
            </div>
          </div>
          <nav className="jb-nav" aria-label="Primary">
            <a className="jb-nav-link" href="#" onClick={(e) => e.preventDefault()}>
              Job search
            </a>
            <a className="jb-nav-link" href="#" onClick={(e) => e.preventDefault()}>
              Training and careers
            </a>
            <a className="jb-nav-link" href="#" onClick={(e) => e.preventDefault()}>
              Labour market information
            </a>
            <a className="jb-nav-link" href="#" onClick={(e) => e.preventDefault()}>
              Hiring
            </a>
            <a className="jb-nav-link" href="#" onClick={(e) => e.preventDefault()}>
              Help
            </a>
          </nav>
          <div className="jb-account">
            <button className="jb-btn jb-btn-secondary" type="button">
              Sign in
            </button>
          </div>
        </div>
      </header>

      <section className="jb-search">
        <div className="jb-container">
          <div className="jb-search-title">Search jobs</div>
          <form
            className="jb-search-form"
            onSubmit={(e) => {
              e.preventDefault()
              setUiSafe({ page: 1 })
            }}
          >
            <label className="jb-field">
              <span>Keywords</span>
              <input
                value={ui.keyword}
                onChange={(e) => setUiSafe({ keyword: e.target.value })}
                placeholder="Job title, skills, employer"
              />
            </label>
            <label className="jb-field">
              <span>Location</span>
              <input
                value={ui.location}
                onChange={(e) => setUiSafe({ location: e.target.value })}
                placeholder="City, province or territory"
              />
            </label>
            <button className="jb-btn jb-btn-primary" type="submit">
              Search
            </button>
            <button
              className="jb-btn jb-btn-secondary jb-filters-toggle"
              type="button"
              onClick={() => setUiSafe({ sidebarOpen: !ui.sidebarOpen })}
              aria-expanded={ui.sidebarOpen}
              aria-controls="jb-sidebar"
            >
              Filters{hasAnyFacet ? ' •' : ''}
            </button>
          </form>
        </div>
      </section>

      <main className="jb-container jb-main">
        <div className="jb-layout">
          <aside
            id="jb-sidebar"
            className={ui.sidebarOpen ? 'jb-sidebar open' : 'jb-sidebar'}
            aria-label="Filters"
          >
            <div className="jb-sidebar-head">
              <div className="jb-sidebar-title">Filters</div>
              <button className="jb-link jb-hide-desktop" type="button" onClick={() => setUiSafe({ sidebarOpen: false })}>
                Close
              </button>
            </div>

            <div className="jb-card jb-map">
              <div className="jb-map-head">
                <div className="jb-map-title">Map</div>
                <div className="jb-map-zoom" aria-hidden="true">
                  <button type="button">+</button>
                  <button type="button">−</button>
                </div>
              </div>
              <div className="jb-map-body" aria-hidden="true">
                <div className="jb-map-pin" />
              </div>
            </div>

            <div className="jb-card jb-facet">
              <details open>
                <summary>Date posted</summary>
                <div className="jb-facet-body">
                  {[
                    { id: 'any', label: 'Any time' },
                    { id: '3', label: 'Last 3 days' },
                    { id: '7', label: 'Last 7 days' },
                    { id: '14', label: 'Last 14 days' },
                  ].map((opt) => (
                    <label key={opt.id} className="jb-radio">
                      <input
                        type="radio"
                        name="posted"
                        checked={ui.posted === opt.id}
                        onChange={() => setUiSafe({ posted: opt.id, page: 1 })}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </details>
            </div>

            <div className="jb-card jb-facet">
              <details open>
                <summary>Job type</summary>
                <div className="jb-facet-body">
                  {TYPES.map((t) => (
                    <label key={t} className="jb-check">
                      <input
                        type="checkbox"
                        checked={ui.types[t]}
                        onChange={(e) => setUiSafe({ types: { ...ui.types, [t]: e.target.checked }, page: 1 })}
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </details>
            </div>

            <div className="jb-card jb-facet">
              <details>
                <summary>Workplace</summary>
                <div className="jb-facet-body">
                  {WORKPLACE.map((t) => (
                    <label key={t} className="jb-check">
                      <input
                        type="checkbox"
                        checked={ui.workplace[t]}
                        onChange={(e) =>
                          setUiSafe({ workplace: { ...ui.workplace, [t]: e.target.checked }, page: 1 })
                        }
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </details>
            </div>

            <div className="jb-card jb-facet">
              <details>
                <summary>Highlights</summary>
                <div className="jb-facet-body">
                  {TAGS.map((t) => (
                    <label key={t} className="jb-check">
                      <input
                        type="checkbox"
                        checked={ui.tags[t]}
                        onChange={(e) => setUiSafe({ tags: { ...ui.tags, [t]: e.target.checked }, page: 1 })}
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </details>
            </div>

            <div className="jb-sidebar-actions">
              <button
                className="jb-btn jb-btn-secondary"
                type="button"
                onClick={() => {
                  setUiSafe({
                    page: 1,
                    posted: 'any',
                    tags: Object.fromEntries(TAGS.map((t) => [t, false])),
                    types: Object.fromEntries(TYPES.map((t) => [t, false])),
                    workplace: Object.fromEntries(WORKPLACE.map((t) => [t, false])),
                  })
                }}
              >
                Reset filters
              </button>
            </div>
          </aside>

          <section className="jb-results" aria-label="Search results">
            <div className="jb-results-head">
              <div>
                <div className="jb-results-title">Available jobs</div>
                <div className="jb-results-meta">
                  <span className="jb-results-count">{results.length.toLocaleString()} results</span>
                  <span className="jb-dot" aria-hidden="true">
                    •
                  </span>
                  <span className="jb-muted">Showing {pageItems.length} on this page</span>
                </div>
              </div>

              <label className="jb-field jb-field-compact">
                <span>Sort</span>
                <select
                  value={ui.sort}
                  onChange={(e) => setUiSafe({ sort: e.target.value, page: 1 })}
                  aria-label="Sort results"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="saved">Saved first</option>
                </select>
              </label>
            </div>

            <div className="jb-list">
              {pageItems.map((job) => {
                const saved = favorites.has(job.id)
                return (
                  <article key={job.id} className="jb-item">
                    <div className="jb-item-main">
                      <a className="jb-item-title" href="#" onClick={(e) => e.preventDefault()}>
                        {job.title}
                      </a>
                      <div className="jb-item-sub">
                        <span className="jb-item-employer">{job.employer}</span>
                        <span className="jb-dot" aria-hidden="true">
                          •
                        </span>
                        <span>{job.location}</span>
                      </div>
                      <div className="jb-item-meta">
                        <span className="jb-pill">{job.workplace}</span>
                        <span className="jb-pill">{job.type}</span>
                        {job.tags.map((t) => (
                          <span key={t} className={t === 'Featured' ? 'jb-tag featured' : 'jb-tag'}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="jb-item-side">
                      <div className="jb-item-date">{formatPosted(job.postedAt)}</div>
                      <button
                        className={saved ? 'jb-save saved' : 'jb-save'}
                        type="button"
                        aria-pressed={saved}
                        aria-label={saved ? 'Remove from saved jobs' : 'Save this job'}
                        onClick={() => toggleFavorite(job.id)}
                      >
                        <Heart active={saved} />
                      </button>
                    </div>
                  </article>
                )
              })}

              {pageItems.length === 0 ? (
                <div className="jb-empty">
                  <div className="jb-empty-title">No results match your filters</div>
                  <div className="jb-muted">Try removing some filters or changing your keywords.</div>
                </div>
              ) : null}
            </div>

            <div className="jb-pagination" aria-label="Pagination">
              <button
                className="jb-btn jb-btn-secondary"
                type="button"
                onClick={() => setUiSafe({ page: Math.max(1, page - 1) })}
                disabled={page <= 1}
              >
                Previous
              </button>
              <div className="jb-page">
                Page {page} of {totalPages}
              </div>
              <button
                className="jb-btn jb-btn-secondary"
                type="button"
                onClick={() => setUiSafe({ page: Math.min(totalPages, page + 1) })}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </section>
        </div>
      </main>

      <footer className="jb-footer">
        <div className="jb-container jb-footer-inner">
          <a
            className="jb-muted jb-footer-link"
            href="https://www.linkedin.com/in/jayaramvs/"
            target="_blank"
            rel="noopener noreferrer"
          >
            © 2026 Jayaram Vijayan Sindhu. Built with React. All rights reserved.
          </a>
          <div className="jb-canada" aria-hidden="true">
            Canada, Ontario
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
