import React from 'react';

export const NoiseBackground: React.FC = () => {
  return (
    <div className="noise-background" aria-hidden="true">
      <div className="noise-background__vignette" />
      <div className="noise-background__gradient" />
      <div className="noise-background__grain" />
    </div>
  );
};
