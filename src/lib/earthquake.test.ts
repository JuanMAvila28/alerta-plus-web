import { describe, expect, it } from 'vitest';
import { earthquakeContent } from '../content';
import type { Home } from '../types';
import { defaultContent } from './data';
import { earthquakeSteps, parseCondition, visibleInstructions } from './earthquake';

const base = defaultContent('home');
const texts = (stepNumber: number, home: Home) =>
  visibleInstructions(earthquakeSteps[stepNumber - 1]!, home).map((instruction) => instruction.text.es);
const homeWith = (changes: Partial<Home>): Home => ({ ...base, ...changes });

const HIGH_FLOOR = 'Estás en un piso alto. Permanece dentro hasta que termine el movimiento.';
const PREPARE_STAIRS = 'Prepárate para utilizar las escaleras.';
const DIRECT_EXIT_5 = 'Tu vivienda tiene salida directa. Prepárate para salir hacia un lugar seguro.';
const FOLLOW_ROUTE_5 = 'Sigue la ruta de evacuación que tienes configurada.';
const FIND_EXIT_5 = 'Identifica una salida segura antes de comenzar a evacuar.';
const ELEVATOR_5 = 'Aunque tengas ascensor, no lo utilices para evacuar.';
const USE_STAIRS_6 = 'Utiliza las escaleras cuando sea seguro hacerlo.';
const NO_ELEVATOR_6 = 'No uses el ascensor.';
const GO_OUT_6 = 'Sal directamente hacia un lugar seguro fuera de la vivienda.';
const FOLLOW_ROUTE_6 = 'Sigue la ruta de evacuación configurada.';
const FIXED_6 = [
  'Camina de manera ordenada y evita correr o empujar.',
  'Mantén juntos a los niños y a las personas que necesiten ayuda.',
  'Mantén a tus mascotas bajo control cuando sea posible.',
  'No regreses al interior para buscar objetos.',
];

describe('parseCondition', () => {
  const home = homeWith({ homeType: 'apartment', floor: 'thirdOrHigher', stairs: 'no' });
  it('handles &&, ||, ! and parentheses with the usual precedence', () => {
    expect(parseCondition('isApartment && isHighFloor')(home)).toBe(true);
    expect(parseCondition('hasStairs || isApartment && !isHighFloor')(home)).toBe(false);
    expect(parseCondition('(hasStairs || isApartment) && isHighFloor')(home)).toBe(true);
    expect(parseCondition('!!isApartment')(home)).toBe(true);
  });
  it('rejects unknown names and broken expressions', () => {
    expect(() => parseCondition('isCastle')).toThrow();
    expect(() => parseCondition('isApartment &&')).toThrow();
    expect(() => parseCondition('(isApartment')).toThrow();
    expect(() => parseCondition('alert(1)')).toThrow();
  });
  it('every condition in earthquake.json parses', () => {
    for (const step of earthquakeContent.steps) {
      for (const { condition } of step.instructions) if (condition) expect(() => parseCondition(condition)).not.toThrow();
    }
  });
});

describe('earthquake steps (plan table 6.4)', () => {
  it('default home', () => {
    expect(texts(2, base)).not.toContain(HIGH_FLOOR);
    const step5 = texts(5, base);
    expect(step5).toContain(PREPARE_STAIRS);
    expect(step5).toContain(DIRECT_EXIT_5);
    expect(step5).not.toContain(ELEVATOR_5);
    expect(texts(6, base)).toEqual([USE_STAIRS_6, NO_ELEVATOR_6, GO_OUT_6, ...FIXED_6]);
  });

  it('apartment, third floor or higher', () => {
    const home = homeWith({ homeType: 'apartment', floor: 'thirdOrHigher' });
    expect(texts(2, home)).toContain(HIGH_FLOOR);
    const step6 = texts(6, home);
    expect(step6).toContain(USE_STAIRS_6);
    expect(step6).toContain(NO_ELEVATOR_6);
    expect(step6).not.toContain(GO_OUT_6);
  });

  it('evacuation route yes', () => {
    const home = homeWith({ evacuationRoute: 'yes' });
    const step5 = texts(5, home);
    expect(step5).toContain(FOLLOW_ROUTE_5);
    expect(step5).not.toContain(DIRECT_EXIT_5);
    expect(step5).not.toContain(FIND_EXIT_5);
    expect(texts(6, home)[0]).toBe(FOLLOW_ROUTE_6);
  });

  it('no route and no direct exit', () => {
    expect(texts(5, homeWith({ evacuationRoute: 'no', streetAccess: 'no' }))).toContain(FIND_EXIT_5);
  });

  it('elevator yes: step 5 ends with the elevator warning', () => {
    expect(texts(5, homeWith({ elevator: 'yes' })).at(-1)).toBe(ELEVATOR_5);
  });

  it('house, first floor, no stairs, exit "other"', () => {
    const home = homeWith({ stairs: 'no', emergencyExit: 'other' });
    expect(texts(5, home)).not.toContain(PREPARE_STAIRS);
    const step6 = texts(6, home);
    expect(step6).not.toContain(USE_STAIRS_6);
    expect(step6).not.toContain(NO_ELEVATOR_6);
  });

  it('meeting point yes / no', () => {
    expect(texts(8, homeWith({ meetingPoint: 'yes' }))[0]).toBe(
      'Dirígete al punto de encuentro configurado para tu grupo familiar.',
    );
    expect(texts(8, homeWith({ meetingPoint: 'no' }))[0]).toBe('Dirígete a un lugar seguro previamente acordado con tu familia.');
  });
});
