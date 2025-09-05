import { find_resource_by_data_attr, RESOURCES } from './resources.js';
import { observe as VMObserve } from '@violentmonkey/dom';
import '@violentmonkey/types';
import {
    find_resource_by_name,
    find_resource_by_eject_id,
    find_resource_by_market_id,
    find_resource_by_resource_id,
    find_resource_by_storage_id,
} from './resources.js';
import { fmtNumber } from './numberFormatter.js';
import { beep } from './utils.js';

let GLOBAL_TABLE_ITEM_BG_COLOR_ALT = $('#resources > .alt').css('background-color');
let GLOBAL_TABLE_ITEM_BG_COLOR = $('html').css('background-color');
let GLOBAL_HIGHLIGHT_COLOR = '#ffffff33';

function get_sub_tab_li_els() {
    let sub_tab_li_els = $("#mainTabs > section > div[tabIndex='0'] > div > div > nav > ul > li");
    if (sub_tab_li_els.length === 0) {
        // A sub-tab may not exist.

        // The exception is the A.R.P.A tab, which has a different structure.
        sub_tab_li_els = $("#mainTabs > section > div[tabIndex='0'] > div > div > div > nav > ul > li");

        // If the A.R.P.A structure doesn't match anything, the sub-tab is not found.
        if (sub_tab_li_els.length === 0) {
            return null;
        }
    }

    return sub_tab_li_els;
}

function highlight_item(element: JQuery<HTMLElement>) {
    element.css({
        'background-color': GLOBAL_HIGHLIGHT_COLOR,
    });
}
function remove_highlight_from_item(element: JQuery<HTMLElement>) {
    if (element.hasClass('alt')) {
        element.css({
            'background-color': GLOBAL_TABLE_ITEM_BG_COLOR_ALT,
        });

        console.log('remove alt highlight');
    } else {
        element.css({
            'background-color': GLOBAL_TABLE_ITEM_BG_COLOR,
        });

        console.log('remove normal highlight', GLOBAL_TABLE_ITEM_BG_COLOR);
    }
}
function add_hover_highlight(element: JQuery<HTMLElement>) {
    element.on('mouseenter', function () {
        highlight_item($(this));
    });
    element.on('mouseleave', function () {
        remove_highlight_from_item($(this));
        console.log('mouseleave');
    });
}

const IMAGE_CACHE = new Map<string, JQuery<HTMLElement>>();
async function add_img(element: JQuery<Element>, image_id: string) {
    element.css({
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        gap: '5px',
    });

    // const text_color = element.css("color");

    const cached_img = IMAGE_CACHE.get(image_id);
    if (!cached_img) {
        const img_el = $('<img />', {
            src: await GM.getResourceUrl(image_id),
            alt: 'logo',
            style: `width: 14px; height: 14px; border-radius: 4px; `, // border: 1px solid ${text_color};
        });

        IMAGE_CACHE.set(image_id, img_el);

        element.prepend(img_el);
    } else {
        element.prepend(cached_img);
    }

    // const img_src = await GM.getResourceUrl(image_id);
    // if (IMAGE_CACHE.has(image_id)) {
    //     const img_el = IMAGE_CACHE.get(img_src);
    //     element.prepend(img_el);
    // } else {
    //     const img_el = $("<img />", {
    //         src: img_src,
    //         alt: "logo",
    //         style: `width: 18px; height: 18px; border-radius: 4px; `, // border: 1px solid ${text_color};
    //     });
    //     element.prepend(img_el);
    //     IMAGE_CACHE.set(img_src, img_el);
    // }

    // const img_el = $("<img />", {
    //     src: await GM.getResourceUrl(image_id),
    //     alt: "logo",
    //     style: `width: 18px; height: 18px; border-radius: 4px; `, // border: 1px solid ${text_color};
    // });

    // element.prepend(img_el);
}

async function add_resource_img(resource_el: JQuery<HTMLElement>, image_id: string) {
    // Most resource <div>s have an <h3> child element.
    // This <h3> element contains the name of the resource.
    let text_parent_el: JQuery<HTMLElement> = $(resource_el).find('h3');

    // Some elements don't have an <h3> element, they have a <span> instead.
    if (text_parent_el.length === 0) {
        text_parent_el = $(resource_el).find('span').first();
    }

    const text_color = text_parent_el.css('color');

    // Make the header flex
    text_parent_el.css({
        display: 'flex',
        'align-items': 'center',
        gap: '5px',
    });

    // Create the image element
    const img_el = $('<img />', {
        src: await GM.getResourceUrl(image_id),
        alt: '404',
        style: `width: 18px; height: 18px; border: 1px solid ${text_color}; border-radius: 4px; font-size: 0.5rem; text-align: center; vertical-align: middle; line-height: 1rem;`,
    });

    // Prepend the image to the header
    text_parent_el.prepend(img_el);
}

class State {
    #selected_main_tab: string | null = null;
    #selected_sub_tab: string | null = null;
    #sub_tabs_with_on_click_handlers = [];

    // Each specific resource handler can override this function.
    // It is called before switching to a new main+sub tab combo.
    #tab_specific_cleanup_function = () => {
        /* no-op */
    };

    set_tab_specific_cleanup_function(func: () => void) {
        this.#tab_specific_cleanup_function = func;
    }

    run_tab_specific_handler() {
        // call the cleanup function of the current specific handler.
        this.#tab_specific_cleanup_function();

        // Remove the handler specific cleanup function.
        this.#tab_specific_cleanup_function = () => {
            /* no-op */
        };

        // Fire the specific handler for the selected main and sub tab.
        this.delegate_sub_tab_event();
    }

    // Returns the selected main and sub tab.
    get_selected_tabs() {
        let selected_main_tab = null;
        let selected_sub_tab = null;

        const main_tab_el = $("#mainTabs > nav > ul > li[aria-selected='true']")[0];

        // Theoretically, the main tab should always be found.
        if (!main_tab_el) {
            selected_main_tab = null;
            selected_sub_tab = null;
            return;
        }

        // Get the name of the clicked tab
        const main_tab_name = main_tab_el.innerText;

        // Update the selected tab
        selected_main_tab = main_tab_name;

        // Get the list of sub-tabs
        const subtabs = get_sub_tab_li_els();
        if (!subtabs) {
            // The sub-tabs are not found.
            selected_sub_tab = null;
            return;
        }

        // Get the selected sub-tab.
        let selected_sub_tab_el: JQuery<HTMLElement> | null = null;
        subtabs.each(function () {
            if ($(this).attr('aria-selected') === 'true') {
                selected_sub_tab_el = $(this);
            }
        });
        if (!selected_sub_tab_el) {
            // No selected sub-tab.
            selected_sub_tab = null;
            return;
        }

        //? Typescript doesn't know that selected_sub_tab_el is a JQuery<HTMLElement>.
        //? This is a workaround to make it work.
        selected_sub_tab_el = selected_sub_tab_el as JQuery<HTMLElement>;

        // The name can be directly inside the <a> element, or inside a nested <span>.
        // If the nested <span> is present, it is the real name of the sub-tab.
        const nested_span_el = selected_sub_tab_el.find('span')[0];
        if (nested_span_el) {
            // Use the nested <h2> as the name of the sub-tab.
            selected_sub_tab = nested_span_el.innerText;
        } else {
            // Use the <a> element directly as the name of the sub-tab.
            selected_sub_tab = selected_sub_tab_el[0]?.innerText;
        }

        return { main_tab: selected_main_tab, sub_tab: selected_sub_tab };
    }

    // Sets the selected main and sub tab.
    // Returns true if the tabs were changed.
    // Returns false if the tabs were not changed.
    sync_selected_tabs() {
        const selected_tabs = this.get_selected_tabs();

        if (this.#selected_main_tab === selected_tabs?.main_tab && this.#selected_sub_tab === selected_tabs?.sub_tab) {
            // Tabs have not changed.
            return false;
        }

        this.#selected_main_tab = selected_tabs?.main_tab ?? null;
        this.#selected_sub_tab = selected_tabs?.sub_tab ?? null;

        // Tabs have changed.
        return true;
    }

    on_main_tab_click() {
        // Sync the selected main and sub tabs. If the tabs have not changed, do nothing.
        const tab_changed = this.sync_selected_tabs();
        if (!tab_changed) return;

        // Since the tabs have changed, detach the previous sub-tab click handlers.
        this.#sub_tabs_with_on_click_handlers.forEach(function (element) {
            element.off('click');
        });
        this.#sub_tabs_with_on_click_handlers = [];

        // Run the previous main+sub tab combo cleanup function.
        // Fire the handler for the selected main+sub tab combo.
        this.run_tab_specific_handler();

        // Alias instance methods to avoid "this" issues.
        const THIS__on_sub_tab_click = () => this.on_sub_tab_click();
        const THIS__push_sub_tab_click_handler = (element) => this.#sub_tabs_with_on_click_handlers.push(element);

        // Attach on-click handlers to the sub-tabs.
        // TODO: Also attaches to hidden tabs. Fix this.
        get_sub_tab_li_els().each(function () {
            THIS__push_sub_tab_click_handler($(this));

            $(this).on('click', function () {
                THIS__on_sub_tab_click();
            });
        });
    }

    on_sub_tab_click() {
        // Sync the selected main and sub tabs. If the tabs have not changed, do nothing.
        const tab_changed = this.sync_selected_tabs();
        if (!tab_changed) return;

        // Run the previous main+sub tab combo cleanup function.
        // Fire the handler for the selected main+sub tab combo.
        this.run_tab_specific_handler();
    }

    delegate_sub_tab_event() {
        const main_tab = this.#selected_main_tab;
        const sub_tab = this.#selected_sub_tab;

        // Resources tab
        if (main_tab === 'Resources') {
            if (sub_tab === 'Market') {
                this.on_event_resources_market();
            }
            if (sub_tab === 'Storage') {
                this.on_event_resources_storage();
            }
            if (sub_tab === 'Mass Ejector') {
                this.on_event_resources_mass_ejector();
            }
        }
    }

    // --- Resource tab handlers ---
    on_event_resources_market() {
        // console.log("SPECIFIC HANDLER: Resources -> Market");

        // Will be cleanup up in the cleanup function.
        const hover_callbacks = [];
        const on_click_callbacks = [];

        // Get the array of market items.
        const market_items = $('#mTabResource > div > section > #market > .market-item').filter(function () {
            // Skip hidden elements.
            if ($(this).css('display') === 'none') return false;

            // Skip elements that are not resources.
            if (!$(this).attr('id').startsWith('market-')) return false;

            return true;
        });

        // Add resource images to market sub-tab.
        market_items.each(async function () {
            // Get the market item id.
            const market_id = `#${$(this).attr('id')}`;

            // Find the corresponding resource by market id.
            const resource = find_resource_by_market_id(market_id);
            if (!resource) return;

            // Add the image to the item
            await add_resource_img($(this), resource.img);
        });

        // Add hover highlight to resources in the market sub-tab.
        market_items.each(function () {
            add_hover_highlight($(this));
        });

        // Highlight the matching main resource from the market resource.
        market_items.each(function () {
            const market_id = `#${$(this).attr('id')}`;

            // TODO: See if this is necessary.
            const resource = find_resource_by_market_id(market_id);
            if (!resource) return;

            // Get the same resource in the main resource tab.
            const main_resource_item = $(resource.id.resources);

            function mouseenter() {
                highlight_item(main_resource_item);
            }
            function mouseleave() {
                remove_highlight_from_item(main_resource_item);
            }

            $(this).on('mouseenter', mouseenter);
            $(this).on('mouseleave', mouseleave);
            hover_callbacks.push({ el: $(this), mouseenter, mouseleave });
        });

        // ------------------ Quanitity Buttons ------------------ //

        // Add quantity select buttons.
        const quantity_buttons_parent = $('<div/>')
            .css({
                display: 'flex',
                gap: '1rem',
                'justify-content': 'center',
            })
            .addClass('market');

        const num_formatter = new Intl.NumberFormat('en-US', {
            notation: 'compact',
        });

        for (const qty of [100, 200, 500, 1000, 5000, 10000, 100000, 1000000]) {
            const on_click = function () {
                const el = $('#market-qty  .control > input').val(qty);
                el[0].dispatchEvent(new Event('input'));
            };

            const btn = $('<button/>')
                .text(fmtNumber(qty))
                .addClass('button')
                .on('click', on_click)
                .appendTo(quantity_buttons_parent);

            on_click_callbacks.push({ el: btn, on_click });
        }

        quantity_buttons_parent.appendTo('#market-qty');

        // ------------------ Galactic Trade ------------------ //

        const galaxy_trade_items = $('#mTabResource > div > section > #market > #galaxyTrade > .market-item').filter(
            function () {
                // Skip hidden elements.
                if ($(this).css('display') === 'none') return false;

                // Skip the trade header.
                if ($(this).hasClass('trade-header')) return false;

                // Skip the last element.
                if ($(this).text().startsWith('Galactic Routes')) return false;

                return true;
            }
        );

        // Add hover highlight to each galactic trade item in the market sub-tab.
        galaxy_trade_items.each(function () {
            add_hover_highlight($(this));
        });

        galaxy_trade_items.each(function () {
            // Get the offer items
            const offer_items = $(this).find('.offer-item');

            offer_items.each(async function () {
                const offer_item_name = $(this).text().trim().replaceAll(/-/g, '_').replaceAll(/ /g, '_');

                // Find the resource by name.
                const resource = find_resource_by_name(offer_item_name);
                if (!resource) return;

                // Add image
                await add_img($(this), resource.img);

                // Add flex style to the item
                $(this).css({
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'start',
                    gap: '5px',
                });

                // Get the same resource in the main resource tab.
                const main_resource_item = $(resource.id.resources);
                function mouseenter() {
                    highlight_item(main_resource_item);
                }
                function mouseleave() {
                    remove_highlight_from_item(main_resource_item);
                }

                $(this).on('mouseenter', mouseenter);
                $(this).on('mouseleave', mouseleave);
                hover_callbacks.push({ el: $(this), mouseenter, mouseleave });
            });
        });

        console.log('galaxy_trade_items', galaxy_trade_items);

        // Cleanup function.
        this.set_tab_specific_cleanup_function(() => {
            // Remove the main resources tab hover handlers.
            hover_callbacks.forEach(({ el, mouseenter, mouseleave }) => {
                el.off('mouseenter', mouseenter);
                el.off('mouseleave', mouseleave);
            });

            on_click_callbacks.forEach(({ el, on_click }) => {
                el.off('click', on_click);
            });
        });
    }
    on_event_resources_storage() {
        // console.log("SPECIFIC HANDLER: Resources -> Storage");

        // Will be cleanup up in the cleanup function.
        const hover_callbacks = [];

        // Get the array of storage items.
        const storage_items = $('#mTabResource > div > section > #resStorage > .market-item').filter(function () {
            // Skip hidden elements.
            if ($(this).css('display') === 'none') return false;

            // Skip elements that are not resources.
            if (!$(this).attr('id').startsWith('stack-')) return false;

            return true;
        });

        // Add resource images to storage sub-tab.
        storage_items.each(async function () {
            // Get the storage item id.
            const storage_id = `#${$(this).attr('id')}`;

            // Find the corresponding resource by storage id.
            const resource = find_resource_by_storage_id(storage_id);
            if (!resource) return;

            // Add the image to the item
            await add_resource_img($(this), resource.img);
        });

        // Add hover highlight to resources in the storage sub-tab.
        storage_items.each(function () {
            add_hover_highlight($(this));
        });

        // Highlight the matching main resource from the storage resource.
        storage_items.each(function () {
            const storage_id = `#${$(this).attr('id')}`;

            // TODO: See if this is necessary.
            const resource = find_resource_by_storage_id(storage_id);
            if (!resource) return;

            // Get the same resource in the main resource tab.
            const main_resource_item = $(resource.id.resources);

            function mouseenter() {
                highlight_item(main_resource_item);
            }
            function mouseleave() {
                remove_highlight_from_item(main_resource_item);
            }

            $(this).on('mouseenter', mouseenter);
            $(this).on('mouseleave', mouseleave);
            hover_callbacks.push({ el: $(this), mouseenter, mouseleave });
        });

        // Cleanup function.
        this.set_tab_specific_cleanup_function(() => {
            // Remove the main resources tab hover handlers.
            hover_callbacks.forEach(({ el, mouseenter, mouseleave }) => {
                el.off('mouseenter', mouseenter);
                el.off('mouseleave', mouseleave);
            });
        });
    }
    on_event_resources_mass_ejector() {
        const hover_callbacks = [];

        // Get the array of ejection items.
        const ejector_items = $('#mTabResource > div > section > #resEjector > .market-item').filter(function () {
            // Skip hidden elements.
            if ($(this).css('display') === 'none') return false;

            // Skip the eject header.
            if ($(this).attr('id') === 'eject') return false;

            return true;
        });

        // Add resource images to ejection sub-tab.
        ejector_items.each(async function () {
            // Get the ejector item id.
            const eject_id = `#${$(this).attr('id')}`;

            // Find the corresponding resource by eject id.
            const resource = find_resource_by_eject_id(eject_id);
            if (!resource) return;

            // Add the image to the item
            await add_resource_img($(this), resource.img);
        });

        // Add hover highlight to resources in the ejector sub-tab.
        ejector_items.each(function () {
            add_hover_highlight($(this));
        });

        // Highlight the matching main resource from the ejector resource.
        ejector_items.each(function () {
            const ejector_id = `#${$(this).attr('id')}`;
            console.log('ejector_id', ejector_id);

            // TODO: See if this is necessary.
            const resource = find_resource_by_eject_id(ejector_id);
            if (!resource) return;

            // Get the same resource in the main resource tab.
            const main_resource_item = $(resource.id.resources);

            function mouseenter() {
                highlight_item(main_resource_item);
            }
            function mouseleave() {
                remove_highlight_from_item(main_resource_item);
            }

            $(this).on('mouseenter', mouseenter);
            $(this).on('mouseleave', mouseleave);
            hover_callbacks.push({ el: $(this), mouseenter, mouseleave });
        });

        // Cleanup function.
        this.set_tab_specific_cleanup_function(() => {
            // Remove the main resources tab hover handlers.
            hover_callbacks.forEach(({ el, mouseenter, mouseleave }) => {
                el.off('mouseenter', mouseenter);
                el.off('mouseleave', mouseleave);
            });
        });
    }
}

function watch_element_dom_mutation(selector: string, on_open: (element: JQuery<HTMLElement>) => () => void) {
    let is_open = false;
    let cleanup_fn = () => {
        console.log('default cleanup');
    };

    const observer = new MutationObserver((mutations) => {
        const element = $(selector);
        const element_exists = element.length !== 0;

        if (element_exists) {
            // Element exists and was previously closed.
            if (is_open === false) {
                is_open = true;
                cleanup_fn = on_open(element);
            }
        } else {
            // Element doesn't exists and was previously open.
            if (is_open === true) {
                is_open = false;
                cleanup_fn();
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    return () => {
        observer.disconnect();
    };
}

// Entry point.
async function main() {
    // Delay the execution by 2 seconds to allow the game to fully load.
    // TODO: Replace this with a robust way to check if the game is *FULLY* loaded.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    GLOBAL_TABLE_ITEM_BG_COLOR_ALT = $('#resources > .alt').css('background-color');
    GLOBAL_TABLE_ITEM_BG_COLOR = $('html').css('background-color');
    GLOBAL_HIGHLIGHT_COLOR = '#ffffff33';

    // ------------- UNIVERSAL ------------ //
    // Global state object.
    const STATE = new State();

    // Get the current species.
    const species = $('#race > .name').text();

    // Change stone to amber for specific species.
    const AMBER_SPECIES = ['Ent', 'Pinguicula'];
    if (AMBER_SPECIES.includes(species)) {
        RESOURCES.find((r) => r.name === 'Stone')!.img = 'R_Amber';
    }

    // Add resource images to the main resource tab.
    for (const resource of RESOURCES) {
        const resource_el = $(resource.id.resources);

        await add_resource_img(resource_el, resource.img);
    }

    // Add hover highlights to the main resource tab.

    $('#resources > div').each(function () {
        add_hover_highlight($(this));
    });

    // Watch for the 'popper' element to appear.
    const stop = watch_element_dom_mutation('#popper', (element) => {
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
            add_img(cost_item_el, resource.img);
        }

        return () => {
            mutated_main_resources.forEach((el) => {
                remove_highlight_from_item(el);
                el.find('#cost-annotation').remove();
            });
        };
    });

    // --------------- TABS --------------- //
    // Auto-fire for the automatically selected tab.
    STATE.on_main_tab_click();

    // Attach on-click handlers to the main tabs.
    // TODO: Also attaches to hidden main tabs. Fix this.
    const main_tabs = $('#mainTabs > nav > ul > li');
    main_tabs.each(function () {
        $(this).on('click', function () {
            STATE.on_main_tab_click();
        });
    });

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

                console.log(nodeText);

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

// Wait for the game UI to load, then run the main function.
VMObserve(document.body, () => {
    const node = document.querySelector('div#main');
    if (node !== null) {
        main();

        // Disconnect observer
        return true;
    }
});
