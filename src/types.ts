export type Universe = 'standard' | 'evil' | 'antimatter' | 'micro' | 'heavy' | 'magic';
export type UniverseShorthand = 'l' | 'e' | 'a' | 'm' | 'h' | 'M'; // TODO: FIX shorthands for 'micro' and 'magic' as they are most likely wrong.
export type AchievementValues = Record<UniverseShorthand, number>;
