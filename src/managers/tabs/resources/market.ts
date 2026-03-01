import { find_resource_by_market_id, find_resource_by_name } from '$src/data/resources';
import {
    add_highlight_on_hover,
    add_resource_img,
    fmtNumber,
    highlight_item,
    remove_highlight_from_item,
} from '$src/utils';

export function on_tab_load_market() {
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
    return () => {
        // Remove the main resources tab hover handlers.
        hover_callbacks.forEach(({ el, mouseenter, mouseleave }) => {
            el.off('mouseenter', mouseenter);
            el.off('mouseleave', mouseleave);
        });

        on_click_callbacks.forEach(({ el, on_click }) => {
            el.off('click', on_click);
        });
    };
}
