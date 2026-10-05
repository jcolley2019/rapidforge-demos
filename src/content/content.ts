export interface Service {
  title: string
  description: string
}

export interface TeamMember {
  name: string
  credential: string
  role: string
  blurb: string
}

export interface Stat {
  value: string
  label: string
}

export interface CompanyContent {
  name: string
  shortName: string
  taglines: {
    primary: string
    secondary: string
  }
  founded: {
    year: number
    founder: string
    founderCredential: string
  }
  contact: {
    phone: string
    phoneHref: string
    address: string
    quoteEmail: string
    clientPortal: string
    facebook: string
    linkedin: string
  }
  stats: Stat[]
  services: Service[]
  team: TeamMember[]
  trustedBy: string[]
  serviceArea: string
}

export const content: CompanyContent = {
  name: 'Brittain & Crawford, LLC',
  shortName: 'Brittain & Crawford',
  taglines: {
    primary: 'Precision since 1973.',
    secondary: "Fort Worth's land surveying authority for over 50 years.",
  },
  founded: {
    year: 1973,
    founder: 'James L. Brittain',
    founderCredential: 'RPLS No. 1674',
  },
  contact: {
    phone: '(817) 926-0211',
    phoneHref: 'tel:+18179260211',
    address: '3908 South Freeway, Fort Worth, TX 76110',
    quoteEmail: 'admin@brittain-crawford.com',
    clientPortal: 'https://brittain-crawford.sharefile.com',
    facebook: 'https://www.facebook.com/BrittainandCrawford',
    linkedin: 'https://www.linkedin.com/company/3853608',
  },
  stats: [
    { value: '50+', label: 'Years in business' },
    { value: '4', label: 'Registered Professional Land Surveyors' },
    { value: '6', label: 'Two-man field crews' },
    { value: '5', label: 'AutoCAD drafting technicians' },
    { value: '4', label: 'On-network GNSS systems tied to the Texas State Plane coordinate system' },
    { value: '2003', label: 'BBB accredited since' },
  ],
  services: [
    {
      title: 'Boundary & ALTA/NSPS Land Title Surveys',
      description:
        'Definitive boundary determinations and ALTA/NSPS land title surveys that meet the exacting standards of lenders, title companies, and attorneys. Every survey is backed by thorough courthouse research and more than five decades of boundary law experience.',
    },
    {
      title: 'Topographic As-Built Surveys',
      description:
        'Precise documentation of existing site conditions, improvements, and utilities as they stand today. As-built surveys give engineers, architects, and owners a reliable record for renovation, expansion, and compliance.',
    },
    {
      title: 'Topographic Design Surveys',
      description:
        'Detailed terrain, elevation, and feature mapping engineered for the design process. Our design surveys give civil engineers and architects the accurate base data a successful project is built on.',
    },
    {
      title: 'Preliminary & Final Plats',
      description:
        'Complete platting services that carry your project from concept through city approval and recording. We navigate municipal requirements across North Texas so your development stays on schedule.',
    },
    {
      title: 'Right-of-Way Documents',
      description:
        'Accurate right-of-way maps, parcel descriptions, and exhibits prepared for transportation and infrastructure projects. Our documents stand up to the scrutiny of public agencies and acquisition proceedings.',
    },
    {
      title: 'Easement Documents',
      description:
        'Clear, legally sound easement descriptions and exhibits for utilities, access, drainage, and pipelines. We define exactly what is granted — and where — so agreements hold up for decades.',
    },
    {
      title: 'Aerial Drone Mapping & Inspections',
      description:
        'FAA-compliant drone flights that capture high-resolution orthomosaics, elevation models, and inspection imagery. Aerial mapping delivers fast, safe coverage of large or hard-to-access sites.',
    },
    {
      title: '3D Laser Scanning',
      description:
        'Interior and exterior laser scanning that captures millions of measurements in minutes. Point-cloud deliverables document structures and sites with millimeter-level fidelity for design, renovation, and records.',
    },
    {
      title: '3D Terrain Models & Custom Exhibits',
      description:
        'Digital terrain models, surface analyses, and presentation-ready exhibits tailored to your project. We turn raw survey data into visuals that communicate clearly to clients, councils, and courts.',
    },
  ],
  team: [
    {
      name: 'James L. Brittain',
      credential: 'RPLS No. 1674',
      role: 'Founder',
      blurb:
        'Licensed in Texas in 1970 and Alaska in 1977. Member of ACSM, NSPS, and TSPS, with more than 50 years of surveying experience.',
    },
    {
      name: 'Stuart F. Smith',
      credential: 'RPLS',
      role: 'GPS Coordinator & Survey Crew Supervisor',
      blurb:
        'Licensed in 2001. Has spent his entire career — roughly 30 years — with Brittain & Crawford.',
    },
    {
      name: 'Chris L. Blevins',
      credential: 'RPLS No. 5792',
      role: 'GIS, Platting & Drafting Supervisor',
      blurb:
        'Licensed in 2004. Holds a BS in Information Systems from UT Arlington and has spent his entire career with Brittain & Crawford.',
    },
    {
      name: 'Name TBD',
      credential: 'RPLS No. 6400',
      role: 'Registered Professional Land Surveyor',
      blurb:
        'Licensed in 2013. Holds a BS in Land Surveying & Real Property Appraisal.',
    },
  ],
  trustedBy: [
    'Freese & Nichols',
    'Kimley-Horn',
    'North Texas Municipal Water District',
    'TxDOT-adjacent engineering firms',
  ],
  serviceArea: 'Fort Worth, Arlington, Dallas, and all of North Texas',
}
