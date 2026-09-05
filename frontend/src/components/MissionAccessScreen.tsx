'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Radio,
  CheckCircle2,
  Cpu,
  Satellite,
  Activity,
  Database,
  Info,
} from 'lucide-react';
import earthOrbitImg from '../assets/earth_orbit.jpg';
import { TextRoll } from './core/text-roll';
import { TextMorph } from './core/text-morph';
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogTitle,
  MorphingDialogSubtitle,
  MorphingDialogClose,
  MorphingDialogDescription,
  MorphingDialogContainer,
} from './core/morphing-dialog';
import { OrbitingSatellite } from './ui/OrbitingSatellite';

interface MissionAccessScreenProps {
  onContinue: () => void;
}

export const MissionAccessScreen: React.FC<MissionAccessScreenProps> = ({ onContinue }) => {
  const [operatorId, setOperatorId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [authButtonText, setAuthButtonText] = useState('AUTHENTICATE & ENTER CONSOLE');
  const [currentTime, setCurrentTime] = useState('');

  // Live client-derived UTC time (scientifically accurate labeling: SYSTEM TIME)
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticating || authSuccess) return;

    setIsAuthenticating(true);
    setAuthButtonText('CONNECTING TO CONSOLE...');

    setTimeout(() => {
      setIsAuthenticating(false);
      setAuthSuccess(true);
      setAuthButtonText('ACCESS GRANTED // INITIALIZING...');
      setTimeout(() => {
        onContinue();
      }, 450);
    }, 650);
  };

  return (
    <main
      className="relative w-screen h-screen min-h-screen overflow-hidden bg-[#01040a] text-white select-none flex flex-col justify-between font-sans"
      aria-label="THERMIVEX Satellite Mission Access Terminal"
    >
      {/* ========================================================
          1. ULTRA-CRISP SATELLITE EARTH BACKGROUND
         ======================================================== */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Deep space black base */}
        <div className="absolute inset-0 bg-[#01040a]" />

        {/* Razor-sharp Earth limb and city lights from low Earth orbit */}
        <img
          src={earthOrbitImg}
          alt="Curved Earth limb with brilliant electric blue atmospheric rim and night city clusters"
          className="absolute inset-0 w-full h-full object-cover object-[center_32%] brightness-100 contrast-110 saturate-110"
          style={{
            opacity: 0.96,
          }}
          loading="eager"
        />

        {/* Subtle starfield canvas */}
        <StarfieldCanvas />

        {/* Subtle cyan atmospheric arc accentuation */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 28%, rgba(6, 182, 212, 0.16) 0%, rgba(14, 165, 233, 0.04) 50%, transparent 75%)',
          }}
        />

        {/* Precision orbital trajectory lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-35"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse
            cx="50%"
            cy="40%"
            rx="52%"
            ry="25%"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.8"
            strokeDasharray="4 12"
            opacity="0.5"
          />
          <ellipse
            cx="50%"
            cy="40%"
            rx="64%"
            ry="31%"
            fill="none"
            stroke="#0284c7"
            strokeWidth="0.5"
            strokeDasharray="2 16"
            opacity="0.3"
          />
          <line
            x1="0"
            y1="40%"
            x2="100%"
            y2="40%"
            stroke="#38bdf8"
            strokeWidth="0.5"
            strokeDasharray="4 24"
            opacity="0.2"
          />
        </svg>

        {/* Subtle vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(1, 4, 10, 0.15) 0%, rgba(1, 4, 10, 0.5) 75%, rgba(1, 4, 10, 0.9) 100%)',
          }}
        />
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#01040a]/90 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#01040a]/95 to-transparent" />
      </div>

      {/* ========================================================
          1.5 ORBITING EARTH-OBSERVATION SATELLITE (Z-[5])
          Realistic 3D perspective orbit around Earth, passes
          behind the central authentication card & HUD panels
         ======================================================== */}
      <OrbitingSatellite />

      {/* ========================================================
          2. TOP BAR: AEROSPACE BRANDING & SYSTEM STATUS
         ======================================================== */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 sm:px-10 sm:py-5 border-b border-white/[0.08] bg-[#01040a]/75 backdrop-blur-md">
        {/* Left: Branding */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-[#0c1e36] to-[#020711] border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <svg
              className="w-6 h-6 text-cyan-400"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="16"
                cy="16"
                r="13"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 3"
                opacity="0.4"
              />
              <circle
                cx="16"
                cy="16"
                r="9"
                stroke="#38bdf8"
                strokeWidth="1.2"
                opacity="0.8"
              />
              <ellipse
                cx="16"
                cy="16"
                rx="14"
                ry="5.5"
                transform="rotate(-30 16 16)"
                stroke="#06b6d4"
                strokeWidth="1.2"
              />
              <circle cx="26" cy="11" r="2" fill="#38bdf8" className="animate-ping opacity-75" />
              <circle cx="26" cy="11" r="2" fill="#38bdf8" />
              <circle cx="16" cy="16" r="3" fill="#0284c7" />
              <circle cx="16" cy="16" r="1.5" fill="#ffffff" />
            </svg>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white font-black tracking-[0.2em] text-lg sm:text-xl leading-none">
                THERMIVEX
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-[9px] font-mono font-bold text-cyan-300 tracking-wider">
                ORBITAL INTELLIGENCE
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.24em] text-cyan-300/80 font-semibold uppercase mt-1">
              SATELLITE THERMAL INTELLIGENCE SYSTEM
            </span>
          </div>
        </div>

        {/* Right: Data Link & Status */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* MorphingDialog Trigger for Satellite Sensor Dossier */}
          <MorphingDialog
            transition={{
              type: 'spring',
              bounce: 0.05,
              duration: 0.3,
            }}
          >
            <MorphingDialogTrigger
              style={{ borderRadius: '10px' }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-cyan-500/30 bg-[#040e1c]/80 text-[10px] font-mono text-cyan-300 hover:bg-cyan-950/40 hover:border-cyan-400 transition-colors shadow-sm cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>MISSION DOSSIER</span>
            </MorphingDialogTrigger>

            <MorphingDialogContainer>
              <MorphingDialogContent
                style={{ borderRadius: '20px' }}
                className="pointer-events-auto relative flex max-w-[540px] w-full flex-col overflow-hidden border border-cyan-500/40 bg-[#040e1c] text-white p-6 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                    <Satellite className="w-5 h-5" />
                  </div>
                  <div>
                    <MorphingDialogTitle className="text-xl font-bold tracking-wider text-white">
                      THERMIVEX // SATELLITE THERMAL OBSERVATIONS
                    </MorphingDialogTitle>
                    <MorphingDialogSubtitle className="text-xs text-cyan-400 font-mono tracking-wide">
                      VIIRS & MODIS THERMAL ANOMALY PIPELINE
                    </MorphingDialogSubtitle>
                  </div>
                </div>

                <MorphingDialogDescription
                  disableLayoutAnimation
                  variants={{
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: 20 },
                  }}
                  className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans mt-2"
                >
                  <p>
                    THERMIVEX ingests near real-time thermal anomaly and hotspot observations sourced from NASA FIRMS across polar-orbiting environmental satellites (Suomi-NPP, NOAA-20, NOAA-21, Terra, and Aqua).
                  </p>
                  <div className="grid grid-cols-2 gap-3 my-3 font-mono text-[11px]">
                    <div className="p-3 rounded-lg bg-[#020712] border border-white/10">
                      <div className="text-cyan-400 font-bold">VIIRS (I-BAND)</div>
                      <div className="text-slate-300 mt-1">Spatial Resol: ~375m</div>
                      <div className="text-slate-400">Payload: Suomi-NPP / NOAA</div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#020712] border border-white/10">
                      <div className="text-cyan-400 font-bold">MODIS (NRT)</div>
                      <div className="text-slate-300 mt-1">Spatial Resol: ~1000m</div>
                      <div className="text-slate-400">Payload: Terra / Aqua</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Clustering algorithms identify persistent thermal sources, candidate thermal events, and potential industrial fire activity. Estimated screening zones and anomaly alerts require ground verification.
                  </p>
                </MorphingDialogDescription>

                <MorphingDialogClose className="text-white hover:text-cyan-400" />
              </MorphingDialogContent>
            </MorphingDialogContainer>
          </MorphingDialog>

          {/* Scientific status items: DATA LINK: VIIRS • MODIS | NASA FIRMS */}
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#040e1c]/85 border border-white/10 text-[10px] font-mono text-slate-300">
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
            <span>DATA LINK: <strong className="text-cyan-300 font-bold">VIIRS • MODIS</strong></span>
            <span className="text-white/20">|</span>
            <span className="text-slate-400">NASA FIRMS</span>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-[#040e1c]/85 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-300 uppercase">
              SYSTEM ONLINE
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================
          3. CENTER VIEWPORT: HUD PANELS + MISSION ACCESS CARD
         ======================================================== */}
      <div className="relative z-20 flex-1 flex items-center justify-center px-4 py-4 sm:py-6">
        {/* Left Side HUD Panel: THERMAL DATA PIPELINE (Desktop) */}
        <aside className="hidden xl:flex flex-col gap-4 absolute left-10 pointer-events-none w-64 text-[10px] font-mono">
          <div className="p-4 rounded-xl bg-[#020712]/85 border border-cyan-500/25 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-wider mb-2.5 border-b border-white/[0.08] pb-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>THERMAL DATA PIPELINE</span>
            </div>
            <div className="space-y-2 text-slate-300">
              <div>
                <div className="text-[9px] text-slate-400 uppercase">SOURCE FEED</div>
                <div className="text-cyan-300 font-semibold mt-0.5">NASA FIRMS</div>
                <div className="text-slate-300 text-[9px]">VIIRS • MODIS</div>
              </div>
              <div className="pt-1 border-t border-white/[0.06]">
                <div className="text-[9px] text-slate-400 uppercase">THERMAL OBSERVATIONS</div>
                <div className="text-slate-200 mt-0.5">VIIRS ~375M</div>
                <div className="text-slate-200">MODIS ~1KM</div>
              </div>
              <div className="pt-1 border-t border-white/[0.06] flex justify-between items-center">
                <span className="text-[9px] text-slate-400 uppercase">DATA STATUS</span>
                <span className="text-emerald-400 font-bold">NOMINAL</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#020712]/80 border border-white/[0.08] backdrop-blur-md">
            <div className="flex items-center gap-2 text-slate-200 font-semibold tracking-wider mb-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>SPECTRAL DETECTORS</span>
            </div>
            <p className="text-slate-400 text-[9px] leading-relaxed">
              VIIRS / MODIS thermal anomaly observations.
            </p>
          </div>
        </aside>

        {/* Right Side HUD Panel: SATELLITE DATA SOURCES (Desktop) */}
        <aside className="hidden xl:flex flex-col gap-4 absolute right-10 pointer-events-none w-64 text-[10px] font-mono text-right">
          <div className="p-4 rounded-xl bg-[#020712]/85 border border-cyan-500/25 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-end gap-2 text-cyan-400 font-bold tracking-wider mb-2.5 border-b border-white/[0.08] pb-1.5">
              <span>SATELLITE DATA SOURCES</span>
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-cyan-300 font-semibold">SUOMI-NPP</span>
                <span className="text-slate-300">VIIRS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-300 font-semibold">NOAA-20</span>
                <span className="text-slate-300">VIIRS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-300 font-semibold">NOAA-21</span>
                <span className="text-slate-300">VIIRS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-300 font-semibold">TERRA / AQUA</span>
                <span className="text-slate-300">MODIS</span>
              </div>
              <div className="pt-2 mt-2 border-t border-white/[0.06] text-left">
                <div className="text-[9px] text-slate-400 uppercase">NASA FIRMS</div>
                <div className="text-[9px] text-slate-300">ACTIVE FIRE / THERMAL ANOMALY DATA</div>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[9px] text-slate-400 uppercase">DATA STATUS</span>
                <span className="text-emerald-400 font-bold">NOMINAL</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#020712]/80 border border-white/[0.08] backdrop-blur-md text-left">
            <div className="text-slate-400 text-[9px] uppercase tracking-wider mb-1">
              SYSTEM TIME
            </div>
            <div className="text-cyan-300 font-bold text-[11px]">
              {currentTime || 'SYNCHRONIZING UTC...'}
            </div>
          </div>
        </aside>

        {/* Center Mission Access Glassmorphic Card */}
        <div
          className="relative w-full max-w-[490px] sm:max-w-[520px] rounded-2xl p-7 sm:p-9 border border-cyan-500/35 backdrop-blur-2xl transition-all"
          style={{
            background: 'linear-gradient(145deg, rgba(4, 11, 24, 0.90), rgba(1, 5, 14, 0.96))',
            boxShadow:
              '0 30px 80px -10px rgba(0, 0, 0, 0.95), 0 0 50px -10px rgba(6, 182, 212, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Tactical Corner HUD Accents */}
          <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
          <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
          <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
          <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

          {/* Top Pill Status Badge: MISSION ACCESS // SECURE */}
          <div className="flex justify-center mb-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-cyan-400/40 bg-cyan-950/60 text-[10px] uppercase font-mono tracking-widest text-cyan-300 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
              <span>MISSION ACCESS // SECURE</span>
            </div>
          </div>

          {/* Card Header & Dynamic TextRoll Title */}
          <div className="text-center">
            <div className="my-1 cursor-pointer">
              <TextRoll
                className="text-4xl sm:text-5xl font-black tracking-[0.18em] text-white drop-shadow-[0_2px_24px_rgba(56,189,248,0.55)]"
                duration={0.4}
              >
                THERMIVEX
              </TextRoll>
            </div>
            <p className="text-[11px] sm:text-xs uppercase font-mono tracking-[0.2em] text-slate-300 font-medium mt-1.5">
              THERMAL INTELLIGENCE COMMAND CENTER
            </p>
          </div>

          {/* Tactical Divider */}
          <div className="flex items-center gap-3 my-5 sm:my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
            <span className="text-[9px] font-mono font-bold text-cyan-400/80 tracking-widest uppercase">
              OPERATOR GATEWAY
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
          </div>

          {/* Form Description */}
          <div className="mb-5">
            <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-cyan-300 uppercase">
              OPERATOR AUTHENTICATION
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Authenticate to access the satellite thermal intelligence console.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Monitor thermal anomalies, persistent sources and potential industrial fire events.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Operator ID Input */}
            <div>
              <label
                htmlFor="operator-id"
                className="block text-[10px] font-mono tracking-wider text-slate-300 font-semibold uppercase mb-1.5"
              >
                OPERATOR ID
              </label>
              <div className="flex items-center h-12 w-full bg-[#020712] border border-cyan-500/35 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-cyan-400/50 focus-within:border-cyan-400 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.7)]">
                <span className="text-cyan-400 shrink-0 mr-3 flex items-center justify-center pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="operator-id"
                  type="text"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  placeholder="Enter operator ID"
                  className="w-full h-full bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-500 font-mono"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-[10px] font-mono tracking-wider text-slate-300 font-semibold uppercase mb-1.5"
              >
                ACCESS KEY // PASSWORD
              </label>
              <div className="flex items-center h-12 w-full bg-[#020712] border border-cyan-500/35 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-cyan-400/50 focus-within:border-cyan-400 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.7)]">
                <span className="text-cyan-400 shrink-0 mr-3 flex items-center justify-center pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter access key"
                  className="w-full h-full bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-500 font-mono"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer p-1 ml-2 shrink-0 flex items-center justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button with TextMorph */}
            <button
              type="submit"
              disabled={isAuthenticating || authSuccess}
              className="w-full h-12 mt-3 rounded-xl text-white font-bold text-xs sm:text-sm tracking-[0.16em] uppercase flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer disabled:opacity-90 disabled:cursor-not-allowed group relative overflow-hidden"
              style={{
                background: authSuccess
                  ? 'linear-gradient(90deg, #059669, #10B981)'
                  : 'linear-gradient(90deg, #0284c7, #06b6d4, #0284c7)',
                backgroundSize: '200% auto',
                boxShadow: authSuccess
                  ? '0 0 35px rgba(16, 185, 129, 0.7)'
                  : '0 4px 25px rgba(6, 182, 212, 0.45)',
              }}
            >
              {isAuthenticating && <Radio className="w-4 h-4 animate-spin text-white" />}
              {authSuccess && <CheckCircle2 className="w-4 h-4 text-white" />}
              <TextMorph>{authButtonText}</TextMorph>
              {!isAuthenticating && !authSuccess && (
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              )}
            </button>
          </form>

          {/* Security Information Footnote */}
          <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-col items-center text-center gap-1">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-mono tracking-wider uppercase font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>SECURE SATELLITE INTELLIGENCE CONNECTION</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Satellite intelligence access is restricted to authorized operators.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. BOTTOM SYSTEM STATUS BAR
         ======================================================== */}
      <footer className="relative z-20 w-full border-t border-white/[0.08] bg-[#01040a]/80 backdrop-blur-md px-6 py-2.5 sm:px-10 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono tracking-widest text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">THERMIVEX</span>
          <span className="text-cyan-500">//</span>
          <span className="text-slate-400">SATELLITE INTELLIGENCE PLATFORM</span>
        </div>

        <div className="flex items-center gap-2 text-cyan-300/80">
          <span>VIIRS (375M)</span>
          <span>•</span>
          <span>MODIS (1KM)</span>
          <span>•</span>
          <span>FIRMS</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
          <span className="text-slate-400">MISSION STATUS:</span>
          <span className="text-emerald-400 font-bold">NOMINAL // OPERATIONAL</span>
        </div>
      </footer>
    </main>
  );
};

// Subtle background starfield canvas component
const StarfieldCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const stars = Array.from({ length: 75 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.55),
      size: Math.random() * 1.5 + 0.4,
      alpha: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      stars.forEach((star) => {
        star.twinklePhase += star.twinkleSpeed;
        const currentAlpha =
          star.alpha + Math.sin(star.twinklePhase) * 0.3 * star.alpha;

        ctx.fillStyle = `rgba(224, 242, 254, ${Math.max(0.15, currentAlpha)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
      aria-hidden="true"
    />
  );
};

export default MissionAccessScreen;
