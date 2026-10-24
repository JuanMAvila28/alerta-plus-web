// The approved texts carry the Android app's emoji ("🏠 CONFIGURAR MI VIVIENDA"). The web draws
// its own SVG icons, so the screens show the words without the emoji; the texts stay unchanged.
const LEADING_EMOJI = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[‍️⃣])+\s*/u;

export function withoutEmoji(text: string): string {
  return text.replace(LEADING_EMOJI, '');
}
