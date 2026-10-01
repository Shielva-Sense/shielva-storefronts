import type { Review } from "@/core/types";
import type { SalonService, ServiceCategory, Stylist } from "./types";

export const SALON_BRAND = "Maison Noor";

/** Built-in copy used when the page builder has no value (and when the API is unreachable). */
export const SALON_SECTION_DEFAULTS = {
    hero: { eyebrow: "Hair & color studio · SoHo, New York", title: "Hair, considered.", lede: "Book a senior stylist in under a minute. Prices on the menu are the prices on your bill." },
    trust: ["Senior stylists only", "Upfront pricing", "Free fix within 7 days", "Walk-ins for blow-dries"],
    services: { eyebrow: "The menu", title: "Every price, before you sit down.", lede: "Starting prices for shoulder-length hair. Your stylist confirms the final price at consultation — before a single snip." },
    process: { title: "How an appointment works" },
    team: { eyebrow: "The team", title: "Only senior hands on your hair." },
    membership: { eyebrow: "Noor Circle", title: "Your monthly reset, on us." },
    reviews: { title: "Heard in the chair." },
    visit: { title: "Find the studio" },
} as const;

export const SALON_FALLBACK_SECTIONS = ["salon.hero", "salon.trust", "salon.services", "salon.process", "salon.team", "salon.membership", "salon.reviews", "salon.visit"] as const;
export const SALON_FREE_SHIPPING_AT = 75;

export const SALON_NAV = [
    { href: "#book", label: "Book" },
    { href: "#services", label: "Services & prices" },
    { href: "#stylists", label: "Stylists" },
    { href: "#visit", label: "Visit" },
] as const;

export const SALON_LOCATION = {
    street: "148 Mercer Street, SoHo",
    city: "New York",
    region: "NY",
    postalCode: "10012",
    country: "US",
    phone: "+1 (212) 555-0148",
    lat: 40.7247,
    lng: -73.9987,
    mapsQuery: "148 Mercer Street New York NY 10012",
} as const;

export const SALON_HOURS = [
    { days: "Tue – Fri", open: "10:00", close: "20:00", schemaDays: ["Tuesday", "Wednesday", "Thursday", "Friday"] },
    { days: "Sat – Sun", open: "09:00", close: "21:00", schemaDays: ["Saturday", "Sunday"] },
    { days: "Monday", open: "", close: "", schemaDays: [] },
] as const;

export const CATEGORY_LABEL: Record<ServiceCategory, string> = {
    hair: "Cut & style",
    color: "Color",
    care: "Treatments",
    bridal: "Bridal & events",
};

export const SALON_SERVICES: readonly SalonService[] = [
    { id: "signature-cut", category: "hair", name: "Signature cut & blow-dry", minutes: 60, from: 95, description: "Consultation, precision cut, wash and a finish that lasts until your next wash." },
    { id: "blowout", category: "hair", name: "Blow-dry bar", minutes: 45, from: 55, description: "Sleek, bouncy or undone waves — booked in minutes, out the door in 45." },
    { id: "fringe", category: "hair", name: "Fringe refresh", minutes: 15, from: 20, description: "A quick tidy between cuts. Walk-ins welcome." },
    { id: "balayage", category: "color", name: "Hand-painted balayage", minutes: 180, from: 325, description: "Sun-kissed dimension painted freehand, with toner and a bond-building treatment." },
    { id: "gloss", category: "color", name: "Gloss & tone", minutes: 45, from: 85, description: "Revives faded color and adds mirror shine in under an hour." },
    { id: "roots", category: "color", name: "Root touch-up", minutes: 75, from: 110, description: "Seamless regrowth coverage, ammonia-free formulas." },
    { id: "keratin", category: "care", name: "Keratin smoothing", minutes: 150, from: 300, description: "Frizz-free, humidity-proof hair for up to four months." },
    { id: "scalp", category: "care", name: "Scalp ritual", minutes: 40, from: 70, description: "Exfoliation, massage and a treatment matched to your scalp type." },
    { id: "bridal-trial", category: "bridal", name: "Bridal trial", minutes: 120, from: 180, description: "A full rehearsal of your wedding-day look, with photos to take home." },
    { id: "event-updo", category: "bridal", name: "Event styling", minutes: 60, from: 120, description: "Updos, braids and glam waves for the big night." },
];

export const DEFAULT_SERVICE_ID = "signature-cut";

export const SALON_STYLISTS: readonly Stylist[] = [
    { id: "any", name: "First available", level: "Senior", specialty: "Fastest slot, any senior stylist", from: 0, nextSlot: "Today" },
    { id: "noor", name: "Noor Rahman", level: "Creative Director", specialty: "Balayage & lived-in color", from: 140, nextSlot: "Thu 11:30 AM" },
    { id: "kabir", name: "Kabir Sethi", level: "Master", specialty: "Precision cuts & textured hair", from: 120, nextSlot: "Tomorrow 4:00 PM" },
    { id: "ananya", name: "Ananya Iyer", level: "Senior", specialty: "Bridal & event styling", from: 95, nextSlot: "Today 6:30 PM" },
    { id: "leela", name: "Leela Das", level: "Senior", specialty: "Curly cuts & scalp health", from: 95, nextSlot: "Sat 10:00 AM" },
];

export const TIME_SLOTS = ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM", "5:30 PM", "7:00 PM"] as const;

export const SALON_PROCESS = [
    { title: "Consult", body: "Ten unhurried minutes on your hair history, routine and what you actually want to see in the mirror." },
    { title: "Craft", body: "Your stylist works to a written plan — no surprises on the bill, no surprise on the color." },
    { title: "Finish", body: "A styling lesson for home, product notes texted to you, and a free fix within seven days." },
] as const;

export const SALON_MEMBERSHIP = {
    id: "noor-circle",
    name: "Noor Circle membership",
    price: 119,
    perks: ["One blow-dry every month", "15% off every color service", "Priority weekend booking", "Free fringe refreshes"],
} as const;

export const SALON_RATING = { average: 4.9, count: 1286 } as const;

export const SALON_REVIEWS: readonly Review[] = [
    { id: "s1", author: "Priya N.", rating: 5, body: "Booked at 9pm, in the chair at 10am. The price I saw online was exactly what I paid.", meta: "Signature cut · Google review" },
    { id: "s2", author: "Rhea M.", rating: 5, body: "Noor fixed a balayage another salon ruined. I finally have the color I showed in my reference photo.", meta: "Balayage · Google review" },
    { id: "s3", author: "Farah A.", rating: 5, body: "The membership pays for itself — my monthly blow-dry is my non-negotiable.", meta: "Noor Circle member" },
];

export const SALON_FAQ = [
    { q: "Do you take walk-ins?", a: "Yes for blow-dries and fringe refreshes when a chair is free — but booking online guarantees your time." },
    { q: "Are the prices final?", a: "Prices shown are starting prices for shoulder-length hair. Your stylist confirms the final price at consultation, before any work begins." },
    { q: "What is the cancellation policy?", a: "Free cancellation up to 12 hours before. Later cancellations are charged 50% of the service." },
    { q: "Is there parking?", a: "No parking on site — the Mercer Street garage is two minutes away, and we validate for 2 hours." },
] as const;

export function servicesIn(category: ServiceCategory): SalonService[] {
    return SALON_SERVICES.filter((s) => s.category === category);
}

export function findService(id: string): SalonService | undefined {
    return SALON_SERVICES.find((s) => s.id === id);
}
