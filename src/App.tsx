import { useState } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { Toasts } from './components/Toast';
import { UpdatePrompt } from './components/UpdatePrompt';
import Splash from './screens/Splash';
import MainMenu from './screens/MainMenu';
import LanguageScreen from './screens/LanguageScreen';
import UnderConstruction from './screens/UnderConstruction';

export default function App() {
  const { pathname } = useLocation();
  // The splash only shows when opening `/`: a shortcut to /sismo or /emergencia must not wait.
  const [showSplash, setShowSplash] = useState(pathname === '/');

  return (
    <>
      {showSplash ? (
        <Splash onDone={() => setShowSplash(false)} />
      ) : (
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/idioma" element={<LanguageScreen />} />
          <Route path="*" element={<UnderConstruction />} />
        </Routes>
      )}
      <Toasts />
      <UpdatePrompt />
    </>
  );
}
