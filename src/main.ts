import '@violentmonkey/types';
import { find_resource_by_data_attr, RESOURCES } from './data/resources.js';
import { observe as VMObserve } from '@violentmonkey/dom';
import {
    beep,
    watch_element_dom_mutation,
    fmtNumber,
    add_highlight_on_hover,
    highlight_item,
    remove_highlight_from_item,
    add_resource_img,
} from './utils.js';
import { ImgFactory } from './ImgFactory.js';
import { GLOBALS, init_globals } from './globals.js';
import { tab_manager } from './TabManager.js';
import { Toaster } from 'svelte-sonner';
import { toast } from 'svelte-sonner';
import { mount } from 'svelte';
import { resource_manager } from './ResourceManager.js';

function popper_handler(element: JQuery<HTMLElement>) {
    // Hovering "Oil Powerplant" OR "Wind Farm"
    // If the element is the wind farm, add a "surplus-power" annotation to the popper.
    if (element.attr('data-id') === 'city-oil_power') {
        const oil_power_el = $('#city-oil_power');

        const building_name = oil_power_el.find('.aTitle').first().text().trim();
        const building_count_str = oil_power_el.find('.count').first().text().trim();
        const building_count = parseInt(building_count_str);

        if (building_name === 'Wind Farm') {
            // TODO: Make sure to update this if the constant power changes.
            // TODO: Ideally parse from wiki or some other source (game data?)
            const constant_power = 4;

            let power_text_el = element.children().last();
            // If the item is a popTimer (building unafordable right-now), we need to get the previous element.
            if (power_text_el.attr('id') === 'popTimer') {
                power_text_el = power_text_el.prev();
            }

            const outPowerStr = power_text_el.text().replaceAll('+', ' ').replaceAll('MW', '').trim();
            const outPower = parseInt(outPowerStr);

            if (outPower > constant_power) {
                // Add the surplus power annotation.
                const surplus_power = (outPower - constant_power) * building_count;
                const surplus_power_annotation = $('<p>').text(`Total Power Surplus: ${surplus_power} MW`).css({
                    color: 'green',
                    'background-color': 'oklch(20.5% 0 0)',
                    padding: '2px 4px',
                    'font-weight': 400,
                    'border-radius': '4px',
                    'font-family': 'Lato, mono',
                    'font-size': '0.8rem',
                });

                power_text_el.append(surplus_power_annotation);
            }
        }
    }

    // Find the cost list <div> or return early.
    let cost_list_el: HTMLElement | undefined = undefined;
    for (const child of element.children()) {
        if (child.classList.contains('costList')) {
            cost_list_el = child;
        }
    }
    if (!cost_list_el) return () => {};

    // Iterate over the cost list items.
    const mutated_main_resources: JQuery<HTMLElement>[] = [];
    for (const child of Array.from(cost_list_el.children)) {
        const cost_item_el = $(child);

        // Find the resource data attribute.
        const resource_data_attribute = Array.from(child.attributes).find((attr) => attr.name.startsWith('data-'));
        if (!resource_data_attribute) continue;

        // Find the resource by the data attribute.
        const resource = find_resource_by_data_attr(resource_data_attribute.name);
        if (!resource) continue;

        // Highlight the main resource.
        const main_resource_el = $(resource.id.resources);
        highlight_item(main_resource_el);

        // Add cost annotation to the main resource.
        const cost = fmtNumber(-resource_data_attribute.value);
        main_resource_el.find('span.count').prepend(
            $('<span>').text(cost).attr('id', 'cost-annotation').css({
                display: 'inline-block',
                color: 'red',
                'background-color': 'oklch(20.5% 0 0)',
                // 'margin-top': "auto",
                // 'margin-bottom': 'auto',
                padding: '0px 4px',
                'font-weight': 400,
                'border-radius': '4px',
                'font-family': 'Lato, mono',
                'font-size': '0.8rem',
                'margin-right': '2px',
                height: 'auto',
            })
        );

        mutated_main_resources.push(main_resource_el);

        // Add the image to the cost item.
        (async () => {
            const img_el = await ImgFactory.get_global_img_el(resource.img);

            cost_item_el.css({
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                gap: '5px',
            });

            cost_item_el.prepend(img_el);
        })();
    }

    return () => {
        mutated_main_resources.forEach((el) => {
            remove_highlight_from_item(el);
            el.find('#cost-annotation').remove();
        });
    };
}

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

async function start_observing_message_log() {
    // Observe the message log for fortress messages.
    const messageQueueLog = document.getElementById('msgQueueLog');
    if (messageQueueLog) {
        VMObserve(messageQueueLog, (mutationRecords) => {
            const mutationRecord = mutationRecords[0];
            if (!mutationRecord) return;

            // Try to find the interesting messages in the log.
            mutationRecord.addedNodes.forEach((addedNode) => {
                const nodeText = addedNode.textContent?.trim()?.toLowerCase();
                if (!nodeText) return;

                // Check for fortress overrun messages.
                if (nodeText.startsWith('your fortress was overrun')) {
                    beep();
                    alert('Fortress overrun!');
                }
            });
        });
    } else {
        console.warn('Message log element not found. Skipping message log observation.');
    }
}

function load_svelte_components() {
    // Mount 'svelte-sonner' toaster.
    mount(Toaster, {
        target: document.body,
        props: { richColors: true, theme: 'dark', position: 'top-right', closeButton: true, duration: 2000 },
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
            const promise = new Promise((resolve, reject) =>
                setTimeout(() => {
                    if (Math.random() > 0.5) {
                        resolve({ name: 'Svelte Sonner' });
                    } else {
                        reject();
                    }
                }, 1500)
            );
            toast.promise(promise, {
                loading: 'Loading...',
                success: (data: any) => {
                    return data.name + ' toast has been added';
                },
                error: 'Error... :( Try again!',
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

// Entry point.
async function main() {
    // Wait for the game to load.
    const game = await wait_for_game_to_load();
    init_globals(game);

    // Misc debug stuff.
    await attach_debug_stuff();

    // Add custom css. (For now only generated for the svelte components.)
    GM.addStyle(GM.getResourceText('compiledStyles'));

    // Load our custom svelte components in various places.
    load_svelte_components();

    // Init Managers
    await resource_manager.init();
    tab_manager.init();

    // ------------------ Dynamic ------------------ //

    // Launch a worker "cron-job" to monitor game state.
    start_game_state_monitoring();

    // Observe the message log for fortress messages.
    start_observing_message_log();

    // Watch for the 'popper' element to appear.
    const stop = watch_element_dom_mutation('#popper', popper_handler);
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
