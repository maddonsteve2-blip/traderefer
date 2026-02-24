// Location data: state → city → suburbs
// Currently only Geelong, VIC is enabled. As we expand, add more cities/states here.

export interface LocationData {
    states: StateData[];
}

export interface StateData {
    code: string;
    name: string;
    cities: CityData[];
}

export interface CityData {
    name: string;
    suburbs: string[];
}

export const LOCATIONS: LocationData = {
    states: [
        {
            code: "VIC",
            name: "Victoria",
            cities: [
                {
                    name: "Geelong",
                    suburbs: [
                        "Anakie",
                        "Armstrong Creek",
                        "Avalon",
                        "Balliang",
                        "Bannockburn",
                        "Barwon Heads",
                        "Batesford",
                        "Bell Park",
                        "Bell Post Hill",
                        "Bellarine",
                        "Belmont",
                        "Breakwater",
                        "Breamlea",
                        "Ceres",
                        "Charlemont",
                        "Clifton Springs",
                        "Connewarre",
                        "Corio",
                        "Curlewis",
                        "Drumcondra",
                        "Drysdale",
                        "East Geelong",
                        "Fyansford",
                        "Geelong",
                        "Geelong West",
                        "Grovedale",
                        "Hamlyn Heights",
                        "Herne Hill",
                        "Highton",
                        "Indented Head",
                        "Lara",
                        "Leopold",
                        "Little River",
                        "Lovely Banks",
                        "Manifold Heights",
                        "Mannerim",
                        "Marcus Hill",
                        "Marshall",
                        "Moolap",
                        "Mount Duneed",
                        "Newcomb",
                        "Newtown",
                        "Norlane",
                        "North Geelong",
                        "North Shore",
                        "Ocean Grove",
                        "Point Lonsdale",
                        "Point Wilson",
                        "Portarlington",
                        "Rippleside",
                        "St Albans Park",
                        "St Leonards",
                        "South Geelong",
                        "Staughton Vale",
                        "Stonehaven",
                        "Swan Bay",
                        "Thomson",
                        "Wallington",
                        "Wandana Heights",
                        "Waurn Ponds",
                        "Whittington",
                    ].sort(),
                },
                // Future: Add Melbourne suburbs here
                // { name: "Melbourne", suburbs: [...] },
            ],
        },
        // Future: Add more states here
        // { code: "NSW", name: "New South Wales", cities: [...] },
        // { code: "QLD", name: "Queensland", cities: [...] },
    ],
};

// Helper: get the default (and currently only) active state/city
export const DEFAULT_STATE = LOCATIONS.states[0];
export const DEFAULT_CITY = DEFAULT_STATE.cities[0];

// Helper: get all suburbs for the current active city (Geelong)
export function getSuburbs(): string[] {
    return DEFAULT_CITY.suburbs;
}

// Helper: get all suburbs across all cities in a state
export function getSuburbsForState(stateCode: string): string[] {
    const state = LOCATIONS.states.find(s => s.code === stateCode);
    if (!state) return [];
    return state.cities.flatMap(c => c.suburbs).sort();
}

// Helper: find which city a suburb belongs to
export function getCityForSuburb(suburb: string): { state: string; city: string } | null {
    for (const state of LOCATIONS.states) {
        for (const city of state.cities) {
            if (city.suburbs.includes(suburb)) {
                return { state: state.code, city: city.name };
            }
        }
    }
    return null;
}
