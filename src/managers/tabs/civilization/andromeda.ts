import { GLOBALS } from '$src/globals';
import { on_event } from '$src/utils';

export function on_tab_load_andromeda() {
    const cleanup_fns: (() => void)[] = [];
    const cleanup = () => {
        cleanup_fns.forEach((cleanup) => cleanup());
        cleanup_fns.length = 0;
    };

    console.log('SPECIFIC HANDLER: Andromeda');

    function get_required_armada() {
        // Get the current piracy threat level.
        function get_piracy_threat_level() {
            let threat_level: 0 | 1 | 2 | 3 = 0;

            // Piracy starts when embassy is built.
            if (GLOBALS.GAME.global.galaxy.embassy && GLOBALS.GAME.global.galaxy.embassy.count > 0) {
                threat_level = 1;
            }

            // Piracy increases with 'xeno 8' tech ("Alien Gift")
            if (GLOBALS.GAME.global.tech.xeno && GLOBALS.GAME.global.tech.xeno >= 8) {
                threat_level = 2;
            }

            // Piracy increases further with "[Region] Assault Mission" known in code as "galaxy-alien2_mission"
            if (GLOBALS.GAME.global.tech.conflict) {
                threat_level = 3;
            }

            return threat_level;
        }

        const threat_level = get_piracy_threat_level();
        const scaling_armada = ([0, 100, 250, 500] as const)[threat_level];

        return [scaling_armada, scaling_armada, 800, 1000, 2500, 7500] as const;
    }
    const required_armada = get_required_armada();

    type RegionName = 'gxy_gateway' | 'gxy_stargate' | 'gxy_gorddon' | 'gxy_alien1' | 'gxy_alien2' | 'gxy_chthonian';
    function get_current_armada(region_name: RegionName) {
        type ShipArmada = {
            scout_ship: number;
            corvette_ship: number;
            frigate_ship: number;
            cruiser_ship: number;
            dreadnought: number;
        };

        const ships = GLOBALS.GAME.global.galaxy.defense[region_name] as ShipArmada;
        const ship_armada =
            ships.scout_ship * 10 +
            ships.corvette_ship * 30 +
            ships.frigate_ship * 80 +
            ships.cruiser_ship * 250 +
            ships.dreadnought * 1800;

        let armada_bonus = 0;

        // Additionally "Gateway System" has extra defense from "Starbase".
        if (region_name === 'gxy_gateway') {
            const starbase_count = GLOBALS.GAME.global.galaxy.starbase.count;

            armada_bonus += starbase_count * 25;
        }

        // Additionally "Stargate Region" has extra defense from "Defense Platform".
        if (region_name === 'gxy_stargate') {
            const defense_platform_count = GLOBALS.GAME.global.galaxy.defense_platform.count;

            armada_bonus += defense_platform_count * 20;
        }

        // Additionally "gxy_alien2" has extra defense from "Foothold Station" and "Armed Mining Ship"
        if (region_name === 'gxy_alien2') {
            const foothold_station_count = GLOBALS.GAME.global.galaxy.foothold.count;
            const armed_mining_ship_count = GLOBALS.GAME.global.galaxy.armed_miner.count;

            armada_bonus += foothold_station_count * 50 + armed_mining_ship_count * 5;
        }

        // Additionally "Chthonian" has extra defense from "Minelayer" and "Corsair (Raider)"
        if (region_name === 'gxy_chthonian') {
            const minelayer_count = GLOBALS.GAME.global.galaxy.minelayer.count;
            const corsair_count = GLOBALS.GAME.global.galaxy.raider.count;

            armada_bonus += minelayer_count * 50 + corsair_count * 12;
        }

        return ship_armada + armada_bonus;
    }

    function calculate_piracy_stats(galaxy_name: RegionName) {
        const galaxy_armada = get_current_armada(galaxy_name);
        const galaxy_index = {
            gxy_gateway: 0,
            gxy_stargate: 1,
            gxy_gorddon: 2,
            gxy_alien1: 3,
            gxy_alien2: 4,
            gxy_chthonian: 5,
        };
        const galaxy_required_armada = required_armada[galaxy_index[galaxy_name]]!;

        let piracy_percent = 100 - (galaxy_armada * 100) / galaxy_required_armada;
        if (piracy_percent < 0) piracy_percent = 0;

        return {
            galaxy_required_armada,
            piracy_percent,
        };
    }

    function create_piracy_stats_el(galaxy_name: RegionName) {
        const { galaxy_required_armada, piracy_percent } = calculate_piracy_stats(galaxy_name);

        const piracy_color_class = piracy_percent > 0 ? 'has-text-danger' : 'has-text-success';

        return $(`
                <div style="display: contents;" id="${galaxy_name}_piracy_stats">
                    <span class="has-text-warning" style="margin-left: 8px;">Required</span>: 
                    <span class="${piracy_color_class}">${galaxy_required_armada}</span>
                    <span class="has-text-warning" style="margin-left: 8px;">Piracy</span>: 
                    <span class="${piracy_color_class}">${piracy_percent.toFixed(1)}%</span>
                </div>    
            `);
    }

    function add_all_piracy_stats() {
        for (const region_html_el of $('#galaxy > .space.vb')) {
            const region_el = $(region_html_el);
            const galaxy_name = region_el.attr('id')! as RegionName;

            // Append the piracy stats div.
            const append_anchor = region_el.find('div');
            append_anchor.append(create_piracy_stats_el(galaxy_name));
        }
    }
    function remove_all_piracy_stats() {
        for (const region_html_el of $('#galaxy > .space.vb')) {
            const region_el = $(region_html_el);
            const galaxy_name = region_el.attr('id')! as RegionName;

            // Remove the piracy stats div.
            const append_anchor = region_el.find('div');
            append_anchor.remove(`#${galaxy_name}_piracy_stats`);
        }
    }

    add_all_piracy_stats();

    // --- FEAT: Refresh values everytime fleet is reallocated.
    const fleet_add_sub_buttons = $(`#galaxy > #fleet > .area > .ship > .add,#galaxy > #fleet > .area > .ship > .sub`);

    fleet_add_sub_buttons.each(function () {
        const stop = on_event($(this), 'click', async () => {
            // Wait for the game to update it's state before reading new values.
            await new Promise((resolve) => setTimeout(resolve, 150));
            remove_all_piracy_stats();
            add_all_piracy_stats();
        });

        cleanup_fns.push(stop);
    });

    return () => {
        cleanup();
        console.log('left andromeda');
    };
}
