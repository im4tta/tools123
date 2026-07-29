export type CambodiaProvince = { code: string; en: string; km: string };

export const CAMBODIA_PROVINCES: CambodiaProvince[] = [
  { code: "12", en: "Phnom Penh", km: "ភ្នំពេញ" },
  { code: "01", en: "Banteay Meanchey", km: "បន្ទាយមានជ័យ" },
  { code: "02", en: "Battambang", km: "បាត់ដំបង" },
  { code: "03", en: "Kampong Cham", km: "កំពង់ចាម" },
  { code: "04", en: "Kampong Chhnang", km: "កំពង់ឆ្នាំង" },
  { code: "05", en: "Kampong Speu", km: "កំពង់ស្ពឺ" },
  { code: "06", en: "Kampong Thom", km: "កំពង់ធំ" },
  { code: "07", en: "Kampot", km: "កំពត" },
  { code: "08", en: "Kandal", km: "កណ្ដាល" },
  { code: "23", en: "Kep", km: "កែប" },
  { code: "09", en: "Koh Kong", km: "កោះកុង" },
  { code: "10", en: "Kratié", km: "ក្រចេះ" },
  { code: "11", en: "Mondulkiri", km: "មណ្ឌលគិរី" },
  { code: "22", en: "Oddar Meanchey", km: "ឧត្តរមានជ័យ" },
  { code: "24", en: "Pailin", km: "ប៉ៃលិន" },
  { code: "13", en: "Preah Vihear", km: "ព្រះវិហារ" },
  { code: "14", en: "Prey Veng", km: "ព្រៃវែង" },
  { code: "15", en: "Pursat", km: "ពោធិ៍សាត់" },
  { code: "16", en: "Ratanakiri", km: "រតនគិរី" },
  { code: "17", en: "Siem Reap", km: "សៀមរាប" },
  { code: "18", en: "Preah Sihanouk", km: "ព្រះសីហនុ" },
  { code: "19", en: "Stung Treng", km: "ស្ទឹងត្រែង" },
  { code: "20", en: "Svay Rieng", km: "ស្វាយរៀង" },
  { code: "21", en: "Takéo", km: "តាកែវ" },
  { code: "25", en: "Tboung Khmum", km: "ត្បូងឃ្មុំ" },
];

export function provinceLocation(province: CambodiaProvince) {
  return province.code === "12" ? `រាជធានី${province.km}` : `ខេត្ត${province.km}`;
}