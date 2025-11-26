import React from 'react';
import Lanyard from './components/Lanyard';
import TargetCursor from './components/TargetCursor';

function App() {
  return (
    <>
      <TargetCursor targetSelector=".cursor-target" />
      <div style={{ width: '100%', height: '100vh', backgroundColor: 'black' }}>
        <Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} />
      </div>
    </>
  );
}

export default App;
