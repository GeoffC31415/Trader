interface TutorialOverlayProps {
  tutorialActive: boolean;
  tutorialStep: 'dock_city' | 'accept_mission' | 'goto_refinery' | 'buy_fuel' | 'deliver_fuel' | 'done';
  onSetTutorialActive: (active: boolean) => void;
}

export function TutorialOverlay({ tutorialActive, tutorialStep, onSetTutorialActive }: TutorialOverlayProps) {
  if (!tutorialActive) return null;
  
  const tutorialText = {
    dock_city: 'Fly to Sol City (the large structure to the northeast) and press E to dock.',
    accept_mission: 'Scroll down in the Market panel to "Hall Contracts" section. Find a mission to deliver Refined Fuel and click Accept.',
    goto_refinery: 'Undock (press Q) and fly to Helios Refinery (south) where fuel is cheap. Dock there (press E when close).',
    buy_fuel: 'In the Market panel, buy the Refined Fuel needed for your mission. The mission objective shows your progress.',
    deliver_fuel: 'Undock and return to Sol City. Dock there, then sell your Refined Fuel in the Market to complete the mission!',
    done: "Tutorial complete! You've completed your first contract. Keep trading, taking missions, and upgrading your ship.",
  };
  
  return (
    <div style={{ position: 'absolute', left: 16, bottom: 16, zIndex: 30, maxWidth: 460 }}>
      <div style={{ background: 'rgba(11,18,32,0.92)', color: '#e5e7eb', padding: 12, borderRadius: 10, border: '1px solid #1f2937', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Tutorial Mission</div>
        <div style={{ fontSize: 14, lineHeight: 1.4 }}>
          {tutorialText[tutorialStep]}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={() => onSetTutorialActive(false)} style={{ opacity: 0.9 }}>Skip tutorial</button>
        </div>
      </div>
    </div>
  );
}

