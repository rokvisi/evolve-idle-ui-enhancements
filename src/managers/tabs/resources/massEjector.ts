import { find_resource_by_eject_id } from '$src/data/resources';
import { add_highlight_on_hover, add_resource_img, highlight_item, remove_highlight_from_item } from '$src/utils';

export function on_tab_load_mass_ejector() {
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
    return () => {
        // Remove the main resources tab hover handlers.
        hover_callbacks.forEach(({ el, mouseenter, mouseleave }) => {
            el.off('mouseenter', mouseenter);
            el.off('mouseleave', mouseleave);
        });
    };
}
