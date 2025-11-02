import { LucideIcon } from 'lucide-react';

export type DistrictType = 
  | "Residential" 
  | "Commercial" 
  | "Industrial" 
  | "Trading" 
  | "Research" 
  | "Science" 
  | "Experimental" 
  | "Governance" 
  | "Manufacturing" 
  | "Resource";

export interface District {
  id: string;
  name: string;
  plots: number;
  price: number;
  type: DistrictType;
  icon: LucideIcon;
}

export interface Planet {
  id: string;
  name: string;
  status: string;
  population: number;
  coverage: number;
  tier: string;
  color: string;
  description: string;
  districts: District[];
  features: string[];
  locked?: boolean;
}

export interface UniverseState {
  planets: Record<string, Planet>;
  selectedPlanetId: string | null;
  wallet: number;
}

export type Action =
  | { type: "SELECT_PLANET"; payload: string }
  | { type: "CLOSE_PLANET" }
  | { type: "BUY_PLOT"; payload: { planetId: string; districtId: string; quantity: number } }
  | { type: "SET_WALLET"; payload: number };
