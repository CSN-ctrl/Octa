export const SARAKT_STAR_POSITION: [number, number, number] = [1.6, 0, 1.6];

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
    cityName: "Octavia Capital",
    color: "#166534",
    emissive: "#14532d",
    cityColor: "#4ade80",
    atmosphereColor: "#22c55e",
    orbitRadius: 0.8,
    orbitSpeed: 0.1,
    inclinationDeg: 8,
    radius: 0.07,
    buildingCount: 18,
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
    radius: 0.065,
    buildingCount: 14,
  },
];
