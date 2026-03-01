import { on_tab_load_mech_lab } from './civics/mechLab';
import { on_tab_load_andromeda } from './civilization/andromeda';
import { on_tab_load_market } from './resources/market';
import { on_tab_load_mass_ejector } from './resources/massEjector';
import { on_tab_load_storage } from './resources/storage';

const TAB_HANDLERS: Record<string, Record<string, () => () => void>> = {
    Civilization: {
        Andromeda: on_tab_load_andromeda,
    },
    Civics: {
        'Mech Lab': on_tab_load_mech_lab,
    },
    Resources: {
        Market: on_tab_load_market,
        Storage: on_tab_load_storage,
        'Mass Ejector': on_tab_load_mass_ejector,
    },
};

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

    cleanup_tab_handler() {
        // call the cleanup function of the current specific handler.
        this.#tab_specific_cleanup_function();

        // Remove the handler specific cleanup function.
        this.#tab_specific_cleanup_function = () => {
            /* no-op */
        };
    }

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

    run_tab_specific_handler() {
        // Run the cleanup function of the previous tab handler.
        this.cleanup_tab_handler();

        // No tab selected - skip.
        if (!this.#selected_main_tab || !this.#selected_sub_tab) return;

        // Find the handler for the currently selected tab.
        const tab_handler = TAB_HANDLERS[this.#selected_main_tab]?.[this.#selected_sub_tab];
        if (!tab_handler) {
            console.log(`[NOOP]: Tab '${this.#selected_main_tab}' -> '${this.#selected_sub_tab}'`);
            return;
        }

        // Run the handler for the currently selected tab.
        this.#tab_specific_cleanup_function = tab_handler();
        console.log(`[HANDLER]: Tab '${this.#selected_main_tab}' -> '${this.#selected_sub_tab}'`);
    }
}

export const game_tab_manager = new GameTabManager();
