import { ActivityValues } from "./cascadeEngine";

export interface Persona {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  description: string;
  // Realistic daily-use preset values
  values: ActivityValues;
  // Override labels for activity sliders (makes them context-aware)
  activityLabels: Partial<Record<string, string>>;
  // Activities shown at top / highlighted for this persona
  primaryActivities: string[];
  // 2 key data insights for this persona
  insights: [string, string];
  // Rough daily footprint range string
  dailyRange: string;
}

export const PERSONAS: Persona[] = [
  {
    id: "student",
    name: "Student",
    tagline: "Lectures, ramen & bus passes",
    icon: "🎓",
    color: "#1de9b6",
    description: "Shared accommodation, mostly public transport, university cafeteria meals.",
    values: {
      personal_vehicle: 6,
      aviation: 0,
      electricity: 4,
      beef: 0,
      dairy: 0.3,
      natural_gas: 0,
      shopping: 6,
    },
    activityLabels: {
      personal_vehicle: "Campus / Weekend Travel",
      electricity: "Shared Dorm / Flat Power",
      shopping: "Textbooks & Basics",
      dairy: "Cafeteria Dairy",
    },
    primaryActivities: ["electricity", "shopping", "dairy", "personal_vehicle"],
    insights: [
      "Students emit ~55% below the global daily average",
      "Shared living is the single biggest carbon reducer",
    ],
    dailyRange: "~7–12 kg",
  },

  {
    id: "working_class",
    name: "Working Class",
    tagline: "Daily grind, honest living",
    icon: "👷",
    color: "#d4a847",
    description: "Car commute to work, owned or rented home, home-cooked family meals.",
    values: {
      personal_vehicle: 48,
      aviation: 0,
      electricity: 18,
      beef: 0.15,
      dairy: 0.5,
      natural_gas: 2,
      shopping: 18,
    },
    activityLabels: {
      personal_vehicle: "Daily Work Commute",
      electricity: "Home Electricity",
      natural_gas: "Home Heating / Cooking",
      beef: "Weekly Meat Meals",
    },
    primaryActivities: ["personal_vehicle", "electricity", "natural_gas", "beef"],
    insights: [
      "Commuting & home energy account for ~70% of working-class footprint",
      "Switching to public transport saves ~1.5 t CO₂e/year",
    ],
    dailyRange: "~22–30 kg",
  },

  {
    id: "office_worker",
    name: "Office Worker",
    tagline: "Coffee, laptops & video calls",
    icon: "💼",
    color: "#64b5f6",
    description: "Car or transit commute, apartment living, restaurants & quarterly work trips.",
    values: {
      personal_vehicle: 28,
      aviation: 150,
      electricity: 12,
      beef: 0.1,
      dairy: 0.4,
      natural_gas: 1,
      shopping: 35,
    },
    activityLabels: {
      personal_vehicle: "Daily Commute",
      aviation: "Quarterly Business Trips",
      electricity: "Home + Remote Office",
      shopping: "Lunch, Subscriptions & Gear",
    },
    primaryActivities: ["personal_vehicle", "electricity", "aviation", "shopping"],
    insights: [
      "A single economy return flight can equal 3 months of commuting",
      "Hybrid work reduces office-building energy but raises home energy",
    ],
    dailyRange: "~18–28 kg",
  },

  {
    id: "ceo",
    name: "Executive / CEO",
    tagline: "Business class & board rooms",
    icon: "🏢",
    color: "#ce93d8",
    description: "Frequent international flights, luxury vehicle, large home, fine dining, high consumption.",
    values: {
      personal_vehicle: 80,
      aviation: 900,
      electricity: 55,
      beef: 0.4,
      dairy: 0.5,
      natural_gas: 8,
      shopping: 280,
    },
    activityLabels: {
      personal_vehicle: "Chauffeur / Luxury Car",
      aviation: "Business & First Class Flights",
      electricity: "Office Building + Mansion",
      shopping: "Fashion, Tech & Dining",
      natural_gas: "Large Home Heating",
      beef: "Steak & Fine Dining",
    },
    primaryActivities: ["aviation", "electricity", "personal_vehicle", "shopping"],
    insights: [
      "The top 1% emit ~100× more than the bottom 50% — aviation is the key driver",
      "One transatlantic business-class seat = 4× more than economy (seat + cabin space)",
    ],
    dailyRange: "~120–260 kg",
  },

  {
    id: "family",
    name: "Family / Parent",
    tagline: "School runs & home cooking",
    icon: "🏡",
    color: "#81c784",
    description: "Family car for errands & school drops, full kitchen use, family grocery shop.",
    values: {
      personal_vehicle: 40,
      aviation: 0,
      electricity: 24,
      beef: 0.25,
      dairy: 0.9,
      natural_gas: 3,
      shopping: 42,
    },
    activityLabels: {
      personal_vehicle: "School Run & Errands",
      electricity: "Family Home",
      natural_gas: "Heating & Kitchen",
      beef: "Family Dinners",
      dairy: "Milk, Cheese & Yoghurt",
      shopping: "Groceries & Kids' Items",
    },
    primaryActivities: ["electricity", "natural_gas", "beef", "personal_vehicle", "dairy"],
    insights: [
      "Household food choices are often the easiest lever — cutting red meat saves ~500 kg/year",
      "A family switching to heat pumps saves ~2.5 t CO₂e/year",
    ],
    dailyRange: "~28–38 kg",
  },

  {
    id: "nomad",
    name: "Digital Nomad",
    tagline: "Everywhere & nowhere at once",
    icon: "💻",
    color: "#ffb74d",
    description: "Frequent long-haul flights, coworking spaces, eating out every day, minimal owned goods.",
    values: {
      personal_vehicle: 8,
      aviation: 1400,
      electricity: 7,
      beef: 0.2,
      dairy: 0.2,
      natural_gas: 0,
      shopping: 90,
    },
    activityLabels: {
      aviation: "Intercontinental Moves",
      personal_vehicle: "Taxis & Ride-Shares",
      shopping: "Cafés, Gear & Accommodation",
      beef: "Restaurant & Street Food",
      electricity: "Coworking Space",
    },
    primaryActivities: ["aviation", "shopping", "beef", "personal_vehicle"],
    insights: [
      "A single long-haul flight emits more CO₂ than 3 months of plant-based eating",
      "\"Low-stuff\" nomad lifestyle is offset entirely by flight frequency",
    ],
    dailyRange: "~45–95 kg",
  },

  {
    id: "eco",
    name: "Eco-Conscious",
    tagline: "Cycling, tofu & solar panels",
    icon: "🌱",
    color: "#4db6ac",
    description: "Public transport or bicycle, plant-based diet, minimal shopping, renewable energy.",
    values: {
      personal_vehicle: 2,
      aviation: 0,
      electricity: 5,
      beef: 0,
      dairy: 0.1,
      natural_gas: 0,
      shopping: 5,
    },
    activityLabels: {
      personal_vehicle: "Occasional Car Share / Taxi",
      electricity: "Green Tariff / Solar",
      shopping: "Secondhand & Essentials Only",
      dairy: "Occasional Dairy",
    },
    primaryActivities: ["electricity", "shopping", "dairy", "personal_vehicle"],
    insights: [
      "Even the most sustainable lifestyle leaves a residual ~4–8 kg/day footprint",
      "The hidden footprint: internet infrastructure & digital services add ~0.5 kg/day",
    ],
    dailyRange: "~4–8 kg",
  },
];

export const CUSTOM_PERSONA_ID = "custom";

// Given a persona id, find it
export function getPersona(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id);
}
