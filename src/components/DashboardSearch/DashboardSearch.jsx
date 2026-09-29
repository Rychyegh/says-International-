import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, ArrowRight, CornerDownLeft, Sparkles,
  UserPlus, UploadCloud, Users, FileText, PlusCircle, Key, CreditCard,
  MessageSquare, Award, CheckCircle2, DollarSign, Coins, Sliders,
  GraduationCap, ShieldAlert, Receipt, Printer, FileSpreadsheet,
  AlertTriangle, TrendingUp, FileCheck, Briefcase, BookOpen,
  PenTool, CheckSquare, BookMarked, Calendar, Mail, Bus,
  Navigation, MessageCircle, CalendarDays, BookOpenCheck, Clock,
  ChevronRight, Compass
} from 'lucide-react';
import { SEARCH_CATALOG } from './searchCatalog';
import './DashboardSearch.css';

const ICON_MAP = {
  UserPlus: <UserPlus size={16} />,
  UploadCloud: <UploadCloud size={16} />,
  Users: <Users size={16} />,
  FileText: <FileText size={16} />,
  PlusCircle: <PlusCircle size={16} />,
  Key: <Key size={16} />,
  CreditCard: <CreditCard size={16} />,
  MessageSquare: <MessageSquare size={16} />,
  Award: <Award size={16} />,
  CheckCircle2: <CheckCircle2 size={16} />,
  DollarSign: <DollarSign size={16} />,
  Coins: <Coins size={16} />,
  Sliders: <Sliders size={16} />,
  GraduationCap: <GraduationCap size={16} />,
  ShieldAlert: <ShieldAlert size={16} />,
  Receipt: <Receipt size={16} />,
  Printer: <Printer size={16} />,
  FileSpreadsheet: <FileSpreadsheet size={16} />,
  AlertTriangle: <AlertTriangle size={16} />,
  TrendingUp: <TrendingUp size={16} />,
  FileCheck: <FileCheck size={16} />,
  Briefcase: <Briefcase size={16} />,
  BookOpen: <BookOpen size={16} />,
  PenTool: <PenTool size={16} />,
  CheckSquare: <CheckSquare size={16} />,
  BookMarked: <BookMarked size={16} />,
  Calendar: <Calendar size={16} />,
  Mail: <Mail size={16} />,
  Bus: <Bus size={16} />,
  Navigation: <Navigation size={16} />,
  MessageCircle: <MessageCircle size={16} />,
  CalendarDays: <CalendarDays size={16} />,
  BookOpenCheck: <BookOpenCheck size={16} />,
  Clock: <Clock size={16} />
};

export default function DashboardSearch({ activePortal }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  // Global Keyboard Shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and rank items
  const filteredResults = useMemo(() => {
    let items = SEARCH_CATALOG;

    if (selectedCategory !== 'All') {
      items = items.filter((item) => item.category === selectedCategory);
    }

    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return items;
    }

    const searchTokens = trimmed.split(/\s+/).filter(Boolean);

    return items
      .map((item) => {
        let score = 0;
        const titleLower = item.title.toLowerCase();
        const descLower = item.description.toLowerCase();
        const navLower = item.nav.toLowerCase();
        const portalLower = item.portalLabel.toLowerCase();
        const keywords = (item.keywords || []).map((k) => k.toLowerCase());

        // Boost exact / prefix matches in title
        if (titleLower === trimmed) score += 100;
        else if (titleLower.startsWith(trimmed)) score += 50;
        else if (titleLower.includes(trimmed)) score += 30;

        // Boost navigation tab match
        if (navLower.includes(trimmed)) score += 40;

        // Boost keyword matches
        searchTokens.forEach((token) => {
          if (titleLower.includes(token)) score += 15;
          if (descLower.includes(token)) score += 10;
          if (navLower.includes(token)) score += 20;
          if (portalLower.includes(token)) score += 10;
          keywords.forEach((kw) => {
            if (kw.includes(token)) score += 12;
          });
        });

        return { item, score };
      })
      .filter((res) => res.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((res) => res.item);
  }, [query, selectedCategory]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Handle keyboard navigation in list
  const handleInputKeyDown = (e) => {
    if (!isOpen || filteredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
      scrollToItem((selectedIndex + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
      scrollToItem((selectedIndex - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex]);
      }
    }
  };

  const scrollToItem = (index) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('.dashboard-search__result-item');
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  };

  // Perform direct navigation to portal and target page
  const handleSelectItem = (item) => {
    if (!item) return;

    // Save target activeNav in localStorage for that portal
    try {
      localStorage.setItem(`says_${item.portal}_active_nav`, item.nav);
      if (item.tab) {
        if (item.portal === 'admin') {
          localStorage.setItem('says_admin_onboard_tab', item.tab);
        }
      }
      if (item.simsTab && item.portal === 'accountant') {
        localStorage.setItem('says_accountant_sims_tab', item.simsTab);
      }
    } catch (e) {}

    // Dispatch custom navigation event so the portal updates state immediately
    window.dispatchEvent(
      new CustomEvent('says_navigate', {
        detail: {
          portal: item.portal,
          nav: item.nav,
          tab: item.tab,
          simsTab: item.simsTab,
          isCreatingApp: item.isCreatingApp,
        },
      })
    );

    // Route to portal if not already on it
    navigate(`/${item.portal}`);

    setIsOpen(false);
    setQuery('');
  };

  const CATEGORIES = ['All', 'Admin', 'Finance', 'Staff', 'Parent', 'Student'];

  return (
    <div className="dashboard-search" ref={containerRef}>
      {/* Search Input Bar */}
      <div className={`dashboard-search__input-wrapper ${isOpen ? 'is-focused' : ''}`}>
        <Search className="dashboard-search__icon" size={16} />
        <input
          ref={inputRef}
          type="text"
          className="dashboard-search__input"
          placeholder="Search functions, tools, buttons, or pages..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          aria-label="Search dashboard features and pages"
        />

        {query && (
          <button
            type="button"
            className="dashboard-search__clear-btn"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}

        <div className="dashboard-search__shortcut" onClick={() => inputRef.current?.focus()}>
          <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd>
          <kbd>K</kbd>
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="dashboard-search__dropdown animate-fade-down">
          {/* Category Filter Pills */}
          <div className="dashboard-search__categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`dashboard-search__cat-pill ${selectedCategory === cat ? 'is-active' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  inputRef.current?.focus();
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results Header / Hint */}
          <div className="dashboard-search__header">
            <span className="dashboard-search__header-title">
              {query.trim() ? (
                <>
                  Found <strong>{filteredResults.length}</strong> matching function{filteredResults.length === 1 ? '' : 's'}
                </>
              ) : (
                <>
                  <Sparkles size={13} style={{ color: '#eab308' }} />
                  Popular Functions & Quick Page Navigation
                </>
              )}
            </span>
            <span className="dashboard-search__header-hint">Click or press Enter to navigate</span>
          </div>

          {/* Result List */}
          <div className="dashboard-search__results" ref={listRef}>
            {filteredResults.length > 0 ? (
              filteredResults.map((item, index) => {
                const isSelected = index === selectedIndex;
                const icon = ICON_MAP[item.icon] || <Compass size={16} />;

                return (
                  <div
                    key={item.id}
                    className={`dashboard-search__result-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="dashboard-search__item-left">
                      <div
                        className="dashboard-search__item-icon"
                        style={{ backgroundColor: `${item.portalColor}15`, color: item.portalColor }}
                      >
                        {icon}
                      </div>

                      <div className="dashboard-search__item-info">
                        <div className="dashboard-search__item-title-row">
                          <span className="dashboard-search__item-title">{item.title}</span>
                          <span
                            className="dashboard-search__portal-tag"
                            style={{
                              borderColor: `${item.portalColor}40`,
                              backgroundColor: `${item.portalColor}10`,
                              color: item.portalColor,
                            }}
                          >
                            {item.portalLabel}
                          </span>
                        </div>

                        <p className="dashboard-search__item-desc">{item.description}</p>

                        {/* Visual Target Location Breadcrumb */}
                        <div className="dashboard-search__item-path">
                          <span className="dashboard-search__path-label">Click Page:</span>
                          <span className="dashboard-search__path-step">{item.portalLabel}</span>
                          <ChevronRight size={12} className="dashboard-search__path-arrow" />
                          <span className="dashboard-search__path-target">{item.nav}</span>
                          {item.tab && (
                            <>
                              <ChevronRight size={12} className="dashboard-search__path-arrow" />
                              <span className="dashboard-search__path-subtarget">{item.tab === 'bulk' ? 'Bulk Upload' : item.tab}</span>
                            </>
                          )}
                          {item.simsTab && (
                            <>
                              <ChevronRight size={12} className="dashboard-search__path-arrow" />
                              <span className="dashboard-search__path-subtarget">{item.simsTab}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-search__item-action">
                      <button
                        type="button"
                        className="dashboard-search__go-btn"
                        style={{ background: item.portalColor }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectItem(item);
                        }}
                      >
                        <span>Open</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="dashboard-search__empty">
                <Search size={32} className="dashboard-search__empty-icon" />
                <p className="dashboard-search__empty-title">No functions or pages found for "{query}"</p>
                <p className="dashboard-search__empty-subtitle">
                  Try searching for terms like <em>"onboard"</em>, <em>"receipt"</em>, <em>"scores"</em>, <em>"sms"</em>, <em>"exams"</em>, or <em>"timetable"</em>.
                </p>
              </div>
            )}
          </div>

          {/* Footer Guide */}
          <div className="dashboard-search__footer">
            <div className="dashboard-search__footer-item">
              <kbd className="dashboard-search__key">↑</kbd>
              <kbd className="dashboard-search__key">↓</kbd>
              <span>to navigate</span>
            </div>
            <div className="dashboard-search__footer-item">
              <kbd className="dashboard-search__key"><CornerDownLeft size={10} /></kbd>
              <span>to select page</span>
            </div>
            <div className="dashboard-search__footer-item">
              <kbd className="dashboard-search__key">ESC</kbd>
              <span>to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
