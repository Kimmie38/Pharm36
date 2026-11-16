// Mock data standing in for backend/API responses while the UI is being built.

// Pharm36 supports two kinds of professional accounts. Each is verified by a
// different regulatory council, and each has "sections" — extra licenses/permits
// a professional may or may not hold. Some drug categories can only be added to
// inventory by someone whose account carries the matching section, even though
// everyone on the app is already a verified professional.
export const professionalTypes = {
  pharmacist: {
    key: 'pharmacist',
    label: 'Pharmacist',
    council: 'Pharmacists Council of Nigeria',
    councilShort: 'PCN',
    licensePrefix: 'PCN',
    sections: [
      { key: 'general_pharmacy', label: 'General / Community Pharmacy', description: 'Standard retail & OTC medicines' },
      { key: 'hospital_pharmacy', label: 'Hospital Pharmacy', description: 'Clinical & hospital-dispensed medicines' },
      { key: 'controlled_drugs', label: 'Controlled Drugs & Narcotics', description: 'Schedule drugs requiring extra PCN authorization' },
      { key: 'veterinary_pharmacy', label: 'Veterinary Pharmacy (cross-licensed)', description: 'Permits stocking animal medicines alongside human ones' },
    ],
  },
  veterinary: {
    key: 'veterinary',
    label: 'Veterinary Doctor',
    council: 'Veterinary Council of Nigeria',
    councilShort: 'VCN',
    licensePrefix: 'VCN',
    sections: [
      { key: 'general_veterinary', label: 'General Veterinary Practice', description: 'Standard animal medicines & vaccines' },
      { key: 'veterinary_controlled_drugs', label: 'Veterinary Controlled Drugs', description: 'Scheduled animal drugs requiring extra VCN authorization' },
    ],
  },
};

// Drug categories a batch can be tagged with. requiredSections is a list of
// section keys — if the logged-in professional holds ANY one of them, they can
// add that category of drug. An empty array means no extra section is needed
// (their base PCN/VCN verification is enough).
export const drugCategories = [
  { key: 'general', label: 'General / OTC', requiredSections: [] },
  { key: 'prescription', label: 'Prescription-only (POM)', requiredSections: [] },
  { key: 'controlled', label: 'Controlled Drug / Narcotic', requiredSections: ['controlled_drugs'] },
  { key: 'veterinary', label: 'Veterinary Drug', requiredSections: ['general_veterinary', 'veterinary_pharmacy'] },
  { key: 'veterinary_controlled', label: 'Veterinary Controlled Drug', requiredSections: ['veterinary_controlled_drugs'] },
];

export function canAddDrugCategory(profile, categoryKey) {
  const category = drugCategories.find((c) => c.key === categoryKey);
  if (!category || category.requiredSections.length === 0) return true;
  return category.requiredSections.some((s) => profile.sections.includes(s));
}

export const pharmacistProfile = {
  name: 'Adaeze Okonkwo',
  professionalType: 'pharmacist', // 'pharmacist' | 'veterinary'
  sections: ['general_pharmacy', 'hospital_pharmacy'], // NOT registered for controlled_drugs or veterinary — used to demo the restriction
  pcnStatus: 'active', // active | revoked  (never shown as "pending" to the pharmacist)
  storeName: 'Okonkwo Pharmacy',
  location: 'Yaba, Lagos',
  state: 'Lagos',
  phone: '+234 803 555 0142',
  email: 'adaeze.okonkwo@pharm36.app',
  licenseNo: 'PCN/LG/2291',
};

export const expiryBuckets = ['1 year', '6 months', '3 months', '1 month', '2 weeks', '1 week'];

export const batches = [
  {
    id: 'B-10231',
    drugName: 'Amoxicillin 500mg',
    batchCode: '5012345678901',
    manufactureDate: '2025-02-10',
    expiryDate: '2026-10-05',
    quantity: 240,
    unitPrice: 85,
    status: 'expiring_1m',
    daysToExpiry: 20,
    category: 'prescription',
  },
  {
    id: 'B-10198',
    drugName: 'Paracetamol 500mg',
    batchCode: '5019988771234',
    manufactureDate: '2024-11-01',
    expiryDate: '2026-09-29',
    quantity: 500,
    unitPrice: 25,
    status: 'expiring_2w',
    daysToExpiry: 14,
    category: 'general',
  },
  {
    id: 'B-10305',
    drugName: 'Ciprofloxacin 250mg',
    batchCode: '5013321459087',
    manufactureDate: '2025-06-18',
    expiryDate: '2027-06-18',
    quantity: 150,
    unitPrice: 130,
    status: 'ok',
    daysToExpiry: 640,
    category: 'prescription',
  },
  {
    id: 'B-10099',
    drugName: 'Artemether/Lumefantrine',
    batchCode: '5010098234561',
    manufactureDate: '2024-04-01',
    expiryDate: '2026-04-01',
    quantity: 60,
    unitPrice: 210,
    status: 'expired',
    daysToExpiry: -167,
    category: 'general',
  },
  {
    id: 'B-10276',
    drugName: 'Metformin 850mg',
    batchCode: '5017765432198',
    manufactureDate: '2025-01-15',
    expiryDate: '2027-01-15',
    quantity: 320,
    unitPrice: 60,
    status: 'ok',
    daysToExpiry: 487,
    category: 'prescription',
  },
];

export const expiringBatches = batches.filter(b => ['expiring_1m', 'expiring_2w', 'expired'].includes(b.status));

export const salesLevels = [
  { drugName: 'Amoxicillin 500mg', level: 'high', unitsSold: 180, revenue: 15300 },
  { drugName: 'Paracetamol 500mg', level: 'medium', unitsSold: 260, revenue: 6500 },
  { drugName: 'Ciprofloxacin 250mg', level: 'low', unitsSold: 22, revenue: 2860 },
  { drugName: 'Metformin 850mg', level: 'high', unitsSold: 140, revenue: 8400 },
];

export const marketplaceListings = [
  {
    id: 'M-2201',
    drugName: 'Vitamin C 1000mg',
    seller: 'GreenLife Pharmacy, Ikeja',
    quantity: 100,
    unitPrice: 45,
    postedAgo: '2h ago',
  },
  {
    id: 'M-2187',
    drugName: 'Ibuprofen 400mg',
    seller: 'CareFirst Pharmacy, Surulere',
    quantity: 300,
    unitPrice: 30,
    postedAgo: '5h ago',
  },
  {
    id: 'M-2150',
    drugName: 'Amoxicillin 500mg',
    seller: 'Wellspring Chemists, Yaba',
    quantity: 150,
    unitPrice: 80,
    postedAgo: '1d ago',
  },
];

// Drug lookup used by the User (consumer) side
export const drugDirectory = {
  '5012345678901': {
    name: 'Amoxicillin',
    strength: '500mg',
    form: 'Capsule',
    manufacturer: 'Emzor Pharmaceuticals',
    manufactureDate: '2025-02-10',
    expiryDate: '2026-10-05',
    batchCode: '5012345678901',
    registeredPharmacy: 'Okonkwo Pharmacy, Yaba, Lagos',
    verified: true,
  },
  '5019988771234': {
    name: 'Paracetamol',
    strength: '500mg',
    form: 'Tablet',
    manufacturer: 'May & Baker Nigeria',
    manufactureDate: '2024-11-01',
    expiryDate: '2026-09-29',
    batchCode: '5019988771234',
    registeredPharmacy: 'Okonkwo Pharmacy, Yaba, Lagos',
    verified: true,
  },
};

export default {
  professionalTypes,
  drugCategories,
  canAddDrugCategory,
  pharmacistProfile,
  batches,
  expiringBatches,
  salesLevels,
  marketplaceListings,
  drugDirectory,
};
