import { GLOBALS } from '$src/globals';
import { capitalize } from '$src/utils';
import { toast } from 'svelte-sonner';

// Boss effective/ineffective weapons calculation:
// https://github.com/pmotschmann/Evolve/blob/f3168211172c11808eb48bc3753642f193e9b5b4/src/portal.js#L6335

const terrain_mech_movement_effectiveness = {
    sand: {
        wheel: {
            s: 90,
            l: 85,
        },
        biped: {
            s: 78,
            l: 65,
        },
        spider: {
            s: 75,
            l: 65,
        },
        tread: {
            s: 115,
            l: 110,
        },
        quad: {
            s: 86,
            l: 75,
        },
        hover: {
            s: 100,
            l: 100,
        },
    },
    swamp: {
        wheel: {
            s: 35,
            l: 18,
        },
        biped: {
            s: 68,
            l: 50,
        },
        spider: {
            s: 90,
            l: 78,
        },
        tread: {
            s: 55,
            l: 40,
        },
        quad: {
            s: 58,
            l: 42,
        },
        hover: {
            s: 135,
            l: 120,
        },
    },
    forest: {
        wheel: {
            s: 100,
            l: 100,
        },
        biped: {
            s: 100,
            l: 95,
        },
        spider: {
            s: 82,
            l: 75,
        },
        tread: {
            s: 100,
            l: 95,
        },
        quad: {
            s: 125,
            l: 120,
        },
        hover: {
            s: 65,
            l: 48,
        },
    },
    jungle: {
        wheel: {
            s: 92,
            l: 85,
        },
        biped: {
            s: 82,
            l: 70,
        },
        spider: {
            s: 77,
            l: 65,
        },
        tread: {
            s: 95,
            l: 90,
        },
        quad: {
            s: 100,
            l: 100,
        },
        hover: {
            s: 55,
            l: 35,
        },
    },
    rocky: {
        wheel: {
            s: 65,
            l: 50,
        },
        biped: {
            s: 48,
            l: 40,
        },
        spider: {
            s: 125,
            l: 120,
        },
        tread: {
            s: 65,
            l: 50,
        },
        quad: {
            s: 95,
            l: 90,
        },
        hover: {
            s: 82,
            l: 68,
        },
    },
    gravel: {
        wheel: {
            s: 100,
            l: 95,
        },
        biped: {
            s: 100,
            l: 100,
        },
        spider: {
            s: 86,
            l: 75,
        },
        tread: {
            s: 130,
            l: 120,
        },
        quad: {
            s: 90,
            l: 80,
        },
        hover: {
            s: 100,
            l: 100,
        },
    },
    muddy: {
        wheel: {
            s: 85,
            l: 58,
        },
        biped: {
            s: 85,
            l: 70,
        },
        spider: {
            s: 92,
            l: 82,
        },
        tread: {
            s: 88,
            l: 72,
        },
        quad: {
            s: 68,
            l: 50,
        },
        hover: {
            s: 115,
            l: 108,
        },
    },
    grass: {
        wheel: {
            s: 130,
            l: 120,
        },
        biped: {
            s: 125,
            l: 120,
        },
        spider: {
            s: 100,
            l: 100,
        },
        tread: {
            s: 100,
            l: 100,
        },
        quad: {
            s: 100,
            l: 95,
        },
        hover: {
            s: 100,
            l: 100,
        },
    },
    brush: {
        wheel: {
            s: 90,
            l: 80,
        },
        biped: {
            s: 92,
            l: 85,
        },
        spider: {
            s: 100,
            l: 95,
        },
        tread: {
            s: 100,
            l: 100,
        },
        quad: {
            s: 95,
            l: 90,
        },
        hover: {
            s: 78,
            l: 70,
        },
    },
    concrete: {
        wheel: {
            s: 110,
            l: 100,
        },
        biped: {
            s: 100,
            l: 100,
        },
        spider: {
            s: 100,
            l: 100,
        },
        tread: {
            s: 100,
            l: 100,
        },
        quad: {
            s: 100,
            l: 100,
        },
        hover: {
            s: 100,
            l: 100,
        },
    },
} as const;

// (() => {
// 	const tt = [...document.querySelectorAll('.infoBox > h3#hazard ~ .infoBox')].map(box => {
//     return {
// 				title: box.querySelector("h4").innerText,
// 				values: [...box.querySelectorAll(".para")].map(para => para.innerHTML)
//     }
// 	});
// 	const result = {};
// 	for (const o of tt) {
// 		result[o.title] = o.values
// 	}
// 	return result;
// })()
const hazards = {
    freeze: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">75%</span>.</span>',
        '<span>Countered by <span class="has-text-warning">Radiator</span>.</span>',
    ],
    hot: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">75%</span>.</span>',
        '<span>Countered by <span class="has-text-warning">Coolant</span>.</span>',
    ],
    corrosive: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">75%</span>.</span>',
        '<span>Countered by <span class="has-text-warning">Ablative Armor</span>.</span>',
        '<span>Partly Countered by <span class="has-text-warning">Shields</span></span>',
    ],
    humid: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">25%</span>.</span>',
        '<span>Countered by <span class="has-text-warning">Rubber Seals</span>.</span>',
    ],
    windy: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">50%</span> if using <span class="has-text-warning">Hover</span> mech.</span>',
    ],
    hilly: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">25%</span> if not using <span class="has-text-warning">Spider</span> mech.</span>',
    ],
    mountain: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">50%</span> if not using <span class="has-text-warning">Spider</span> mech or <span class="has-text-warning">Grapple Hook</span>.</span>',
        '<span>Partly Countered by <span class="has-text-warning">Flares</span></span>',
    ],
    radioactive: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">50%</span>.</span>',
        '<span>Countered by <span class="has-text-warning">Shields</span>.</span>',
    ],
    tremors: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">75%</span>.</span>',
        '<span>Countered by <span class="has-text-warning">Stabilizer</span>.</span>',
    ],
    dust: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">50%</span>.</span>',
        '<span>Countered by <span class="has-text-warning">Rubber Seals</span>.</span>',
    ],
    river: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">50%</span> if not using <span class="has-text-warning">Hover</span> mech.</span>',
    ],
    tar: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">25%</span> if not using <span class="has-text-warning">Quad</span> mech.</span>',
        '<span>Mech effectiveness reduced by <span class="has-text-warning">50%</span> if using <span class="has-text-warning">Tread</span> or <span class="has-text-warning">Wheel</span> mech.</span>',
    ],
    steam: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">25%</span>.</span>',
        '<span>Countered by <span class="has-text-warning">Shields</span>.</span>',
    ],
    flooded: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">65%</span> if not using <span class="has-text-warning">Hover</span> mech.</span>',
    ],
    foggy: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">80%</span>.</span>',
        '<span>Countered by <span class="has-text-warning">Sonar</span>.</span>',
    ],
    rain: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">25%</span>.</span>',
        '<span>Countered by <span class="has-text-warning">Rubber Seals</span>.</span>',
    ],
    hail: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">25%</span> if not using <span class="has-text-warning">Ablative Armor</span> or <span class="has-text-warning">Shields</span>.</span>',
    ],
    chasm: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">90%</span>.</span>',
        '<span>Countered by <span class="has-text-warning">Grapple Hook</span>.</span>',
    ],
    dark: [
        '<span>Mech effectiveness reduced by <span class="has-text-warning">90%</span>.</span>',
        '<span>Countered by <span class="has-text-warning">Infrared</span>.</span>',
        '<span>Partly Countered by <span class="has-text-warning">Flares</span></span>',
    ],
    gravity: [
        '<span><span class="has-text-warning">Standard</span> mech effectiveness reduced by <span class="has-text-warning">20%</span>.</span>',
        '<span><span class="has-text-warning">Heavy</span> mech effectiveness reduced by <span class="has-text-warning">55%</span>.</span>',
        '<span><span class="has-text-warning">Titan</span> mech effectiveness reduced by <span class="has-text-warning">75%</span>.</span>',
    ],
} as const;

function get_available_weapons() {
    const standard_weapons = ['laser', 'flame', 'plasma', 'kinetic', 'missile', 'sonic', 'shotgun', 'tesla'];
    const warlord_weapons = [
        'claws',
        'venom',
        'cold',
        'shock',
        'fire',
        'acid',
        'stone',
        'iron',
        'flesh',
        'ice',
        'magma',
        'axe',
        'hammer',
    ];

    return GLOBALS.GAME.global.race['warlord'] ? [...standard_weapons, ...warlord_weapons] : standard_weapons;
}

const monsters = {
    fire_elm: {
        weapon: {
            laser: 1.05,
            flame: 0,
            plasma: 0.25,
            kinetic: 0.5,
            missile: 0.5,
            sonic: 1,
            shotgun: 0.75,
            tesla: 0.65,
            claws: 0.5,
            venom: 0.62,
            cold: 1.25,
            shock: 0.68,
            fire: 0,
            acid: 0.25,
            stone: 0.5,
            iron: 0.5,
            flesh: 0.3,
            ice: 1.12,
            magma: 0,
            axe: 0.5,
            hammer: 0.5,
        },
        nozone: {
            freeze: true,
            flooded: true,
        },
        amp: {
            hot: 1.75,
            humid: 0.8,
            steam: 0.9,
        },
    },
    water_elm: {
        weapon: {
            laser: 0.65,
            flame: 0.5,
            plasma: 1,
            kinetic: 0.2,
            missile: 0.5,
            sonic: 0.5,
            shotgun: 0.25,
            tesla: 0.75,
            claws: 0.4,
            venom: 0.8,
            cold: 1.1,
            shock: 0.68,
            fire: 0.8,
            acid: 0.25,
            stone: 0.4,
            iron: 0.3,
            flesh: 0.5,
            ice: 1.1,
            magma: 0.75,
            axe: 0.45,
            hammer: 0.45,
        },
        nozone: {
            hot: true,
            freeze: true,
        },
        amp: {
            steam: 1.5,
            river: 1.1,
            flooded: 2,
            rain: 1.75,
            humid: 1.25,
        },
    },
    rock_golem: {
        weapon: {
            laser: 1,
            flame: 0.5,
            plasma: 1,
            kinetic: 0.65,
            missile: 0.95,
            sonic: 0.75,
            shotgun: 0.35,
            tesla: 0,
            claws: 0.7,
            venom: 0.25,
            cold: 0.35,
            shock: 0,
            fire: 0.9,
            acid: 1,
            stone: 0.5,
            iron: 0.65,
            flesh: 0.3,
            ice: 0.3,
            magma: 0.9,
            axe: 0.2,
            hammer: 1,
        },
        nozone: {},
        amp: {},
    },
    bone_golem: {
        weapon: {
            laser: 0.45,
            flame: 0.35,
            plasma: 0.55,
            kinetic: 1,
            missile: 1,
            sonic: 0.75,
            shotgun: 0.75,
            tesla: 0.15,
            claws: 0.75,
            venom: 0,
            cold: 0.2,
            shock: 0.15,
            fire: 0.4,
            acid: 0.85,
            stone: 0.9,
            iron: 1,
            flesh: 0.15,
            ice: 0.3,
            magma: 0.9,
            axe: 0.65,
            hammer: 1.2,
        },
        nozone: {},
        amp: {},
    },
    mech_dino: {
        weapon: {
            laser: 0.85,
            flame: 0.05,
            plasma: 0.55,
            kinetic: 0.45,
            missile: 0.5,
            sonic: 0.35,
            shotgun: 0.5,
            tesla: 1,
            claws: 0.38,
            venom: 0.1,
            cold: 0.5,
            shock: 1.1,
            fire: 0.5,
            acid: 0.75,
            stone: 0.5,
            iron: 0.5,
            flesh: 0.15,
            ice: 0.3,
            magma: 0.9,
            axe: 0.6,
            hammer: 0.4,
        },
        nozone: {},
        amp: {},
    },
    plant: {
        weapon: {
            laser: 0.42,
            flame: 1,
            plasma: 0.65,
            kinetic: 0.2,
            missile: 0.25,
            sonic: 0.75,
            shotgun: 0.35,
            tesla: 0.38,
            claws: 0.25,
            venom: 0.25,
            cold: 0.65,
            shock: 0.28,
            fire: 1,
            acid: 0.45,
            stone: 0.6,
            iron: 0.5,
            flesh: 0.5,
            ice: 0.55,
            magma: 1,
            axe: 0.25,
            hammer: 0.15,
        },
        nozone: {},
        amp: {},
    },
    crazed: {
        weapon: {
            laser: 0.5,
            flame: 0.85,
            plasma: 0.65,
            kinetic: 1,
            missile: 0.35,
            sonic: 0.15,
            shotgun: 0.95,
            tesla: 0.6,
            claws: 1,
            venom: 0.5,
            cold: 0.5,
            shock: 0.75,
            fire: 0.5,
            acid: 0.5,
            stone: 0.7,
            iron: 0.8,
            flesh: 0.9,
            ice: 0.4,
            magma: 0.5,
            axe: 1,
            hammer: 0.75,
        },
        nozone: {},
        amp: {},
    },
    minotaur: {
        weapon: {
            laser: 0.32,
            flame: 0.5,
            plasma: 0.82,
            kinetic: 0.44,
            missile: 1,
            sonic: 0.15,
            shotgun: 0.2,
            tesla: 0.35,
            claws: 0.6,
            venom: 1.1,
            cold: 0.5,
            shock: 0.3,
            fire: 0.5,
            acid: 1,
            stone: 0.6,
            iron: 0.9,
            flesh: 0.3,
            ice: 0.4,
            magma: 0.55,
            axe: 0.75,
            hammer: 0.6,
        },
        nozone: {},
        amp: {},
    },
    ooze: {
        weapon: {
            laser: 0.2,
            flame: 0.65,
            plasma: 1,
            kinetic: 0,
            missile: 0,
            sonic: 0.85,
            shotgun: 0,
            tesla: 0.15,
            claws: 0,
            venom: 0.15,
            cold: 1.5,
            shock: 0.2,
            fire: 0.6,
            acid: 0.5,
            stone: 0,
            iron: 0,
            flesh: 0,
            ice: 1.25,
            magma: 0.7,
            axe: 0,
            hammer: 0,
        },
        nozone: {},
        amp: {},
    },
    zombie: {
        weapon: {
            laser: 0.35,
            flame: 1,
            plasma: 0.45,
            kinetic: 0.08,
            missile: 0.8,
            sonic: 0.18,
            shotgun: 0.95,
            tesla: 0.05,
            claws: 0.85,
            venom: 0,
            cold: 0.2,
            shock: 0.35,
            fire: 0.95,
            acid: 0.5,
            stone: 0.5,
            iron: 0.5,
            flesh: 0.35,
            ice: 0.25,
            magma: 0.9,
            axe: 1,
            hammer: 0.5,
        },
        nozone: {},
        amp: {},
    },
    raptor: {
        weapon: {
            laser: 0.68,
            flame: 0.55,
            plasma: 0.85,
            kinetic: 1,
            missile: 0.44,
            sonic: 0.22,
            shotgun: 0.33,
            tesla: 0.66,
            claws: 0.85,
            venom: 0.5,
            cold: 0.5,
            shock: 0.88,
            fire: 0.6,
            acid: 0.6,
            stone: 1,
            iron: 0.85,
            flesh: 0.45,
            ice: 0.5,
            magma: 0.65,
            axe: 0.9,
            hammer: 0.6,
        },
        nozone: {},
        amp: {},
    },
    frost_giant: {
        weapon: {
            laser: 0.9,
            flame: 0.82,
            plasma: 1,
            kinetic: 0.25,
            missile: 0.08,
            sonic: 0.45,
            shotgun: 0.28,
            tesla: 0.5,
            claws: 0.35,
            venom: 0.15,
            cold: 0,
            shock: 0.6,
            fire: 1.2,
            acid: 0.5,
            stone: 0.35,
            iron: 1,
            flesh: 0.3,
            ice: 0,
            magma: 1.1,
            axe: 0.5,
            hammer: 1,
        },
        nozone: {
            hot: true,
        },
        amp: {
            freeze: 2.5,
            hail: 1.65,
        },
    },
    swarm: {
        weapon: {
            laser: 0.02,
            flame: 1,
            plasma: 0.04,
            kinetic: 0.01,
            missile: 0.08,
            sonic: 0.66,
            shotgun: 0.38,
            tesla: 0.45,
            claws: 0.05,
            venom: 0.01,
            cold: 0.8,
            shock: 0.75,
            fire: 0.8,
            acid: 0.75,
            stone: 0.03,
            iron: 0.03,
            flesh: 0.03,
            ice: 0.3,
            magma: 0.5,
            axe: 0.01,
            hammer: 0.05,
        },
        nozone: {},
        amp: {},
    },
    dragon: {
        weapon: {
            laser: 0.18,
            flame: 0,
            plasma: 0.12,
            kinetic: 0.35,
            missile: 1,
            sonic: 0.22,
            shotgun: 0.65,
            tesla: 0.15,
            claws: 0.38,
            venom: 0.88,
            cold: 0.8,
            shock: 0.35,
            fire: 0,
            acid: 0.85,
            stone: 0.03,
            iron: 0.03,
            flesh: 0.03,
            ice: 0.3,
            magma: 0,
            axe: 0.4,
            hammer: 0.55,
        },
        nozone: {},
        amp: {},
    },
    mech_dragon: {
        weapon: {
            laser: 0.84,
            flame: 0.1,
            plasma: 0.68,
            kinetic: 0.18,
            missile: 0.75,
            sonic: 0.22,
            shotgun: 0.28,
            tesla: 1,
            claws: 0.28,
            venom: 0,
            cold: 0.35,
            shock: 1,
            fire: 0.15,
            acid: 0.72,
            stone: 0.5,
            iron: 0.5,
            flesh: 0.5,
            ice: 0.2,
            magma: 0.15,
            axe: 0.25,
            hammer: 0.8,
        },
        nozone: {},
        amp: {},
    },
    construct: {
        weapon: {
            laser: 0.5,
            flame: 0.2,
            plasma: 0.6,
            kinetic: 0.34,
            missile: 0.9,
            sonic: 0.08,
            shotgun: 0.28,
            tesla: 1,
            claws: 0.28,
            venom: 0,
            cold: 0.45,
            shock: 1.1,
            fire: 0.22,
            acid: 0.68,
            stone: 0.55,
            iron: 0.55,
            flesh: 0.4,
            ice: 0.4,
            magma: 0.18,
            axe: 0.42,
            hammer: 0.95,
        },
        nozone: {},
        amp: {},
    },
    beholder: {
        weapon: {
            laser: 0.75,
            flame: 0.15,
            plasma: 1,
            kinetic: 0.45,
            missile: 0.05,
            sonic: 0.01,
            shotgun: 0.12,
            tesla: 0.3,
            claws: 0.48,
            venom: 0.9,
            cold: 0.88,
            shock: 0.24,
            fire: 0.18,
            acid: 0.9,
            stone: 0.72,
            iron: 0.45,
            flesh: 0.85,
            ice: 0.92,
            magma: 0.16,
            axe: 0.44,
            hammer: 0.08,
        },
        nozone: {},
        amp: {},
    },
    worm: {
        weapon: {
            laser: 0.55,
            flame: 0.38,
            plasma: 0.45,
            kinetic: 0.2,
            missile: 0.05,
            sonic: 1,
            shotgun: 0.02,
            tesla: 0.01,
            claws: 0.18,
            venom: 0.65,
            cold: 1,
            shock: 0.02,
            fire: 0.38,
            acid: 0.48,
            stone: 0.22,
            iron: 0.24,
            flesh: 0.35,
            ice: 1,
            magma: 0.4,
            axe: 0.15,
            hammer: 0.05,
        },
        nozone: {},
        amp: {},
    },
    hydra: {
        weapon: {
            laser: 0.85,
            flame: 0.75,
            plasma: 0.85,
            kinetic: 0.25,
            missile: 0.45,
            sonic: 0.5,
            shotgun: 0.6,
            tesla: 0.65,
            claws: 0.3,
            venom: 0.65,
            cold: 0.55,
            shock: 0.65,
            fire: 0.75,
            acid: 0.85,
            stone: 0.25,
            iron: 0.15,
            flesh: 0.2,
            ice: 0.55,
            magma: 0.75,
            axe: 0.45,
            hammer: 0.65,
        },
        nozone: {},
        amp: {},
    },
    colossus: {
        weapon: {
            laser: 1,
            flame: 0.05,
            plasma: 0.75,
            kinetic: 0.45,
            missile: 1,
            sonic: 0.35,
            shotgun: 0.35,
            tesla: 0.5,
            claws: 0.48,
            venom: 0.22,
            cold: 0.25,
            shock: 0.65,
            fire: 0.15,
            acid: 0.95,
            stone: 0.55,
            iron: 0.95,
            flesh: 0.25,
            ice: 0.35,
            magma: 0.2,
            axe: 0.55,
            hammer: 0.35,
        },
        nozone: {},
        amp: {},
    },
    lich: {
        weapon: {
            laser: 0.1,
            flame: 0.1,
            plasma: 0.1,
            kinetic: 0.45,
            missile: 0.75,
            sonic: 0.35,
            shotgun: 0.75,
            tesla: 0.5,
            claws: 0.4,
            venom: 0.01,
            cold: 0.1,
            shock: 0.5,
            fire: 0.1,
            acid: 0.1,
            stone: 0.35,
            iron: 0.25,
            flesh: 0.95,
            ice: 0.1,
            magma: 0.1,
            axe: 0.4,
            hammer: 1,
        },
        nozone: {},
        amp: {},
    },
    ape: {
        weapon: {
            laser: 1,
            flame: 0.95,
            plasma: 0.85,
            kinetic: 0.5,
            missile: 0.5,
            sonic: 0.05,
            shotgun: 0.35,
            tesla: 0.68,
            claws: 0.65,
            venom: 0.95,
            cold: 0.5,
            shock: 0.5,
            fire: 0.75,
            acid: 0.65,
            stone: 0.5,
            iron: 0.5,
            flesh: 0.5,
            ice: 0.5,
            magma: 0.75,
            axe: 0.65,
            hammer: 0.5,
        },
        nozone: {},
        amp: {},
    },
    bandit: {
        weapon: {
            laser: 0.65,
            flame: 0.5,
            plasma: 0.85,
            kinetic: 1,
            missile: 0.5,
            sonic: 0.25,
            shotgun: 0.75,
            tesla: 0.25,
            claws: 1,
            venom: 0.15,
            cold: 0.5,
            shock: 0.25,
            fire: 0.5,
            acid: 0.5,
            stone: 0.5,
            iron: 0.8,
            flesh: 0.5,
            ice: 0.5,
            magma: 0.5,
            axe: 1,
            hammer: 0.5,
        },
        nozone: {},
        amp: {},
    },
    croc: {
        weapon: {
            laser: 0.65,
            flame: 0.05,
            plasma: 0.6,
            kinetic: 0.5,
            missile: 0.5,
            sonic: 1,
            shotgun: 0.2,
            tesla: 0.75,
            claws: 1,
            venom: 0.5,
            cold: 1,
            shock: 0.75,
            fire: 0.05,
            acid: 0.08,
            stone: 0.6,
            iron: 0.5,
            flesh: 0.25,
            ice: 0.95,
            magma: 0.05,
            axe: 0.75,
            hammer: 0.5,
        },
        nozone: {},
        amp: {},
    },
    djinni: {
        weapon: {
            laser: 0,
            flame: 0.35,
            plasma: 1,
            kinetic: 0.15,
            missile: 0,
            sonic: 0.65,
            shotgun: 0.22,
            tesla: 0.4,
            claws: 0.18,
            venom: 0.12,
            cold: 0.9,
            shock: 0.45,
            fire: 0.3,
            acid: 0.1,
            stone: 0.2,
            iron: 0.95,
            flesh: 0.2,
            ice: 0.9,
            magma: 0.3,
            axe: 0.12,
            hammer: 0,
        },
        nozone: {},
        amp: {},
    },
    snake: {
        weapon: {
            laser: 0.5,
            flame: 0.5,
            plasma: 0.5,
            kinetic: 0.5,
            missile: 0.5,
            sonic: 0.5,
            shotgun: 0.5,
            tesla: 0.5,
            claws: 0.5,
            venom: 0.02,
            cold: 0.75,
            shock: 0.5,
            fire: 0.5,
            acid: 0.5,
            stone: 0.5,
            iron: 0.5,
            flesh: 0.5,
            ice: 0.75,
            magma: 0.5,
            axe: 0.5,
            hammer: 0.5,
        },
        nozone: {},
        amp: {},
    },
    centipede: {
        weapon: {
            laser: 0.5,
            flame: 0.85,
            plasma: 0.95,
            kinetic: 0.65,
            missile: 0.6,
            sonic: 0,
            shotgun: 0.5,
            tesla: 0.01,
            claws: 0.65,
            venom: 0.01,
            cold: 0,
            shock: 0.01,
            fire: 0.88,
            acid: 0.95,
            stone: 0.6,
            iron: 0.45,
            flesh: 0.55,
            ice: 0,
            magma: 0.88,
            axe: 0.7,
            hammer: 0.4,
        },
        nozone: {},
        amp: {},
    },
    spider: {
        weapon: {
            laser: 0.65,
            flame: 1,
            plasma: 0.22,
            kinetic: 0.75,
            missile: 0.15,
            sonic: 0.38,
            shotgun: 0.9,
            tesla: 0.18,
            claws: 0.12,
            venom: 0.05,
            cold: 0.5,
            shock: 0.32,
            fire: 1,
            acid: 0.65,
            stone: 0.8,
            iron: 0.5,
            flesh: 0.5,
            ice: 0.5,
            magma: 1,
            axe: 0.18,
            hammer: 0.75,
        },
        nozone: {},
        amp: {},
    },
    manticore: {
        weapon: {
            laser: 0.05,
            flame: 0.25,
            plasma: 0.95,
            kinetic: 0.5,
            missile: 0.15,
            sonic: 0.48,
            shotgun: 0.4,
            tesla: 0.6,
            claws: 0.5,
            venom: 0.5,
            cold: 0.8,
            shock: 0.75,
            fire: 0.15,
            acid: 0.95,
            stone: 0.25,
            iron: 0.5,
            flesh: 0.8,
            ice: 0.8,
            magma: 0.15,
            axe: 0.5,
            hammer: 0.25,
        },
        nozone: {},
        amp: {},
    },
    fiend: {
        weapon: {
            laser: 0.75,
            flame: 0.25,
            plasma: 0.5,
            kinetic: 0.25,
            missile: 0.75,
            sonic: 0.25,
            shotgun: 0.5,
            tesla: 0.5,
            claws: 0.65,
            venom: 0.1,
            cold: 0.65,
            shock: 0.5,
            fire: 0.2,
            acid: 0.5,
            stone: 0.25,
            iron: 0.75,
            flesh: 1,
            ice: 0.65,
            magma: 0.2,
            axe: 0.75,
            hammer: 0.25,
        },
        nozone: {},
        amp: {},
    },
    bat: {
        weapon: {
            laser: 0.16,
            flame: 0.18,
            plasma: 0.12,
            kinetic: 0.25,
            missile: 0.02,
            sonic: 1,
            shotgun: 0.9,
            tesla: 0.58,
            claws: 0.1,
            venom: 0.1,
            cold: 0.8,
            shock: 0.65,
            fire: 0.15,
            acid: 0.5,
            stone: 0.1,
            iron: 0.1,
            flesh: 0.5,
            ice: 0.8,
            magma: 0.2,
            axe: 0.1,
            hammer: 0.1,
        },
        nozone: {},
        amp: {},
    },
    medusa: {
        weapon: {
            laser: 0.35,
            flame: 0.1,
            plasma: 0.3,
            kinetic: 0.95,
            missile: 1,
            sonic: 0.15,
            shotgun: 0.88,
            tesla: 0.26,
            claws: 0.42,
            venom: 0.3,
            cold: 0.48,
            shock: 0.28,
            fire: 0.1,
            acid: 0.85,
            stone: 1,
            iron: 0.25,
            flesh: 0.75,
            ice: 0.52,
            magma: 0.12,
            axe: 0.34,
            hammer: 1,
        },
        nozone: {},
        amp: {},
    },
    ettin: {
        weapon: {
            laser: 0.5,
            flame: 0.35,
            plasma: 0.8,
            kinetic: 0.5,
            missile: 0.25,
            sonic: 0.3,
            shotgun: 0.6,
            tesla: 0.09,
            claws: 0.5,
            venom: 0.95,
            cold: 0.3,
            shock: 0.8,
            fire: 0.38,
            acid: 0.9,
            stone: 0.6,
            iron: 0.75,
            flesh: 0.4,
            ice: 0.28,
            magma: 0.32,
            axe: 0.45,
            hammer: 0.25,
        },
        nozone: {},
        amp: {},
    },
    faceless: {
        weapon: {
            laser: 0.6,
            flame: 0.28,
            plasma: 0.6,
            kinetic: 0,
            missile: 0.05,
            sonic: 0.8,
            shotgun: 0.15,
            tesla: 1,
            claws: 0.02,
            venom: 0.01,
            cold: 0,
            shock: 1,
            fire: 0.25,
            acid: 0.55,
            stone: 0.15,
            iron: 0.15,
            flesh: 0.95,
            ice: 0,
            magma: 0.25,
            axe: 0.01,
            hammer: 0.05,
        },
        nozone: {},
        amp: {},
    },
    enchanted: {
        weapon: {
            laser: 1,
            flame: 0.02,
            plasma: 0.95,
            kinetic: 0.2,
            missile: 0.7,
            sonic: 0.05,
            shotgun: 0.65,
            tesla: 0.01,
            claws: 0.1,
            venom: 0,
            cold: 0.5,
            shock: 0.01,
            fire: 0.02,
            acid: 1,
            stone: 0.25,
            iron: 0.75,
            flesh: 0.1,
            ice: 0.5,
            magma: 0.03,
            axe: 0.1,
            hammer: 0.5,
        },
        nozone: {},
        amp: {},
    },
    gargoyle: {
        weapon: {
            laser: 0.15,
            flame: 0.4,
            plasma: 0.3,
            kinetic: 0.5,
            missile: 0.5,
            sonic: 0.85,
            shotgun: 1,
            tesla: 0.2,
            claws: 0.45,
            venom: 0.05,
            cold: 0.15,
            shock: 0.08,
            fire: 0.38,
            acid: 0.85,
            stone: 1,
            iron: 0.85,
            flesh: 0.25,
            ice: 0.15,
            magma: 0.35,
            axe: 0.42,
            hammer: 1,
        },
        nozone: {},
        amp: {},
    },
    chimera: {
        weapon: {
            laser: 0.38,
            flame: 0.6,
            plasma: 0.42,
            kinetic: 0.85,
            missile: 0.35,
            sonic: 0.5,
            shotgun: 0.65,
            tesla: 0.8,
            claws: 0.92,
            venom: 0.5,
            cold: 0.45,
            shock: 0.8,
            fire: 0.56,
            acid: 0.4,
            stone: 0.5,
            iron: 0.5,
            flesh: 0.5,
            ice: 0.48,
            magma: 0.54,
            axe: 0.88,
            hammer: 0.42,
        },
        nozone: {},
        amp: {},
    },
    gorgon: {
        weapon: {
            laser: 0.65,
            flame: 0.65,
            plasma: 0.64,
            kinetic: 0.65,
            missile: 0.66,
            sonic: 0.65,
            shotgun: 0.65,
            tesla: 0.65,
            claws: 0.65,
            venom: 0.65,
            cold: 0.65,
            shock: 0.65,
            fire: 0.65,
            acid: 0.65,
            stone: 0.65,
            iron: 0.65,
            flesh: 0.65,
            ice: 0.65,
            magma: 0.65,
            axe: 0.65,
            hammer: 0.65,
        },
        nozone: {},
        amp: {},
    },
    kraken: {
        weapon: {
            laser: 0.75,
            flame: 0.35,
            plasma: 0.75,
            kinetic: 0.35,
            missile: 0.5,
            sonic: 0.18,
            shotgun: 0.05,
            tesla: 0.85,
            claws: 0.32,
            venom: 0.8,
            cold: 0.66,
            shock: 0.82,
            fire: 0.33,
            acid: 0.75,
            stone: 0.45,
            iron: 0.35,
            flesh: 0.4,
            ice: 0.66,
            magma: 0.33,
            axe: 0.36,
            hammer: 0.5,
        },
        nozone: {},
        amp: {},
    },
    homunculus: {
        weapon: {
            laser: 0.05,
            flame: 1,
            plasma: 0.1,
            kinetic: 0.85,
            missile: 0.65,
            sonic: 0.5,
            shotgun: 0.75,
            tesla: 0.2,
            claws: 0.85,
            venom: 0.4,
            cold: 0.12,
            shock: 0.22,
            fire: 1,
            acid: 0.13,
            stone: 0.65,
            iron: 0.68,
            flesh: 0.95,
            ice: 0.18,
            magma: 0.9,
            axe: 0.85,
            hammer: 0.65,
        },
        nozone: {},
        amp: {},
    },
    giant_chicken: {
        weapon: {
            laser: 0.95,
            flame: 0.95,
            plasma: 0.95,
            kinetic: 0.95,
            missile: 0.95,
            sonic: 0.95,
            shotgun: 0.95,
            tesla: 0.95,
            claws: 0.95,
            venom: 0.96,
            cold: 0.95,
            shock: 0.95,
            fire: 0.95,
            acid: 0.95,
            stone: 0.95,
            iron: 0.95,
            flesh: 0.94,
            ice: 0.95,
            magma: 0.95,
            axe: 0.95,
            hammer: 0.95,
        },
        nozone: {},
        amp: {},
    },
    skeleton_pack: {
        weapon: {
            laser: 0.5,
            flame: 0.1,
            plasma: 0.5,
            kinetic: 1,
            missile: 1.2,
            sonic: 0.5,
            shotgun: 1.05,
            tesla: 0.2,
            claws: 0.65,
            venom: 0,
            cold: 0.11,
            shock: 0.22,
            fire: 0.1,
            acid: 0.5,
            stone: 1,
            iron: 0.65,
            flesh: 0.25,
            ice: 0.1,
            magma: 0.12,
            axe: 0.15,
            hammer: 1.08,
        },
        nozone: {},
        amp: {},
    },
};

// -------------------------------------------------------------------------------------------------------------

function get_active_spire_debuffs() {
    return Object.entries(GLOBALS.GAME.global.portal.spire.status)
        .filter(([_, value]) => value)
        .map(([key, _]) => {
            const hazard = GLOBALS.LOC(`portal_spire_status_${key}`);
            const text = hazards[key as keyof typeof hazards];

            if (!text) {
                toast.error(`No hazard with key '${key}' exists.`);
                console.error(`No hazard with key '${key}' exists.`);
                return {
                    title: hazard,
                    text: ['<span>ERROR</span>'],
                };
            }

            return {
                title: hazard,
                text: text,
            };
        });
}

function colored_percent(percent: number) {
    const color_class = percent >= 100 ? 'has-text-success' : 'has-text-danger';

    return `<span class='${color_class}'>${percent.toFixed(0)}%</span>`;
}

function create_html_table(title: string) {
    const container_el = $(`
        <div style="border: .0625rem solid; padding: .25rem .5rem; max-width: 50rem;">
            <p style="margin-bottom: 8px;" class="has-text-caution">${title}</p>
        </div>
    `);

    const table_el = $(`
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
        </div>
    `);

    container_el.append(table_el);

    const add_cell = (cell: string) => table_el.append(cell);

    return { el: container_el, add_cell };
}

// -------------------------------------------------------------------------------------------------------------

function create_spire_biome_info_table() {
    // Spire Floor Biome Table
    const current_biome_type = GLOBALS.GAME.global.portal.spire
        .type as keyof typeof terrain_mech_movement_effectiveness;
    const current_biome = terrain_mech_movement_effectiveness[current_biome_type];

    const { el: spire_biome_el, add_cell: add_biome_cell } = create_html_table(capitalize(current_biome_type));
    for (const mech_type of Object.keys(current_biome) as (keyof typeof current_biome)[]) {
        const biome = current_biome[mech_type];

        // add_biome_cell(
        //     `<p style="margin: 0;"><span class="has-text-warning">${capitalize(mech_type)}</span> mech effectiveness: <span class="has-text-info">S</span> ${colored_percent(biome.s)}, <span class="has-text-info">L</span> ${colored_percent(biome.l)}</p>`
        // );

        add_biome_cell(
            `<p style="margin: 0;"><span class="has-text-warning">${capitalize(mech_type)}</span>: <span class="has-text-info">S</span> ${colored_percent(biome.s)}, <span class="has-text-info">L</span> ${colored_percent(biome.l)}</p>`
        );
    }

    return spire_biome_el;
}

function create_spire_boss_info_table() {
    const loc = GLOBALS.LOC;

    const monster_name = GLOBALS.GAME.global.portal.spire.boss;
    const monster = monsters[monster_name as keyof typeof monsters];

    const { el: spire_boss_el, add_cell: add_boss_cell } = create_html_table(loc(`portal_mech_boss_${monster_name}`));

    const available_weapon_list = get_available_weapons();
    for (const [weapon, value] of Object.entries(monster.weapon)) {
        if (!available_weapon_list.includes(weapon)) continue;

        // add_boss_cell(
        //     `<p style="margin: 0;"><span class="has-text-warning">${loc(`portal_mech_weapon_${weapon}`)}</span> effectiveness: ${colored_percent(value * 100)}</p>`
        // );

        add_boss_cell(
            `<p style="margin: 0;"><span class="has-text-warning">${loc(`portal_mech_weapon_${weapon}`)}</span>: ${colored_percent(value * 100)}</p>`
        );
    }

    return spire_boss_el;
}

function create_spire_hazards_info_el() {
    // Get the debuffs
    const spire_hazards_el = $(`
        <div style="display: flex; flex-direction: column; gap: 4px;">
        </div>
    `);

    for (const active_hazard of get_active_spire_debuffs()) {
        const hazard_el = $(`
            <div style="border: .0625rem solid; padding: .25rem .5rem; display: flex; flex-direction: column; gap: 4px;">
                <p style="margin: 0px;" class="has-text-caution">${capitalize(active_hazard.title)}</p>
            </div>
        `);

        for (const hazard_html of active_hazard.text) {
            hazard_el.append(`<p style="margin: 0;">${hazard_html}</p>`);
        }

        spire_hazards_el.append(hazard_el);
    }

    return spire_hazards_el;
}

function create_spire_clear_time_counter_el() {
    const get_cleared_in = () => `Cleared in: ${GLOBALS.GAME.global.portal.spire.time}`;

    const counter_el = $(`<span id="custom_counter">${get_cleared_in()}<span/>`);
    const update_counter = () => {
        counter_el.text(get_cleared_in());
    };

    const interval = setInterval(update_counter, 500);
    const cleanup = () => clearInterval(interval);

    return { el: counter_el, cleanup };
}

// -------------------------------------------------------------------------------------------------------------

export function on_tab_load_mech_lab() {
    const spire_biome_el = create_spire_biome_info_table();
    const spire_boss_el = create_spire_boss_info_table();
    const spire_hazards_el = create_spire_hazards_info_el();
    const { el: spire_clear_counter_el, cleanup: spire_clear_counter_cleanup } = create_spire_clear_time_counter_el();

    const custom_els_wrapper = $(
        '<div style="display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 8px;"></div>'
    );

    const essentials_el = $('<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;"></div>');
    essentials_el.append(spire_biome_el);
    essentials_el.append(spire_boss_el);

    // custom_els_wrapper.append(spire_biome_el);
    // custom_els_wrapper.append(spire_boss_el);
    custom_els_wrapper.append(essentials_el);
    custom_els_wrapper.append(spire_hazards_el);
    custom_els_wrapper.append(spire_clear_counter_el);

    $('#mechAssembly').prepend(custom_els_wrapper);

    return () => {
        spire_clear_counter_cleanup();
    };
}
