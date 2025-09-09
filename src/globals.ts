type GlobalsType = {
    TABLE_ITEM_BG_COLOR_ALT: string | undefined;
    TABLE_ITEM_BG_COLOR: string | undefined;
    HIGHLIGHT_COLOR: string | undefined;
    GAME: any | undefined;
    PLANET: any | undefined;
    SPECIES: any | undefined;
    PLANET_TRAITS: any[] | undefined;
    UNIVERSE: any | undefined;
};

// Improve the structure (group colors, etc.)
export const GLOBALS: GlobalsType = {
    TABLE_ITEM_BG_COLOR_ALT: undefined,
    TABLE_ITEM_BG_COLOR: undefined,
    HIGHLIGHT_COLOR: undefined,
    GAME: undefined,
    PLANET: undefined,
    SPECIES: undefined,
    PLANET_TRAITS: undefined,
    UNIVERSE: undefined,
};

export function init_globals(game: Record<string, any>) {
    GLOBALS.TABLE_ITEM_BG_COLOR = $('html').css('background-color');
    GLOBALS.TABLE_ITEM_BG_COLOR_ALT = $('#resources > .alt').css('background-color');
    GLOBALS.HIGHLIGHT_COLOR = '#ffffff33';
    GLOBALS.GAME = game;
    GLOBALS.SPECIES = game.global.race.species;
    GLOBALS.PLANET = game.global.city.biome;
    GLOBALS.PLANET_TRAITS = game.global.city.ptrait;
    GLOBALS.UNIVERSE = game.global.race.universe;
}
