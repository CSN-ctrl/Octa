

import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { Planet, UniverseState, Action } from '@/types/universe';

const UniverseContext = createContext<{
  state: UniverseState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

const INITIAL_WALLET = 2500;

function universeReducer(state: UniverseState, action: Action): UniverseState {
  switch (action.type) {
    case 'SELECT_PLANET':
      return { ...state, selectedPlanetId: action.payload };
    case 'CLOSE_PLANET':
      return { ...state, selectedPlanetId: null };
    case 'BUY_PLOT': {
      const { planetId, districtId, quantity } = action.payload;
      if (planetId !== 'sarakt-prime' || quantity <= 0) return state;

      const planet = state.planets[planetId];
      if (!planet) return state;

      let totalCost = 0;
      const newDistricts = planet.districts.map(d => {
        if (d.id !== districtId) return d;
        const available = d.plots;
        const buy = Math.min(quantity, available);
        totalCost += buy * d.price;
        return { ...d, plots: available - buy };
      });

      if (totalCost > state.wallet) return state;

      return {
        ...state,
        planets: {
          ...state.planets,
          [planetId]: { ...planet, districts: newDistricts }
        },
        wallet: state.wallet - totalCost
      };
    }
    case 'SET_WALLET':
      return { ...state, wallet: action.payload };
    default:
      return state;
  }
}

export function UniverseProvider({
  children,
  initialPlanets
}: {
  children: React.ReactNode;
  initialPlanets: Record<string, Planet>;
}) {
  const [state, dispatch] = useReducer(universeReducer, {
    planets: initialPlanets,
    selectedPlanetId: null,
    wallet: INITIAL_WALLET
  });

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <UniverseContext.Provider value={value}>{children}</UniverseContext.Provider>;
}

export function useUniverse() {
  const ctx = useContext(UniverseContext);
  if (!ctx) throw new Error('useUniverse must be used within UniverseProvider');
  return ctx;
}
