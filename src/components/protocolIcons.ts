import {
  Ambulance,
  Bandaids,
  Bone,
  Bug,
  EyeClosed,
  Fire,
  ForkKnife,
  HandFist,
  Lightning,
  Pulse,
  Skull,
  Waves,
  Wind,
  type Icon,
} from '@phosphor-icons/react';

// One icon per protocol id: the approved texts keep their emoji, the screens draw these instead.
const ICONS: Record<string, Icon> = {
  herida: Bandaids,
  fractura: Bone,
  quemadura: Fire,
  electrocucion: Lightning,
  desmayo: EyeClosed,
  obstruccion: ForkKnife,
  golpe_trauma: HandFist,
  mordedura_picadura: Bug,
  ahogamiento: Waves,
  convulsion: Pulse,
  intoxicacion: Skull,
  dificultad_respirar: Wind,
  otra_emergencia: Ambulance,
};

export const protocolIcon = (id: string | undefined): Icon => (id ? ICONS[id] : undefined) ?? Ambulance;
