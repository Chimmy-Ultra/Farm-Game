import { FarmScene2D } from './scenes/FarmScene2D';
import { HUD } from './components/HUD';
import { Toolbar } from './components/Toolbar';
import { FuturesPanel } from './components/FuturesPanel';

export function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-neutral-900">
      <FarmScene2D />
      <HUD />
      <Toolbar />
      <FuturesPanel />
    </div>
  );
}
