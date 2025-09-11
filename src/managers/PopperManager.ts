import { find_resource_by_data_attr } from '$src/data/resources';
import { ImgFactory } from '$src/ImgFactory';
import { fmtNumber, highlight_item, remove_highlight_from_item, watch_element_dom_mutation } from '$src/utils';

class PopperManager {
    #stopObserving: (() => void) | null = null;

    init = () => {
        this.#stopObserving = watch_element_dom_mutation('#popper', this.popper_handler);
    };

    stop = () => {
        if (this.#stopObserving) {
            this.#stopObserving();
            this.#stopObserving = null;
        }
    };

    // Return a cleanup function to remove any modifications made.
    popper_handler(element: JQuery<HTMLElement>) {
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
            (async () => {
                const img_el = await ImgFactory.get_global_img_el(resource.img);

                cost_item_el.css({
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    gap: '5px',
                });

                cost_item_el.prepend(img_el);
            })();
        }

        return () => {
            mutated_main_resources.forEach((el) => {
                remove_highlight_from_item(el);
                el.find('#cost-annotation').remove();
            });
        };
    }
}

export const popper_manager = new PopperManager();
