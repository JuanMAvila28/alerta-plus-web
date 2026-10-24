// Interfaces for the JSON files in src/content and for user data.

export type Language = 'es' | 'en';

/** Bilingual text. `en: null` = not translated in the original app (Spanish is shown). */
export interface LocalizedText {
  es: string;
  en: string | null;
}

type Section<K extends string> = Record<K, LocalizedText>;

// ---------- ui-text.json ----------

export interface UiText {
  _description: string;
  app: Section<'name' | 'tagline' | 'splashTagline'>;
  menu: Section<
    'earthquake' | 'emergency' | 'home' | 'kit' | 'firstAidKit' | 'checklist' | 'premium' | 'contacts' | 'language' | 'privacy'
  >;
  emergency: Section<'title' | 'question' | 'back'>;
  protocol: Section<'counter' | 'autoContinue' | 'backToEmergencies' | 'back' | 'exit'>;
  lists: Section<'readyCount' | 'backToMenu'>;
  contacts: Section<
    'title' | 'subtitle' | 'description' | 'myContacts' | 'relationship' | 'delete' | 'edit' | 'add' | 'notify' | 'backToMenu'
  >;
  person: Section<'title' | 'description' | 'name' | 'phone' | 'pickContact' | 'selectedPhone' | 'relationship' | 'save'>;
  notify: Section<'title' | 'question' | 'imSafe' | 'needHelp' | 'back'>;
  confirm: Section<'safeTitle' | 'safeMessage' | 'helpTitle' | 'helpMessage' | 'confirm' | 'back'>;
  sms: Section<
    'safeText' | 'helpText' | 'locationLine' | 'accuracy' | 'sent' | 'noContacts' | 'noPhones' | 'noLocation' | 'locationDenied'
  >;
  premium: Section<
    | 'title'
    | 'description'
    | 'location'
    | 'oneTimePayment'
    | 'share'
    | 'shareTitle'
    | 'shareText'
    | 'buy'
    | 'active'
    | 'restore'
    | 'back'
    | 'pricePending'
    | 'promoPricePending'
  > & { _googlePlayMessages: LocalizedText[] };
  language: Section<'title' | 'question' | 'spanish' | 'english' | 'back'>;
}

// ---------- home.json ----------

export type HomeFieldKey =
  | 'homeType'
  | 'floor'
  | 'streetAccess'
  | 'stairs'
  | 'elevator'
  | 'emergencyExit'
  | 'evacuationRoute'
  | 'meetingPoint';

export interface HomeOption {
  /** Stored value; the earthquake rules compare against it. */
  value: string;
  label: LocalizedText;
}

export interface HomeField {
  key: HomeFieldKey;
  label: LocalizedText;
  options: HomeOption[];
  /** `value` of the default option. */
  default: string;
}

export interface HomeContent {
  _description: string;
  title: LocalizedText;
  description: LocalizedText;
  fields: HomeField[];
  saveButton: LocalizedText;
  backButton: LocalizedText;
}

/** The user's home: each entry is the `value` of the chosen option. */
export type Home = Record<HomeFieldKey, string>;

// ---------- earthquake.json ----------

export type EarthquakePredicate =
  | 'isApartment'
  | 'isHighFloor'
  | 'hasStairs'
  | 'hasElevator'
  | 'hasEvacuationRoute'
  | 'hasMeetingPoint'
  | 'hasDirectExit'
  | 'exitIsStairs';

export interface EarthquakeInstruction {
  text: LocalizedText;
  /** Expression with predicates, `&&`, `||` and `!`. No condition = always shown. */
  condition?: string;
}

export interface EarthquakeStep {
  number: number;
  title: LocalizedText;
  instructions: EarthquakeInstruction[];
}

export interface EarthquakeContent {
  _description: string;
  _conditionsNote: string;
  heading: LocalizedText;
  predicates: Record<EarthquakePredicate, string>;
  steps: EarthquakeStep[];
}

// ---------- protocols.json ----------

export interface Protocol {
  /** URL slug: /emergencia/:id */
  id: string;
  menuButton: LocalizedText;
  title: LocalizedText;
  steps: LocalizedText[];
}

export interface ProtocolsContent {
  _description: string;
  protocols: Protocol[];
}

// ---------- lists.json ----------

export type ListType = 'kit' | 'firstAidKit' | 'checklist';

export interface ListItem {
  id: string;
  text: LocalizedText;
}

export interface List {
  title: LocalizedText;
  description: LocalizedText;
  items: ListItem[];
}

export type ListsContent = { _description: string } & Record<ListType, List>;

// ---------- premium.json ----------

export interface Benefit {
  icon: string;
  title: LocalizedText;
  detail: LocalizedText;
}

export interface GuideStep {
  action: LocalizedText;
  explanation: LocalizedText;
  /** SVG name in public/illustrations (without extension). */
  illustration: string;
  label: LocalizedText;
}

export interface Guide {
  title: LocalizedText;
  steps: GuideStep[];
}

export interface Question {
  question: LocalizedText;
  options: LocalizedText[];
  /** 0-based index of the correct option. */
  correct: number;
  explanation: LocalizedText;
}

export interface PremiumContent {
  _description: string;
  intro: { title: LocalizedText; benefits: Benefit[] };
  library: {
    title: LocalizedText;
    subtitle: LocalizedText;
    description: LocalizedText;
    practiceButton: LocalizedText;
    previousButton: LocalizedText;
    nextButton: LocalizedText;
    backToGuidesButton: LocalizedText;
    guides: Guide[];
  };
  practice: {
    counter: LocalizedText;
    continueButton: LocalizedText;
    backButton: LocalizedText;
    end: { title: LocalizedText; result: LocalizedText; note: LocalizedText; repeatButton: LocalizedText };
    questions: Question[];
  };
}

// ---------- User data (IndexedDB / D1, plan section 7.5) ----------

export interface Contact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Preferences {
  language: Language;
  shareDiscount: boolean;
}

export interface DocumentContents {
  home: Home;
  contacts: { people: Contact[] };
  kit: { checked: string[] };
  firstAidKit: { checked: string[] };
  checklist: { checked: string[] };
  preferences: Preferences;
}

export type DocumentType = keyof DocumentContents;

export interface UserDocument<T extends DocumentType = DocumentType> {
  type: T;
  content: DocumentContents[T];
  updatedAt: number;
  version: number;
  pending: boolean;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  photo: string | null;
}

export interface Session {
  key: 'current';
  user: User;
  /** License JWT (plan section 7.4). */
  license: string;
  dataConsent: boolean;
}

export type LocalPreference =
  | { key: 'language'; value: Language }
  /** The note about third-party consent was shown (plan section 7.8). */
  | { key: 'thirdPartyNoticeSeen'; value: boolean };
