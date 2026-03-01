import { find_resource_by_storage_id } from '$src/data/resources';
import { add_resource_img, add_highlight_on_hover, highlight_item, remove_highlight_from_item } from '$src/utils';

export function on_tab_load_storage() {
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
    return () => {
        // Remove the main resources tab hover handlers.
        hover_callbacks.forEach(({ el, mouseenter, mouseleave }) => {
            el.off('mouseenter', mouseenter);
            el.off('mouseleave', mouseleave);
        });
    };
}
