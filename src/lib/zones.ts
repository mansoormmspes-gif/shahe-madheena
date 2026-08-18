export const DEFAULT_ZONES = {
  "Minor Zone": ["1", "2", "3"],
  "Mid Zone": ["4", "5", "6", "7"],
  "Premier Zone": ["8", "9", "10", "11", "12"]
};

export function getZoneForClass(studentClass: string, zoneConfig?: any): string {
  const config = zoneConfig || DEFAULT_ZONES;
  
  for (const [zone, classes] of Object.entries(config)) {
    if (Array.isArray(classes) && classes.includes(studentClass.trim())) {
      return zone;
    }
  }
  
  return "General Zone";
}
