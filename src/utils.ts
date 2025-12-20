import { beepAudioSrc } from '$src/data/beepAudio';
import { GLOBALS } from '$src/globals';
import { ImgFactory } from '$src/ImgFactory';

const num_formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
});
export function fmtNumber(num: number): string {
    return num_formatter.format(num);
}

export async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
}

export function beep() {
    const beepAudioEl = new Audio(beepAudioSrc);

    beepAudioEl.volume = 1;
    beepAudioEl.play();
}

export function watch_element_dom_mutation(selector: string, on_open: (element: JQuery<HTMLElement>) => () => void) {
    let is_open = false;
    let cleanup_fn = () => {
        console.log('default cleanup');
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

export function highlight_item(element: JQuery<HTMLElement>) {
    element.css({
        'background-color': GLOBALS.HIGHLIGHT_COLOR!,
    });
}

export function remove_highlight_from_item(element: JQuery<HTMLElement>) {
    if (element.hasClass('alt')) {
        element.css({
            'background-color': GLOBALS.TABLE_ITEM_BG_COLOR_ALT!,
        });
    } else {
        element.css({
            'background-color': GLOBALS.TABLE_ITEM_BG_COLOR!,
        });
    }
}

export function add_highlight_on_hover(element: JQuery<HTMLElement>) {
    element.on('mouseenter', function () {
        highlight_item($(this));
    });
    element.on('mouseleave', function () {
        remove_highlight_from_item($(this));
    });
}

export async function add_resource_img(resource_el: JQuery<Element>, image_id: string) {
    // Most resource <div>s have an <h3> child element.
    // This <h3> element contains the name of the resource.
    let text_parent_el: JQuery<Element> = $(resource_el).find('h3');

    // Some elements don't have an <h3> element, they have a <span> instead.
    if (text_parent_el.length === 0) {
        text_parent_el = $(resource_el).find('span').first();
    }

    // If there is no <h3> or <span>, just use the resource element itself.
    if (text_parent_el.length === 0) {
        text_parent_el = resource_el;
    }

    // Make the parent a flexbox to align the image and text.
    text_parent_el.css({
        display: 'flex',
        'align-items': 'center',
        gap: '5px',
    });

    // Prepend the image to the parent.
    const img_el = await ImgFactory.create_img_el(image_id);
    text_parent_el.prepend(img_el);
}

export function create_stylesheet(css_content: string) {
    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(css_content);
    return stylesheet;
}

export function attach_stylesheet(stylesheet: CSSStyleSheet, parent: Document | ShadowRoot) {
    parent.adoptedStyleSheets.push(stylesheet);
}

export function extract_css_property_at_rules_from_content(css_content: string) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css_content);

    return extract_css_property_at_rules_from_stylesheet(sheet);
}

export function extract_css_property_at_rules_from_stylesheet(stylesheet: CSSStyleSheet) {
    // Extract all @property at-rules.
    let css_property_at_rules = '';
    for (let i = 0; i < stylesheet.cssRules.length; i++) {
        const rule = stylesheet.cssRules[i]!;

        if (rule.cssText.startsWith('@property')) {
            css_property_at_rules += rule.cssText + '\n';
        }
    }

    return css_property_at_rules;
}

export function on_event<T = HTMLElement>(el: JQuery<T>, events: string, callback: () => void) {
    el.on(events, callback);

    return () => {
        el.off(events, callback);
    };
}
