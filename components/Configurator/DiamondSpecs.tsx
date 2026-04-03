import React, { useState, useEffect } from 'react';
interface MobileSpecsProps {
  active: string | null;
  setActive: (s: string | null) => void;
  isConfiguratorOpen?: boolean;
}

const MobileSpecs: React.FC<MobileSpecsProps> = ({ active, setActive, isConfiguratorOpen }) => {
  // When configurator is open on mobile, do not render the mobile specs
  if (isConfiguratorOpen) return null;

  return (
    <>
      <div className="md:hidden fixed bottom-10 left-0 w-full z-40">
        <div className="overflow-x-auto px-4 py-2">
          <div className="flex gap-3 items-center w-max snap-x snap-mandatory">
            {ITEMS_SIMPLE.map((label) => (
              <button
                key={`mobile-${label}`}
                onClick={() => setActive(active === label ? null : label)}
                className={`flex-shrink-0 flex items-center gap-2 bg-[#f3f4f6] text-[#333333] px-3 py-2 rounded-full shadow-sm hover:scale-[1.02] transition-transform ${
                  active === label ? 'ring-2 ring-indigo-400' : ''
                }`}
                draggable={false}
              >
                <span className="w-5 h-5 flex items-center justify-center bg-white border border-[#d1d5db] rounded-full text-xs">+</span>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {active ? (
        <div className="md:hidden fixed left-4 right-4 bottom-[5.5rem] z-50">
          <Panel label={active} onClose={() => setActive(null)} />
        </div>
      ) : null}
    </>
  );
};

const ITEMS_SIMPLE = ['Cut', 'Clarity', 'Color', 'Carat', 'Brilliance', 'Fire', 'Scintillation'];

const DESCRIPTIONS: Record<string, { title: string; text: string; image?: string }> = {
  Cut: {
    title: 'Cut',
    text:
      "Measures how expertly a diamond’s facets are proportioned, shaped and polished to interact with light, creating brilliance, fire and sparkle that bring a diamond to life.",
    image: '/assets/images/cut.png',
  },
  Clarity: {
    title: 'Clarity',
    text: "Assesses the presence, size and visibility of natural internal inclusions and external blemishes that affect a diamond's purity and appearance.",
    image: '/assets/images/clarity.png',
  },
  Color: {
    title: 'Color',
    text: 'Refers to the absence of color in a diamond; stones closer to colorless allow more light to pass through, enhancing brilliance and value.',
    image: '/assets/images/color.png',
  },
  Carat: {
    title: 'Carat',
    text: "Represents the diamond’s weight in metric carats (200 mg each), which influences rarity and price, though not necessarily visual size.",
  },
  Brilliance: {
    title: 'Brilliance',
    text: 'The brightness created by white light reflecting from a diamond’s surface and interior, giving it a lively, luminous appearance.',
    image: '/assets/images/brilliance.png',
  },
  Fire: {
    title: 'Fire',
    text: 'The flashes of spectral color you see when white light disperses into rainbow hues, adding drama and visual richness to the diamond.',
    image: '/assets/images/fire.png',
  },
  Scintillation: {
    title: 'Scintillation',
    text: 'The sparkle effect produced by light and dark patterns as the diamond or the observer moves, creating dynamic flashes and contrast.',
    image: '/assets/images/Scintillation.png',
  },
};

const Panel: React.FC<{ label: string; onClose: () => void }> = ({ label, onClose }) => {
  const desc = DESCRIPTIONS[label];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => {
      cancelAnimationFrame(id);
      setMounted(false);
    };
  }, [label]);

  return (
    <div
      key={`${label}-panel`}
      className={`w-full md:w-[420px] transform-gpu transition-all duration-500 ease-in-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'
      }`}
    >
      <div className={`bg-[rgba(238,238,242,0.8)] border border-[rgba(238,238,242,0.8)] ${desc?.image ? 'rounded-t-[32px]' : 'rounded-[32px]'} p-4 text-[#333333] relative`}>
        <p className="text-[14px] leading-relaxed"><strong>{desc?.title || label}: </strong>{desc?.text || ''}</p>
      </div>

      {desc?.image ? (
        <div style={{ backgroundColor: 'white' }} className="shadow-[0_0_0_0.25px_#3C3C3C] rounded-b-[32px] overflow-hidden h-[150px] w-full bg-transparent">
          <img src={desc.image} alt={`${desc?.title} diagram`} className="block w-full h-auto max-h-full object-contain" />
        </div>
      ) : null}
    </div>
  );
};

export const DiamondSpecs: React.FC<{ isConfiguratorOpen?: boolean }> = ({ isConfiguratorOpen }) => {
  const [active, setActive] = useState<string | null>(null);

  return (
    <>
      <div className="hidden md:flex fixed top-1/2 left-4 transform -translate-y-1/2 z-20">
        <div className="relative flex items-start gap-3">
          <div className="select-none" onMouseDown={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-3">
              {ITEMS_SIMPLE.map((label) => {
                const isActive = active === label;
                return (
                  <button
                    key={label}
                    onClick={() => setActive(isActive ? null : label)}
                    className={`flex items-center gap-3 bg-[#f3f4f6] text-[#333333] px-4 py-2 rounded-full shadow-sm transition-transform ${
                      isActive ? 'ring-2 ring-indigo-400 scale-[1.02]' : 'hover:scale-[1.02]'
                    }`}
                    draggable={false}
                  >
                    <span className="w-[20px] h-[20px] flex items-center justify-center bg-white border border-[#3C3C3C] rounded-full text-sm text-[#333333]" draggable={false}>
                      {isActive ? '-' : '+'}
                    </span>
                    <span className="text-sm font-medium text-[#3C3C3C]" draggable={false}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {active && (
            <div className="relative w-full max-w-[420px]">
              <Panel label={active} onClose={() => setActive(null)} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile horizontal scroller placed below the ring model */}
      <MobileSpecs active={active} setActive={setActive} isConfiguratorOpen={isConfiguratorOpen} />
    </>
  );
};

export default DiamondSpecs;
