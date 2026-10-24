import { useState, type ReactNode } from 'react';
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
import HomeScreen from './screens/HomeScreen';
import ContactsScreen from './screens/ContactsScreen';
import PersonScreen from './screens/PersonScreen';
import { CheckList } from './components/CheckList';
import UnderConstruction from './screens/UnderConstruction';

// Screens that need an account (plan section 5).
const ACCOUNT_ROUTES: [string, ReactNode][] = [
  ['/cuenta', <Account />],
  ['/vivienda', <HomeScreen />],
  ['/kit', <CheckList type="kit" />],
  ['/botiquin', <CheckList type="firstAidKit" />],
  ['/checklist', <CheckList type="checklist" />],
  ['/nucleo', <ContactsScreen />],
  ['/nucleo/persona', <PersonScreen />],
  ['/nucleo/persona/:index', <PersonScreen />],
  // Later phases.
  ['/nucleo/avisar/*', <UnderConstruction />],
  ['/premium/*', <UnderConstruction />],
];

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
          {ACCOUNT_ROUTES.map(([path, element]) => (
            <Route key={path} path={path} element={<RequireAccount>{element}</RequireAccount>} />
          ))}
          <Route path="*" element={<UnderConstruction />} />
        </Routes>
      )}
      <Toasts />
      <UpdatePrompt />
    </>
  );
}
