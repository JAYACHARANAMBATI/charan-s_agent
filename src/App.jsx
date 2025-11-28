import React, { useState, useEffect } from 'react';
import Lanyard from './components/Lanyard';
import TargetCursor from './components/TargetCursor';

function App() {
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' && window.innerWidth <= 768
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Only render TargetCursor on desktop/web, not on mobile */}
      {!isMobile && <TargetCursor targetSelector=".cursor-target" />}
      <div style={{ width: '100%', height: '100vh', backgroundColor: 'black' }}>
        <Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} />
      </div>
    </>
  );
}

export default App;
