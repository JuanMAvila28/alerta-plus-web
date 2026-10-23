// The part of Google Identity Services used by GoogleButton.
interface GoogleIdConfiguration {
  client_id: string;
  ux_mode: 'redirect' | 'popup';
  login_uri: string;
  auto_select?: boolean;
  itp_support?: boolean;
}

interface GoogleButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize(config: GoogleIdConfiguration): void;
        renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
      };
    };
  };
}
