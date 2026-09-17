/**
 * Location utility functions for polygon operations and coordinate calculations
 */

export type PolygonCoordinate = {
  latitude: number;
  longitude: number;
};

/**
 * Checks if a point is inside a polygon using the ray casting algorithm
 * @param latitude - The latitude of the point to check
 * @param longitude - The longitude of the point to check
 * @param polygon - Array of polygon coordinates
 * @returns true if the point is inside the polygon, false otherwise
 */
export function isPointInPolygon(
  latitude: number,
  longitude: number,
  polygon: PolygonCoordinate[]
): boolean {
  if (!polygon || polygon.length < 3) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect =
      yi > latitude !== yj > latitude &&
      longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Calculates the centroid (center point) of a polygon
 * This point is guaranteed to be within the polygon for convex polygons
 * @param polygon - Array of polygon coordinates
 * @returns The centroid coordinates, or null if polygon is invalid
 */
export function getPolygonCentroid(
  polygon: PolygonCoordinate[]
): PolygonCoordinate | null {
  if (!polygon || polygon.length < 3) {
    return null;
  }

  // Remove duplicate last point if polygon is closed
  const coords =
    polygon.length > 0 &&
    polygon[0].latitude === polygon.at(-1)?.latitude &&
    polygon[0].longitude === polygon.at(-1)?.longitude
      ? polygon.slice(0, -1)
      : polygon;

  if (coords.length < 3) {
    return null;
  }

  // Calculate centroid using the average of all vertices
  let sumLat = 0;
  let sumLon = 0;

  for (const coord of coords) {
    sumLat += coord.latitude;
    sumLon += coord.longitude;
  }

  return {
    latitude: sumLat / coords.length,
    longitude: sumLon / coords.length,
  };
}

/**
 * Creates a square polygon around a center point
 * @param centerLatitude - The latitude of the center point
 * @param centerLongitude - The longitude of the center point
 * @param radiusInMeters - The radius in meters (half the side length of the square)
 * @returns Array of polygon coordinates forming a square
 */
export function createSquarePolygon(
  centerLatitude: number,
  centerLongitude: number,
  radiusInMeters: number
): PolygonCoordinate[] {
  // Convert meters to degrees (approximate)
  // 1 degree latitude ≈ 111,000 meters
  // 1 degree longitude ≈ 111,000 * cos(latitude) meters
  const latDelta = radiusInMeters / 111_000;
  const lonDelta =
    radiusInMeters / (111_000 * Math.cos((centerLatitude * Math.PI) / 180));

  return [
    {
      latitude: centerLatitude - latDelta,
      longitude: centerLongitude - lonDelta,
    },
    {
      latitude: centerLatitude - latDelta,
      longitude: centerLongitude + lonDelta,
    },
    {
      latitude: centerLatitude + latDelta,
      longitude: centerLongitude + lonDelta,
    },
    {
      latitude: centerLatitude + latDelta,
      longitude: centerLongitude - lonDelta,
    },
    // Close the polygon by repeating the first point
    {
      latitude: centerLatitude - latDelta,
      longitude: centerLongitude - lonDelta,
    },
  ];
}
