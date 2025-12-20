import {
    find_resource_by_name,
    find_resource_by_eject_id,
    find_resource_by_market_id,
    find_resource_by_resource_id,
    find_resource_by_storage_id,
} from '$src/data/resources';
import { GLOBALS } from '$src/globals';
import {
    beep,
    watch_element_dom_mutation,
    fmtNumber,
    add_highlight_on_hover,
    highlight_item,
    remove_highlight_from_item,
    add_resource_img,
    on_event,
} from '$src/utils';

class GameTabManager {
    #selected_main_tab: string | null = null;
    #selected_sub_tab: string | null = null;
    #sub_tabs_with_on_click_handlers: JQuery<HTMLElement>[] = [];

    init = () => {
        // Auto-fire for the auto-selected tab.
        this.on_primary_tab_click();

        // Attach on-click handlers to the main tabs.
        // TODO: Also attaches to hidden main tabs. Fix this.
        const main_tabs = $('#mainTabs > nav > ul > li');
        const THIS = this;
        main_tabs.each(function () {
            $(this).on('click', function () {
                THIS.on_primary_tab_click();
            });
        });
    };

    // Each specific resource handler can override this function.
    // It is called before switching to a new main+sub tab combo.
    #tab_specific_cleanup_function = () => {
        /* no-op */
    };

    #get_sub_tab_li_els = () => {
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
        const subtabs = this.#get_sub_tab_li_els();
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

    on_primary_tab_click() {
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
        const THIS__on_sub_tab_click = () => this.on_secondary_tab_click();
        const THIS__push_sub_tab_click_handler = (element: JQuery<HTMLElement>) =>
            this.#sub_tabs_with_on_click_handlers.push(element);

        // Attach on-click handlers to the sub-tabs.
        // TODO: Also attaches to hidden tabs. Fix this.
        this.#get_sub_tab_li_els()?.each(function () {
            const el = $(this);

            THIS__push_sub_tab_click_handler($(this));

            $(this).on('click', function () {
                THIS__on_sub_tab_click();
            });
        });
    }

    on_secondary_tab_click() {
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

        // Andromeda Tab
        if (main_tab === 'Civilization') {
            if (sub_tab === 'Andromeda') {
                this.on_event_civilization_andromeda();
            }
        }
    }

    // --- Resource tab handlers ---
    on_event_resources_market() {
        // console.log("SPECIFIC HANDLER: Resources -> Market");

        type HoverCallback = { el: JQuery<HTMLElement>; mouseenter: () => void; mouseleave: () => void };
        type OnClickCallback = { el: JQuery<HTMLElement>; on_click: () => void };

        // Will be cleanup up in the cleanup function.
        const hover_callbacks: HoverCallback[] = [];
        const on_click_callbacks: OnClickCallback[] = [];

        // Get the array of market items.
        const market_items = $('#mTabResource > div > section > #market > .market-item').filter(function () {
            // Skip hidden elements.
            if ($(this).css('display') === 'none') return false;

            // Skip elements that are not resources.
            if (!$(this).attr('id')?.startsWith('market-')) return false;

            return true;
        });

        // Add resource images to market sub-tab.
        market_items.each(function () {
            const market_item_el = $(this);

            // Get the market item id.
            const market_id = `#${market_item_el.attr('id')}`;

            // Find the corresponding resource by market id.
            const resource = find_resource_by_market_id(market_id);
            if (!resource) return;

            // Add the image to the item
            //? Maybe await?
            add_resource_img(market_item_el, resource.img);
        });

        // Add hover highlight to resources in the market sub-tab.
        market_items.each(function () {
            add_highlight_on_hover($(this));
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
                el[0]?.dispatchEvent(new Event('input'));
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
            add_highlight_on_hover($(this));
        });

        galaxy_trade_items.each(function () {
            // Get the offer items
            const offer_items = $(this).find('.offer-item');

            offer_items.each(function () {
                const offer_item_name = $(this).text().trim().replaceAll(/-/g, '_').replaceAll(/ /g, '_');

                // Find the resource by name.
                const resource = find_resource_by_name(offer_item_name);
                if (!resource) return;

                // Add image
                //? Maybe await?
                add_resource_img($(this), resource.img);

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
        type HoverCallback = { el: JQuery<HTMLElement>; mouseenter: () => void; mouseleave: () => void };

        // console.log("SPECIFIC HANDLER: Resources -> Storage");

        // Will be cleanup up in the cleanup function.
        const hover_callbacks: HoverCallback[] = [];

        // Get the array of storage items.
        const storage_items = $('#mTabResource > div > section > #resStorage > .market-item').filter(function () {
            // Skip hidden elements.
            if ($(this).css('display') === 'none') return false;

            // Skip elements that are not resources.
            if (!$(this).attr('id')?.startsWith('stack-')) return false;

            return true;
        });

        // Add resource images to storage sub-tab.
        storage_items.each(function () {
            // Get the storage item id.
            const storage_id = `#${$(this).attr('id')}`;

            // Find the corresponding resource by storage id.
            const resource = find_resource_by_storage_id(storage_id);
            if (!resource) return;

            // Add the image to the item
            //? Maybe await?
            add_resource_img($(this), resource.img);
        });

        // Add hover highlight to resources in the storage sub-tab.
        storage_items.each(function () {
            add_highlight_on_hover($(this));
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
        type HoverCallback = { el: JQuery<HTMLElement>; mouseenter: () => void; mouseleave: () => void };
        const hover_callbacks: HoverCallback[] = [];

        // Get the array of ejection items.
        const ejector_items = $('#mTabResource > div > section > #resEjector > .market-item').filter(function () {
            // Skip hidden elements.
            if ($(this).css('display') === 'none') return false;

            // Skip the eject header.
            if ($(this).attr('id') === 'eject') return false;

            return true;
        });

        // Add resource images to ejection sub-tab.
        ejector_items.each(function () {
            // Get the ejector item id.
            const eject_id = `#${$(this).attr('id')}`;

            // Find the corresponding resource by eject id.
            const resource = find_resource_by_eject_id(eject_id);
            if (!resource) return;

            // Add the image to the item
            //? Maybe await?
            add_resource_img($(this), resource.img);
        });

        // Add hover highlight to resources in the ejector sub-tab.
        ejector_items.each(function () {
            add_highlight_on_hover($(this));
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

    // --- Civilization tab handlers ---
    on_event_civilization_andromeda() {
        const cleanup_fns: (() => void)[] = [];
        const cleanup = () => {
            cleanup_fns.forEach((cleanup) => cleanup());
            cleanup_fns.length = 0;
        };

        console.log('SPECIFIC HANDLER: Andromeda');

        function get_required_armada() {
            // Get the current piracy threat level.
            function get_piracy_threat_level() {
                let threat_level: 0 | 1 | 2 | 3 = 0;

                // Piracy starts when embassy is built.
                if (GLOBALS.GAME.global.galaxy.embassy && GLOBALS.GAME.global.galaxy.embassy.count > 0) {
                    threat_level = 1;
                }

                // Piracy increases with 'xeno 8' tech ("Alien Gift")
                if (GLOBALS.GAME.global.tech.xeno && GLOBALS.GAME.global.tech.xeno >= 8) {
                    threat_level = 2;
                }

                // Piracy increases further with "[Region] Assault Mission" known in code as "galaxy-alien2_mission"
                if (GLOBALS.GAME.global.tech.conflict) {
                    threat_level = 3;
                }

                return threat_level;
            }

            const threat_level = get_piracy_threat_level();
            const scaling_armada = ([0, 100, 250, 500] as const)[threat_level];

            return [scaling_armada, scaling_armada, 800, 1000, 2500, 7500] as const;
        }
        const required_armada = get_required_armada();

        type RegionName =
            | 'gxy_gateway'
            | 'gxy_stargate'
            | 'gxy_gorddon'
            | 'gxy_alien1'
            | 'gxy_alien2'
            | 'gxy_chthonian';
        function get_current_armada(region_name: RegionName) {
            type ShipArmada = {
                scout_ship: number;
                corvette_ship: number;
                frigate_ship: number;
                cruiser_ship: number;
                dreadnought: number;
            };

            const ships = GLOBALS.GAME.global.galaxy.defense[region_name] as ShipArmada;
            const ship_armada =
                ships.scout_ship * 10 +
                ships.corvette_ship * 30 +
                ships.frigate_ship * 80 +
                ships.cruiser_ship * 250 +
                ships.dreadnought * 1800;

            let armada_bonus = 0;

            // Additionally "Gateway System" has extra defense from "Starbase".
            if (region_name === 'gxy_gateway') {
                const starbase_count = GLOBALS.GAME.global.galaxy.starbase.count;

                armada_bonus += starbase_count * 25;
            }

            // Additionally "Stargate Region" has extra defense from "Defense Platform".
            if (region_name === 'gxy_stargate') {
                const defense_platform_count = GLOBALS.GAME.global.galaxy.defense_platform.count;

                armada_bonus += defense_platform_count * 20;
            }

            // Additionally "gxy_alien2" has extra defense from "Foothold Station" and "Armed Mining Ship"
            if (region_name === 'gxy_alien2') {
                const foothold_station_count = GLOBALS.GAME.global.galaxy.foothold.count;
                const armed_mining_ship_count = GLOBALS.GAME.global.galaxy.armed_miner.count;

                armada_bonus += foothold_station_count * 50 + armed_mining_ship_count * 5;
            }

            // Additionally "Chthonian" has extra defense from "Minelayer" and "Corsair (Raider)"
            if (region_name === 'gxy_chthonian') {
                const minelayer_count = GLOBALS.GAME.global.galaxy.minelayer.count;
                const corsair_count = GLOBALS.GAME.global.galaxy.raider.count;

                armada_bonus += minelayer_count * 50 + corsair_count * 12;
            }

            return ship_armada + armada_bonus;
        }

        function calculate_piracy_stats(galaxy_name: RegionName) {
            const galaxy_armada = get_current_armada(galaxy_name);
            const galaxy_index = {
                gxy_gateway: 0,
                gxy_stargate: 1,
                gxy_gorddon: 2,
                gxy_alien1: 3,
                gxy_alien2: 4,
                gxy_chthonian: 5,
            };
            const galaxy_required_armada = required_armada[galaxy_index[galaxy_name]]!;

            let piracy_percent = 100 - (galaxy_armada * 100) / galaxy_required_armada;
            if (piracy_percent < 0) piracy_percent = 0;

            return {
                galaxy_required_armada,
                piracy_percent,
            };
        }

        function create_piracy_stats_el(galaxy_name: RegionName) {
            const { galaxy_required_armada, piracy_percent } = calculate_piracy_stats(galaxy_name);

            const piracy_color_class = piracy_percent > 0 ? 'has-text-danger' : 'has-text-success';

            return $(`
                <div style="display: contents;" id="${galaxy_name}_piracy_stats">
                    <span class="has-text-warning" style="margin-left: 8px;">Required</span>: 
                    <span class="${piracy_color_class}">${galaxy_required_armada}</span>
                    <span class="has-text-warning" style="margin-left: 8px;">Piracy</span>: 
                    <span class="${piracy_color_class}">${piracy_percent.toFixed(1)}%</span>
                </div>    
            `);
        }

        function add_all_piracy_stats() {
            for (const region_html_el of $('#galaxy > .space.vb')) {
                const region_el = $(region_html_el);
                const galaxy_name = region_el.attr('id')! as RegionName;

                // Append the piracy stats div.
                const append_anchor = region_el.find('div');
                append_anchor.append(create_piracy_stats_el(galaxy_name));
            }
        }
        function remove_all_piracy_stats() {
            for (const region_html_el of $('#galaxy > .space.vb')) {
                const region_el = $(region_html_el);
                const galaxy_name = region_el.attr('id')! as RegionName;

                // Remove the piracy stats div.
                const append_anchor = region_el.find('div');
                append_anchor.remove(`#${galaxy_name}_piracy_stats`);
            }
        }

        add_all_piracy_stats();

        // --- FEAT: Refresh values everytime fleet is reallocated.
        const fleet_add_sub_buttons = $(
            `#galaxy > #fleet > .area > .ship > .add,#galaxy > #fleet > .area > .ship > .sub`
        );

        fleet_add_sub_buttons.each(function () {
            const stop = on_event($(this), 'click', async () => {
                // Wait for the game to update it's state before reading new values.
                await new Promise((resolve) => setTimeout(resolve, 150));
                remove_all_piracy_stats();
                add_all_piracy_stats();
            });

            cleanup_fns.push(stop);
        });

        this.set_tab_specific_cleanup_function(() => {
            cleanup();
            console.log('left andromeda');
        });
    }
}

export const game_tab_manager = new GameTabManager();
