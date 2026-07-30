import type { Group, Color } from "three";

export interface ModelEntry {
  id: string;
  title: string;
  description: string;
  load: () => Promise<{
    createModel: (opts?: { shadows?: boolean }) => Group;
    createLights?: () => Group;
    background?: () => Color;
  }>;
}

export const MODEL_GALLERY: ModelEntry[] = [
  {
    id: "sony-wf-1000xm3",
    title: "Sony WF-1000XM3",
    description:
      "True-wireless earbuds and charging case, rebuilt from primitives — extruded stadium body with pierced oval wells, copper lid with engraved SONY wordmark, satin-graphite earbuds with copper accents, gold pogo pins. Looping ~11s animation: lid opens, buds rise and spin, settle back, lid closes.",
    load: () =>
      import("./models/sony-wf-1000xm3").then((m) => ({
        createModel: (opts) => m.createSonyWf1000xm3Model(opts),
        createLights: m.createSonyWf1000xm3LookDevLights,
        background: m.makeSonyBackground,
      })),
  },
  {
    id: "cambodia-fuel-tracker-badge",
    title: "Cambodia Fuel Tracker Badge",
    description:
      "A commemorative badge-coin with Cambodia flag colours — gold-rimmed circular body, blue face with red band, stylised Cambodia map silhouette, fuel-drop motif with emissive pulse, and encircling Khmer/English text. Looping ~8s animation: gentle breathing scale pulse, fuel-drop emissive glow oscillates.",
    load: () =>
      import("./models/createCambodiaFuelTrackerBadgeModel").then((m) => ({
        createModel: (opts) => m.createCambodiaFuelTrackerBadgeModel(opts),
        createLights: m.createFuelTrackerLookDevLights,
        background: m.makeFuelTrackerBackground,
      })),
  },
  {
    id: "coffee-mug",
    title: "Coffee Mug",
    description:
      "Ceramic coffee mug on a saucer — glossy body with rolled rim and looped handle, dark coffee surface with faint crema swirl. Three steam wisps rise and dissipate on staggered ~4s cycles with a gentle idle sway.",
    load: () =>
      import("./models/createCoffeeMugModel").then((m) => ({
        createModel: (opts) => m.createCoffeeMugModel(opts),
        createLights: m.createCoffeeMugLookDevLights,
        background: m.makeCoffeeMugBackground,
      })),
  },
  {
    id: "padlock",
    title: "Brushed-Steel Padlock",
    description:
      "Brushed-steel padlock with rounded body, engraved keyhole, status LED window, and a pivoting shackle. Looping ~5s animation: shackle unlatches and swings open, LED flips green→amber, holds, then swings shut and LED resets.",
    load: () =>
      import("./models/createPadlockModel").then((m) => ({
        createModel: (opts) => m.createPadlockModel(opts),
        createLights: m.createPadlockLookDevLights,
        background: m.makePadlockBackground,
      })),
  },
  {
    id: "mechanical-watch",
    title: "Mechanical Watch",
    description:
      "Brushed-steel wristwatch with fluted bezel, sunburst dial with applied hour markers, blued sweeping hands, knurled crown, and stitched leather strap. Continuous animation: second hand sweeps in real time, minute/hour hands advance, case has a faint wrist-tilt idle.",
    load: () =>
      import("./models/createMechanicalWatchModel").then((m) => ({
        createModel: (opts) => m.createMechanicalWatchModel(opts),
        createLights: m.createMechanicalWatchLookDevLights,
        background: m.makeMechanicalWatchBackground,
      })),
  },
  {
    id: "potted-succulent",
    title: "Potted Succulent",
    description:
      "Echeveria-style succulent in a lathed terracotta pot with rolled rim and drainage saucer — soil cap, rosette of tapered leaves in three staggered rings around a central bud, plus small offset pups at the base.",
    load: () =>
      import("./models/createPottedSucculentModel").then((m) => ({
        createModel: (opts) => m.createPottedSucculentModel(opts),
        createLights: m.createPottedSucculentLookDevLights,
        background: m.makePottedSucculentBackground,
      })),
  },
  {
    id: "desk-lamp",
    title: "Articulated Desk Lamp",
    description:
      "Balanced-arm desk lamp — weighted disc base, two pivoting arm segments with visible spring coils, tilting head with warm emissive bulb and soft light cone. Looping ~9s animation: lamp nods down, clicks on, holds, lifts back up and clicks off.",
    load: () =>
      import("./models/createDeskLampModel").then((m) => ({
        createModel: (opts) => m.createDeskLampModel(opts),
        createLights: m.createDeskLampLookDevLights,
        background: m.makeDeskLampBackground,
      })),
  },
  {
    id: "drone",
    title: "Quadcopter Drone",
    description:
      "Consumer quadcopter — matte carbon-fibre body with gimbal camera, four arms ending in motor nacelles with spinning props (additive double-blades at speed), red/green alternating nav lights, and landing skids.",
    load: () =>
      import("./models/createDroneModel").then((m) => ({
        createModel: (opts) => m.createDroneModel(opts),
        createLights: m.createDroneLookDevLights,
        background: m.makeDroneBackground,
      })),
  },
  {
    id: "turntable",
    title: "Vinyl Turntable",
    description:
      "Belt-drive turntable — walnut-veneer plinth, aluminium platter with spinning record, etched label and groove rings, counterweighted tonearm that swings from rest to record edge and lowers the stylus, backlit power LED. Looping ~10s animation: platter spins, tonearm lifts, swings in, drops, plays, then returns to rest.",
    load: () =>
      import("./models/createTurntableModel").then((m) => ({
        createModel: (opts) => m.createTurntableModel(opts),
        createLights: m.createTurntableLookDevLights,
        background: m.makeTurntableBackground,
      })),
  },
  {
    id: "treasure-chest",
    title: "Treasure Chest",
    description:
      "Pirate-style treasure chest — plank-textured wooden body with riveted iron straps, domed lid on rear hinge, front latch, jumbled pile of gold coins and gems inside. Looping ~7s animation: latch flips, lid swings up, holds as gold glints, swings shut, latch re-engages.",
    load: () =>
      import("./models/createTreasureChestModel").then((m) => ({
        createModel: (opts) => m.createTreasureChestModel(opts),
        createLights: m.createTreasureChestLookDevLights,
        background: m.makeTreasureChestBackground,
      })),
  },
  {
    id: "hot-air-balloon",
    title: "Hot Air Balloon",
    description:
      "Gore-panelled envelope with alternating colour wedges, rigging net and load lines to a wicker-textured basket, burner with flaring flame (scale + emissive pulse) on a firing cycle. Looping ~8s animation: burner fires twice with bright flare, balloon rocks and drifts with slow turn as if airborne.",
    load: () =>
      import("./models/createHotAirBalloonModel").then((m) => ({
        createModel: (opts) => m.createHotAirBalloonModel(opts),
        createLights: m.createHotAirBalloonLookDevLights,
        background: m.makeHotAirBalloonBackground,
      })),
  },
  {
    id: "dna-helix",
    title: "DNA Double Helix",
    description:
      "Double-helix DNA strand — two intertwined sugar-phosphate backbone tubes (cyan and terracotta), evenly spaced base-pair rungs coloured by nucleotide type (adenine-thymine, cytosine-guanine), and a travelling scan highlight that sweeps up and down the strand like a replication scan. Looping ~12s animation: helix rotates steadily, bobs gently, and a bright band of rungs travels back and forth along the strand.",
    load: () =>
      import("./models/createDnaHelixModel").then((m) => ({
        createModel: (opts) => m.createDnaHelixModel(opts),
        createLights: m.createDnaHelixLookDevLights,
        background: m.makeDnaHelixBackground,
      })),
  },
  {
    id: "globe",
    title: "Desktop World Globe",
    description:
      "Desktop world globe on a brass meridian stand — textured ocean with stylised continents, a semi-transparent cloud layer drifting past, a fixed brass meridian ring and turned-wood base with brass trim. Looping animation: globe spins steadily on its 23.5° tilted axis while clouds drift at a slightly different rate, and the whole assembly rocks gently as if resting on a desk.",
    load: () =>
      import("./models/createGlobeModel").then((m) => ({
        createModel: (opts) => m.createGlobeModel(opts),
        createLights: m.createGlobeLookDevLights,
        background: m.makeGlobeBackground,
      })),
  },
  {
    id: "solar-system",
    title: "Solar System Model",
    description:
      "Simplified tabletop solar system — an emissive sun with gentle glow pulse, six orbiting planets each spinning on their own axis, thin orbit-path rings, a banded gas-giant texture for Jupiter and Saturn, a moon circling Earth, and Saturn's tilted ring system. Looping animation: every planet orbits at speed roughly proportional to its real relative period (inner planets faster) and spins on its own axis.",
    load: () =>
      import("./models/createSolarSystemModel").then((m) => ({
        createModel: (opts) => m.createSolarSystemModel(opts),
        createLights: m.createSolarSystemLookDevLights,
        background: m.makeSolarSystemBackground,
      })),
  },
  {
    id: "volcano",
    title: "Erupting Volcano",
    description:
      "Erupting volcano diorama — noise-textured rock cone rising from a mossy ground disc, a glowing lava lake in the crater with a lava-flow streak down one flank, a drifting smoke plume built from soft layered spheres, and embers that pop and arc up out of the crater. Looping ~9s animation: crater glow pulses steadily, smoke puffs rise and fade, and every cycle a stronger eruption burst sends embers higher and briefly brightens the crater.",
    load: () =>
      import("./models/createVolcanoModel").then((m) => ({
        createModel: (opts) => m.createVolcanoModel(opts),
        createLights: m.createVolcanoLookDevLights,
background: m.makeVolcanoBackground,
      })),
    },
    {
      id: "apple-watch",
      title: "Apple Watch",
      description:
        "Rounded-square titanium Apple Watch with sapphire-glass display, a live watch face, knurled Digital Crown, side button, and a sport band curving from the top and bottom lugs. Looping ~8s animation: second hand sweeps in real time, screen brightens on 'raise to wake', Digital Crown gives a small idle turn, band sways gently.",
      load: () =>
        import("./models/createAppleWatchModel").then((m) => ({
          createModel: (opts) => m.createAppleWatchModel(opts),
          createLights: m.createAppleWatchLookDevLights,
          background: m.makeAppleWatchBackground,
        })),
    },
    {
      id: "apple-vision-pro",
      title: "Apple Vision Pro",
      description:
        "Apple Vision Pro with curved 3D laminated-glass front wrapped in a light aluminum-alloy frame, dark foam Light Seal, Dual Loop Band, knurled Digital Crown + top button, and a separate battery pack tethered by a braided cable. Looping ~9s animation: slow turntable sway, EyeSight glass brightens on approach and fades to mirror, Digital Crown idles, battery pack bobs.",
      load: () =>
        import("./models/createAppleVisionProModel").then((m) => ({
          createModel: (opts) => m.createAppleVisionProModel(opts),
          createLights: m.createAppleVisionProLookDevLights,
          background: m.makeAppleVisionProBackground,
        })),
    },
    {
      id: "imac",
      title: "iMac (24-inch)",
      description:
        "24-inch iMac all-in-one with thin white forehead/chin bezel, edge-to-edge glass, saturated color-matched aluminum back shell, slim chrome foot arm and round base, plus a wallpaper desktop with a dock row. Looping ~10s animation: slow turntable, wallpaper hue drifts through its gradient, soft specular sweep crosses the glass, dock icons bounce gently one at a time.",
      load: () =>
        import("./models/createImacModel").then((m) => ({
          createModel: (opts) => m.createImacModel(opts),
          createLights: m.createImacLookDevLights,
          background: m.makeImacBackground,
        })),
    },
    {
      id: "ipad",
      title: "iPad",
      description:
        "Thin aluminum unibody iPad with edge-to-edge display, front camera dot, single back camera lens, volume rocker + top button, USB-C slot, and an Apple Pencil magnetically docked to the side edge with a soft charge-ring pulse. Looping ~9s animation: slow turntable, screen wallpaper glow breathes, Pencil lifts, hovers, and snaps back onto its magnetic edge.",
      load: () =>
        import("./models/createIpadModel").then((m) => ({
          createModel: (opts) => m.createIpadModel(opts),
          createLights: m.createIpadLookDevLights,
          background: m.makeIpadBackground,
        })),
    },
    {
      id: "angkor-wat",
      title: "Angkor Wat Miniature",
      description:
        "Stylised low-poly miniature of Angkor Wat — tiered sandstone terraces, a quincunx of prasat towers, causeway and moat, with looping ambient animation (circling egrets, water shimmer, warm light pulse).",
      load: () =>
        import("./models/createAngkorWatModel").then((m) => ({
          createModel: (opts) => m.createAngkorWatModel(opts),
          createLights: m.createAngkorWatLookDevLights,
          background: m.makeAngkorWatBackground,
        })),
    },
    {
      id: "bayon",
      title: "Bayon Temple",
      description:
        "Stylised Bayon temple with clustered face-towers, colonnaded galleries, flickering braziers and drifting smoke — procedural face decals and a slow warm pulse animation.",
      load: () =>
        import("./models/createBayonModel").then((m) => ({
          createModel: (opts) => m.createBayonModel(opts),
          createLights: m.createBayonLookDevLights,
          background: m.makeBayonBackground,
        })),
    },
    {
      id: "wat-phnom",
      title: "Wat Phnom",
      description:
        "Wat Phnom miniature — grassy mound with a bell-stupa at the summit, winding stair, flanking vihara and circling birds; gentle looping ambient motion and gold-spire glint.",
      load: () =>
        import("./models/createWatPhnomModel").then((m) => ({
          createModel: (opts) => m.createWatPhnomModel(opts),
          createLights: m.createWatPhnomLookDevLights,
          background: m.makeWatPhnomBackground,
        })),
    },
    {
      id: "ta-prohm",
      title: "Ta Prohm Ruins",
      description:
        "Ta Prohm jungle-ruin diorama — crumbling sandstone gallery entwined with a giant tree, drifting leaves and a slow canopy sway; atmospheric look-dev.",
      load: () =>
        import("./models/createTaProhmModel").then((m) => ({
          createModel: (opts) => m.createTaProhmModel(opts),
          createLights: m.createTaProhmLookDevLights,
          background: m.makeTaProhmBackground,
        })),
    },
    {
      id: "banteay-srei",
      title: "Banteay Srei",
      description:
        "Banteay Srei miniature — delicate pink sandstone temple with ornate carved panels and stepped terraces; warm morning light and subtle idle animation.",
      load: () =>
        import("./models/createBanteaySreiModel").then((m) => ({
          createModel: (opts) => m.createBanteaySreiModel(opts),
          createLights: m.createBanteaySreiLookDevLights,
          background: m.makeBanteaySreiBackground,
        })),
    },
    {
      id: "preah-vihear",
      title: "Preah Vihear Temple",
      description:
        "Preah Vihear cliff-top temple miniature — long colonnaded approach, pronounced axial composition and sunlit stone surfaces with soft atmospheric haze.",
      load: () =>
        import("./models/createPreahVihearModel").then((m) => ({
          createModel: (opts) => m.createPreahVihearModel(opts),
          createLights: m.createPreahVihearLookDevLights,
          background: m.makePreahVihearBackground,
        })),
    },
    {
      id: "koh-ker",
      title: "Koh Ker Temple",
      description:
        "Koh Ker stepped pyramid miniature — bold stepped terraces and a central prasat tower rising above a compact ceremonial plaza, with dry-season lighting.",
      load: () =>
        import("./models/createKohKerModel").then((m) => ({
          createModel: (opts) => m.createKohKerModel(opts),
          createLights: m.createKohKerLookDevLights,
          background: m.makeKohKerBackground,
        })),
    },
    {
      id: "sambor-prei-kuk",
      title: "Sambor Prei Kuk",
      description:
        "Sambor Prei Kuk temple cluster miniature — group of early brick prasats, ruined courtyards and tropical undergrowth; soft warm tones and subtle idle motion.",
      load: () =>
        import("./models/createSamborPreiKukModel").then((m) => ({
          createModel: (opts) => m.createSamborPreiKukModel(opts),
          createLights: m.createSamborPreiKukLookDevLights,
          background: m.makeSamborPreiKukBackground,
        })),
    },
  ];
