import { attach_stylesheet, create_stylesheet, extract_css_property_at_rules_from_stylesheet } from '$src/utils';

class ShadowDomHelper {
    #shadow_dom_stylesheet_resource_key = 'shadow-dom-css';
    shadow_dom_stylesheet: CSSStyleSheet;

    constructor() {
        const css_content = GM.getResourceText(this.#shadow_dom_stylesheet_resource_key);
        this.shadow_dom_stylesheet = create_stylesheet(css_content);
    }

    attach_stylesheet = (shadow_root: ShadowRoot) => {
        attach_stylesheet(this.shadow_dom_stylesheet, shadow_root);
    };

    extract_css_property_at_rules = () => {
        const property_at_rules_content = extract_css_property_at_rules_from_stylesheet(this.shadow_dom_stylesheet);
        return create_stylesheet(property_at_rules_content);
    };

    create_shadow_dom = (shadow_root_anchor: Element) => {
        const shadow_wrapper_outer = document.createElement('div');
        const shadow_wrapper_inner = document.createElement('div');

        shadow_root_anchor.appendChild(shadow_wrapper_outer);
        const shadow_root = shadow_wrapper_outer.attachShadow({ mode: 'open' });
        shadow_root.appendChild(shadow_wrapper_inner);

        return { shadow_wrapper_outer, shadow_wrapper_inner, shadow_root };
    };

    create_shadcn_shadow_dom = (shadow_root_anchor: Element) => {
        // Create the shadow dom.
        const shadow_dom = this.create_shadow_dom(shadow_root_anchor);

        // Apply dark theme to the shadow dom.
        shadow_dom.shadow_wrapper_inner.classList.add('dark');

        // Inject the compiled css into the shadow dom.
        this.attach_stylesheet(shadow_dom.shadow_root);

        return shadow_dom;
    };
}

export const shadow_dom_helper = new ShadowDomHelper();
