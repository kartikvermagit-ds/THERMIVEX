'use client';

import React from 'react';

/**
 * OrbitingSatellite
 * Realistic Earth-observation spacecraft orbiting in 3D perspective around Earth.
 * Features:
 * - Pure SVG & hardware-accelerated SMIL/CSS transforms (0% JS CPU overhead, 60fps).
 * - 22-second continuous orbital trajectory following realistic 3D perspective.
 * - 3D depth simulation: scales up to ~1.05x and full opacity at orbital apex closest to viewer,
 *   shrinks to ~0.62x and completely fades out behind the planetary horizon (occlusion).
 * - Sits at z-[5], strictly behind the central authentication card (z-20) and HUD panels.
 * - Mobile responsive: HUD label hidden on small screens, orbit scaled safely.
 */
export const OrbitingSatellite: React.FC = () => {
  // Orbit trajectory path:
  // Ascends from left horizon (180, 270) into high orbital space (600, 110),
  // descends toward right horizon (1020, 270), and loops through the far/night side of Earth.
  const fullOrbitPath =
    'M 180,270 C 260,160 420,110 600,110 C 780,110 940,160 1020,270 C 1080,360 900,430 600,430 C 300,430 120,360 180,270 Z';

  // Visible front arc in space above Earth
  const frontTrackPath =
    'M 180,270 C 260,160 420,110 600,110 C 780,110 940,160 1020,270';

  // Occluded back arc behind Earth
  const backTrackPath =
    'M 1020,270 C 1080,360 900,430 600,430 C 300,430 120,360 180,270';

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-[5]"
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle cyan glow for front orbital tracking trajectory */}
          <filter id="orbitGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Linear gradient along the visible front orbit trajectory */}
          <linearGradient id="frontOrbitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.08" />
            <stop offset="20%" stopColor="#38bdf8" stopOpacity="0.28" />
            <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.4" />
            <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.08" />
          </linearGradient>

          {/* Solar Panel Specular Sheen Gradient */}
          <linearGradient id="solarGlintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="40%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#bae6fd" />
            <stop offset="60%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>

          {/* Metallic Bus Chassis Gradient */}
          <linearGradient id="satelliteBusGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="35%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Invisible Master Motion Track for animateMotion */}
          <path id="satelliteMasterTrack" d={fullOrbitPath} fill="none" />
        </defs>

        {/* 1. Subtle Back Trajectory Line (faint behind Earth) */}
        <path
          d={backTrackPath}
          fill="none"
          stroke="#0284c7"
          strokeWidth="0.6"
          strokeDasharray="2 12"
          opacity="0.1"
        />

        {/* 2. Elegant Front Trajectory Line (visible in space above Earth) */}
        <path
          d={frontTrackPath}
          fill="none"
          stroke="url(#frontOrbitGradient)"
          strokeWidth="0.9"
          strokeDasharray="3 8"
          filter="url(#orbitGlowFilter)"
        />

        {/* ========================================================
            3. REALISTIC EARTH-OBSERVATION SATELLITE CRAFT
           ======================================================== */}
        <g className="satellite-craft-group">
          {/* Continuous 22-Second Orbital Motion along the 3D Elliptical Path */}
          <animateMotion
            dur="22s"
            repeatCount="indefinite"
            rotate="auto"
            calcMode="linear"
          >
            <mpath href="#satelliteMasterTrack" />
          </animateMotion>

          {/* 3D Depth Opacity:
              0.00: 0.65 (emerging at left horizon)
              0.25: 1.00 (APEX in deep space closest to viewer)
              0.50: 0.60 (descending to right horizon)
              0.56: 0.15 (entering Earth atmosphere limb)
              0.60: 0.00 (completely occluded behind Earth)
              0.88: 0.00 (far side of Earth)
              0.94: 0.25 (beginning emergence)
              1.00: 0.65 (back at left horizon)
          */}
          <animate
            attributeName="opacity"
            dur="22s"
            repeatCount="indefinite"
            values="0.65; 0.85; 1.0; 0.85; 0.60; 0.15; 0; 0; 0.25; 0.65"
            keyTimes="0; 0.12; 0.25; 0.38; 0.50; 0.56; 0.62; 0.88; 0.94; 1"
          />

          {/* 3D Depth Scale:
              Grows to 1.05x at high apex closest to viewer,
              shrinks to ~0.62x when far away behind Earth
          */}
          <g>
            <animateTransform
              attributeName="transform"
              type="scale"
              dur="22s"
              repeatCount="indefinite"
              values="0.78; 0.92; 1.05; 0.92; 0.75; 0.66; 0.62; 0.62; 0.70; 0.78"
              keyTimes="0; 0.12; 0.25; 0.38; 0.50; 0.56; 0.62; 0.88; 0.94; 1"
              additive="sum"
            />

            {/* Spacecraft Visual Elements (Centered at 0, 0) */}
            <g>
              {/* Top Solar Array Wing (Outboard) */}
              <g id="topSolarArray">
                {/* Deployment Boom */}
                <line x1="0" y1="-6" x2="0" y2="-12" stroke="#94a3b8" strokeWidth="1" />
                {/* Solar Panel Wing */}
                <rect
                  x="-8"
                  y="-32"
                  width="16"
                  height="20"
                  rx="1"
                  fill="url(#solarGlintGrad)"
                  stroke="#38bdf8"
                  strokeWidth="0.5"
                />
                {/* Photovoltaic Cell Grid Lines */}
                <line x1="-8" y1="-22" x2="8" y2="-22" stroke="#0c4a6e" strokeWidth="0.5" />
                <line x1="-8" y1="-27" x2="8" y2="-27" stroke="#0c4a6e" strokeWidth="0.4" />
                <line x1="-8" y1="-17" x2="8" y2="-17" stroke="#0c4a6e" strokeWidth="0.4" />
                <line x1="0" y1="-32" x2="0" y2="-12" stroke="#0c4a6e" strokeWidth="0.5" />
                {/* Specular Reflective Highlight */}
                <line
                  x1="-6"
                  y1="-30"
                  x2="-6"
                  y2="-14"
                  stroke="#f0f9ff"
                  strokeWidth="0.6"
                  opacity="0.6"
                />
              </g>

              {/* Bottom Solar Array Wing (Inboard) */}
              <g id="bottomSolarArray">
                {/* Deployment Boom */}
                <line x1="0" y1="6" x2="0" y2="12" stroke="#94a3b8" strokeWidth="1" />
                {/* Solar Panel Wing */}
                <rect
                  x="-8"
                  y="12"
                  width="16"
                  height="20"
                  rx="1"
                  fill="url(#solarGlintGrad)"
                  stroke="#38bdf8"
                  strokeWidth="0.5"
                />
                {/* Photovoltaic Cell Grid Lines */}
                <line x1="-8" y1="22" x2="8" y2="22" stroke="#0c4a6e" strokeWidth="0.5" />
                <line x1="-8" y1="17" x2="8" y2="17" stroke="#0c4a6e" strokeWidth="0.4" />
                <line x1="-8" y1="27" x2="8" y2="27" stroke="#0c4a6e" strokeWidth="0.4" />
                <line x1="0" y1="12" x2="0" y2="32" stroke="#0c4a6e" strokeWidth="0.5" />
                {/* Specular Reflective Highlight */}
                <line
                  x1="-6"
                  y1="14"
                  x2="-6"
                  y2="30"
                  stroke="#f0f9ff"
                  strokeWidth="0.6"
                  opacity="0.6"
                />
              </g>

              {/* Central Satellite Body (Metallic Bus) */}
              <g id="satelliteChassis">
                {/* Main Spacecraft Bus */}
                <rect
                  x="-10"
                  y="-6"
                  width="20"
                  height="12"
                  rx="1.5"
                  fill="url(#satelliteBusGrad)"
                  stroke="#64748b"
                  strokeWidth="0.75"
                />

                {/* Thermal Multi-Layer Insulation (MLI) Trim */}
                <rect
                  x="-8"
                  y="-4.5"
                  width="16"
                  height="9"
                  fill="#0b1329"
                  stroke="#38bdf8"
                  strokeWidth="0.4"
                />
                <line
                  x1="-8"
                  y1="0"
                  x2="8"
                  y2="0"
                  stroke="#f59e0b"
                  strokeWidth="0.5"
                  strokeDasharray="1.5 1.5"
                  opacity="0.7"
                />

                {/* Forward Avionics / Payload Hood */}
                <path
                  d="M 10 -4.5 L 13 -2 L 13 2 L 10 4.5 Z"
                  fill="#334155"
                  stroke="#64748b"
                  strokeWidth="0.5"
                />

                {/* Nadir Earth-Observation Optical Sensor / Thermal Radiometer (Pointing downward) */}
                <circle cx="2" cy="6" r="2" fill="#0369a1" stroke="#38bdf8" strokeWidth="0.5" />
                <circle cx="2" cy="6" r="0.8" fill="#ffffff" />

                {/* High-Gain Telemetry Antenna Boom (Zenith facing) */}
                <line x1="-5" y1="-6" x2="-9" y2="-11" stroke="#94a3b8" strokeWidth="0.7" />
                <circle cx="-9" cy="-11" r="1.1" fill="#38bdf8" />

                {/* Aft Propulsion Thruster Nozzle */}
                <path d="M -10 -2.5 L -12 -3.5 L -12 3.5 L -10 2.5 Z" fill="#1e293b" />

                {/* Subtle Cyan Navigation Strobe Light */}
                <circle cx="9" cy="-4" r="1.1" fill="#22d3ee">
                  <animate
                    attributeName="opacity"
                    values="1; 0.2; 1"
                    dur="1.4s"
                    repeatCount="indefinite"
                  >
                  </animate>
                </circle>
                <circle cx="9" cy="-4" r="2.8" fill="#22d3ee" opacity="0.3">
                  <animate
                    attributeName="r"
                    values="1.8; 4.2; 1.8"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.4; 0; 0.4"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>

              {/* Optional Subtle Telemetry Tag: SAT LINK (HUD Overlay tracking tag) */}
              <g id="satelliteTelemetryHUD" className="hidden sm:block">
                {/* Thin HUD Leader Line */}
                <path
                  d="M 13,-2 L 20,-9 L 28,-9"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="0.4"
                  opacity="0.4"
                />
                {/* Telemetry Monospace Text */}
                <text
                  x="30"
                  y="-7.5"
                  fill="#7dd3fc"
                  fontSize="5.5"
                  fontFamily="monospace"
                  letterSpacing="0.1em"
                  opacity="0.55"
                >
                  SAT LINK
                </text>
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default OrbitingSatellite;
