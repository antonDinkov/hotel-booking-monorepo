import rawPanelData from "./hotel-panel.json";
import type { HotelPanelData, SearchFieldIcon } from "../types/hotel-panel";

const panelData: HotelPanelData = {
  ...rawPanelData,
  searchFields: rawPanelData.searchFields.map((field) => ({
    ...field,
    icon: field.icon as SearchFieldIcon,
  })),
};

export default panelData;