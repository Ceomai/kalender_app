import { CATEGORIES, THEME_SWATCHES } from '@/src/constants/categories';
import { dict } from '@/src/i18n/dictionary';
import { hsl } from '@/src/theme/hsl';
import { PALETTES, resolveColors } from '@/src/theme/palettes';
import { THEME_IDS } from '@/src/theme/types';

// `alpha` lives next to the `useTheme` hook; import it directly to keep this test hook-free.
jest.mock('@/src/lib/PreferencesContext', () => ({ usePreferences: jest.fn() }));
// eslint-disable-next-line import/first
import { alpha } from '@/src/theme';

describe('hsl', () => {
  it('matches the CSS conversion of the web tokens', () => {
    expect(hsl(0, 0, 100)).toBe('#ffffff');
    expect(hsl(0, 0, 0)).toBe('#000000');
    expect(hsl(258, 84, 58)).toBe('#703aee'); // aurora primary
  });
});

describe('alpha', () => {
  it('appends an 8-bit alpha channel', () => {
    expect(alpha('#7a3ff0', 1)).toBe('#7a3ff0ff');
    expect(alpha('#7a3ff0', 0.6)).toBe('#7a3ff099');
    expect(alpha('#7a3ff0', 0)).toBe('#7a3ff000');
  });
});

describe('palettes', () => {
  it('defines light and dark tokens for every theme', () => {
    for (const id of THEME_IDS) {
      expect(Object.keys(PALETTES[id].light).sort()).toEqual(Object.keys(PALETTES.aurora.light).sort());
      expect(Object.keys(PALETTES[id].dark).sort()).toEqual(Object.keys(PALETTES.aurora.light).sort());
      expect(THEME_SWATCHES[id]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('resolves by dark mode', () => {
    expect(resolveColors('ocean', true)).toBe(PALETTES.ocean.dark);
    expect(resolveColors('ocean', false)).toBe(PALETTES.ocean.light);
  });
});

describe('i18n', () => {
  it('has every Turkish key in English', () => {
    const missing = Object.keys(dict.tr).filter((k) => !(k in dict.en));
    expect(missing).toEqual([]);
  });

  it('labels every category and theme', () => {
    for (const c of CATEGORIES) expect(dict.tr[`cat.${c.id}`]).toBeDefined();
    for (const id of THEME_IDS) {
      expect(dict.tr[`th.${id}`]).toBeDefined();
      expect(dict.tr[`th.hint.${id}`]).toBeDefined();
    }
  });
});
