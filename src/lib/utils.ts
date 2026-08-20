import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const sortStudents = (students: any[]) => {
  const getSortValue = (student: any) => {
    const zoneWeight: Record<string, number> = {
      "Minor Zone": 1,
      "Mid Zone": 2,
      "Premier Zone": 3,
      "General Zone": 4
    };
    
    let classVal = 999;
    if (student.class) {
      const c = student.class.toString().trim().toLowerCase();
      if (c === "+1" || c === "plus 1" || c === "plus one") classVal = 11;
      else if (c === "+2" || c === "plus 2" || c === "plus two") classVal = 12;
      else {
        const match = c.match(/\d+/);
        if (match) classVal = parseInt(match[0], 10);
      }
    }
    
    return {
      z: zoneWeight[student.category || student.zone] || 99,
      c: classVal
    };
  };

  return [...students].sort((a, b) => {
    const valA = getSortValue(a);
    const valB = getSortValue(b);
    
    if (valA.z !== valB.z) return valA.z - valB.z;
    if (valA.c !== valB.c) return valA.c - valB.c;
    return (a.name || "").localeCompare(b.name || "");
  });
};

