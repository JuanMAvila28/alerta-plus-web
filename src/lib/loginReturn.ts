// Where to go after login. The Google redirect leaves the app, so it is kept in sessionStorage.
const KEY = 'alerta.returnTo';

const isSafePath = (path: string | null): path is string => !!path && path.startsWith('/') && !path.startsWith('//');

export function rememberReturnTo(path: string | null) {
  try {
    if (isSafePath(path)) sessionStorage.setItem(KEY, path);
    else sessionStorage.removeItem(KEY);
  } catch {
    // Without storage the user simply lands on the home screen.
  }
}

/** Reads and forgets the saved path. */
export function takeReturnTo(): string {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return isSafePath(path) ? path : '/';
  } catch {
    return '/';
  }
}
