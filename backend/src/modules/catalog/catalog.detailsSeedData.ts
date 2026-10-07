/**
 * Details-page content for the 30 launch services (n04): gallery, inclusions, exclusions, FAQs.
 *
 * - Image paths are served by the frontend from frontend/public (a test checks every file exists).
 * - The first image is the main one: it matches the service card where the card photo is landscape. A service
 *   with a single photo has no thumbnails. Extra photos come from the same category's set in public/images.
 * - The copy is launch placeholder text written from each service's catalog description. It makes no
 *   claims about pricing, refunds or cancellation, and the product team should review it before go-live.
 */
export interface ServiceDetailsSeed {
  images: string[];
  inclusions: string[];
  exclusions: string[];
  faqs: [question: string, answer: string][];
}

const IMG = '/images/';

/**
 * Files in frontend/public/images that must NOT appear in a gallery, and why. A test fails if one is used.
 * (Numbered sets such as plumbing-2.jpg are stock photos: check the licence before adding more.)
 */
export const UNSUITABLE_IMAGES: Record<string, string> = {
  'plumbing-2.jpg': 'visible Getty Images watermark',
  'plumbing-4.jpg': 'visible Shutterstock watermark',
  'painting.jpg': 'framed artwork, not wall painting',
  'painting-2.jpg': 'framed artwork, not wall painting',
  'painting-3.jpg': 'framed artwork, not wall painting (also tiny)',
  'painting-4.jpg': 'framed artwork, not wall painting',
  'deep-cleaning.jpg': 'blog banner with text baked into the image',
  'deep-cleaning-2.jpg': 'cleaning an office, not a home',
  'blog-cleaning.jpg': 'blog graphic',
  'blog-maintenance.jpg': 'blog graphic with text',
  'pestControl.png': 'promo banner (text and icons, 4:1 crop)',
  'TermiteTreatment.png': 'promo banner (text and icons, 4:1 crop)',
  'bathroom-cleaning-2.jpg': 'only 300 x 300, blurry full screen',
  'kitchen-cleaning-3.jpg': 'letterboxed screenshot',
  'kitchen-cleaning-4.jpg': 'cooking, not cleaning (and only 397 px wide)',
  'background.png': 'page background',
};

export const SERVICE_DETAILS_SEED: Record<string, ServiceDetailsSeed> = {
  // ---- Home Cleaning
  'deep-home-cleaning': {
    images: [`${IMG}home-cleaning.jpg`, `${IMG}deep-cleaning-3.jpg`, `${IMG}deep-cleaning-4.jpg`, `${IMG}home-cleaning-2.jpg`],
    inclusions: ['Dusting of ceilings, fans, walls and fittings', 'Scrubbing and mopping of all floors', 'Kitchen platform, sink and cabinet exteriors cleaned', 'Bathrooms descaled and sanitised', 'Interior window glass and frames wiped'],
    exclusions: ['Exterior window and balcony-grill cleaning at height', 'Inside of cabinets and the refrigerator', 'Moving heavy furniture or appliances'],
    faqs: [
      ['Do I need to be at home during the service?', 'Someone should be there to let the team in and point out priority areas. You do not need to supervise the work.'],
      ['Do I need to provide cleaning supplies?', 'No. The team brings the equipment and materials for the standard service. Optional add-ons are listed on this page.'],
    ],
  },
  'sofa-carpet-shampooing': {
    images: [`${IMG}home-cleaning.jpg`, `${IMG}home-cleaning-3.jpg`, `${IMG}home-cleaning-4.jpg`],
    inclusions: ['Vacuuming of loose dust and debris', 'Machine shampooing of sofas or carpets', 'Spot treatment of light stains', 'Fabric-safe finishing'],
    exclusions: ['Set-in or old stains (see the Stain Treatment add-on)', 'Curtain and mattress cleaning', 'Furniture repair'],
    faqs: [
      ['How long until the sofa or carpet is dry?', 'Fabric usually needs several hours to dry fully. Keep the room ventilated and avoid sitting on it until it is dry to the touch.'],
      ['Will it remove old stains?', 'Fresh and light stains usually come out. Set-in stains may need the Stain Treatment add-on, and results vary by fabric.'],
    ],
  },
  'bathroom-deep-cleaning': {
    images: [`${IMG}bathroom-deep-cleaning.png`, `${IMG}bathroom-cleaning-3.jpg`, `${IMG}bathroom-cleaning-4.jpg`, `${IMG}bathroom-cleaning.jpg`],
    inclusions: ['Descaling of tiles, taps and fittings', 'Toilet seat and pan scrubbed and disinfected', 'Mirror, sink and glass cleaned', 'Floor and drain scrubbed', 'Disinfectant finish'],
    exclusions: ['Plumbing repairs or leak fixing', 'Grout re-filling or tile polishing', 'Replacement of fittings'],
    faqs: [
      ['How many bathrooms does one booking cover?', 'The listed price is for one bathroom. For more than one, book each separately or increase the quantity when you book.'],
      ['When can I use the bathroom again?', 'Once the floor is dry. Open a window or run the exhaust fan to clear the disinfectant smell.'],
    ],
  },
  'kitchen-deep-cleaning': {
    images: [`${IMG}kitchen-deep-cleaning.png`, `${IMG}kitchen-cleaning-2.jpg`, `${IMG}kitchen-cleaning.jpg`],
    inclusions: ['Chimney and hob degreased', 'Cabinet exteriors and open shelves wiped', 'Tiles and backsplash descaled', 'Sink and countertop scrubbed and sanitised', 'Floor scrubbed'],
    exclusions: ['Cleaning inside the refrigerator', 'Chimney filter replacement or repair', 'Dismantling or servicing of appliances'],
    faqs: [
      ['What should I do before the team arrives?', 'Clear the countertop and any shelves you want cleaned, and keep food items covered or put away.'],
      ['Is the chimney cleaned too?', 'Yes. The chimney and hob are degreased as part of the service.'],
    ],
  },
  'full-home-sanitization': {
    images: [`${IMG}full-home-sanitization.png`, `${IMG}home-cleaning-4.jpg`, `${IMG}home-cleaning-3.jpg`],
    inclusions: ['Odourless disinfectant spray across rooms', 'Door handles, switches and railings treated', 'Sofas, beds and upholstery lightly sprayed', 'Kitchen and bathroom surfaces covered'],
    exclusions: ['Deep scrubbing or stain removal', 'Pest control treatment', 'Sanitising the inside of appliances or electronics'],
    faqs: [
      ['Do I need to move furniture?', 'No. Clear valuables and fragile items from surfaces so every area can be sprayed.'],
      ['How long should children and pets stay out?', 'Keep them out of treated rooms until the surfaces are dry. The professional will tell you when it is fine to return.'],
    ],
  },

  // ---- Appliance Repair & Service
  'ac-service-gas-refill': {
    images: [`${IMG}appliance-repair.jpg`, `${IMG}appliance-repair-4.jpg`, `${IMG}appliance-repair-2.jpg`, `${IMG}appliance-repair-3.jpg`],
    inclusions: ['Jet-wash of the indoor unit and filters', 'Outdoor unit cleaning', 'Cooling and gas-pressure check', 'Drain line check', 'Performance test after service'],
    exclusions: ['Gas top-up (optional add-on)', 'Filter replacement (optional add-on)', 'Installation, uninstallation or relocation', 'Electrical wiring repair'],
    faqs: [
      ['Is the gas top-up included in the price?', 'The base price covers the service and a gas-pressure check. A top-up is an optional add-on if the check shows it is needed.'],
      ['What should I do before the technician arrives?', 'Switch the AC off and clear the space around the indoor unit. Keep a stool or ladder area free if you can.'],
    ],
  },
  'ro-water-purifier-service': {
    images: [`${IMG}appliance-repair.jpg`, `${IMG}appliance-repair-2.jpg`, `${IMG}appliance-repair-3.jpg`, `${IMG}appliance-repair-4.jpg`],
    inclusions: ['Pre-filter and sediment filter check', 'Membrane flush', 'TDS test of the water', 'Leak and pressure check'],
    exclusions: ['Filter and membrane replacement (see the Filter Change add-on)', 'Installation or relocation of the purifier', 'Repair of the purifier body or electronics'],
    faqs: [
      ['Do the filters need replacing at every service?', 'Not always. The technician checks the filters and TDS and recommends replacement only if needed.'],
      ['Can I drink the water right after the service?', 'The system is flushed during service. The technician will tell you if the first batch of water should be discarded.'],
    ],
  },
  'washing-machine-repair': {
    images: [`${IMG}washing-machine-repair.png`, `${IMG}appliance-repair-4.jpg`, `${IMG}appliance-repair.jpg`],
    inclusions: ['Diagnosis of the fault', 'Check of drum, drain pump, inlet valve and belt', 'On-the-spot minor repairs', 'Test run after repair'],
    exclusions: ['Cost of spare parts', 'Major component replacement', 'Installation or relocation'],
    faqs: [
      ['Does it cover front-load and top-load machines?', 'Yes, both front-load and top-load machines are covered.'],
      ['Do I pay for spare parts separately?', 'Yes. The visit covers diagnosis and minor repairs. If a part needs replacing, the technician will share its cost before replacing it.'],
    ],
  },
  'refrigerator-repair': {
    images: [`${IMG}refrigerator-repair.png`, `${IMG}appliance-repair.jpg`, `${IMG}appliance-repair-2.jpg`],
    inclusions: ['Cooling performance check', 'Compressor and thermostat check', 'Door-seal inspection', 'On-the-spot minor repair'],
    exclusions: ['Cost of spare parts', 'Major compressor or gas work', 'Moving or relocating the refrigerator'],
    faqs: [
      ['Should I empty the refrigerator first?', 'Not fully, but keep a cooler or space ready for perishables in case the technician needs to switch it off or pull it out.'],
      ['What if a spare part is not available during the visit?', 'The technician will explain what is needed and the next steps, and share the part cost.'],
    ],
  },
  'microwave-oven-repair': {
    images: [`${IMG}microwave-oven-repair.png`, `${IMG}appliance-repair-3.jpg`, `${IMG}appliance-repair-2.jpg`],
    inclusions: ['Fault diagnosis', 'Check of door switch, turntable and heating', 'On-the-spot minor repair', 'Safety check after repair'],
    exclusions: ['Cost of spare parts', 'Cosmetic repair of panels or the cavity', 'Installation or relocation'],
    faqs: [
      ['Which microwave ovens are covered?', 'Solo, grill and convection ovens.'],
      ['Is it worth repairing an older oven?', 'The technician diagnoses the fault and shares the repair cost so you can decide.'],
    ],
  },

  // ---- Salon & Spa
  'at-home-spa-for-women': {
    images: [`${IMG}Home-spa-women-banner.jpg`, `${IMG}full-body-massage.png`],
    inclusions: ['Relaxing spa session of about 2 hours', 'Trained therapist visits your home'],
    exclusions: ['Aromatherapy oils (optional add-on)', 'Facials, waxing or other beauty services'],
    faqs: [
      ['What should I prepare?', 'A clean, quiet room with enough space to lie down comfortably.'],
      ['Can I tell the therapist about allergies?', 'Yes. Share any skin sensitivities or allergies at the start of the session so the therapist can adjust.'],
    ],
  },
  'mens-haircut-grooming': {
    images: [`${IMG}mens-haircut-grooming.png`],
    inclusions: ['Haircut', 'Beard trim', 'Head massage', 'Neck and hair clean-up'],
    exclusions: ['Hair colouring or treatments', 'Facials or waxing'],
    faqs: [
      ['Do I need to arrange a chair or mirror?', 'A chair and a mirror make it easier. The professional brings the grooming tools.'],
      ['Can I choose my style?', 'Yes. Tell the professional the style you want at the start of the session.'],
    ],
  },
  'full-body-massage': {
    images: [`${IMG}full-body-massage.png`, `${IMG}Home-spa-women-banner.jpg`],
    inclusions: ['Swedish or deep-tissue massage of your choice', 'Session of about 90 minutes', 'Certified therapist'],
    exclusions: ['Medical or physiotherapy treatment', 'Time beyond the booked duration'],
    faqs: [
      ['Swedish or deep-tissue: which should I pick?', 'Swedish is gentler and relaxing. Deep-tissue uses firmer pressure for tight muscles. Tell the therapist your preference at the start.'],
      ['Is it suitable if I have an injury or medical condition?', 'Tell the therapist before the session starts. For injuries or medical conditions, check with your doctor first.'],
    ],
  },
  'bridal-makeup': {
    images: [`${IMG}bridal-makeup.png`],
    inclusions: ['Complete bridal makeup', 'Hairstyling', 'Senior makeup artist'],
    exclusions: ['Makeup trial before the event', 'Services for other members of the bridal party'],
    faqs: [
      ['How early should the artist arrive?', 'The session is booked for about 3 hours. Choose a slot that finishes before you need to leave.'],
      ['Can I share reference looks?', 'Yes. Show your reference photos and mention your skin type or any allergies at the start.'],
    ],
  },

  // ---- Electrical & Plumbing
  'electrician-visit-general': {
    images: [`${IMG}electrical.jpg`, `${IMG}electrical-2.jpg`, `${IMG}electrical-3.jpg`, `${IMG}electrical-4.jpg`],
    inclusions: ['Visit and fault diagnosis', 'Check of switches, wiring points and fans', 'Minor repairs on the spot', 'Safety check'],
    exclusions: ['Cost of spare parts', 'Fixture installation (optional add-on)', 'Major rewiring or panel work'],
    faqs: [
      ['What does the visit price cover?', 'The technician\'s time for diagnosis and minor faults. Parts and larger jobs are quoted separately.'],
      ['Can I get a fixture installed during the visit?', 'Yes. Add Fixture Installation when you book.'],
    ],
  },
  'fan-light-installation': {
    images: [`${IMG}electrical.jpg`, `${IMG}electrical-3.jpg`, `${IMG}electrical-2.jpg`],
    inclusions: ['Ceiling fan, tube light or decorative light fitting', 'Mounting and wiring connection', 'Test after installation'],
    exclusions: ['The fan or light fixture itself', 'Chasing walls or new wiring runs', 'False-ceiling cutting or repair'],
    faqs: [
      ['Do I need to buy the fan or light beforehand?', 'Yes. Keep the fixture ready; the visit covers fitting it.'],
      ['Can the old fan or light be replaced?', 'Yes. Tell the technician on arrival and they will remove the old fitting and fit the new one.'],
    ],
  },
  'plumbing-tap-leak-repair': {
    images: [`${IMG}blog-plumbing.jpg`, `${IMG}plumbing-3.jpg`, `${IMG}plumbing.jpg`],
    inclusions: ['Inspection of the leak', 'Tap, pipe or flush-tank leak repair', 'Spare fitting for the repair', 'Check after repair'],
    exclusions: ['Concealed-pipe or pipe replacement work', 'Breaking and restoring walls or tiles', 'New taps or fixtures'],
    faqs: [
      ['What should I do before the plumber arrives?', 'Close the main valve if the leak is serious, and clear access to the tap or pipe.'],
      ['Is the spare fitting included?', 'Yes, for the minor repair described. Larger replacements are quoted separately.'],
    ],
  },
  'geyser-installation-repair': {
    images: [`${IMG}geyser-installation-repair.png`, `${IMG}blog-plumbing.jpg`, `${IMG}plumbing-3.jpg`],
    inclusions: ['Installation or replacement of electric and gas geysers', 'Diagnosis and repair of faults', 'Connection and test run'],
    exclusions: ['The geyser unit and its spare parts', 'Pipe or wiring extensions', 'Wall or tile restoration'],
    faqs: [
      ['Do I need to buy the geyser first?', 'For installation or replacement, yes. Keep the unit ready. For repairs, the technician will quote any parts first.'],
      ['Are both electric and gas geysers covered?', 'Yes, both are covered.'],
    ],
  },
  'water-tank-cleaning': {
    images: [`${IMG}water-tank-cleaning.png`],
    inclusions: ['Mechanised scrubbing of the tank', 'Disinfection', 'Overhead and sump tanks'],
    exclusions: ['Tank repair or waterproofing', 'Cleaning of household pipes'],
    faqs: [
      ['Will I be without water during the service?', 'The tank is emptied and cleaned, so supply from that tank is paused during the visit. Store some water in advance.'],
      ['How often should a tank be cleaned?', 'A common guideline is every six months, though it depends on water quality and the condition of the tank.'],
    ],
  },

  // ---- Painting & Waterproofing
  'room-painting-per-room': {
    images: [`${IMG}room-painting-per-room.png`, `${IMG}painting-category.png`, `${IMG}texture-accent-wall.png`],
    inclusions: ['Interior wall painting for one room', 'Furniture covering and floor protection', 'Clean-up after the work'],
    exclusions: ['Wall putty and primer (optional add-on)', 'Repair of cracks, damp or seepage'],
    faqs: [
      ['How long does it take?', 'Plan for a full day for one room. The service is booked for about 8 hours.'],
      ['Do I need to empty the room?', 'Move small items and valuables out. The team covers furniture that stays.'],
    ],
  },
  'terrace-waterproofing': {
    images: [`${IMG}terrace-waterproofing.png`, `${IMG}room-painting-per-room.png`],
    inclusions: ['Crack filling', 'Waterproof coating for the terrace or roof', 'Surface cleaning before coating'],
    exclusions: ['Structural repair', 'Tile or flooring replacement'],
    faqs: [
      ['How long is the visit?', 'The service is booked for about 10 hours. Clear the area of furniture and plants beforehand.'],
      ['When can I use the terrace again?', 'The coating needs time to cure. The professional will tell you how long to keep off it.'],
    ],
  },
  'texture-accent-wall': {
    images: [`${IMG}texture-accent-wall.png`, `${IMG}painting-category.png`, `${IMG}room-painting-per-room.png`],
    inclusions: ['Designer texture finish on one feature wall', 'Surface preparation', 'Masking and clean-up'],
    exclusions: ['Painting of other walls', 'Wall repair'],
    faqs: [
      ['Can I choose the design?', 'Yes. Pick a texture with the professional at the start, and share reference images to help.'],
      ['Does it cover more than one wall?', 'No. The service covers a single feature wall.'],
    ],
  },

  // ---- Pest Control
  'general-pest-control': {
    images: [`${IMG}pest-control-clean.png`, `${IMG}full-home-sanitization.png`, `${IMG}mosquito-fogging.png`],
    inclusions: ['Odourless spray treatment', 'Cockroaches, ants and common household pests', 'Kitchen, bathrooms and living areas covered'],
    exclusions: ['Termite treatment (optional add-on)', 'Bed bug treatment (separate service)', 'Mosquito fogging (separate service)'],
    faqs: [
      ['Do I need to leave the house?', 'Keep children, pets and uncovered food out of the treated areas. The technician will say when it is fine to return.'],
      ['How soon will I see results?', 'You may still see pests for a few days while the treatment takes effect.'],
    ],
  },
  'termite-treatment': {
    images: [`${IMG}termite-treatment-clean.png`, `${IMG}pest-control-clean.png`],
    inclusions: ['Inspection of affected areas', 'Drill-and-inject anti-termite treatment', '1-year warranty'],
    exclusions: ['Repair of damaged wood or furniture', 'Wood polishing or repainting'],
    faqs: [
      ['Is there a warranty?', 'Yes. The treatment comes with a 1-year warranty. Ask the technician for the terms on the day.'],
      ['Will walls or floors be drilled?', 'Small holes are drilled near affected areas to inject the treatment.'],
    ],
  },
  'mosquito-fogging': {
    images: [`${IMG}mosquito-fogging.png`, `${IMG}pest-control-clean.png`],
    inclusions: ['Thermal fogging for homes', 'Balconies and gardens', 'Quick visit of about 30 minutes'],
    exclusions: ['Draining or cleaning stagnant water', 'Treatment for other insects'],
    faqs: [
      ['Should I close doors and windows?', 'Yes. Keep windows closed during fogging and for a while after, as the technician advises.'],
      ['How long does the effect last?', 'Fogging reduces adult mosquitoes for a limited period. Removing standing water helps the effect last longer.'],
    ],
  },
  'bed-bug-treatment': {
    images: [`${IMG}bed-bug-treatment.png`, `${IMG}pest-control-clean.png`, `${IMG}full-home-sanitization.png`],
    inclusions: ['Two-step heat and spray treatment', 'Beds, sofas and wardrobes covered', 'Inspection of affected areas'],
    exclusions: ['Washing of linen and clothes', 'Replacement of infested mattresses'],
    faqs: [
      ['How should I prepare the room?', 'Strip the bedding and keep it ready to wash on a hot setting. Clear the area around beds and sofas.'],
      ['Will one visit be enough?', 'The treatment has two steps in a single visit. Severe infestations may need a follow-up, which the technician will advise.'],
    ],
  },

  // ---- Carpentry & Furniture Assembly
  'furniture-assembly': {
    images: [`${IMG}home-maintenance.jpg`, `${IMG}home-maintenance-2.jpg`, `${IMG}home-maintenance-3.jpg`, `${IMG}home-maintenance-4.jpg`],
    inclusions: ['Assembly of beds, wardrobes, tables and shelves', 'Fitting as per the manufacturer\'s manual', 'Placement in your chosen spot'],
    exclusions: ['The furniture and hardware itself', 'Dismantling of old furniture', 'Wall mounting (optional add-on)'],
    faqs: [
      ['What should I keep ready?', 'Unpack the pieces and keep all fittings and the assembly manual handy.'],
      ['Is wall mounting included?', 'Not in the base price. Add Wall Mounting when you book.'],
    ],
  },
  'door-lock-repair': {
    images: [`${IMG}home-maintenance.jpg`, `${IMG}home-maintenance-4.jpg`, `${IMG}home-maintenance-3.jpg`],
    inclusions: ['Hinge, handle and lock repair or replacement', 'Door alignment', 'Test after repair'],
    exclusions: ['Cost of a new lock or hardware', 'Repair or replacement of the door or frame'],
    faqs: [
      ['Do I need to buy a new lock?', 'Only if the lock cannot be repaired. The technician will tell you before replacing it.'],
      ['Can hinge, handle and lock work be done in one visit?', 'Yes, they can be combined in one visit.'],
    ],
  },
  'wardrobe-repair': {
    images: [`${IMG}home-maintenance.jpg`, `${IMG}home-maintenance-3.jpg`, `${IMG}home-maintenance-2.jpg`],
    inclusions: ['Channel and hinge repair', 'Shutter alignment', 'Drawer repair'],
    exclusions: ['Replacement hardware', 'Polishing or repainting', 'Panel or board replacement'],
    faqs: [
      ['Can a stuck drawer be fixed?', 'Yes. Drawer channels and alignment are part of the service.'],
      ['What if a part needs replacing?', 'The technician will explain what is needed. Replacement hardware is charged separately.'],
    ],
  },
  'custom-shelf-installation': {
    images: [`${IMG}home-maintenance.jpg`, `${IMG}home-maintenance-2.jpg`, `${IMG}home-maintenance-4.jpg`],
    inclusions: ['Drilling and fixing of wall shelves', 'Curtain rod installation', 'TV bracket mounting', 'Levelling check'],
    exclusions: ['The shelf, rod or bracket itself', 'Wall repair or plastering after drilling', 'Concealing cables or wiring'],
    faqs: [
      ['What should I keep ready?', 'The item to be mounted, its hardware and a clear wall. Mark where you want it if you can.'],
      ['Can it hold a large TV?', 'TV brackets are covered. Share the TV size so the technician can check the wall suits it.'],
    ],
  },
};
