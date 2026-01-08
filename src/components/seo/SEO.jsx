import { Helmet } from "react-helmet";

const SEO = ({
  title = "Caritas Inn Ilasan | Luxury Accommodation in Lekki Phase 2, Lagos",
  description = "Experience luxury and comfort at Caritas Inn Ilasan. Book your stay at our premium hotel in Lekki Phase 2, Lagos.",
  keywords = "hotel, lagos, accommodation, caritas inn, ilasan, lekki, lekki phase 2, luxury hotel, nigeria, business hotel, vacation",
  image = "/ring-ruby-logo.webp",
  url = typeof window !== "undefined"
    ? window.location.href
    : "https://caritasinnilasan.fivecloverhotels.com",
  type = "website",
}) => {
  const siteName = "Caritas Inn Ilasan";
  const siteUrl = "https://caritasinnilasan.fivecloverhotels.com";
  const twitterHandle = "@fivecloverhotel";

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      {/* Viewport should only be in the root HTML */}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/five-clover-logo.svg" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Preconnect to important domains */}
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="preconnect" href="https://maps.googleapis.com" />
    </Helmet>
  );
};

export default SEO;
