// Shared reference geography for Cambodia tools.
//
// A single representative point per province/municipality (the provincial
// town / administrative centre), NOT a boundary polygon. Distances computed
// from these are straight-line, centre-to-centre approximations — good for a
// rough "how far apart are these provinces" answer, never authoritative for
// points near a border or for real road distance.
//
// Coordinates are the well-known provincial-capital locations; keep them as
// approximate reference points, not survey-grade data.

export type ProvincePoint = { en: string; km: string; lat: number; lng: number };

export const PROVINCE_CAPITALS: ProvincePoint[] = [
  { en: "Phnom Penh", km: "ភ្នំពេញ", lat: 11.5564, lng: 104.9282 },
  { en: "Banteay Meanchey", km: "បន្ទាយមានជ័យ", lat: 13.5875, lng: 102.9857 },
  { en: "Battambang", km: "បាត់ដំបង", lat: 13.0957, lng: 103.2022 },
  { en: "Kampong Cham", km: "កំពង់ចាម", lat: 12.0, lng: 105.45 },
  { en: "Kampong Chhnang", km: "កំពង់ឆ្នាំង", lat: 12.25, lng: 104.6667 },
  { en: "Kampong Speu", km: "កំពង់ស្ពឺ", lat: 11.45, lng: 104.5167 },
  { en: "Kampong Thom", km: "កំពង់ធំ", lat: 12.7111, lng: 104.8887 },
  { en: "Kampot", km: "កំពត", lat: 10.6104, lng: 104.1817 },
  { en: "Kandal", km: "កណ្តាល", lat: 11.4833, lng: 104.95 },
  { en: "Kep", km: "កែប", lat: 10.4833, lng: 104.3167 },
  { en: "Koh Kong", km: "កោះកុង", lat: 11.6153, lng: 102.9836 },
  { en: "Kratie", km: "ក្រចេះ", lat: 12.4881, lng: 106.0189 },
  { en: "Mondulkiri", km: "មណ្ឌលគិរី", lat: 12.455, lng: 107.1931 },
  { en: "Oddar Meanchey", km: "ឧត្តរមានជ័យ", lat: 14.1867, lng: 103.5236 },
  { en: "Pailin", km: "ប៉ៃលិន", lat: 12.85, lng: 102.6 },
  { en: "Preah Sihanouk", km: "ព្រះសីហនុ", lat: 10.6167, lng: 103.53 },
  { en: "Preah Vihear", km: "ព្រះវិហារ", lat: 13.82, lng: 104.97 },
  { en: "Prey Veng", km: "ព្រៃវែង", lat: 11.4857, lng: 105.3251 },
  { en: "Pursat", km: "ពោធិ៍សាត់", lat: 12.5388, lng: 103.9199 },
  { en: "Ratanakiri", km: "រតនគិរី", lat: 13.7394, lng: 106.9873 },
  { en: "Siem Reap", km: "សៀមរាប", lat: 13.3671, lng: 103.8448 },
  { en: "Stung Treng", km: "ស្ទឹងត្រែង", lat: 13.5259, lng: 105.9683 },
  { en: "Svay Rieng", km: "ស្វាយរៀង", lat: 11.0877, lng: 105.7996 },
  { en: "Takeo", km: "តាកែវ", lat: 10.9908, lng: 104.7845 },
  { en: "Tboung Khmum", km: "ត្បូងឃ្មុំ", lat: 11.9667, lng: 105.6333 },
];

/** Great-circle (straight-line) distance between two points, in kilometres. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
