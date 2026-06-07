/**
 * Octagonal spiral plot coordinates — shared by seed-plots and 3D grid scenes.
 */

export function calculatePlotCoordinates(plotId: number): { x: number; y: number } {
  if (plotId === 1) return { x: 0, y: 0 };

  let ring = 1;
  let totalPlots = 1;

  while (totalPlots < plotId) {
    totalPlots += ring * 8;
    if (totalPlots >= plotId) break;
    ring++;
  }

  const positionInRing = plotId - (totalPlots - ring * 8) - 1;
  const side = Math.floor(positionInRing / ring);
  const posOnSide = positionInRing % ring;

  let x = 0;
  let y = 0;
  const baseX = ring;
  const baseY = ring;

  switch (side) {
    case 0:
      x = -baseX + posOnSide;
      y = -baseY;
      break;
    case 1:
      x = baseX;
      y = -baseY + posOnSide;
      break;
    case 2:
      x = baseX - posOnSide;
      y = baseY;
      break;
    case 3:
      x = -baseX;
      y = baseY - posOnSide;
      break;
    case 4:
      x = -baseX + posOnSide;
      y = baseY;
      break;
    case 5:
      x = -baseX;
      y = baseY - posOnSide;
      break;
    case 6:
      x = -baseX + posOnSide;
      y = -baseY;
      break;
    case 7:
      x = -baseX;
      y = -baseY + posOnSide;
      break;
  }

  return { x, y };
}

export function getPlotZoneType(plotId: number): string {
  if (plotId <= 100) return "Central District";
  if (plotId <= 1000) return "Inner Ring - Commercial";
  if (plotId <= 3000) return "Residential Zone";
  if (plotId <= 6000) return "Mixed Use";
  if (plotId <= 9000) return "Industrial Zone";
  return "Outer Frontier";
}

/** World positions for instanced plot tiles (scale matches universe scene units). */
export function plotWorldPosition(
  plotId: number,
  tileSpacing = 0.35,
): [number, number, number] {
  const { x, y } = calculatePlotCoordinates(plotId);
  return [x * tileSpacing, 0, y * tileSpacing];
}
