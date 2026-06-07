export const SARAKT_STAR_POSITION: [number, number, number] = [1.6, 0, 1.6];

/** Default orbit pose — camera and controls bias toward Phase 1 hero planet */
export const SARAKT_PRIME_ORBIT_RADIUS = 0.8;
export const SARAKT_PRIME_FOCUS_POSITION: [number, number, number] = [
  SARAKT_STAR_POSITION[0] + SARAKT_PRIME_ORBIT_RADIUS,
  SARAKT_STAR_POSITION[1],
  SARAKT_STAR_POSITION[2],
];
export const UNIVERSE_CAMERA_POSITION: [number, number, number] = [3.6, 1.6, 2.5];
export const OCTAVIA_DISTRICT_NAME = "Octavia Capital City";

export type UniversePlanetId = "sarakt-prime" | "zythera";

export type UniverseCelestialConfig = {
  id: UniversePlanetId;
  name: string;
  cityName: string;
  color: string;
  emissive: string;
  cityColor: string;
  atmosphereColor: string;
  orbitRadius: number;
  orbitSpeed: number;
  inclinationDeg: number;
  radius: number;
  buildingCount: number;
  priority?: boolean;
  dimmed?: boolean;
};

export const SARAKT_STAR = {
  name: "Sarakt Star",
  color: "#9333ea",
  emissive: "#6d28d9",
  labelColor: "#a78bfa",
  radius: 0.1,
} as const;

export const SARAKT_PLANETS: UniverseCelestialConfig[] = [
  {
    id: "sarakt-prime",
    name: "Sarakt Prime",
    cityName: "Octavia Capital City",
    color: "#14532d",
    emissive: "#166534",
    cityColor: "#4ade80",
    atmosphereColor: "#22c55e",
    orbitRadius: SARAKT_PRIME_ORBIT_RADIUS,
    orbitSpeed: 0.1,
    inclinationDeg: 8,
    radius: 0.095,
    buildingCount: 28,
    priority: true,
  },
  {
    id: "zythera",
    name: "Zythera",
    cityName: "Zarathis",
    color: "#7f1d1d",
    emissive: "#450a0a",
    cityColor: "#f87171",
    atmosphereColor: "#ef4444",
    orbitRadius: 1.1,
    orbitSpeed: 0.08,
    inclinationDeg: 15,
    radius: 0.052,
    buildingCount: 8,
    dimmed: true,
  },
];
