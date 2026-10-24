import { describe, expect, it } from 'vitest';
import { removePerson, upsertPerson, validatePerson } from './contacts';

const ana = { name: 'Ana', relationship: 'Mamá', phone: '300 123 4567' };

describe('family group', () => {
  it('validates name and phone (9.3, 9.5)', () => {
    expect(validatePerson(ana)).toBeNull();
    expect(validatePerson({ ...ana, phone: '+57 300-123-4567' })).toBeNull();
    expect(validatePerson({ ...ana, name: '   ' })).toBe('nameRequired');
    expect(validatePerson({ ...ana, phone: ' ' })).toBe('phoneRequired');
    expect(validatePerson({ ...ana, phone: '300 abc' })).toBe('phoneInvalid');
    expect(validatePerson({ ...ana, phone: '+ -' })).toBe('phoneInvalid');
  });

  it('two identical people: editing one leaves the other alone (9.4)', () => {
    const people = [ana, { ...ana }];
    const edited = upsertPerson(people, { ...ana, name: 'Ana María' }, 1);
    expect(edited.map((p) => p.name)).toEqual(['Ana', 'Ana María']);
  });

  it('adds at the end and removes by index (9.1)', () => {
    const luis = { name: 'Luis', relationship: '', phone: '301' };
    expect(upsertPerson([ana], luis)).toEqual([ana, luis]);
    expect(removePerson([ana, luis, ana], 0)).toEqual([luis, ana]);
  });
});
