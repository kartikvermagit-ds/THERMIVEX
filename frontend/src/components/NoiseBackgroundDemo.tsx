'use client';

import { MissionAccessScreen } from './MissionAccessScreen';

type NoiseBackgroundDemoProps = {
  onContinue: () => void;
};

export function NoiseBackgroundDemo({ onContinue }: NoiseBackgroundDemoProps) {
  return <MissionAccessScreen onContinue={onContinue} />;
}

export default NoiseBackgroundDemo;
