// Earthquake steps adapted to the user's home (plan section 6.4). Conditions are parsed, never `eval`ed.
import { earthquakeContent } from '../content';
import type { EarthquakeInstruction, EarthquakePredicate, EarthquakeStep, Home } from '../types';

export const PREDICATES: Record<EarthquakePredicate, (home: Home) => boolean> = {
  isApartment: (home) => home.homeType === 'apartment',
  isHighFloor: (home) => home.floor === 'thirdOrHigher',
  hasStairs: (home) => home.stairs === 'yes',
  hasElevator: (home) => home.elevator === 'yes',
  hasEvacuationRoute: (home) => home.evacuationRoute === 'yes',
  hasMeetingPoint: (home) => home.meetingPoint === 'yes',
  hasDirectExit: (home) => home.streetAccess === 'yes',
  exitIsStairs: (home) => home.emergencyExit === 'stairs',
};

type Condition = (home: Home) => boolean;

/**
 * Parses `a && !b || (c && d)` into a function. Grammar (usual precedence):
 *   or := and ('||' and)* ; and := not ('&&' not)* ; not := '!' not | '(' or ')' | predicate
 */
export function parseCondition(source: string): Condition {
  const tokens = source.match(/&&|\|\||!|\(|\)|[A-Za-z]+|\S/g) ?? [];
  let position = 0;
  const peek = () => tokens[position];
  const take = (expected?: string) => {
    const token = tokens[position++];
    if (token === undefined || (expected && token !== expected)) {
      throw new Error(`Invalid condition "${source}": expected ${expected ?? 'a token'}, got ${token ?? 'the end'}`);
    }
    return token;
  };

  const parseOr = (): Condition => {
    let left = parseAnd();
    while (peek() === '||') {
      take();
      const [a, b] = [left, parseAnd()];
      left = (home) => a(home) || b(home);
    }
    return left;
  };
  const parseAnd = (): Condition => {
    let left = parseNot();
    while (peek() === '&&') {
      take();
      const [a, b] = [left, parseNot()];
      left = (home) => a(home) && b(home);
    }
    return left;
  };
  const parseNot = (): Condition => {
    const token = take();
    if (token === '!') {
      const inner = parseNot();
      return (home) => !inner(home);
    }
    if (token === '(') {
      const inner = parseOr();
      take(')');
      return inner;
    }
    if (!Object.hasOwn(PREDICATES, token)) throw new Error(`Invalid condition "${source}": unknown predicate ${token}`);
    return PREDICATES[token as EarthquakePredicate];
  };

  const condition = parseOr();
  if (position !== tokens.length) throw new Error(`Invalid condition "${source}": unexpected ${peek()}`);
  return condition;
}

const cache = new Map<string, Condition>();

function applies(instruction: EarthquakeInstruction, home: Home): boolean {
  if (instruction.condition === undefined) return true;
  let condition = cache.get(instruction.condition);
  if (!condition) {
    condition = parseCondition(instruction.condition);
    cache.set(instruction.condition, condition);
  }
  return condition(home);
}

/** The instructions of a step that apply to this home, in JSON order. */
export function visibleInstructions(step: EarthquakeStep, home: Home): EarthquakeInstruction[] {
  return step.instructions.filter((instruction) => applies(instruction, home));
}

export const earthquakeSteps = earthquakeContent.steps;
