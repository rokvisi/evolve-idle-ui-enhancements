import * as v from 'valibot';

const setting_schema = v.object({
    cloudsave_gist_id: v.optional(v.string(), ''),
    cloudsave_gist_token: v.optional(v.string(), ''),
    cloudsave_filename: v.optional(v.string(), ''),
    beep_on_new_message: v.optional(v.boolean(), true),
});
export type Settings = v.InferOutput<typeof setting_schema>;
const default_settings = v.getDefaults(setting_schema);
type SettingsKey = keyof Settings;

class UserscriptSettings {
    #settings_localstorage_key = 'userscript-settings';
    #settings: Settings = default_settings;

    constructor() {
        const localstorage_settings = this.#read_settings_from_localstorage();
        if (localstorage_settings) {
            this.#settings = localstorage_settings;
            return;
        }

        this.#settings = default_settings;
        this.#write_settings_to_localstorage();
    }

    #set_localstorage = (key: string, value: any) => {
        localStorage[key] = JSON.stringify(value);
    };
    #get_localstorage = <ResultT = unknown>(key: string): ResultT | null => {
        const value = localStorage.getItem(key);
        if (!value) return null;

        return JSON.parse(value) as ResultT;
    };

    #read_settings_from_localstorage = () => {
        const settings_str = this.#get_localstorage(this.#settings_localstorage_key);
        if (!settings_str) return null;

        const settings_parse_result = v.safeParse(setting_schema, settings_str);
        return settings_parse_result.success ? settings_parse_result.output : null;
    };
    #write_settings_to_localstorage = () => {
        this.#set_localstorage(this.#settings_localstorage_key, this.#settings);
    };

    get = <T extends SettingsKey>(key: T): Settings[T] => {
        return this.#settings[key];
    };
    get_all = () => {
        return { ...this.#settings };
    };

    set = <T extends SettingsKey>(key: T, value: Settings[T]) => {
        this.#settings[key] = value;
        this.#write_settings_to_localstorage();
    };
    set_multiple = (new_settings: Partial<Settings>) => {
        Object.assign(this.#settings, new_settings);
        this.#write_settings_to_localstorage();
    };
}
export const userscript_settings = new UserscriptSettings();
