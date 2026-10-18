/**
 * Single source of truth for the NGO's public contact details.
 * Only confirmed information is listed — no invented street numbers etc.
 */
export const NGO_CONTACT = {
  name: "Mangaldham Bahuuddeshiy Samajik Sanstha",
  address: "Sukhsagar Nagar, Katraj, Pune, Maharashtra",
  phone: "7219185111",
  phoneDisplay: "+91 72191 85111",
  email: "vijug0027@gmail.com",
  /**
   * OpenStreetMap embed — needs no API key (unlike Google Maps) and pins the
   * named locality. The marker is the approximate centre of Sukhsagar Nagar,
   * Katraj; no street-level address was supplied, so none is invented.
   */
  mapEmbedUrl:
    "https://www.openstreetmap.org/export/embed.html?bbox=73.8480%2C18.4430%2C73.8760%2C18.4640&layer=mapnik&marker=18.4530%2C73.8615",
  mapLink:
    "https://www.openstreetmap.org/search?query=Sukhsagar%20Nagar%2C%20Katraj%2C%20Pune",
} as const
