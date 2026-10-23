import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { earthquakeContent, homeContent, listsContent, premiumContent, protocolsContent, uiText } from './index';
import type { EarthquakePredicate, ListType } from '../types';

/** Walks a value and returns the paths of malformed `{ es, en }` objects. */
function invalidTexts(value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => invalidTexts(v, `${path}[${i}]`));
  if (value === null || typeof value !== 'object') return [];
  const obj = value as Record<string, unknown>;
  if ('es' in obj) {
    const ok =
      typeof obj.es === 'string' &&
      obj.es.trim() !== '' &&
      (obj.en === null || (typeof obj.en === 'string' && obj.en.trim() !== '')) &&
      Object.keys(obj).length === 2;
    return ok ? [] : [path];
  }
  return Object.entries(obj).flatMap(([k, v]) => invalidTexts(v, `${path}.${k}`));
}

const PREDICATES: EarthquakePredicate[] = [
  'isApartment',
  'isHighFloor',
  'hasStairs',
  'hasElevator',
  'hasEvacuationRoute',
  'hasMeetingPoint',
  'hasDirectExit',
  'exitIsStairs',
];

describe('content', () => {
  it('every bilingual text has valid `es` and `en`', () => {
    for (const json of [uiText, homeContent, earthquakeContent, protocolsContent, listsContent, premiumContent]) {
      expect(invalidTexts(json)).toEqual([]);
    }
  });

  it('home: 8 fields, unique option values, and each default is one of its options', () => {
    expect(homeContent.fields.map((f) => f.key)).toEqual([
      'homeType',
      'floor',
      'streetAccess',
      'stairs',
      'elevator',
      'emergencyExit',
      'evacuationRoute',
      'meetingPoint',
    ]);
    for (const field of homeContent.fields) {
      const values = field.options.map((o) => o.value);
      expect(new Set(values).size).toBe(values.length);
      expect(values).toContain(field.default);
    }
  });

  it('earthquake: 8 numbered steps and conditions only use known predicates', () => {
    expect(Object.keys(earthquakeContent.predicates).sort()).toEqual([...PREDICATES].sort());
    expect(earthquakeContent.steps.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const step of earthquakeContent.steps) {
      expect(step.instructions.length).toBeGreaterThan(0);
      for (const { condition } of step.instructions) {
        if (condition === undefined) continue;
        const names = condition.replace(/&&|\|\||!|\(|\)/g, ' ').trim().split(/\s+/);
        for (const name of names) expect(PREDICATES).toContain(name);
      }
    }
  });

  it('protocols: 13, with a unique slug id and at least one step', () => {
    const { protocols } = protocolsContent;
    expect(protocols).toHaveLength(13);
    expect(new Set(protocols.map((p) => p.id)).size).toBe(13);
    for (const p of protocols) {
      expect(p.id).toMatch(/^[a-z0-9_]+$/);
      expect(p.steps.length).toBeGreaterThan(0);
    }
  });

  it('lists: kit, first aid kit and checklist with 9 items and unique prefixed ids', () => {
    const types: ListType[] = ['kit', 'firstAidKit', 'checklist'];
    const ids = new Set<string>();
    for (const type of types) {
      const { items } = listsContent[type];
      expect(items).toHaveLength(9);
      for (const { id } of items) {
        expect(id.startsWith(`${type}_`)).toBe(true);
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
    }
  });

  it('premium: 13 guides, 5 questions, existing illustrations and correct answer in range', () => {
    const { library, practice, intro } = premiumContent;
    expect(intro.benefits).toHaveLength(4);
    expect(library.guides).toHaveLength(13);
    for (const guide of library.guides) {
      expect(guide.steps.length).toBeGreaterThan(0);
      for (const { illustration } of guide.steps) {
        const path = resolve('public/illustrations', `${illustration}.svg`);
        expect(existsSync(path), path).toBe(true);
      }
    }
    expect(practice.questions).toHaveLength(5);
    for (const q of practice.questions) {
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(q.options.length);
    }
  });
});
