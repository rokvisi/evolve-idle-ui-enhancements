import { RESOURCES } from '$src/data/resources';
import { GLOBALS } from '$src/globals';
import { add_highlight_on_hover, add_resource_img } from '$src/utils';

class ResourceColumnManager {
    init = async () => {
        // Change stone to amber for certain species.
        this.change_stone_to_amber_if_needed();

        // Add resource images to the main resource column.
        await this.add_images_to_resource_column();

        // Add hover highlights to the main resource column.
        this.add_hover_highlights_to_resource_column();
    };

    // This doesn't belong in the resource manager because it mutates globals.
    // But it's the most convenient place for it right now.
    // TODO: Move this into GlobalsManager when it's implemented (globals management also needed for watching state changes, which is also in the wrong place atm.)
    change_stone_to_amber_if_needed() {
        // Check for the sappy trait.
        if (GLOBALS.GAME.global.race.sappy) {
            // Replace stone's image with amber (still stone tho).
            RESOURCES.find((r) => r.name === 'Stone')!.img = 'R_Amber';
        }
    }

    add_images_to_resource_column = async () => {
        for (const resource of RESOURCES) {
            const resource_el = $(resource.id.resources);

            await add_resource_img(resource_el, resource.img);
        }
    };

    add_hover_highlights_to_resource_column = () => {
        $('#resources > div').each(function () {
            add_highlight_on_hover($(this));
        });
    };
}

export const resource_column_manager = new ResourceColumnManager();
