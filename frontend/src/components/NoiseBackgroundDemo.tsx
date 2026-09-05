import React from 'react';
import { NoiseBackground } from './ui/noise-background';

type NoiseBackgroundDemoProps = {
  onContinue: () => void;
};

export function NoiseBackgroundDemo({ onContinue }: NoiseBackgroundDemoProps) {
  return (
    <div className="login-screen">
      <NoiseBackground />
      <div className="login-screen__content">
        <span className="login-screen__badge">Mission Access</span>
        <h1 className="login-screen__title">THERMIVEX</h1>
        <p className="login-screen__subtitle">
          Thermal intelligence command center
        </p>
        <button className="login-screen__button" onClick={onContinue} type="button">
          Continue
        </button>
      </div>
    </div>
  );
}
