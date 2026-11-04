/**
 * OptiGreen Carbon Telemetry Controller
 * Handles regional grid carbon intensity queries and multi-region telemetries.
 */

import { Request, Response } from 'express';
import { getAllRegionsTelemetry } from '../services/regionalCarbonService';
import { getHistoricalReplayScenario, HISTORICAL_GRID_ARCHIVE } from '../services/historicalGridService';

export async function getCarbonIntensity(req: Request, res: Response): Promise<void> {
  const zone = (req.query.zone as string) || 'US-CAL-CISO';
  const apiKey = process.env.ELECTRICITY_API_KEY;

  if (apiKey && apiKey !== 'MY_ELECTRICITY_MAPS_API_KEY') {
    try {
      const response = await fetch(`https://api.electricitymaps.com/v3/carbon-intensity/latest?zone=${zone}`, {
        headers: { 'auth-token': apiKey }
      });
      if (response.ok) {
        const data = await response.json();
        res.json({ zone, carbonIntensity: data.carbonIntensity, isRealApi: true });
        return;
      }
    } catch (err) {
      console.warn('Electricity Maps API call failed, using fallback realistic data', err);
    }
  }

  // Fallback realistic grid intensity mapping
  const mockIntensities: Record<string, number> = {
    'US-CAL-CISO': 214,
    'US-NW-PACW': 140,
    'US-EAST-1': 245,
    'DE': 412,
    'IE': 230,
    'SG': 680,
    'IN-WE': 710
  };

  const base = mockIntensities[zone.toUpperCase()] || 250;
  const fluctuation = Math.floor(Math.random() * 10) - 5;
  const carbonIntensity = Math.max(50, base + fluctuation);

  res.json({
    zone,
    carbonIntensity,
    isRealApi: false,
    timestamp: new Date().toISOString()
  });
}

export async function getAllRegionsCarbon(req: Request, res: Response): Promise<void> {
  const data = await getAllRegionsTelemetry();
  res.json(data);
}

export function getHistoricalReplay(req: Request, res: Response): void {
  const scenario = (req.query.scenario as string) || 'nordic_wind_peak';
  const data = getHistoricalReplayScenario(scenario);
  res.json({
    ...data,
    availableScenarios: Object.keys(HISTORICAL_GRID_ARCHIVE)
  });
}
