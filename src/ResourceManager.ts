import { RESOURCES } from './data/resources';
import { GLOBALS } from './globals';
import { add_highlight_on_hover, add_resource_img } from './utils';

class ResourceManager {
    init = async () => {
        // Change stone to amber for certain species.
        this.change_stone_to_amber_if_needed();

        // Add resource images to the main resource column.
        await this.add_images_to_resource_column();

        // Add hover highlights to the main resource column.
        this.add_hover_highlights_to_resource_column();
    };

    change_stone_to_amber_if_needed() {
        // Get the current species.
        const species = GLOBALS.SPECIES;

        // Change stone to amber for specific species.
        const AMBER_SPECIES = ['ent', 'pinguicula'];
        if (AMBER_SPECIES.includes(species)) {
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

export const resource_manager = new ResourceManager();
