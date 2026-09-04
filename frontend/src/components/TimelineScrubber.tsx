import React, { useState, useEffect } from 'react';
import { Play, Pause, FastForward, Rewind, Clock, Satellite } from 'lucide-react';

interface TimelineScrubberProps {
  selectedPassTime: string;
  onSelectPassTime: (time: string) => void;
}

const SATELLITE_PASSES = [
  { id: 'all', time: 'LIVE FEED', label: 'All Active Detections', sat: 'REALTIME STREAM' },
  { id: '0200', time: '02:00 UTC', label: 'Terra MODIS Overpass', sat: 'TERRA' },
  { id: '0815', time: '08:15 UTC', label: 'Suomi-NPP Day Pass', sat: 'SNPP_VIIRS' },
  { id: '1330', time: '13:30 UTC', label: 'Aqua MODIS Overpass', sat: 'AQUA' },
  { id: '1940', time: '19:40 UTC', label: 'Suomi-NPP Night Pass', sat: 'SNPP_VIIRS' },
  { id: '2134', time: '21:34 UTC', label: 'NOAA-20 Conflagration Peak', sat: 'NOAA20_VIIRS' }
];

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  selectedPassTime: _selectedPassTime,
  onSelectPassTime
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % SATELLITE_PASSES.length;
          onSelectPassTime(SATELLITE_PASSES[next].id);
          return next;
        });
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, onSelectPassTime]);

  const handleStep = (dir: 'next' | 'prev') => {
    setIsPlaying(false);
    let nextIdx = dir === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIdx < 0) nextIdx = SATELLITE_PASSES.length - 1;
    if (nextIdx >= SATELLITE_PASSES.length) nextIdx = 0;
    setCurrentIndex(nextIdx);
    onSelectPassTime(SATELLITE_PASSES[nextIdx].id);
  };

  const currentPass = SATELLITE_PASSES[currentIndex] || SATELLITE_PASSES[0];

  return (
    <div style={{
      position: 'absolute',
      bottom: '56px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(15, 20, 28, 0.94)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '10px',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      zIndex: 450,
      boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
      minWidth: '580px'
    }}>
      {/* Play/Step Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => handleStep('prev')}
          title="Previous Overpass"
          style={{
            background: 'none',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            padding: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Rewind size={13} />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            backgroundColor: isPlaying ? '#EF4444' : 'var(--accent-cyan)',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 10px',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease'
          }}
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          <span>{isPlaying ? 'Pause' : 'Play Series'}</span>
        </button>

        <button
          onClick={() => handleStep('next')}
          title="Next Overpass"
          style={{
            background: 'none',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            padding: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <FastForward size={13} />
        </button>
      </div>

      {/* Scrub Ticks */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-cyan)' }}>
            <Clock size={11} />
            <strong className="font-mono">{currentPass.time}</strong>
            <span style={{ color: 'var(--text-muted)' }}>• {currentPass.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
            <Satellite size={11} />
            <span className="font-mono">{currentPass.sat}</span>
          </div>
        </div>

        {/* Interactive Scrub Bar */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {SATELLITE_PASSES.map((p, idx) => (
            <div
              key={p.id}
              onClick={() => {
                setIsPlaying(false);
                setCurrentIndex(idx);
                onSelectPassTime(p.id);
              }}
              style={{
                flex: 1,
                height: '6px',
                borderRadius: '3px',
                backgroundColor: idx === currentIndex ? 'var(--accent-cyan)' : '#1E293B',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: idx === currentIndex ? '0 0 8px var(--accent-cyan)' : 'none'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
