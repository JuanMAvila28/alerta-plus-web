// Typed content. Assigning each JSON file to its interface makes `tsc` check its shape;
// src/content/content.test.ts checks the rules the types cannot express.
import type {
  EarthquakeContent,
  HomeContent,
  ListsContent,
  PremiumContent,
  ProtocolsContent,
  UiText,
} from '../types';
import uiTextJson from './ui-text.json';
import homeJson from './home.json';
import earthquakeJson from './earthquake.json';
import protocolsJson from './protocols.json';
import listsJson from './lists.json';
import premiumJson from './premium.json';

export const uiText: UiText = uiTextJson;
// JSON imports widen `key` to string, so this one needs a cast; the test checks the keys.
export const homeContent = homeJson as HomeContent;
export const earthquakeContent: EarthquakeContent = earthquakeJson;
export const protocolsContent: ProtocolsContent = protocolsJson;
export const listsContent: ListsContent = listsJson;
export const premiumContent: PremiumContent = premiumJson;
