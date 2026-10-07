import type { CopyFamily } from './copy'

/**
 * Stock photography per trade family, used whenever a brief arrives with no
 * photo_urls. Every URL is a free Unsplash image (never Unsplash+), served
 * from images.unsplash.com at 1600px wide; credits are in photos-credits.md
 * next to this file. `scripts/verify-photos.mjs` HEAD-checks the whole set.
 *
 * Order matters: hero[0] is the first thing a visitor sees. Each family
 * covers the same four subjects: a technician at work, a service van, a
 * finished install, and hands on a tool. `crew` is people with their
 * trucks or crews at work, for a brief's crew_photo_urls.
 */

export interface TradePhotoSet {
  /** Full-bleed hero candidates, best first. */
  hero: string[]
  /** Smaller supporting shots for service tiles. */
  detail: string[]
  /** People with their trucks, or crews at work. */
  crew: string[]
}

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=1600&q=80`

export const TRADE_PHOTOS: Record<CopyFamily, TradePhotoSet> = {
  plumbing: {
    hero: [
      u('1676210134188-4c05dd172f89'), // plumber working under a sink
      u('1624355761500-f00bb5cfb5a1'), // white service van on the road
      u('1631048499052-e6d9f305d2c0'), // finished bathroom vanity install
      u('1676210134190-3f2c0d5cf58d'), // hands on a wrench at the pipes
    ],
    detail: [
      u('1676210133055-eab6ef033ce3'), // under-sink repair
      u('1620653713380-7a34b773fef8'), // water heater with a tool
      u('1521207418485-99c705420785'), // kitchen faucet running
      u('1749532125405-70950966b0e5'), // plumber in a bathroom
    ],
    crew: [
      u('1746095792963-74106bae8658'), // crew repairing a pipe in the ground
      u('1787672357497-9d9e025f01b3'), // two techs in blue work uniforms
      u('1710058959636-0588a837357e'), // loading the back of a work van
    ],
  },
  hvac: {
    hero: [
      u('1561400555-786780284b67'), // technician servicing a unit
      u('1641199788912-9a7385a35c82'), // white service van at a brick building
      u('1700124113583-81aa99ea2aa2'), // finished heat pump install
      u('1642749776312-aa42ce20c9f5'), // technicians at rooftop units
    ],
    detail: [
      u('1545259741-2ea3ebf61fa3'), // smart thermostat
      u('1718203862467-c33159fdc504'), // condenser on a brick wall
      u('1762341123870-d706f257a12e'), // wall-mounted indoor unit
      u('1615309662243-70f6df917b59'), // ductwork
    ],
    crew: [
      u('1705579605238-24a90c8799c5'), // technician among rooftop units
      u('1594581835488-0b95b8b0bacd'), // three techs walking an equipment yard
      u('1732395805034-e0bf859665e5'), // technician in uniform outside a building
    ],
  },
  electrical: {
    hero: [
      u('1621905251189-08b45d6a269e'), // electrician wiring a box
      u('1623412910761-8929605372ce'), // white service van at a building
      u('1515948725-edac7b5bb0fc'), // finished pendant lighting install
      u('1758101755915-462eddc23f57'), // multimeter on a panel
    ],
    detail: [
      u('1660330589693-99889d60181e'), // screwdriver on an electrical panel
      u('1682345262055-8f95f3c513ea'), // hands holding wires
      u('1553873002-785d775854c9'), // clamp meter and tools
      u('1635335874521-7987db781153'), // wired switch box
    ],
    crew: [
      u('1759542877886-39d81e8f2eee'), // linemen working from a bucket truck
      u('1679000265956-3bd0f356b2b3'), // two crew members in hard hats
      u('1615774925655-a0e97fc85c14'), // electrician in a face shield at a panel
    ],
  },
  generic: {
    hero: [
      u('1731168273756-e02cae42265b'), // tradesperson with an angle grinder
      u('1579992822406-2092a7bd5a36'), // white service van on a street
      u('1665507279644-67d8ed143a84'), // finished kitchen
      u('1643509867448-57001e0c333d'), // hands driving a screw with a drill
    ],
    detail: [
      u('1615974679600-665fb9468c4f'), // tape measure
      u('1505495533616-ed5f6ce6d4f9'), // tools in a chest
      u('1570129477492-45c003edd2be'), // suburban house
      u('1739203469638-d6f54c24a5da'), // worker on a ladder in a garage
    ],
    crew: [
      u('1652303518379-c0ef1c9fb2b1'), // two crew members at a trench
      u('1647735282077-c12699af40be'), // crew beside a mixer truck and excavator
      u('1626885930974-4b69aa21bbf9'), // two crew members walking a job site
    ],
  },
}

/** Every URL in the registry, flattened, for verification scripts and tests. */
export function allTradePhotoUrls(): string[] {
  return Object.values(TRADE_PHOTOS).flatMap((set) => [...set.hero, ...set.detail, ...set.crew])
}
