interface TutorialOverlayProps {
  tutorialActive: boolean;
  tutorialStep: 'dock_city' | 'accept_mission' | 'goto_refinery' | 'buy_fuel' | 'deliver_fuel' | 'done';
  onSetTutorialActive: (active: boolean) => void;
}

export function TutorialOverlay({ tutorialActive, tutorialStep, onSetTutorialActive }: TutorialOverlayProps) {
  if (!tutorialActive) return null;
  
  const tutorialText = {
    dock_city: 'Fly to Sol City (the large structure to the northeast) and press E to dock.',
    accept_mission: 'Open the station’s Missions tab. Under Hall Contracts, accept “First fuel run: Helios Refinery → Sol City”.',
    goto_refinery: 'Undock (Q). Your waypoint now points to Helios Refinery. Use the waypoint pilot (T), or fly there and dock with E.',
    buy_fuel: 'Open the Production tab. Set trade quantity to 10 and buy Refined Fuel. You need all ten units before returning.',
    deliver_fuel: 'Undock and return to Sol City. Dock there, open Civic Exchange, then sell your Refined Fuel to complete the mission!',
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
          <button onClick={() => onSetTutorialActive(false)} style={{ opacity: 0.9 }}>{tutorialStep === 'done' ? 'Close tutorial' : 'Skip tutorial'}</button>
        </div>
      </div>
    </div>
  );
}

