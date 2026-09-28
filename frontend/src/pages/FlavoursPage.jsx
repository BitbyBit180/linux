import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar.jsx';
import DistroCard from '../components/DistroCard.jsx';
import { DistroGridSkeleton, Skeleton } from '../components/Skeleton.jsx';
import { useDistros } from '../hooks/useDistros.js';
import { THEME } from '../theme/designTokens.js';

// Static Dots texture identical to hero page
const STATIC_DOTS = [
  { top: '4%', left: '8%' },
  { top: '6%', left: '24%' },
  { top: '5%', left: '42%' },
  { top: '8%', left: '61%' },
  { top: '3%', left: '78%' },
  { top: '7%', left: '92%' },
  { top: '12%', left: '14%' },
  { top: '15%', left: '33%' },
  { top: '11%', left: '55%' },
  { top: '14%', left: '72%' },
  { top: '17%', left: '86%' },
  { top: '21%', left: '5%' },
  { top: '23%', left: '19%' },
  { top: '19%', left: '48%' },
  { top: '22%', left: '67%' },
  { top: '26%', left: '82%' },
  { top: '28%', left: '95%' },
  { top: '31%', left: '12%' },
  { top: '34%', left: '29%' },
  { top: '30%', left: '58%' },
  { top: '33%', left: '75%' },
  { top: '37%', left: '89%' },
  { top: '41%', left: '7%' },
  { top: '39%', left: '22%' },
  { top: '44%', left: '38%' },
  { top: '42%', left: '64%' },
  { top: '45%', left: '80%' },
  { top: '49%', left: '15%' },
  { top: '47%', left: '31%' },
  { top: '52%', left: '49%' },
  { top: '50%', left: '71%' },
  { top: '53%', left: '93%' },
  { top: '57%', left: '9%' },
  { top: '55%', left: '25%' },
  { top: '59%', left: '43%' },
  { top: '58%', left: '62%' },
  { top: '61%', left: '79%' },
  { top: '64%', left: '18%' },
  { top: '66%', left: '35%' },
  { top: '63%', left: '54%' },
  { top: '67%', left: '73%' },
  { top: '65%', left: '88%' },
  { top: '70%', left: '6%' },
  { top: '72%', left: '28%' },
  { top: '69%', left: '47%' },
  { top: '73%', left: '66%' },
  { top: '75%', left: '84%' },
  { top: '78%', left: '13%' },
  { top: '81%', left: '22%' },
  { top: '77%', left: '40%' },
  { top: '80%', left: '59%' },
  { top: '82%', left: '77%' },
  { top: '79%', left: '94%' },
  { top: '85%', left: '10%' },
  { top: '88%', left: '27%' },
  { top: '84%', left: '51%' },
  { top: '87%', left: '70%' },
  { top: '89%', left: '85%' },
  { top: '92%', left: '4%' },
  { top: '94%', left: '19%' },
  { top: '91%', left: '36%' },
  { top: '95%', left: '56%' },
  { top: '93%', left: '75%' },
  { top: '96%', left: '91%' },
];

export default function FlavoursPage({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Catalogue from the API (hook falls back to local static data offline)
  const { distros, popularDistros, categories, loading } = useDistros();

  // Filtered distros based on search and category
  const filteredAllDistros = useMemo(() => {
    return distros.filter((distro) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        distro.name.toLowerCase().includes(q) ||
        distro.tagline.toLowerCase().includes(q) ||
        distro.basedOn.toLowerCase().includes(q) ||
        distro.pkgMgr.toLowerCase().includes(q) ||
        distro.category.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === 'All' || distro.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, distros]);

  const filteredPopularDistros = useMemo(() => {
    if (!searchQuery.trim()) return popularDistros;
    const q = searchQuery.toLowerCase().trim();
    return popularDistros.filter(
      (distro) =>
        distro.name.toLowerCase().includes(q) ||
        distro.tagline.toLowerCase().includes(q) ||
        distro.basedOn.toLowerCase().includes(q)
    );
  }, [searchQuery, popularDistros]);

  return (
    <div
      style={{
        backgroundColor: '#161B22',
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
      }}
      className="flex flex-col text-[#F0F4F8]"
    >
      {/* Exact Hero CSS Background with Grain Layers */}
      <div className="hero-bg fixed inset-0 z-0" aria-hidden="true">
        <div className="grain-fine" />
        <div className="grain-fiber" />
      </div>

      {/* Static Dot Texture */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        {STATIC_DOTS.map((dot, idx) => (
          <span
            key={idx}
            style={{
              width: '2px',
              height: '2px',
              borderRadius: '50%',
              background: THEME.textMuted,
              opacity: 0.15,
              position: 'absolute',
              top: dot.top,
              left: dot.left,
            }}
          />
        ))}
      </div>

      {/* Navbar with centered search box */}
      <Navbar
        currentRoute="/flavours"
        onNavigate={onNavigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        {/* Find Your Distro quiz CTA */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#E05A38]/15 via-white/[0.04] to-transparent border border-[#E05A38]/30 rounded-2xl px-5 py-4 backdrop-blur-md">
          <div>
            <p className="font-mono text-sm font-bold text-white">
              Not sure which distro fits you?
            </p>
            <p className="font-mono text-xs text-white/55 mt-0.5">
              Answer 10 quick questions and get a personalized recommendation.
            </p>
          </div>
          <button
            onClick={() => onNavigate?.('/quiz')}
            className="px-5 py-2 rounded-full font-mono text-xs font-bold text-white bg-[#E05A38] hover:bg-[#b83d25] transition-colors shrink-0"
          >
            $ Find Your Distro →
          </button>
        </div>

        {/* If searching, display search overview banner */}
        {searchQuery && (
          <div className="mb-8 flex items-center justify-between bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-md">
            <span className="font-mono text-sm text-white/80">
              Showing results for &ldquo;
              <span className="text-[#E05A38] font-bold">{searchQuery}</span>
              &rdquo; ({filteredAllDistros.length} found)
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-mono text-white/50 hover:text-white underline"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* SECTION 1: Popular distro (styled matching flavours-inspiration .png) */}
        {!searchQuery && (
          <section className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold tracking-wider text-white">
                Popular distro
              </h2>
              {/* Red expressive brush underline */}
              <div className="flex justify-center mt-1.5">
                <svg
                  width="220"
                  height="12"
                  viewBox="0 0 220 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="overflow-visible"
                >
                  <path
                    d="M3 7C42 2.5 102 9.5 145 4.5C175 2 208 8 217 5.5"
                    stroke="#E05A38"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M14 9.5C64 6 122 11 182 8C198 7 212 9 216 8"
                    stroke="#E05A38"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                </svg>
              </div>
            </div>

            {/* Popular 5 Distros Grid (Ubuntu, Debian, Kali, Arch, Fedora) */}
            {loading ? (
              <DistroGridSkeleton count={5} />
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6">
              {filteredPopularDistros.map((distro) => (
                <DistroCard
                  key={distro.id}
                  distro={distro}
                  onExplore={(d) => onNavigate?.(`/distro/${d.id}`)}
                />
              ))}
            </div>
            )}
          </section>
        )}

        {/* SECTION 2: All distros */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-xl sm:text-2xl font-mono font-bold tracking-wide text-white">
              All distros
            </h2>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
              {loading ? (
                <div aria-hidden="true" className="flex items-center gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} width={64 + (i % 3) * 14} height={30} radius={9999} />
                  ))}
                </div>
              ) : (
              categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="px-3.5 py-1.5 rounded-full font-mono text-xs transition-all duration-200 shrink-0 select-none"
                    style={{
                      background: isSelected
                        ? 'rgba(255, 255, 255, 0.18)'
                        : 'rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                      border: isSelected
                        ? '1px solid rgba(255, 255, 255, 0.35)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: isSelected
                        ? '0 2px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
                        : 'none',
                    }}
                  >
                    {cat}
                  </button>
                );
              })
              )}
            </div>
          </div>

          {/* All Distros Grid */}
          {loading ? (
            <DistroGridSkeleton count={10} />
          ) : filteredAllDistros.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6">
              {filteredAllDistros.map((distro) => (
                <DistroCard
                  key={distro.id}
                  distro={distro}
                  onExplore={(d) => onNavigate?.(`/distro/${d.id}`)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-white/[0.02] rounded-3xl border border-white/10 backdrop-blur-sm">
              <p className="text-white/60 font-mono text-sm mb-4">
                No Linux distributions matched &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-5 py-2 rounded-full font-mono text-xs font-bold text-white bg-[#E05A38] hover:bg-[#b83d25] transition-colors"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
