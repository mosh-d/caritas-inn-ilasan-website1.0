export const generateHotelSchema = (hotelData = {}) => {
  const defaultData = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: "Caritas Inn Ilasan",
    description:
      "Luxury hotel accommodation at Lekki Phase 2, Lagos. Experience comfort and excellent service at Caritas Inn Ilasan.",
    url: "https://caritasinnilasan.fivecloverhotels.com",
    logo: "https://caritasinnilasan.fivecloverhotels.com/caritas%20logo.webp",
    priceRange: "$$",
    starRating: {
      "@type": "Rating",
      ratingValue: "4.5",
      bestRating: "5",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "2, Howard Edafe Street, Ilasan, Lekki Phase 2",
      addressLocality: "Lagos",
      postalCode: "100001",
      addressCountry: "NG",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "6.431359668871449",
      longitude: "3.5022371276345114",
    },
    telephone: "+2347042798946",
    email: "info@caritasinnilasanhotel.com",
    sameAs: [
      "https://www.facebook.com/RingrubyHotel?_rdc=1&_rdr#",
      "https://www.instagram.com/ringruby_hotel/",
      "https://twitter.com/fivecloverhotel",
      "https://www.tiktok.com/@ringrubyhotels",
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
      },
    ],
  };

  return JSON.stringify({ ...defaultData, ...hotelData });
};

export const generateBreadcrumbSchema = (items = []) => {
  const defaultItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://caritasinnilasan.fivecloverhotels.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Rooms",
      item: "https://caritasinnilasan.fivecloverhotels.com/rooms",
    },
  ];

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.length > 0 ? items : defaultItems,
  };

  return JSON.stringify(breadcrumbList);
};
