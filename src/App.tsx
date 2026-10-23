import { useState } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { RequireAccount } from './components/RequireAccount';
import { Toasts } from './components/Toast';
import { UpdatePrompt } from './components/UpdatePrompt';
import Splash from './screens/Splash';
import MainMenu from './screens/MainMenu';
import LanguageScreen from './screens/LanguageScreen';
import Login from './screens/Login';
import LoginDone from './screens/LoginDone';
import Welcome from './screens/Welcome';
import Account from './screens/Account';
import UnderConstruction from './screens/UnderConstruction';

// Routes from later phases that need an account (plan section 5).
const ACCOUNT_ROUTES = ['/vivienda', '/kit', '/botiquin', '/checklist', '/nucleo/*', '/premium/*'];

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
          <Route path="/login" element={<Login />} />
          <Route path="/login/ok" element={<LoginDone />} />
          <Route path="/bienvenida" element={<Welcome />} />
          <Route
            path="/cuenta"
            element={
              <RequireAccount>
                <Account />
              </RequireAccount>
            }
          />
          {ACCOUNT_ROUTES.map((path) => (
            <Route
              key={path}
              path={path}
              element={
                <RequireAccount>
                  <UnderConstruction />
                </RequireAccount>
              }
            />
          ))}
          <Route path="*" element={<UnderConstruction />} />
        </Routes>
      )}
      <Toasts />
      <UpdatePrompt />
    </>
  );
}
