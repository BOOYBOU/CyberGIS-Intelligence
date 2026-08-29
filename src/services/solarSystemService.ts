export interface MoonData {
  name: string;
  arabicName: string;
  diameterKm: string;
  discoveryYear: string;
  keyFact: string;
}

export interface AtmosphereGas {
  gas: string;
  arabicGas: string;
  percentage: number;
  color: string;
}

export interface CelestialBodyData {
  id: string;
  name: string;
  arabicName: string;
  subtitle: string;
  arabicSubtitle: string;
  category: 'star' | 'terrestrial' | 'gas_giant' | 'ice_giant' | 'dwarf' | 'belt' | 'satellite';
  categoryLabelAr: string;
  radius: number;
  color: string;
  glowColor: string;
  diameter: string;
  diameterKmNum: number;
  distanceFromSun: string;
  distanceAU: number;
  orbitalPeriod: string;
  orbitalVelocityKmS: string;
  dayLength: string;
  temperature: string;
  gravity: string;
  gravityFactor: number; // relative to Earth = 1.0
  moonsCount: number;
  notableMoons?: MoonData[];
  atmosphere: string;
  atmosphericComposition?: AtmosphereGas[];
  description: string;
  arabicDescription: string;
  facts: string[];
  arabicFacts: string[];
  spaceMissions: { name: string; year: string; agency: string; result: string }[];
  position: [number, number, number];
  cameraDistance: number;
  surfaceFeatures?: string[];
}

export const SOLAR_SYSTEM_DATA: CelestialBodyData[] = [
  {
    id: 'sun',
    name: 'The Sun',
    arabicName: 'الشمس',
    subtitle: 'Yellow Dwarf Star (G2V)',
    arabicSubtitle: 'نجم قزم أصفر في قلب المجموعة',
    category: 'star',
    categoryLabelAr: 'نجم المجموعة الأم',
    radius: 120,
    color: '#fbbf24',
    glowColor: '#f59e0b',
    diameter: '1,392,700 km',
    diameterKmNum: 1392700,
    distanceFromSun: 'Center of Solar System (0 AU)',
    distanceAU: 0,
    orbitalPeriod: '230 Million Years (Galactic Orbit)',
    orbitalVelocityKmS: '220 km/s',
    dayLength: '25 - 35 Earth Days (Differential)',
    temperature: '5,500°C Surface / 15,000,000°C Core',
    gravity: '274.0 m/s² (27.9g)',
    gravityFactor: 27.9,
    moonsCount: 8,
    atmosphere: '73.46% Hydrogen, 24.85% Helium, 0.77% Oxygen',
    atmosphericComposition: [
      { gas: 'Hydrogen (H₂)', arabicGas: 'هيدروجين', percentage: 73.46, color: '#f59e0b' },
      { gas: 'Helium (He)', arabicGas: 'هيليوم', percentage: 24.85, color: '#fbbf24' },
      { gas: 'Oxygen (O)', arabicGas: 'أكسجين', percentage: 0.77, color: '#38bdf8' },
      { gas: 'Carbon & Iron', arabicGas: 'كربون وحديد', percentage: 0.92, color: '#94a3b8' }
    ],
    description: 'The luminous powerhouse and gravitational anchor of the Solar System, supplying all thermal radiant energy for planetary atmospheres and life.',
    arabicDescription: 'قلب المجموعة الشمسية ومصدر الطاقة والضوء والحياة لجميع الكواكب، يشكل 99.86% من إجمالي كتلة المجموعة الشمسية بأكملها.',
    facts: [
      'Accounts for 99.86% of the total mass in the entire Solar System.',
      'Nuclear fusion converts 600 million tons of hydrogen into helium every second in its core.',
      'Light produced in the core takes over 100,000 years to reach the surface.'
    ],
    arabicFacts: [
      'تستحوذ الشمس على 99.86% من إجمالي كتلة النظام الشمسي.',
      'يحدث اندماج نووي يحول 600 مليون طن من الهيدروجين إلى هيليوم كل ثانية.',
      'يستغرق الفوتون الضوئي المتولد في اللب نحو 100,000 سنة للخروج إلى السطح.'
    ],
    spaceMissions: [
      { name: 'Parker Solar Probe', year: '2018–2026', agency: 'NASA', result: 'Approached within 6 million km of the Sun' },
      { name: 'SOHO', year: '1995–Active', agency: 'ESA/NASA', result: 'Continuous coronal mass ejection monitoring' },
      { name: 'Solar Orbiter', year: '2020–Active', agency: 'ESA', result: 'High-latitude imaging of solar polar caps' }
    ],
    surfaceFeatures: ['Solar Granules', 'Sunspots', 'Prominences', 'Coronal Loops'],
    position: [1800, 700, 1400],
    cameraDistance: 450
  },
  {
    id: 'mercury',
    name: 'Mercury',
    arabicName: 'عطارد',
    subtitle: 'Innermost Terrestrial Planet',
    arabicSubtitle: 'أصغر الكواكب وأقربها للشمس',
    category: 'terrestrial',
    categoryLabelAr: 'كوكب صخري داخلي',
    radius: 7,
    color: '#9ca3af',
    glowColor: '#6b7280',
    diameter: '4,879 km',
    diameterKmNum: 4879,
    distanceFromSun: '57.9 Million km (0.39 AU)',
    distanceAU: 0.39,
    orbitalPeriod: '87.97 Earth Days',
    orbitalVelocityKmS: '47.4 km/s',
    dayLength: '58.6 Earth Days (3:2 Resonance)',
    temperature: '-180°C to +430°C',
    gravity: '3.70 m/s² (0.38g)',
    gravityFactor: 0.38,
    moonsCount: 0,
    atmosphere: 'Ultra-thin Exosphere: Sodium, Magnesium, Oxygen, Potassium',
    atmosphericComposition: [
      { gas: 'Oxygen (O₂)', arabicGas: 'أكسجين', percentage: 42.0, color: '#38bdf8' },
      { gas: 'Sodium (Na)', arabicGas: 'صوديوم', percentage: 29.0, color: '#facc15' },
      { gas: 'Hydrogen (H₂)', arabicGas: 'هيدروجين', percentage: 22.0, color: '#ec4899' },
      { gas: 'Helium & Potassium', arabicGas: 'هيليوم وبوتاسيوم', percentage: 7.0, color: '#a855f7' }
    ],
    description: 'The smallest planet and closest to the Sun. Its scarred basaltic crust holds massive impact basins like Caloris and deep permanently shadowed polar ice traps.',
    arabicDescription: 'أصغر كواكب المجموعة وأقربها إلى الشمس، سطحه شبيه بالقمر مليء بالفوهات النيزكية العميقة مع تقلبات حرارية هي الأشد على الإطلاق.',
    facts: [
      'Experiences extreme temperature swings exceeding 600°C between day and night.',
      'Has a massive metallic iron core occupying roughly 75% of its planetary radius.',
      'Despite high heat, ice exists in permanently shadowed craters at the poles.'
    ],
    arabicFacts: [
      'يشهد أعلى تباين حراري في النظام الشمسي (من -180 مئوية ليلاً إلى 430 نهاراً).',
      'يمتلك نواة حديدية عملاقة تشكل 75% من حجم الكوكب.',
      'توجد ترسبات جليدية مائية أزلية داخل الفوهات القطبية المظلمة.'
    ],
    spaceMissions: [
      { name: 'MESSENGER', year: '2004–2015', agency: 'NASA', result: 'Orbited and mapped 100% of Mercury surface' },
      { name: 'BepiColombo', year: '2018–2026', agency: 'ESA/JAXA', result: 'Dual orbiter scientific mapping' },
      { name: 'Mariner 10', year: '1973–1975', agency: 'NASA', result: 'First close-up flybys' }
    ],
    surfaceFeatures: ['Caloris Basin (1,550 km)', 'Discovery Rupes', 'Eminescu Crater'],
    position: [1150, 420, 850],
    cameraDistance: 32
  },
  {
    id: 'venus',
    name: 'Venus',
    arabicName: 'الزهرة',
    subtitle: 'Runaway Greenhouse Planet',
    arabicSubtitle: 'الكوكب الأشد حرارة وتوأم الأرض',
    category: 'terrestrial',
    categoryLabelAr: 'كوكب صخري داخلي',
    radius: 14,
    color: '#fde047',
    glowColor: '#eab308',
    diameter: '12,104 km',
    diameterKmNum: 12104,
    distanceFromSun: '108.2 Million km (0.72 AU)',
    distanceAU: 0.72,
    orbitalPeriod: '224.7 Earth Days',
    orbitalVelocityKmS: '35.0 km/s',
    dayLength: '243 Earth Days (Retrograde)',
    temperature: '465°C (Constant Global Heat)',
    gravity: '8.87 m/s² (0.90g)',
    gravityFactor: 0.90,
    moonsCount: 0,
    atmosphere: '96.5% Carbon Dioxide, 3.5% Nitrogen, Sulfuric Acid Clouds',
    atmosphericComposition: [
      { gas: 'Carbon Dioxide (CO₂)', arabicGas: 'ثاني أكسيد الكربون', percentage: 96.5, color: '#f97316' },
      { gas: 'Nitrogen (N₂)', arabicGas: 'نيتروجين', percentage: 3.5, color: '#60a5fa' },
      { gas: 'Sulfuric Acid Clouds', arabicGas: 'حمض الكبريتيك', percentage: 0.015, color: '#facc15' }
    ],
    description: 'Earth’s sister planet in size and mass, wrapped in dense sulfuric acid clouds and an extreme runaway greenhouse atmosphere with 92 bar surface pressure.',
    arabicDescription: 'توأم الأرض في الحجم والكتلة، لكنه جحيم كوني مغلف بسحب من حمض الكبريتيك وغاز ثاني أكسيد الكربون بضغط جوي يعادل 92 ضعف ضغط الأرض.',
    facts: [
      'Rotates backwards (retrograde); the Sun rises in the west and sets in the east.',
      'A day on Venus (243 Earth days) is longer than its orbital year (225 Earth days).',
      'Surface atmospheric pressure equals being 900 meters underwater on Earth.'
    ],
    arabicFacts: [
      'يدور حول نفسه في اتجاه عكسي؛ وتشرق الشمس فيه من الغرب وتغرب في الشرق.',
      'يوم كوكب الزهرة أطول من سنته المدارية.',
      'الضغط الجوي على سطحه يعادل الغوص 900 متر تحت سطح المحيط.'
    ],
    spaceMissions: [
      { name: 'Venera 13 & 14', year: '1981', agency: 'USSR', result: 'Landed on surface and sent first color photos' },
      { name: 'Magellan', year: '1989–1994', agency: 'NASA', result: 'Radar-mapped 98% of Venusian topography' },
      { name: 'Akatsuki', year: '2015–Active', agency: 'JAXA', result: 'Upper-atmosphere weather tracking' }
    ],
    surfaceFeatures: ['Maxwell Montes (11 km height)', 'Ishtar Terra', 'Aphrodite Terra'],
    position: [750, 290, 520],
    cameraDistance: 48
  },
  {
    id: 'earth',
    name: 'Earth',
    arabicName: 'كوكب الأرض',
    subtitle: 'The Blue Marble (Living World)',
    arabicSubtitle: 'موطن البشرية وكوكب المياه والحياة',
    category: 'terrestrial',
    categoryLabelAr: 'كوكب صخري مأهول',
    radius: 20,
    color: '#38bdf8',
    glowColor: '#0284c7',
    diameter: '12,742 km',
    diameterKmNum: 12742,
    distanceFromSun: '149.6 Million km (1.00 AU)',
    distanceAU: 1.0,
    orbitalPeriod: '365.25 Days',
    orbitalVelocityKmS: '29.78 km/s',
    dayLength: '23h 56m 04s (Sidereal Day)',
    temperature: '-89°C to +58°C (Mean: +15°C)',
    gravity: '9.81 m/s² (1.00g)',
    gravityFactor: 1.0,
    moonsCount: 1,
    notableMoons: [
      { name: 'The Moon (Luna)', arabicName: 'القمر', diameterKm: '3,474 km', discoveryYear: 'Prehistoric', keyFact: 'Stabilizes Earth axis tilt and creates oceanic tides' }
    ],
    atmosphere: '78.08% Nitrogen, 20.95% Oxygen, 0.93% Argon, Water Vapor',
    atmosphericComposition: [
      { gas: 'Nitrogen (N₂)', arabicGas: 'نيتروجين', percentage: 78.08, color: '#3b82f6' },
      { gas: 'Oxygen (O₂)', arabicGas: 'أكسجين', percentage: 20.95, color: '#10b981' },
      { gas: 'Argon (Ar)', arabicGas: 'أرجون', percentage: 0.93, color: '#8b5cf6' },
      { gas: 'Carbon Dioxide & Trace', arabicGas: 'ثاني أكسيد الكربون وبخار', percentage: 0.04, color: '#e2e8f0' }
    ],
    description: 'The cradle of human civilization and the only known planetary body harboring active liquid hydrospheres, plate tectonics, and abundant complex life.',
    arabicDescription: 'كوكبنا الأزرق النابض بالحياة، الكوكب الوحيد المعروف الذي يمتلك مياهاً سائلة مستقرة وغلافاً جوياً غنياً بالأكسجين ومجالاً مغناطيسياً حامياً.',
    facts: [
      'Protected by a dynamic geomagnetic field deflecting harmful cosmic and solar radiation.',
      'Surface is 70.8% covered with liquid water oceans averaging 3,688 meters in depth.',
      'Located squarely inside the circumstellar habitable Goldilocks zone.'
    ],
    arabicFacts: [
      'محمي بمجال مغناطيسي أرضي ديناميكي يحرف الرياح الشمسية القاتلة.',
      'تغطي المحيطات المائية 70.8% من إجمالي مساحة سطحه.',
      'يقع في النطاق الصالح للحياة (Goldilocks Zone) حول الشمس.'
    ],
    spaceMissions: [
      { name: 'International Space Station (ISS)', year: '1998–Active', agency: 'NASA/ESA/Roscosmos/JAXA/CSA', result: 'Continuous human presence in LEO' },
      { name: 'Hubble & Landsat Fleet', year: '1972–Active', agency: 'NASA/USGS', result: '50+ years of continuous Earth and cosmic observation' }
    ],
    surfaceFeatures: ['Mariana Trench (-10,994m)', 'Mount Everest (+8,848m)', 'Amazon Basin', 'Sahara Desert'],
    position: [0, 0, 0],
    cameraDistance: 280
  },
  {
    id: 'moon',
    name: 'The Moon',
    arabicName: 'القمر',
    subtitle: 'Earth’s Natural Satellite (Luna)',
    arabicSubtitle: 'التابع الطبيعي للأرض',
    category: 'satellite',
    categoryLabelAr: 'قمر طبيعي',
    radius: 6,
    color: '#cbd5e1',
    glowColor: '#94a3b8',
    diameter: '3,474 km',
    diameterKmNum: 3474,
    distanceFromSun: '384,400 km from Earth',
    distanceAU: 1.0,
    orbitalPeriod: '27.32 Earth Days',
    orbitalVelocityKmS: '1.02 km/s',
    dayLength: '27.32 Earth Days (Tidally Locked)',
    temperature: '-130°C to +120°C',
    gravity: '1.62 m/s² (0.166g)',
    gravityFactor: 0.166,
    moonsCount: 0,
    atmosphere: 'Trace Exosphere: Helium, Neon, Hydrogen',
    atmosphericComposition: [
      { gas: 'Helium (He)', arabicGas: 'هيليوم', percentage: 40.0, color: '#f59e0b' },
      { gas: 'Neon (Ne)', arabicGas: 'نيون', percentage: 40.0, color: '#38bdf8' },
      { gas: 'Hydrogen (H₂)', arabicGas: 'هيدروجين', percentage: 20.0, color: '#ec4899' }
    ],
    description: 'The fifth-largest satellite in the Solar System, displaying dark volcanic basaltic maria, highland anorthosite crust, and ancient impact craters.',
    arabicDescription: 'قمر الأرض التابع ذو السطح الرمادي المغطى بالبحار القمرية البازلتية البركانية القديمة والفوهات النيزكية الشاهدة على تاريخ نشأة النظام الشمسي.',
    facts: [
      'Formed ~4.5 billion years ago after a Mars-sized body (Theia) collided with proto-Earth.',
      'Tidally locked to Earth, always showing the exact same side to our planet.',
      '12 human astronauts walked on its lunar surface during NASA Apollo missions (1969–1972).'
    ],
    arabicFacts: [
      'نشأ قبل 4.5 مليار سنة إثر اصطدام كوكب بحجم المريخ (ثيا) بالأرض البدائية.',
      'مقيد مدياً بالأرض، لذا نرى دائماً وجهاً واحداً فقط منه.',
      'هبط على سطحه 12 رائد فضاء بشرياً في رحلات أبولو التاريخية.'
    ],
    spaceMissions: [
      { name: 'Apollo 11', year: '1969', agency: 'NASA', result: 'First humans to land on the Moon' },
      { name: 'Artemis & Lunar Reconnaissance', year: '2009–Active', agency: 'NASA', result: 'Sub-meter mapping of south pole ice' },
      { name: 'Chandrayaan-3', year: '2023', agency: 'ISRO', result: 'Landed near lunar south pole' }
    ],
    surfaceFeatures: ['Sea of Tranquility (Mare Tranquillitatis)', 'Tycho Crater & Rays', 'Copernicus Crater', 'Ocean of Storms'],
    position: [520, 140, -360],
    cameraDistance: 50
  },
  {
    id: 'mars',
    name: 'Mars',
    arabicName: 'المريخ',
    subtitle: 'The Red Planet (Desert World)',
    arabicSubtitle: 'الكوكب الأحمر ذو البراكين والوديان العملاقة',
    category: 'terrestrial',
    categoryLabelAr: 'كوكب صخري خارجي',
    radius: 11,
    color: '#ef4444',
    glowColor: '#dc2626',
    diameter: '6,779 km',
    diameterKmNum: 6779,
    distanceFromSun: '227.9 Million km (1.52 AU)',
    distanceAU: 1.52,
    orbitalPeriod: '687 Earth Days (1.88 Years)',
    orbitalVelocityKmS: '24.07 km/s',
    dayLength: '24h 37m 22s (1 Sol)',
    temperature: '-140°C to +20°C (Mean: -63°C)',
    gravity: '3.72 m/s² (0.38g)',
    gravityFactor: 0.38,
    moonsCount: 2,
    notableMoons: [
      { name: 'Phobos', arabicName: 'فوبوس', diameterKm: '22.2 km', discoveryYear: '1877', keyFact: 'Orbits in just 7.6 hours; doomed to break apart in ~50M years' },
      { name: 'Deimos', arabicName: 'ديموس', diameterKm: '12.4 km', discoveryYear: '1877', keyFact: 'Small, smooth, crater-filled captured asteroid moon' }
    ],
    atmosphere: '95.3% Carbon Dioxide, 2.6% Nitrogen, 1.9% Argon',
    atmosphericComposition: [
      { gas: 'Carbon Dioxide (CO₂)', arabicGas: 'ثاني أكسيد الكربون', percentage: 95.32, color: '#f87171' },
      { gas: 'Nitrogen (N₂)', arabicGas: 'نيتروجين', percentage: 2.6, color: '#60a5fa' },
      { gas: 'Argon (Ar)', arabicGas: 'أرجون', percentage: 1.9, color: '#a78bfa' },
      { gas: 'Oxygen & Water Vapor', arabicGas: 'أكسجين وبخار ماء', percentage: 0.18, color: '#34d399' }
    ],
    description: 'A rust-colored desert world featuring Olympus Mons (highest volcano in the solar system) and Valles Marineris (canyon system stretching 4,000 km).',
    arabicDescription: 'الكوكب الأحمر الغني بأكاسيد الحديد، يضم أعلى بركان في المجموعة الشمسية (بركان أوليمبوس بارتفاع 22 كم) وأكبر وادٍ أخدودي (فاليس مارينريس).',
    facts: [
      'Hosts the largest volcano in the Solar System: Olympus Mons (21.9 km high, 3x Everest).',
      'Valles Marineris canyon is 4,000 km long, 200 km wide, and up to 7 km deep.',
      'Contains substantial subterranean water ice and dry ice polar caps.'
    ],
    arabicFacts: [
      'يحتضن أعلى قمة بركانية في النظام الشمسي: بركان أوليمبوس (21.9 كم ارتفاعاً).',
      'يمتد وادي فاليس مارينريس لأكثر من 4,000 كم (أطول من قارة أمريكا الشمالية).',
      'يمتلك غطاءين قطبيين من جليد الماء وثاني أكسيد الكربون المتجمد.'
    ],
    spaceMissions: [
      { name: 'Perseverance & Ingenuity', year: '2021–Active', agency: 'NASA', result: 'Searching for ancient biosignatures in Jezero Crater' },
      { name: 'Curiosity Rover', year: '2012–Active', agency: 'NASA', result: 'Discovered ancient organic molecules and lake beds' },
      { name: 'Hope Probe (مسبار الأمل)', year: '2020–Active', agency: 'UAE', result: 'Comprehensive atmospheric weather dynamics' }
    ],
    surfaceFeatures: ['Olympus Mons', 'Valles Marineris', 'Jezero Crater', 'Gale Crater'],
    position: [-850, 320, -750],
    cameraDistance: 45
  },
  {
    id: 'asteroids',
    name: 'Asteroid Belt & Ceres',
    arabicName: 'حزام الكويكبات وسيريس',
    subtitle: 'Main Protoplanetary Debris Zone',
    arabicSubtitle: 'حزام الصخور الكونية والكوكب القزم سيريس',
    category: 'belt',
    categoryLabelAr: 'حزام كويكبات وركام بدائي',
    radius: 25,
    color: '#a8a29e',
    glowColor: '#78716c',
    diameter: 'Circumsolar Ring (Ceres: 940 km)',
    diameterKmNum: 940,
    distanceFromSun: '329 - 478 Million km (2.2 - 3.2 AU)',
    distanceAU: 2.7,
    orbitalPeriod: '3 to 6 Earth Years',
    orbitalVelocityKmS: '17.9 km/s',
    dayLength: '9.07 Hours (Ceres)',
    temperature: '-73°C to -108°C',
    gravity: '0.28 m/s² (Ceres 0.03g)',
    gravityFactor: 0.03,
    moonsCount: 0,
    atmosphere: 'Vacuum with intermittent water vapor plumes from Ceres',
    description: 'A torus-shaped circumsolar region between Mars and Jupiter holding millions of ancient primordial carbonaceous, silicate, and metallic planetesimals.',
    arabicDescription: 'حزام كوني دائري يفصل بين الكواكب الصخرية والعمالقة الغازية، يحتوي على ملايين الصخور البدائية والكوكب القزم الجليدي سيريس.',
    facts: [
      'Total mass is only about 4% of Earth’s Moon, with dwarf planet Ceres holding one-third of it.',
      'Ceres contains water-ice mantle and bright sodium carbonate salt deposits in Occator crater.',
      'Average distance between individual asteroids is nearly 1 million kilometers.'
    ],
    arabicFacts: [
      'كتلة الحزام بالكامل لا تتجاوز 4% من كتلة قمر الأرض، ثلثها في كويكب سيريس وحده.',
      'يحتوي سيريس على خزان جليدي ومواقع ملحية بيضاء مضيئة في فوهة أوكاتور.',
      'المسافة بين الكويكبات في الواقع شاسعة جداً وتقارب مليون كيلومتر.'
    ],
    spaceMissions: [
      { name: 'Dawn Mission', year: '2007–2018', agency: 'NASA', result: 'Orbited and mapped both Vesta and Ceres' },
      { name: 'Lucy Mission', year: '2021–Active', agency: 'NASA', result: 'En route to explore multiple Trojan asteroids' }
    ],
    surfaceFeatures: ['Ceres Occator Bright Spots', 'Vesta Rheasilvia Peak', 'Psyche Metallic Core'],
    position: [-100, 120, -1100],
    cameraDistance: 120
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    arabicName: 'المشتري',
    subtitle: 'King of Planets (Gas Giant)',
    arabicSubtitle: 'عملاق المجموعة الشمسية وأكبر كواكبها',
    category: 'gas_giant',
    categoryLabelAr: 'عملاق غازي ضخم',
    radius: 38,
    color: '#fb923c',
    glowColor: '#ea580c',
    diameter: '139,820 km',
    diameterKmNum: 139820,
    distanceFromSun: '778.5 Million km (5.20 AU)',
    distanceAU: 5.20,
    orbitalPeriod: '11.86 Earth Years',
    orbitalVelocityKmS: '13.07 km/s',
    dayLength: '9h 55m 30s (Fastest Planetary Spin)',
    temperature: '-110°C (Cloud Tops)',
    gravity: '24.79 m/s² (2.53g)',
    gravityFactor: 2.53,
    moonsCount: 95,
    notableMoons: [
      { name: 'Ganymede', arabicName: 'غانيميد', diameterKm: '5,268 km', discoveryYear: '1610', keyFact: 'Largest moon in the Solar System (bigger than planet Mercury)' },
      { name: 'Europa', arabicName: 'يوروبا', diameterKm: '3,122 km', discoveryYear: '1610', keyFact: 'Subsurface liquid water ocean under ice shell with potential life' },
      { name: 'Io', arabicName: 'آيو', diameterKm: '3,643 km', discoveryYear: '1610', keyFact: 'Most volcanically active body in the Solar System (400+ volcanoes)' },
      { name: 'Callisto', arabicName: 'كاليستو', diameterKm: '4,821 km', discoveryYear: '1610', keyFact: 'Most heavily cratered ancient surface in the Solar System' }
    ],
    atmosphere: '89.8% Hydrogen, 10.2% Helium, Methane, Ammonia, Water Ice',
    atmosphericComposition: [
      { gas: 'Hydrogen (H₂)', arabicGas: 'هيدروجين', percentage: 89.8, color: '#f97316' },
      { gas: 'Helium (He)', arabicGas: 'هيليوم', percentage: 10.2, color: '#fde047' },
      { gas: 'Methane & Ammonia', arabicGas: 'ميثان وأمونيا', percentage: 0.3, color: '#a855f7' }
    ],
    description: 'The monarch gas giant of the Solar System with alternating colorful cloud bands, the 350-year-old Great Red Spot storm, and 95 known moons.',
    arabicDescription: 'ملك الكواكب وأضخمها، تزيد كتلته عن ضعفي ونصف مجموع كتل كل الكواكب الأخرى مجتمعة، وتدور في غلافه العاصفة الحمراء العظيمة الأكبر من كوكب الأرض.',
    facts: [
      'Has more mass than all other planets in the Solar System combined (318x Earth mass).',
      'The Great Red Spot is a high-pressure anticyclonic storm raging for over 350 years.',
      'Acts as a cosmic vacuum cleaner, deflecting many comets away from the inner planets.'
    ],
    arabicFacts: [
      'كتلته تفوق كتلة جميع كواكب النظام الشمسي الأخرى مجتمعة بـ 2.5 مرة.',
      'البقعة الحمراء العظيمة هي إعصار عملاق يفوق حجم كوكب الأرض مستمر منذ 350 سنة.',
      'يعمل كدرع واقٍ للأرض عن طريق جذب المذنبات الضالة نحو جاذبيته الهائلة.'
    ],
    spaceMissions: [
      { name: 'Juno Mission', year: '2016–Active', agency: 'NASA', result: 'Deep atmospheric soundings and magnetic mapping' },
      { name: 'JUICE', year: '2023–Active', agency: 'ESA', result: 'En route to explore icy moons Ganymede and Europa' },
      { name: 'Galileo Orbiter', year: '1995–2003', agency: 'NASA', result: 'First dedicated orbiter and probe descent' }
    ],
    surfaceFeatures: ['Great Red Spot', 'North Equatorial Belt', 'South Equatorial Belt', 'White Ovals'],
    position: [1450, -380, -1450],
    cameraDistance: 120
  },
  {
    id: 'saturn',
    name: 'Saturn',
    arabicName: 'زحل',
    subtitle: 'Jewel of the Solar System (Ringed Giant)',
    arabicSubtitle: 'جوهرة السماء وأجمل كواكب المجموعة بحلقاته الرائعة',
    category: 'gas_giant',
    categoryLabelAr: 'عملاق غازي ذو حلقات',
    radius: 32,
    color: '#facc15',
    glowColor: '#eab308',
    diameter: '116,460 km',
    diameterKmNum: 116460,
    distanceFromSun: '1.43 Billion km (9.58 AU)',
    distanceAU: 9.58,
    orbitalPeriod: '29.45 Earth Years',
    orbitalVelocityKmS: '9.68 km/s',
    dayLength: '10h 33m 38s',
    temperature: '-140°C (Cloud Tops)',
    gravity: '10.44 m/s² (1.06g)',
    gravityFactor: 1.06,
    moonsCount: 146,
    notableMoons: [
      { name: 'Titan', arabicName: 'تيتان', diameterKm: '5,149 km', discoveryYear: '1655', keyFact: 'Thick nitrogen atmosphere with liquid methane lakes and rivers' },
      { name: 'Enceladus', arabicName: 'إنسيلادوس', diameterKm: '504 km', discoveryYear: '1789', keyFact: 'Cryovolcanic geysers shooting water vapor and organics from subsurface ocean' },
      { name: 'Mimas', arabicName: 'ميماس', diameterKm: '396 km', discoveryYear: '1789', keyFact: 'Resembles the Death Star with its 130 km Herschel impact crater' }
    ],
    atmosphere: '96.3% Hydrogen, 3.25% Helium, Methane, Ammonia',
    atmosphericComposition: [
      { gas: 'Hydrogen (H₂)', arabicGas: 'هيدروجين', percentage: 96.3, color: '#facc15' },
      { gas: 'Helium (He)', arabicGas: 'هيليوم', percentage: 3.25, color: '#fde047' },
      { gas: 'Methane & Ammonia', arabicGas: 'ميثان وأمونيا', percentage: 0.45, color: '#60a5fa' }
    ],
    description: 'Famed for its dazzling, razor-thin concentric ring systems of water ice crystals spanning 282,000 km, accompanied by 146 moons including Titan and Enceladus.',
    arabicDescription: 'جوهرة السماء بنظامه الحلقي البديع الممتد لمئات آلاف الكيلومترات من بلورات الجليد والصخور، ويرافقه 146 قمراً طبيعياً أبرزها تيتان وإنسيلادوس.',
    facts: [
      'The least dense planet in the Solar System (0.687 g/cm³); it would float in a giant ocean of water.',
      'Ring system is 282,000 km wide but averages only 10 to 30 meters in thickness.',
      'Moon Titan has a dense atmosphere and liquid methane and ethane seas on its surface.'
    ],
    arabicFacts: [
      'أقل كواكب النظام الشمسي كثافة (أخف من الماء)؛ ولو وُضع في حوض ماء عملاق لطفا فوقه.',
      'تمتد حلقاته لنحو 282,000 كم، بينما لا يتجاوز سمكها في المتوسط 10 إلى 30 متراً فقط.',
      'يمتلك قمره تيتان بحيرات وأنهاراً من الميثان السائل وغلافاً جوياً كثيفاً.'
    ],
    spaceMissions: [
      { name: 'Cassini-Huygens', year: '1997–2017', agency: 'NASA/ESA/ASI', result: '13-year exploration and Huygens landing on Titan' },
      { name: 'Dragonfly Mission', year: '2028 Launch', agency: 'NASA', result: 'Rotorcraft drone destined to fly on moon Titan' },
      { name: 'Voyager 1 & 2', year: '1980–1981', agency: 'NASA', result: 'First detailed ring structure data' }
    ],
    surfaceFeatures: ['Cassini Division', 'Encke Gap', 'North Polar Hexagon', 'Ring A, B, C'],
    position: [-1650, -480, -1350],
    cameraDistance: 130
  },
  {
    id: 'uranus',
    name: 'Uranus',
    arabicName: 'أورانوس',
    subtitle: 'Tilted Ice Giant (Cyan World)',
    arabicSubtitle: 'العملاق الجليدي المائل ذو الحلقات الرأسية',
    category: 'ice_giant',
    categoryLabelAr: 'عملاق جليدي أزرق فيروزي',
    radius: 20,
    color: '#2dd4bf',
    glowColor: '#14b8a6',
    diameter: '50,724 km',
    diameterKmNum: 50724,
    distanceFromSun: '2.87 Billion km (19.22 AU)',
    distanceAU: 19.22,
    orbitalPeriod: '84.01 Earth Years',
    orbitalVelocityKmS: '6.80 km/s',
    dayLength: '17h 14m 24s (Retrograde)',
    temperature: '-224°C (Coldest Planetary Atmosphere)',
    gravity: '8.69 m/s² (0.89g)',
    gravityFactor: 0.89,
    moonsCount: 28,
    notableMoons: [
      { name: 'Miranda', arabicName: 'ميراندا', diameterKm: '471 km', discoveryYear: '1948', keyFact: 'Extreme tectonic canyons up to 20 km deep (Verona Rupes)' },
      { name: 'Titania', arabicName: 'تيتانيا', diameterKm: '1,578 km', discoveryYear: '1787', keyFact: 'Largest moon of Uranus with extensive fault valleys' }
    ],
    atmosphere: '82.5% Hydrogen, 15.2% Helium, 2.3% Methane',
    atmosphericComposition: [
      { gas: 'Hydrogen (H₂)', arabicGas: 'هيدروجين', percentage: 82.5, color: '#2dd4bf' },
      { gas: 'Helium (He)', arabicGas: 'هيليوم', percentage: 15.2, color: '#67e8f9' },
      { gas: 'Methane (CH₄)', arabicGas: 'ميثان', percentage: 2.3, color: '#06b6d4' }
    ],
    description: 'An aquamarine ice giant rotating nearly on its side with a dramatic axial tilt of 97.8 degrees, producing 42-year seasons of extreme light and darkness.',
    arabicDescription: 'عملاق جليدي فيروزي يدور على جانبه بميل محوري فريد يبلغ 97.8 درجة، مما يجعل قطبيه يواجهان الشمس مباشرة لمدة 42 سنة متواصلة.',
    facts: [
      'Has the most tilted rotation axis in the Solar System (rolls around the Sun like a ball).',
      'Methane in the upper atmosphere absorbs red light, lending the planet its aquamarine hue.',
      'Encircled by 13 faint, vertical ring systems.'
    ],
    arabicFacts: [
      'يدور على جانبه بمحور دوران أفقي فريد يتدحرج به حول الشمس.',
      'يعود لونه الفيروزي الهادئ إلى امتصاص غاز الميثان للأطوال الموجية الحمراء.',
      'محاط بـ 13 حلقة رأسية باهتة و28 قمراً جليدياً.'
    ],
    spaceMissions: [
      { name: 'Voyager 2', year: '1986', agency: 'NASA', result: 'Only spacecraft to fly by Uranus so far' }
    ],
    surfaceFeatures: ['Verona Rupes (on Miranda)', 'Faint Ring System', 'South Polar Collar'],
    position: [2100, 520, -1800],
    cameraDistance: 75
  },
  {
    id: 'neptune',
    name: 'Neptune',
    arabicName: 'نبتون',
    subtitle: 'Windswept Azure Giant',
    arabicSubtitle: 'الكوكب الأزرق العميق ذو أسرع رياح في المجموعة',
    category: 'ice_giant',
    categoryLabelAr: 'عملاق جليدي أزرق عميق',
    radius: 19,
    color: '#3b82f6',
    glowColor: '#2563eb',
    diameter: '49,244 km',
    diameterKmNum: 49244,
    distanceFromSun: '4.50 Billion km (30.07 AU)',
    distanceAU: 30.07,
    orbitalPeriod: '164.79 Earth Years',
    orbitalVelocityKmS: '5.43 km/s',
    dayLength: '16h 06m 36s',
    temperature: '-218°C',
    gravity: '11.15 m/s² (1.14g)',
    gravityFactor: 1.14,
    moonsCount: 16,
    notableMoons: [
      { name: 'Triton', arabicName: 'تريتون', diameterKm: '2,706 km', discoveryYear: '1846', keyFact: 'Retrograde orbit with nitrogen ice geysers erupting 8 km into space' }
    ],
    atmosphere: '80.0% Hydrogen, 19.0% Helium, 1.5% Methane',
    atmosphericComposition: [
      { gas: 'Hydrogen (H₂)', arabicGas: 'هيدروجين', percentage: 80.0, color: '#3b82f6' },
      { gas: 'Helium (He)', arabicGas: 'هيليوم', percentage: 19.0, color: '#60a5fa' },
      { gas: 'Methane (CH₄)', arabicGas: 'ميثان', percentage: 1.5, color: '#1d4ed8' }
    ],
    description: 'The most distant major planet, a deep cobalt-blue world driven by supersonic atmospheric winds topping 2,100 km/h and home to cryovolcanic moon Triton.',
    arabicDescription: 'أبعد الكواكب الرئيسية عن الشمس، عملاق أزرق كحلي تعصف في غلافه أسرع رياح في النظام الشمسي تتجاوز سرعتها 2,100 كم/ساعة، ويرافقه قمر تريتون البركاني الجليدي.',
    facts: [
      'Discovered via mathematical calculations before ever being sighted in a telescope.',
      'Experiences the fastest winds in the Solar System, exceeding supersonic speeds of 2,100 km/h.',
      'Moon Triton orbits in a backwards retrograde direction and shoots liquid nitrogen geysers.'
    ],
    arabicFacts: [
      'تم اكتشافه عبر الحسابات الرياضية الفلكية قبل رؤيته بالتلسكوب لأول مرة.',
      'تعصف فيه أسرع رياح مسجلة في المجموعة الشمسية بسرعة تفوق 2,100 كم/س.',
      'يقذف قمره تريتون نافورات من النيتروجين السائل لارتفاع 8 كيلومترات.'
    ],
    spaceMissions: [
      { name: 'Voyager 2', year: '1989', agency: 'NASA', result: 'Historic flyby discovering Great Dark Spot and Triton geysers' }
    ],
    surfaceFeatures: ['Great Dark Spot', 'Scooter White Cloud', 'Small Dark Spot', 'Galle Ring'],
    position: [-2400, 310, -2100],
    cameraDistance: 75
  },
  {
    id: 'pluto',
    name: 'Pluto & Charon',
    arabicName: 'بلوتو وشارون',
    subtitle: 'Kuiper Belt World (Heart of Ice)',
    arabicSubtitle: 'الكوكب القزم الشهير ذو القلب الجليدي في حزام كايبر',
    category: 'dwarf',
    categoryLabelAr: 'كوكب قزم جليدي ثنائي',
    radius: 6,
    color: '#d97706',
    glowColor: '#b45309',
    diameter: '2,376 km',
    diameterKmNum: 2376,
    distanceFromSun: '5.91 Billion km (39.48 AU)',
    distanceAU: 39.48,
    orbitalPeriod: '247.9 Earth Years',
    orbitalVelocityKmS: '4.74 km/s',
    dayLength: '153.3 Hours (6.39 Earth Days)',
    temperature: '-230°C',
    gravity: '0.62 m/s² (0.063g)',
    gravityFactor: 0.063,
    moonsCount: 5,
    notableMoons: [
      { name: 'Charon', arabicName: 'شارون', diameterKm: '1,212 km', discoveryYear: '1978', keyFact: 'Half the size of Pluto, forming a binary dwarf planet system' }
    ],
    atmosphere: 'Thin Nitrogen, Methane, Carbon Monoxide (Sublimating)',
    atmosphericComposition: [
      { gas: 'Nitrogen (N₂)', arabicGas: 'نيتروجين', percentage: 99.0, color: '#d97706' },
      { gas: 'Methane (CH₄)', arabicGas: 'ميثان', percentage: 0.5, color: '#f59e0b' },
      { gas: 'Carbon Monoxide', arabicGas: 'أول أكسيد الكربون', percentage: 0.5, color: '#fde047' }
    ],
    description: 'The famed Kuiper Belt dwarf planet discovered in 1930, showcasing the bright nitrogen-ice glacier Sputnik Planitia in its iconic heart-shaped Tombaugh Regio.',
    arabicDescription: 'الكوكب القزم الأسطوري في حزام كايبر، يشتهر بقلبه الجليدي النيتروجيني الناصع (سبوتنيك بلانيتيا) وجباله الجليدية الشاهقة وقمره التوأم شارون.',
    facts: [
      'Features a massive heart-shaped nitrogen glacier known as Tombaugh Regio.',
      'Pluto and its largest moon Charon are mutually tidally locked, orbiting a shared barycenter.',
      'Its tilted orbit occasionally brings it closer to the Sun than Neptune.'
    ],
    arabicFacts: [
      'يحتضن معلماً شهيراً على شكل قلب من جليد النيتروجين يسمى (تومبو ريجيو).',
      'يشكل مع قمره شارون نظاماً ثنائياً مقيداً مدياً يواجه فيه كل منهما الآخر دائماً.',
      'مداره البيضاوي المائل يجعله يقترب من الشمس أحياناً أكثر من نبتون.'
    ],
    spaceMissions: [
      { name: 'New Horizons', year: '2015', agency: 'NASA', result: 'Historic high-resolution close flyby of Pluto and Charon' }
    ],
    surfaceFeatures: ['Sputnik Planitia', 'Hillary Montes', 'Norgay Montes', 'Cthulhu Macula'],
    position: [2800, -650, -2500],
    cameraDistance: 30
  }
];

export function getCelestialBodyById(id: string): CelestialBodyData | undefined {
  return SOLAR_SYSTEM_DATA.find(b => b.id.toLowerCase() === id.toLowerCase());
}

export function calculateWeightOnBody(weightKg: number, bodyId: string): number {
  const body = getCelestialBodyById(bodyId);
  if (!body) return weightKg;
  return Number((weightKg * body.gravityFactor).toFixed(1));
}
