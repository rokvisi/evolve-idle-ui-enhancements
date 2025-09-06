class ImgFactory {
    #IMAGE_SRC_CACHE = new Map<string, string>();
    #IMAGE_EL_CACHE = new Map<string, JQuery<HTMLElement>>();

    #get_img_src = async (image_id: string) => {
        // Return cached src if it exists.
        const cached_src = this.#IMAGE_SRC_CACHE.get(image_id);
        if (cached_src) return cached_src;

        // Otherwise, fetch the src and cache it.
        const img_src = await GM.getResourceUrl(image_id);
        this.#IMAGE_SRC_CACHE.set(image_id, img_src);

        return img_src;
    };

    create_img_el = async (image_id: string) => {
        const img_src = await this.#get_img_src(image_id);

        const img_el = $('<img />', {
            src: img_src,
            alt: '404',
            style: `width: 18px; height: 18px; border: 1px solid; border-radius: 4px; font-size: 0.5rem; text-align: center; vertical-align: middle; line-height: 1rem;`,
        });

        return img_el;
    };

    // Returns a global image element that can be moved around the DOM.
    // This is only useful when there is ONE image at ONE place at a time.
    // Used to combat the popover performance issues where it rerenders *a lot* of times per second.
    // We create a single image and consantly move it inside the popover instead of creating a new one each time.
    get_global_img_el = async (image_id: string) => {
        // Try to get the global/cached image element.
        const cached_el = this.#IMAGE_EL_CACHE.get(image_id);
        if (cached_el) return cached_el;

        // Otherwise, create it and cache it.
        const img_el = await this.create_img_el(image_id);
        this.#IMAGE_EL_CACHE.set(image_id, img_el);

        return img_el;
    };
}

const imgFactoryInstance = new ImgFactory();
export { imgFactoryInstance as ImgFactory };
