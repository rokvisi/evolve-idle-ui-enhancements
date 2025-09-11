import '@violentmonkey/types';
import { observe as VMObserve } from '@violentmonkey/dom';
import { GLOBALS, init_globals } from '$src/globals';
import { Toaster } from 'svelte-sonner';
import { toast } from 'svelte-sonner';
import { mount } from 'svelte';
import { game_tab_manager } from '$src/managers/GameTabManager';
import { resource_column_manager } from '$src/managers/ResourceColumnManager';
import { message_log_manager } from '$src/managers/MessageLogManager';
import { popper_manager } from '$src/managers/PopperManager';
import type { AchievementValues, Universe, UniverseShorthand } from '$src/types';
import CloudSave from '$svelte/CloudSave.svelte';
import CssImporter from '$svelte/CssImporter.svelte';
import SettingsModal from '$svelte/SettingsModal.svelte';
import { userscript_settings } from '$src/managers/UserscriptSettings';
import SettingsTabAdditions from '$svelte/SettingsTabAdditions.svelte';

async function wait_for_game_to_load() {
    const start_time = Date.now();

    return await new Promise<Record<string, any>>((resolve) => {
        let win: typeof unsafeWindow;

        const intervalId = setInterval(() => {
            // Get the real window to access objects exposed by vue.
            if (typeof unsafeWindow !== 'undefined') win = unsafeWindow;
            else win = window;

            // Check if globals have loaded.
            if (!win.evolve) return;
            if (!win.evolve.global) return;
            if (!win.evolve.global.race) return;
            if (!win.evolve.global.race.species) return;

            // Check if breakdowns have loaded.
            if (!win.evolve.breakdown) return;
            if (!win.evolve.breakdown.p) return;
            if (!win.evolve.breakdown.p.consume) return;

            // Clear the interval and resolve the promise.
            clearInterval(intervalId);
            resolve(win.evolve);

            console.log(`Game loaded in ${Math.floor(Date.now() - start_time)} ms.`);
        }, 100);
    });
}

// Resuse the style sheet object instead of creating a new one each time.
// https://dev.to/westbrook/why-would-anyone-use-constructible-stylesheets-anyways-19ng#sharing
function add_stylesheet(cssContent: string, document: Document | ShadowRoot) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssContent);
    document.adoptedStyleSheets.push(sheet);
}

function create_shadow_dom(shadowRootAnchor: Element) {
    const shadowWrapperOuter = document.createElement('div');
    const shadowWrapperInner = document.createElement('div');

    shadowRootAnchor.appendChild(shadowWrapperOuter);
    const shadowRoot = shadowWrapperOuter.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(shadowWrapperInner);

    return { shadowWrapperOuter, shadowWrapperInner, shadowRoot };
}

function create_shadcn_shadow_dom(shadowRootAnchor: Element) {
    // Create the shadow dom.
    const shadowDom = create_shadow_dom(shadowRootAnchor);

    // Apply the dark theme to the shadow dom.
    shadowDom.shadowWrapperInner.classList.add('dark');

    // Inject the compiled css into the shadow dom.
    add_stylesheet(GM.getResourceText('shadow-dom-css'), shadowDom.shadowRoot);

    return shadowDom;
}

function load_svelte_components() {
    const { shadowWrapperInner: toasterShadowWrapperInner } = create_shadcn_shadow_dom(document.body);
    console.log('[svelte components]: mounting Toaster.');
    mount(Toaster, {
        target: toasterShadowWrapperInner,
        props: { richColors: true, theme: 'dark', position: 'top-right', closeButton: true, duration: 3500 },
    });

    // Settings sub-tab.
    const { shadowWrapperInner: settingsShadowWrapperInner } = create_shadcn_shadow_dom(
        document.body.querySelectorAll('div.importExport')[1]!
    );

    console.log('[svelte components]: mounting CssImporter.');
    mount(CssImporter, {
        target: settingsShadowWrapperInner,
    });

    console.log('[svelte components]: mounting SettingsTabAdditions.');
    mount(SettingsTabAdditions, {
        target: settingsShadowWrapperInner,
    });
}

async function attach_debug_stuff() {
    console.log({
        species: GLOBALS.SPECIES,
        planet: GLOBALS.PLANET,
        traits: GLOBALS.PLANET_TRAITS,
        universe: GLOBALS.UNIVERSE,
    });

    document.addEventListener('keydown', async (event) => {
        if (event.key === 'z') {
            // const promise = new Promise((resolve, reject) =>
            //     setTimeout(() => {
            //         if (Math.random() > 0.5) {
            //             resolve({ name: 'Svelte Sonner' });
            //         } else {
            //             reject();
            //         }
            //     }, 1500)
            // );
            // toast.promise(promise, {
            //     loading: 'Loading...',
            //     success: (data: any) => {
            //         return data.name + ' toast has been added';
            //     },
            //     error: 'Error... :( Try again!',
            // });

            toast.info('userscript_settings.beep_on_new_message: ' + userscript_settings.get('beep_on_new_message'), {
                duration: 5000,
            });
        }
        if (event.key === 'x') {
        }
    });
}

function start_game_state_monitoring() {
    setInterval(() => {
        // Should be moved out to a gamestate sync manager.

        // Check for "species" changes.
        // Comparing two globals seems like lying. globals should only store the most current state. NO OLD STATES!
        if (GLOBALS.SPECIES !== GLOBALS.GAME.global.race.species) {
            const old_species = GLOBALS.SPECIES;
            const new_species = GLOBALS.GAME.global.race.species;

            // Handling the species change event is only usefull for the transition from protoplasm -> species. Since the page hard-reloads on soft-resets. But it doesn't hard-reload on resets... or maybe it does?
            console.log('Species changed from:', old_species, 'to:', new_species);

            // Update the global state. (Essentially re-run 'main()', because new menus got created and the tab manager needs to re-attach handlers.)
            // main();
            // As it currently stands, we can't invoke main, because it creates an interval and such. Also a lot of duplicate logic would run.
            // Need to research which parts of main() actually need to be re-run on species change.
            // Also PUT 90% main in the TabManger function that initializes the tab logic. Create ResourceManager or something to handle the resurce column (applies images, highlights, etc). other Managers might be needed.
            // also todo:
            // unify this and the evolve_cloud_save.

            // Updat the globals.
            GLOBALS.SPECIES = new_species;
        }
    }, 200);
}

function get_non_bioseeded_planets() {
    const non_bioseeded_planets: string[] = [];
    const non_bioseeded_traits: string[] = [];

    const universeShorthandMap: Record<Universe, UniverseShorthand> = {
        standard: 'l',
        evil: 'e',
        antimatter: 'a',
        micro: 'm', // TODO: Porbably wrong
        heavy: 'h',
        magic: 'M', // TODO: Porbably wrong
    };

    // Get the current universe shorthand.
    const shorthand = universeShorthandMap[GLOBALS.UNIVERSE!];
    if (!shorthand) {
        console.warn('Unknown universe shorthand for the current universe:', GLOBALS.UNIVERSE);
        console.warn('Skipping reading achievements.');
        return { non_bioseeded_planets, non_bioseeded_traits };
    }

    for (const [achievementName, achievementValues] of Object.entries(
        GLOBALS.GAME.global.stats.achieve as Record<string, Record<UniverseShorthand, number | undefined>>
    )) {
        // Iterate over planet traits.
        if (achievementName.startsWith('atmo_')) {
            // Get the achievement level for the current universe.
            const level = achievementValues[shorthand];
            if (!level || level < 5) {
                const traitName = achievementName.replace('atmo_', '');
                non_bioseeded_traits.push(traitName);
            }
        }

        // Iterate over planet biomes.
        if (achievementName.startsWith('biome_')) {
            // Get the achievement level for the current universe.
            const level = achievementValues[shorthand];
            if (!level || level < 5) {
                const biomeName = achievementName.replace('biome_', '');
                non_bioseeded_planets.push(biomeName);
            }
        }

        continue;
    }

    return { non_bioseeded_planets, non_bioseeded_traits };
}

// Entry point.
async function main() {
    // Wait for the game to load.
    const game = await wait_for_game_to_load();
    init_globals(game);

    // No browser supports css @property rule inside the shadow DOM, they all ignore it entirely.
    // Therefore, add the tailwind css @property definitions to the main document.
    // https://stackoverflow.com/a/79037671
    // TODO: The 'tailwind-properties.css' resource is currently manually created. We need to parse the compiled css and extract the @property rules at build time.
    add_stylesheet(GM.getResourceText('tailwind-properties-css'), document);

    // Misc debug stuff.
    await attach_debug_stuff();

    // Load our custom svelte components in various places.
    load_svelte_components();

    // Init Managers
    popper_manager.init();
    game_tab_manager.init();
    message_log_manager.init();
    await resource_column_manager.init();

    // Launch a worker "cron-job" to monitor game state.

    // TODO: ONLY RUN ON PLANET SELECTION AND NOT EVOLUTION.
    if (GLOBALS.SPECIES === 'protoplasm') {
        const { non_bioseeded_planets, non_bioseeded_traits } = get_non_bioseeded_planets();

        // Abort if we are in the evolution phase.
        if ($('#evolution > div.action')[0]?.id.startsWith('evolution')) {
            console.log('In evolution phase, skipping bioseed highlights.');
            return;
        }

        // Abort in universe selection screen.
        // TODO: Later.

        // Abort in custom species creation screen.
        // TODO: Later.

        // TODO: Or better yet, check if #evolution > div.action ids start with planet names (Desert23213). Need to have a list of all planet biomes for that.

        // Select all planets and highlight the ones that need bioseeding.
        const planets = $('#evolution > div.action > a > span.aTitle').each(function () {
            // Get the planet biomes and traits. Drop the last word (meaningless number).
            const planetTextTokens = $(this).text().toLowerCase().split(' ').slice(0, -1);
            const planetName = planetTextTokens.at(-1);
            const planetTraits = planetTextTokens.slice(0, -1); // All but the last word.

            if (!planetName) {
                console.log('Failed to parse planet name.');
                return;
            }

            // Check if the planet is non-bioseeded.
            if (non_bioseeded_planets.includes(planetName)) {
                const uppercasedPlanetName = planetName.charAt(0).toUpperCase() + planetName.slice(1);

                const newHtml = $(this)
                    .html()
                    .replace(
                        uppercasedPlanetName,
                        `<span style="color: #74C365; font-weight: medium;">${uppercasedPlanetName}</span>`
                    );

                $(this).html(newHtml);
            }

            // Check if the planet has non-bioseeded traits.
            for (const trait of planetTraits) {
                if (non_bioseeded_traits.includes(trait)) {
                    const uppercaseTrait = trait.charAt(0).toUpperCase() + trait.slice(1);

                    const newHtml = $(this)
                        .html()
                        .replace(
                            uppercaseTrait,
                            `<span style="color: #74C365; font-weight: medium;">${uppercaseTrait}</span>`
                        );

                    $(this).html(newHtml);
                }
            }
        });
    }

    start_game_state_monitoring();
}

// Wait for the game UI to load, then run the main function.
VMObserve(document.body, () => {
    const node = document.querySelector('div#main');
    if (node !== null) {
        main();

        // Disconnect observer
        return true;
    }
});
