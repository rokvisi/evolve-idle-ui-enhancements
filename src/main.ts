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

import Test from './svelte/Test.svelte';

// import webc from './web-components/hello.min.js' with { type: 'text' };
import { mount } from 'svelte';

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

function change_stone_to_amber_if_needed() {
    // Get the current species.
    const species = GLOBALS.SPECIES;

    // Change stone to amber for specific species.
    const AMBER_SPECIES = ['ent', 'pinguicula'];
    if (AMBER_SPECIES.includes(species)) {
        RESOURCES.find((r) => r.name === 'Stone')!.img = 'R_Amber';
    }
}

async function add_images_to_resource_column() {
    for (const resource of RESOURCES) {
        const resource_el = $(resource.id.resources);

        await add_resource_img(resource_el, resource.img);
    }
}

function add_hover_highlights_to_resource_column() {
    $('#resources > div').each(function () {
        add_highlight_on_hover($(this));
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

async function attach_debug_stuff() {
    console.log({
        species: GLOBALS.SPECIES,
        planet: GLOBALS.PLANET,
        traits: GLOBALS.PLANET_TRAITS,
        universe: GLOBALS.UNIVERSE,
    });

    let toast: any;

    document.addEventListener('keydown', async (event) => {
        if (event.key === 'z') {
            // const aa = document.getElementById('me')! as any;
            // toast = aa.toast;
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
        }
        if (event.key === 'x') {
            console.log('imported component: ', Test);
            try {
                // console.log("mounting with 'mount()'");
                // mount(Test, { target: document.querySelector('.planetWrap')!,  });
                console.log("mounting with 'mount()'");
                mount(Test, { target: document.querySelector('.planetWrap')! });
            } catch (e) {
                console.error(e);
            }
        }
    });
}

// Entry point.
async function main() {
    // ------------- WAIT FOR THE GAME TO LOAD ------------ //
    const game = await wait_for_game_to_load();
    init_globals(game);

    // $('body').append(
    //     $('<script />', {
    //         html: webc,
    //     })
    // );

    // $('.planetWrap').append($('<hello-world id="me" name="tom"></hello-world>'));

    // ------------- UNIVERSAL ------------ //

    // Misc debug stuff.
    await attach_debug_stuff();

    // Change stone to amber for certain species.
    change_stone_to_amber_if_needed();

    // Observe the message log for fortress messages.
    start_observing_message_log();

    // Add resource images to the main resource tab.
    await add_images_to_resource_column();

    // Add hover highlights to the main resource tab.
    add_hover_highlights_to_resource_column();

    // Watch for the 'popper' element to appear.
    const stop = watch_element_dom_mutation('#popper', popper_handler);

    // --------------- TABS --------------- //

    // Auto-fire for the automatically selected tab.
    tab_manager.on_main_tab_click();

    // Attach on-click handlers to the main tabs.
    // TODO: Also attaches to hidden main tabs. Fix this.
    const main_tabs = $('#mainTabs > nav > ul > li');
    main_tabs.each(function () {
        $(this).on('click', function () {
            tab_manager.on_main_tab_click();
        });
    });

    // Launch a worker "cron-job" to monitor game state.
    setInterval(() => {
        // Check for "species" changes.
        if (GLOBALS.SPECIES !== game.global.race.species) {
            const old_species = GLOBALS.SPECIES;
            const new_species = game.global.race.species;

            // Handling the species change event is only usefull for the transition from protoplasm -> species. Since the page hard-reloads on soft-resets. But it doesn't hard-reload on resets... or maybe it does?
            console.log('Species changed from:', old_species, 'to:', new_species);

            // Update the global state. (Essentially re-run 'main()', because new menus got created and the tab manager needs to re-attach handlers.)
            // main();
            // As it currently stands, we can't invoke main, because it creates an interval and such. Also a lot of duplicate logic would run.
            // Need to research which parts of main() actually need to be re-run on species change.
            // Also PUT 90% main in the TabManger function that initializes the tab logic. Create ResourceManager or something to handle the resurce column (applies images, highlights, etc). other Managers might be needed.
            // also todo:
            // unify this and the evolve_cloud_save.
            // Add a better toast (svelte-sonner with web-components via compiled svelte?).

            // Updat the globals.
            GLOBALS.SPECIES = new_species;
        }
    }, 200);
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
