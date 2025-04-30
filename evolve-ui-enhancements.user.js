// ==UserScript==
// @name        Evolve UI Enhancements
// @namespace   EvolveIdle
// @match       https://pmotschmann.github.io/Evolve/
// @grant       none
// @version     1.0
// @author      -
// @description 11/03/2025, 16:42:55
// @grant    GM.getResourceUrl
// @require https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js
// @require https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @run-at      document-idle
//
// @resource R_Money ./icons/money.webp
// @resource R_Lumber ./icons/lumber.webp
// @resource R_Ent ./icons/entity.webp
// @resource R_Knowledge ./icons/knowledge.webp
// @resource R_Crate ./icons/crate.webp
// @resource R_Container ./icons/container.webp
// @resource R_Food ./icons/wheat.webp
// @resource R_Amber ./icons/amber.webp
// @resource R_Stone ./icons/stone.webp
// @resource R_Furs ./icons/furs.webp
// @resource R_Copper ./icons/copper.webp
// @resource R_Iron ./icons/iron.webp
// @resource R_Aluminium ./icons/aluminium.webp
// @resource R_Cement ./icons/cement.webp
// @resource R_Coal ./icons/coal.webp
// @resource R_Oil ./icons/oil.webp
// @resource R_Steel ./icons/steel.webp
// @resource R_Titanium ./icons/titanium.webp
// @resource R_Brick ./icons/brick.webp
// @resource R_Plywood ./icons/plywood.webp
// @resource R_Wrought_Iron ./icons/wroughtiron.webp
// @resource R_Nano_Tube ./icons/nanotube.webp
// @resource R_Sheet_Metal ./icons/sheetmetal.webp
// @resource R_Polymer ./icons/polymer.webp
// @resource R_Uranium ./icons/uranium.webp
// @resource R_Mythril ./icons/mythril.webp
// @resource R_Iridium ./icons/iridium.webp
// @resource R_Helium_3 ./icons/helium.webp
// @resource R_Deuterium ./icons/deuterium.webp
// @resource R_Adamantite ./icons/adamantite.webp
// @resource R_Infernite ./icons/infernite.webp
// @resource R_Graphene ./icons/graphene.webp
// @resource R_Soul_Gem ./icons/soulgem.webp
// @resource R_Stanene ./icons/stanene.webp
// @resource R_Aerogel ./icons/aerogel.webp
// @resource R_Neutronium ./icons/neutronium.webp
// @resource R_Alloy ./icons/alloy.webp
// @resource R_Genes ./icons/genes.webp
// @resource R_Plasmid ./icons/plasmid.webp
// @resource R_Phage ./icons/phage.webp
// @resource R_Elerium ./icons/elerium.webp
// @resource R_Damp_Cloth ./icons/dampcloth.webp
//
// ==/UserScript==

const GLOBAL_TABLE_ITEM_BG_COLOR_ALT =
    $("#resources > .alt").css("background-color");
const GLOBAL_TABLE_ITEM_BG_COLOR = $("html").css("background-color");
const GLOBAL_HIGHLIGHT_COLOR = "#ffffff33";

const SPECIES = [
    "Antid",
    "Arraak",
    "Balorg",
    "Behodler",
    "Bombardier",
    "Cacti",
    "Capybara",
    "Cath",
    "Centaur",
    "Cyclops",
    "Djinn",
    "Dracnid",
    "Dryad",
    "Dwarf",
    "Elf",
    "Entish", // Ent
    "Gecko",
    "Ghast",
    "Gnome",
    "Goblin",
    "Human",
    "Imp",
    "Kamel",
    "Kobold",
    "Lichen",
    "Mantis",
    "Moldling",
    "Nano",
    "Narwhalus",
    "Nephilim",
    "Octigoran",
    "Ogre",
    "Orc",
    "Phoenix",
    "Pinguicula",
    "Pterodacti",
    "Racconar",
    "Rhinotaur",
    "Salamander",
    "Satyr",
    "Scorpid",
    "Seraph",
    "Sharkin",
    "Shoggoth",
    "Shroomi",
    "Slitheryn",
    "Sludge",
    "Sporgar",
    "Synth",
    "Tortoisan",
    "Troll",
    "Tuskin",
    "Ultra Sludge",
    "Unicorn",
    "Junker", // Valdi
    "Vulpine",
    "Wendigo",
    "Wolven",
    "Wyvern",
    "Yeti",
];

const RESOURCES = [
    ...SPECIES.map((s) => ({
        name: s,
        img: "R_Ent",
        id: {
            resources: `#res${s.toLowerCase()}`,
            market: null,
            storage: null,
        },
    })),
    {
        name: "Money",
        img: "R_Money",
        id: {
            data_attr: "data-money",
            resources: "#resMoney",
            market: null,
            storage: null,
        },
    },
    {
        name: "Knowledge",
        img: "R_Knowledge",
        id: {
            data_attr: "data-knowledge",
            resources: "#resKnowledge",
            market: null,
            storage: null,
        },
    },
    {
        name: "Crate",
        img: "R_Crate",
        id: {
            resources: "#resCrates",
            market: null,
            storage: null,
        },
    },
    {
        name: "Container",
        img: "R_Container",
        id: {
            resources: "#resContainers",
            market: null,
            storage: null,
        },
    },
    {
        name: "Food",
        img: "R_Food",
        id: {
            resources: "#resFood",
            market: "#market-Food",
            storage: "#stack-Food",
        },
    },
    {
        name: "Lumber",
        img: "R_Lumber",
        id: {
            data_attr: "data-lumber",
            resources: "#resLumber",
            market: "#market-Lumber",
            storage: "#stack-Lumber",
        },
    },
    {
        name: "Stone",
        img: "R_Stone",
        id: {
            data_attr: "data-stone",
            resources: "#resStone",
            market: "#market-Stone",
            storage: "#stack-Stone",
        },
    },
    {
        name: "Furs",
        img: "R_Furs",
        id: {
            data_attr: "data-furs",
            resources: "#resFurs",
            market: "#market-Furs",
            storage: "#stack-Furs",
        },
    },
    {
        name: "Copper",
        img: "R_Copper",
        id: {
            data_attr: "data-copper",
            resources: "#resCopper",
            market: "#market-Copper",
            storage: "#stack-Copper",
        },
    },
    {
        name: "Iron",
        img: "R_Iron",
        id: {
            data_attr: "data-iron",
            resources: "#resIron",
            market: "#market-Iron",
            storage: "#stack-Iron",
        },
    },
    {
        name: "Aluminium",
        img: "R_Aluminium",
        id: {
            data_attr: "data-aluminium",
            resources: "#resAluminium",
            market: "#market-Aluminium",
            storage: "#stack-Aluminium",
        },
    },
    {
        name: "Cement",
        img: "R_Cement",
        id: {
            data_attr: "data-cement",
            resources: "#resCement",
            market: "#market-Cement",
            storage: "#stack-Cement",
        },
    },
    {
        name: "Coal",
        img: "R_Coal",
        id: {
            data_attr: "data-coal",
            resources: "#resCoal",
            market: "#market-Coal",
            storage: "#stack-Coal",
        },
    },
    {
        name: "Oil",
        img: "R_Oil",
        id: {
            data_attr: "data-oil",
            resources: "#resOil",
            market: "#market-Oil",
            storage: "#stack-Oil",
        },
    },
    {
        name: "Steel",
        img: "R_Steel",
        id: {
            data_attr: "data-steel",
            resources: "#resSteel",
            market: "#market-Steel",
            storage: "#stack-Steel",
        },
    },
    {
        name: "Titanium",
        img: "R_Titanium",
        id: {
            data_attr: "data-titanium",
            resources: "#resTitanium",
            market: "#market-Titanium",
            storage: "#stack-Titanium",
        },
    },
    {
        name: "Uranium",
        img: "R_Uranium",
        id: {
            data_attr: "data-uranium",
            resources: "#resUranium",
            market: "#market-Uranium",
            storage: "#stack-Uranium",
        },
    },
    {
        name: "Mythril",
        img: "R_Mythril",
        id: {
            data_attr: "data-mythril",
            resources: "#resMythril",
            market: "#market-Mythril",
            storage: "#stack-Mythril",
        },
    },
    {
        name: "Iridium",
        img: "R_Iridium",
        id: {
            data_attr: "data-iridium",
            resources: "#resIridium",
            market: "#market-Iridium",
            storage: "#stack-Iridium",
        },
    },
    {
        name: "Neutronium",
        img: "R_Neutronium",
        id: {
            data_attr: "data-neutronium",
            resources: "#resNeutronium",
            market: "#market-Neutronium",
            storage: "#stack-Neutronium",
        },
    },
    {
        name: "Elerium",
        img: "R_Elerium",
        id: {
            data_attr: "data-elerium",
            resources: "#resElerium",
            market: "#market-Elerium",
            storage: "#stack-Elerium",
        },
    },
    {
        name: "Helium_3",
        img: "R_Helium_3",
        id: {
            data_attr: "data-helium_3",
            resources: "#resHelium_3",
            market: "#market-Helium_3",
            storage: "#stack-Helium_3",
        },
    },
    {
        name: "Deuterium",
        img: "R_Deuterium",
        id: {
            data_attr: "data-deuterium",
            resources: "#resDeuterium",
            market: null,
            storage: null,
        },
    },
    {
        name: "Adamantite",
        img: "R_Adamantite",
        id: {
            data_attr: "data-adamantite",
            resources: "#resAdamantite",
            market: null,
            storage: "#stack-Adamantite",
        },
    },
    {
        name: "Infernite",
        img: "R_Infernite",
        id: {
            data_attr: "data-infernite",
            resources: "#resInfernite",
            market: null,
            storage: null,
        },
    },
    {
        name: "Graphene",
        img: "R_Graphene",
        id: {
            data_attr: "data-graphene",
            resources: "#resGraphene",
            market: null,
            storage: "#stack-Graphene",
        },
    },
    {
        name: "Stanene",
        img: "R_Stanene",
        id: {
            data_attr: "data-stanene",
            resources: "#resStanene",
            market: null,
            storage: "#stack-Stanene",
        },
    },
    {
        name: "Aerogel",
        img: "R_Aerogel",
        id: {
            data_attr: "data-aerogel",
            resources: "#resAerogel",
            market: null,
            storage: null,
        },
    },
    {
        name: "Soul Gem",
        img: "R_Soul_Gem",
        id: {
            data_attr: "data-soul_gem",
            resources: "#resSoul_Gem",
            market: null,
            storage: null,
        },
    },

    //resSoul_Gem
    {
        name: "Alloy",
        img: "R_Alloy",
        id: {
            data_attr: "data-alloy",
            resources: "#resAlloy",
            market: "#market-Alloy",
            storage: "#stack-Alloy",
        },
    },
    {
        name: "Polymer",
        img: "R_Polymer",
        id: {
            data_attr: "data-polymer",

            resources: "#resPolymer",
            market: "#market-Polymer",
            storage: "#stack-Polymer",
        },
    },
    {
        name: "Genes",
        img: "R_Genes",
        id: {
            resources: "#resGenes",
            market: null,
            storage: null,
        },
    },
    {
        name: "Plasmid",
        img: "R_Plasmid",
        id: {
            resources: "#resPlasmid",
            market: null,
            storage: null,
        },
    },
    {
        name: "Phage",
        img: "R_Phage",
        id: {
            resources: "#resPhage",
            market: null,
            storage: null,
        },
    },
    {
        name: "Brick",
        img: "R_Brick",
        id: {
            data_attr: "data-brick",
            resources: "#resBrick",
            market: null,
            storage: null,
        },
    },
    {
        name: "Plywood",
        img: "R_Plywood",
        id: {
            data_attr: "data-plywood",
            resources: "#resPlywood",
            market: null,
            storage: null,
        },
    },
    {
        name: "Wrought Iron",
        img: "R_Wrought_Iron",
        id: {
            data_attr: "data-wrought_iron",
            resources: "#resWrought_Iron",
            market: null,
            storage: null,
        },
    },
    {
        name: "Damp Cloth",
        img: "R_Damp_Cloth",
        id: {
            data_attr: "data-damp_cloth",
            resources: "#resHorseshoe",
            market: null,
            storage: null,
        },
    },
    {
        name: "Nano Tube",
        img: "R_Nano_Tube",
        id: {
            data_attr: "data-nano_tube",
            resources: "#resNano_Tube",
            market: null,
            storage: null,
        },
    },
    {
        name: "Sheet Metal",
        img: "R_Sheet_Metal",
        id: {
            data_attr: "data-sheet_metal",
            resources: "#resSheet_Metal",
            market: null,
            storage: null,
        },
    },
];

function find_resource_by_resource_id(id) {
    return RESOURCES.find((resource) => {
        return resource.id.resources === id;
    });
}
function find_resource_by_market_id(id) {
    return RESOURCES.find((resource) => {
        return resource.id.market === id;
    });
}
function find_resource_by_storage_id(id) {
    return RESOURCES.find((resource) => {
        return resource.id.storage === id;
    });
}

function get_sub_tab_li_els() {
    let sub_tab_li_els = $(
        "#mainTabs > section > div[tabIndex='0'] > div > div > nav > ul > li"
    );
    if (sub_tab_li_els.length === 0) {
        // A sub-tab may not exist.

        // The exception is the A.R.P.A tab, which has a different structure.
        sub_tab_li_els = $(
            "#mainTabs > section > div[tabIndex='0'] > div > div > div > nav > ul > li"
        );

        // If the A.R.P.A structure doesn't match anything, the sub-tab is not found.
        if (sub_tab_li_els.length === 0) {
            return null;
        }
    }

    return sub_tab_li_els;
}

function highlight_item(element) {
    element.css({
        "background-color": GLOBAL_HIGHLIGHT_COLOR,
    });
}
function remove_highlight_from_item(element) {
    if (element.hasClass("alt")) {
        element.css({
            "background-color": GLOBAL_TABLE_ITEM_BG_COLOR_ALT,
        });
    } else {
        element.css({
            "background-color": GLOBAL_TABLE_ITEM_BG_COLOR,
        });
    }
}
function add_hover_highlight(element) {
    element.hover(
        function () {
            highlight_item($(this));
        },
        function () {
            remove_highlight_from_item($(this));
        }
    );
}

const IMAGE_CACHE = new Map();
async function add_img(element, image_id) {
    element.css({
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        gap: "5px",
    });

    // const text_color = element.css("color");

    const cached_img = IMAGE_CACHE.get(image_id);
    if (!cached_img) {
        const img_el = $("<img />", {
            src: await GM.getResourceUrl(image_id),
            alt: "logo",
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

async function add_resource_img(resource_el, image_id) {
    // Most resource <div>s have an <h3> child element.
    // This <h3> element contains the name of the resource.
    let text_parent_el = $(resource_el).find("h3");

    // Some elements don't have an <h3> element, they have a <span> instead.
    if (text_parent_el.length === 0) {
        text_parent_el = $(resource_el).find("span").first();
    }

    const text_color = text_parent_el.css("color");

    // Make the header flex
    text_parent_el.css({
        display: "flex",
        "align-items": "center",
        gap: "5px",
    });

    // Create the image element
    const img_el = $("<img />", {
        src: await GM.getResourceUrl(image_id),
        alt: "logo",
        style: `width: 18px; height: 18px; border: 1px solid ${text_color}; border-radius: 4px;`,
    });

    // Prepend the image to the header
    text_parent_el.prepend(img_el);
}

class State {
    #selected_main_tab = null;
    #selected_sub_tab = null;
    #sub_tabs_with_on_click_handlers = [];

    // Each specific resource handler can override this function.
    // It is called before switching to a new main+sub tab combo.
    #tab_specific_cleanup_function = () => {
        /* no-op */
    };

    set_tab_specific_cleanup_function(func) {
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

        const main_tab_el = $(
            "#mainTabs > nav > ul > li[aria-selected='true']"
        )[0];

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
        let selected_sub_tab_el = null;
        subtabs.each(function () {
            if ($(this).attr("aria-selected") === "true") {
                selected_sub_tab_el = $(this);
            }
        });
        if (!selected_sub_tab_el) {
            // No selected sub-tab.
            selected_sub_tab = null;
            return;
        }

        // The name can be directly inside the <a> element, or inside a nested <span>.
        // If the nested <span> is present, it is the real name of the sub-tab.
        const nested_span_el = selected_sub_tab_el.find("span")[0];
        if (nested_span_el) {
            // Use the nested <h2> as the name of the sub-tab.
            selected_sub_tab = nested_span_el.innerText;
        } else {
            // Use the <a> element directly as the name of the sub-tab.
            selected_sub_tab = selected_sub_tab_el[0].innerText;
        }

        return { main_tab: selected_main_tab, sub_tab: selected_sub_tab };
    }

    // Sets the selected main and sub tab.
    // Returns true if the tabs were changed.
    // Returns false if the tabs were not changed.
    sync_selected_tabs() {
        const selected_tabs = this.get_selected_tabs();

        if (
            this.#selected_main_tab === selected_tabs.main_tab &&
            this.#selected_sub_tab === selected_tabs.sub_tab
        ) {
            // Tabs have not changed.
            return false;
        }

        this.#selected_main_tab = selected_tabs.main_tab;
        this.#selected_sub_tab = selected_tabs.sub_tab;

        // Tabs have changed.
        return true;
    }

    on_main_tab_click() {
        // Sync the selected main and sub tabs. If the tabs have not changed, do nothing.
        const tab_changed = this.sync_selected_tabs();
        if (!tab_changed) return;

        // Since the tabs have changed, detach the previous sub-tab click handlers.
        this.#sub_tabs_with_on_click_handlers.forEach(function (element) {
            element.off("click");
        });
        this.#sub_tabs_with_on_click_handlers = [];

        // Run the previous main+sub tab combo cleanup function.
        // Fire the handler for the selected main+sub tab combo.
        this.run_tab_specific_handler();

        // Alias instance methods to avoid "this" issues.
        const THIS__on_sub_tab_click = () => this.on_sub_tab_click();
        const THIS__push_sub_tab_click_handler = (element) =>
            this.#sub_tabs_with_on_click_handlers.push(element);

        // Attach on-click handlers to the sub-tabs.
        // TODO: Also attaches to hidden tabs. Fix this.
        get_sub_tab_li_els().each(function () {
            THIS__push_sub_tab_click_handler($(this));

            $(this).on("click", function () {
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
        if (main_tab === "Resources") {
            if (sub_tab === "Market") {
                this.on_event_resources_market();
            }
            if (sub_tab === "Storage") {
                this.on_event_resources_storage();
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
        const market_items = $(
            "#mTabResource > div > section > #market > .market-item"
        ).filter(function () {
            // Skip hidden elements.
            if ($(this).css("display") === "none") return false;

            // Skip elements that are not resources.
            if (!$(this).attr("id").startsWith("market-")) return false;

            return true;
        });

        // Add resource images to market sub-tab.
        market_items.each(async function () {
            // Get the market item id.
            const market_id = `#${$(this).attr("id")}`;

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

        // Highlight the matching market resource from the main resource.
        $("#resources > div").each(function () {
            const resource_id = `#${$(this).attr("id")}`;

            // TODO: Investigate this to see why so many invalid resources exist.
            const resource = find_resource_by_resource_id(resource_id);
            if (!resource) return;

            // Get the same resource in the resources->market.
            const market_item = $(resource.id.market);

            function mouseenter() {
                highlight_item(market_item);
            }
            function mouseleave() {
                remove_highlight_from_item(market_item);
            }

            $(this).on("mouseenter", mouseenter);
            $(this).on("mouseleave", mouseleave);
            hover_callbacks.push({ el: $(this), mouseenter, mouseleave });
        });

        // Highlight the matching main resource from the market resource.
        market_items.each(function () {
            const market_id = `#${$(this).attr("id")}`;

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

            $(this).on("mouseenter", mouseenter);
            $(this).on("mouseleave", mouseleave);
            hover_callbacks.push({ el: $(this), mouseenter, mouseleave });
        });

        // Add quantity select buttons.
        const quantity_buttons_parent = $("<div/>")
            .css({
                display: "flex",
                gap: "1rem",
                "justify-content": "center",
            })
            .addClass("market");

        const num_formatter = new Intl.NumberFormat("en-US", {
            notation: "compact",
        });

        for (const qty of [100, 200, 500, 1000, 5000, 10000, 100000, 1000000]) {
            const on_click = function () {
                const el = $("#market-qty  .control > input").val(qty);
                el[0].dispatchEvent(new Event("input"));
            };

            const btn = $("<button/>")
                .text(num_formatter.format(qty))
                .addClass("button")
                .on("click", on_click)
                .appendTo(quantity_buttons_parent);

            on_click_callbacks.push({ el: btn, on_click });
        }

        quantity_buttons_parent.appendTo("#market-qty");

        // Cleanup function.
        this.set_tab_specific_cleanup_function(() => {
            // Remove the main resources tab hover handlers.
            hover_callbacks.forEach(({ el, mouseenter, mouseleave }) => {
                el.off("mouseenter", mouseenter);
                el.off("mouseleave", mouseleave);
            });

            on_click_callbacks.forEach(({ el, on_click }) => {
                el.off("click", on_click);
            });
        });
    }
    on_event_resources_storage() {
        // console.log("SPECIFIC HANDLER: Resources -> Storage");

        // Will be cleanup up in the cleanup function.
        const hover_callbacks = [];

        // Get the array of storage items.
        const storage_items = $(
            "#mTabResource > div > section > #resStorage > .market-item"
        ).filter(function () {
            // Skip hidden elements.
            if ($(this).css("display") === "none") return false;

            // Skip elements that are not resources.
            if (!$(this).attr("id").startsWith("stack-")) return false;

            return true;
        });

        // Add resource images to storage sub-tab.
        storage_items.each(async function () {
            // Get the storage item id.
            const storage_id = `#${$(this).attr("id")}`;

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

        // Highlight the matching storage resource from the main resource.
        $("#resources > div").each(function () {
            const resource_id = `#${$(this).attr("id")}`;

            // TODO: Investigate this to see why so many invalid resources exist.
            const resource = find_resource_by_resource_id(resource_id);
            if (!resource) return;

            // Get the same resource in the resources->storage.
            const storage_item = $(resource.id.storage);

            function mouseenter() {
                highlight_item(storage_item);
            }
            function mouseleave() {
                remove_highlight_from_item(storage_item);
            }

            $(this).on("mouseenter", mouseenter);
            $(this).on("mouseleave", mouseleave);
            hover_callbacks.push({ el: $(this), mouseenter, mouseleave });
        });

        // Highlight the matching main resource from the storage resource.
        storage_items.each(function () {
            const storage_id = `#${$(this).attr("id")}`;

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

            $(this).on("mouseenter", mouseenter);
            $(this).on("mouseleave", mouseleave);
            hover_callbacks.push({ el: $(this), mouseenter, mouseleave });
        });

        // Cleanup function.
        this.set_tab_specific_cleanup_function(() => {
            // Remove the main resources tab hover handlers.
            hover_callbacks.forEach(({ el, mouseenter, mouseleave }) => {
                el.off("mouseenter", mouseenter);
                el.off("mouseleave", mouseleave);
            });
        });
    }
}

function watch_element_dom_mutation(selector, on_open) {
    let is_open = false;
    let cleanup_fn = () => {
        console.log("default cleanup");
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

function watch_element_interval(
    selector,
    on_open,
    on_close,
    check_interval = 1
) {
    let is_open = false;

    const interval = setInterval(() => {
        const element = $(selector);
        const element_exists = element.length !== 0;

        if (element_exists) {
            // Element exists and was previously closed.
            if (is_open === false) {
                is_open = true;
                on_open(element);
            }
        } else {
            // Element doesn't exists and was previously open.
            if (is_open === true) {
                is_open = false;
                on_close();
            }
        }
    }, check_interval);

    return () => {
        clearInterval(interval);
    };
}

// Same as watch_element, but also fires when the contents of the element get changed.
function watch_element_change(selector, on_open, on_close, check_interval = 1) {
    // const observer = new MutationObserver((mutations) => {
    //     on_open(element);
    // });

    const extended_on_open = (element) => {
        on_open(element);

        const observer = new MutationObserver((mutations) => {
            console.log("element changed");
        });

        console.log("connected observer to element:", element[0]);
        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(element[0], {
            childList: true,
            subtree: true,
        });
    };

    const stop_watching = watch_element(
        selector,
        extended_on_open,
        on_close,
        check_interval
    );

    // const observer = new MutationObserver((mutations) => {
    //     console.log("element changed");
    // });

    // const get_element = () => {
    //     if (selector.startsWith("#")) {
    //         return document.getElementById(selector.slice(1));
    //     }
    //     if (selector.startsWith(".")) {
    //         return document.getElementsByClassName(selector.slice(1))[0];
    //     }
    // };

    // // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
    // observer.observe(document.getElementById("#popper"), {
    //     childList: true,
    //     subtree: true,
    // });

    return () => {
        stop_watching();
        // observer.disconnect();
    };
}

// Entry point.
async function main() {
    // ------------- UNIVERSAL ------------ //
    // Global state object.
    const STATE = new State();

    // Get the current species.
    const species = $("#race > .name").text();

    // Change stone to amber for specific species.
    const AMBER_SPECIES = ["Ent", "Pinguicula"];
    if (AMBER_SPECIES.includes(species)) {
        RESOURCES.find((r) => r.name === "Stone").img = "R_Amber";
    }

    // Add resource images to the main resource tab.
    for (const resource of RESOURCES) {
        const resource_el = $(resource.id.resources);

        await add_resource_img(resource_el, resource.img);
    }

    // Add hover highlights to the main resource tab.
    $("#resources > div").each(function () {
        add_hover_highlight($(this));
    });

    // Remove the footer promo.
    // $(".promoBar").remove();

    // Watch for the 'popper' element to appear.
    const stop = watch_element_dom_mutation("#popper", (element) => {
        // Find the cost list <div> or return early.
        let cost_list_el = null;
        element.children().each(function () {
            if ($(this).hasClass("costList")) {
                cost_list_el = $(this);
            }
        });
        if (!cost_list_el) {
            return () => {};
        }

        // Iterate over the cost list items.
        const mutated_main_resources = [];
        cost_list_el.children().each(function () {
            const cost_item_el = $(this);

            // Find the resource data attribute.
            let resource_data_attribute = null;
            $.each(this.attributes, function () {
                if (this.name.startsWith("data-")) {
                    resource_data_attribute = this;
                }
            });

            // Find the resource by the data attribute.
            const resource = RESOURCES.find(
                (resource) =>
                    resource.id.data_attr === resource_data_attribute.name
            );
            if (!resource) return;

            // Highlight the main resource.
            const main_resource_el = $(resource.id.resources);
            highlight_item(main_resource_el);

            // Add cost annotation to the main resource.

            const cost = Number(-resource_data_attribute.value).toLocaleString(
                undefined, // leave undefined to use the visitor's browser
                // locale or a string like 'en-US' to override it.
                { minimumFractionDigits: 0 }
            );
            main_resource_el.find("span.count").prepend(
                $("<span>").text(cost).attr("id", "cost-annotation").css({
                    color: "oklch(0.637 0.237 25.331)",
                    "font-size": "0.6rem",
                    "margin-right": "2px",
                    "background-color": "black",
                    height: "auto",
                })
            );

            mutated_main_resources.push(main_resource_el);

            // Add the image to the cost item.
            add_img(cost_item_el, resource.img);
        });

        return () => {
            mutated_main_resources.forEach((el) => {
                remove_highlight_from_item(el);
                el.find("#cost-annotation").remove();
            });
        };
    });

    // --------------- TABS --------------- //
    // Auto-fire for the automatically selected tab.
    STATE.on_main_tab_click();

    // Attach on-click handlers to the main tabs.
    // TODO: Also attaches to hidden main tabs. Fix this.
    const main_tabs = $("#mainTabs > nav > ul > li");
    main_tabs.each(function () {
        $(this).on("click", function () {
            STATE.on_main_tab_click();
        });
    });
}

// Wait for the game UI to load, then run the main function.
VM.observe(document.body, () => {
    const node = document.querySelector("div#main");
    if (node !== null) {
        main();

        // Disconnect observer
        return true;
    }
});
