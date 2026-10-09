// Every legal rule the app relies on, with where it came from and when it was checked.
// If you change a rule in the engine, update it here too. The /sources page and the
// claim pack both read from this list.

export interface Source {
  id: string;
  rule: string;
  source: string;
  url: string;
  checked: string; // date we last checked it
}

export const SOURCES: Source[] = [
  {
    id: "rta-bond-max",
    rule: "A residential tenancy bond can't be more than 4 weeks' rent.",
    source: "Tenants' Union of NSW, Bond factsheet (updated Feb 2026)",
    url: "https://files.tenants.org.au/factsheets/bond.pdf",
    checked: "2026-10-09",
  },
  {
    id: "rta-lodgement",
    rule:
      "A landlord must lodge the bond with NSW Fair Trading within 10 business days of it being paid; an agent has until 10 business days after the end of the month it was paid. Not lodging is an offence under s162 of the Residential Tenancies Act 2010 (max 20 penalty units).",
    source: "Tenants' Union of NSW, sample letter: Bond not lodged",
    url: "https://www.tenants.org.au/sample/bond-not-lodged",
    checked: "2026-10-09",
  },
  {
    id: "rbo-claim",
    rule:
      "Tenants can usually claim their bond through Rental Bonds Online once they've moved out and returned the keys. The other party gets 14 days' notice; if nobody disputes, the bond is paid out as claimed.",
    source: "Tenants' Union of NSW, Bond factsheet (updated Feb 2026)",
    url: "https://files.tenants.org.au/factsheets/bond.pdf",
    checked: "2026-10-09",
  },
  {
    id: "rbo-dispute",
    rule:
      "If a landlord claims part of the bond, the tenant has 14 days to respond. To dispute, log in to Rental Bonds Online before the due date to freeze the bond. A landlord who disputes must apply to NCAT within 14 days. A tenant can apply to NCAT within 6 months of the bond being paid out.",
    source: "NSW Government, Dealing with bond disputes for tenants (modified 22 May 2024)",
    url: "https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/residential-rental-bonds/dealing-bond-disputes-for-tenants",
    checked: "2026-10-09",
  },
  {
    id: "condition-report",
    rule:
      "The landlord or agent gives the tenant a condition report before or when the lease is signed. The tenant must return a completed copy within 7 days of moving in. Time-stamped photos help. The report is evidence if there's a dispute about damage.",
    source: "NSW Government, Rental property condition reports (modified 24 May 2024)",
    url: "https://www.nsw.gov.au/housing-and-construction/rules/rental-property-condition-reports",
    checked: "2026-10-09",
  },
  {
    id: "boarding-deposit",
    rule:
      "In a boarding house, a security deposit can't be more than 2 weeks' occupancy fee and must be refunded within 14 days of the resident moving out, minus allowed deductions (e.g. unpaid rent, reasonable repair or cleaning costs). Residents can enforce this through NCAT.",
    source: "NSW Government, Operating a boarding house (updated 18 Dec 2025)",
    url: "https://www.nsw.gov.au/housing-and-construction/community-living/boarding-houses/operating-a-boarding-house",
    checked: "2026-10-09",
  },
  {
    id: "boarding-definition",
    rule:
      "A general boarding house provides beds for a fee to 5 or more residents (not counting the owner, manager or their relatives) and must be registered under the Boarding Houses Act 2012.",
    source: "Legal Aid NSW, Boarding houses (updated Jul 2025)",
    url: "https://www.legalaid.nsw.gov.au/lawprompt/legal-topics/housing-and-land/boarding-houses",
    checked: "2026-10-09",
  },
  {
    id: "lodgers",
    rule:
      "Boarders and lodgers are not covered by the Residential Tenancies Act. If the landlord runs a business, a lodger may be able to apply to NCAT's General Division under the Fair Trading Act 1987; otherwise usually the Local Court. Residential colleges of educational institutions are excluded from the Residential Tenancies Act, with some exceptions.",
    source: "Tenants' Union of NSW, Boarders and lodgers factsheet (updated Feb 2023)",
    url: "https://www.tenants.org.au/node/17",
    checked: "2026-10-09",
  },
  {
    id: "ncat-fee",
    rule:
      "NCAT application fee for residential proceedings (tenancy and boarding houses): $62 standard, $16 concession. General list claims up to $10,000: $62 standard, $16 concession.",
    source: "NCAT fees and charges schedule (as at 1 July 2025)",
    url: "https://ncat.nsw.gov.au/documents/fees/ncat-fees-and-charges-schedule-as-at-1-july-2025.pdf",
    checked: "2026-10-09",
  },
  {
    id: "research-bonds",
    rule:
      "Recovering rental bonds made up 25% of international students' legal advice matters at Kingsford Legal Centre (Oct 2017–Apr 2018); students in share houses often had no bond receipt or written agreement.",
    source: "UNSW, International students at risk of exploitation by Sydney landlords (2019)",
    url: "https://www.unsw.edu.au/news/2019/07/international-students-at-risk-of-exploitation-by-sydney-landlor",
    checked: "2026-10-09",
  },
  {
    id: "research-housing",
    rule:
      "In a survey of more than 5,000 international students, share housing was the most common first home (36%), and 57% of students in share housing experienced illegal or poor living conditions in their first share house.",
    source: "UNSW / UTS, Living Precariously: Understanding International Students' Housing Experiences in Australia (Berg & Farbenblum, 2019)",
    url: "https://www.unsw.edu.au/newsroom/news/2019/12/international-students-exploited-by-landlords",
    checked: "2026-10-10",
  },
];

export const HELP_CONTACTS = [
  {
    name: "Redfern Legal Centre",
    detail: "Free legal help, including an international student service. (02) 9698 7277",
    url: "https://rlc.org.au",
  },
  {
    name: "Tenants' Union of NSW",
    detail: "Factsheets and your local Tenants' Advice and Advocacy Service",
    url: "https://www.tenants.org.au",
  },
  {
    name: "NSW Fair Trading",
    detail: "Rental bonds and complaints. 13 32 20",
    url: "https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/residential-rental-bonds",
  },
];

export const DISCLAIMER =
  "Bond Secure gives legal information, not legal advice. It doesn't file anything for you. Rules checked 9 October 2026 for NSW only. If anything here doesn't match your situation, talk to Redfern Legal Centre or your local Tenants' Advice service before you act.";
