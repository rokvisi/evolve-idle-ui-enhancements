import {
    find_resource_by_name,
    find_resource_by_eject_id,
    find_resource_by_market_id,
    find_resource_by_resource_id,
    find_resource_by_storage_id,
} from '$src/data/resources';
import {
    beep,
    watch_element_dom_mutation,
    fmtNumber,
    add_highlight_on_hover,
    highlight_item,
    remove_highlight_from_item,
    add_resource_img,
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
}

export const game_tab_manager = new GameTabManager();
