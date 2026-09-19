import About1 from "../../assets/about/about-1.jpg";
import About2 from "../../assets/about/about-2.jpg";
import { EASE_OUT } from "../shared/motion";
import { Reveal, RevealGroup, RevealItem, Words } from "../shared/guestMotion";

// Each photo opens from the page's outer edge in toward its text, drawing
// the eye across to it. The wipe runs on the photo but is triggered by its
// frame (the RevealGroup around it): a fully clipped element has no visible
// area, so it could never report itself as scrolled into view.
const WIPE_FROM_LEFT = {
  hidden: { clipPath: "inset(0% 100% 0% 0%)" },
  shown: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 1.2, ease: EASE_OUT } },
};
const WIPE_FROM_RIGHT = {
  hidden: { clipPath: "inset(0% 0% 0% 100%)" },
  shown: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 1.2, ease: EASE_OUT } },
};

export default function AboutMainSection() {
  return (
    <>
      <div
        data-component="AboutMainSection"
        className="p-[12rem] max-md:px-[6rem] max-sm:px-[4rem] w-full flex flex-col gap-[4.8rem]"
      >
        <Reveal y={24}
          data-component="Block1"
          className="bg-[color:var(--text-color)] p-[6rem] max-sm:p-[4rem] flex flex-col gap-[1.8rem] text-[var(--white)] font-secondary"
        >
          <Words
            as="h1"
            onLoad
            delay={0.2}
            text="Seamless Comfort and Hospitality"
            className="text-6xl font-secondary font-bold"
          />
          <p className="text-3xl">
            In Lekki Phase 2, one of Lagos's more sought-after addresses, Caritas Inn Ilasan combines modern comfort with the warmth guests expect from West African hospitality. The hotel is designed for people who want a workable base close to the city's best without sacrificing calm - a strong fit for travelers prioritizing both convenience and comfort in Lekki.
          </p>
        </Reveal>
        <div data-component="Block2" className="flex flex-col w-full">
          <div className="flex max-sm:flex-col">
            <RevealGroup amount={0.3}
              data-component="Block2Image"
              className="w-[60%] max-sm:w-[100%] max-w-[40rem] max-sm:max-w-[100%] max-sm:h-[25rem]"
            >
              <RevealItem
                as="img"
                variants={WIPE_FROM_LEFT}
                src={About1}
                alt=""
                className="w-full h-full object-cover object-center"
              />
            </RevealGroup>
            <Reveal delay={0.15}
              data-component="Block2Text"
              className="flex flex-col gap-[1.8rem] font-secondary bg-[color:var(--background-color-2)] w-[100%] p-[12rem] max-md:p-[6rem] max-sm:p-[4rem]"
            >
              <h2 className="text-6xl font-bold">
                Your Ideal Retreat for Comfort and Convenience
              </h2>
              <p className="text-3xl">
                Caritas Inn brings a new hospitality standard to Ilasan, with the Lekki-Epe Expressway just minutes away. Built for business and leisure travelers alike, the hotel focuses on comfort and function in equal measure: king-sized beds with quality bedding, a complimentary coffee station, air conditioning, free Wi-Fi, flat-screen TVs, and an ensuite bathroom in every room.
              </p>
            </Reveal>
          </div>
          {/* Second row - you can add this structure for additional img+text pairs */}
          <div className="flex max-sm:flex-col">
            <Reveal delay={0.15}
              data-component="Block2Text"
              className="flex flex-col gap-[1.8rem] font-secondary bg-[color:var(--background-color-2)] w-[100%] p-[12rem] max-md:p-[6rem] max-sm:p-[4rem]"
            >
              <h2 className="text-6xl font-bold">
                Experience Tranquil Stays with Unmatched Security
              </h2>
              <p className="text-3xl">
                Tucked into the quieter side of Lekki Phase 2, Caritas Inn Ilasan takes security seriously - advanced surveillance and a dedicated on-site team keep watch so you don't have to. It's a stay built on more than just a bed: comfort, safety, and service that's genuinely personal.
              </p>
            </Reveal>
            <RevealGroup amount={0.3}
              data-component="Block2Image"
              className="w-[60%] max-w-[40rem] max-sm:w-[100%] max-sm:max-w-[100%] max-sm:h-[25rem]"
            >
              <RevealItem
                as="img"
                variants={WIPE_FROM_RIGHT}
                src={About2}
                alt=""
                className="w-full h-full object-cover object-center"
              />
            </RevealGroup>
          </div>
        </div>
        <RevealGroup stagger={0.15}
          data-component="Block3"
          className="bg-[color:var(--text-color)] p-[6rem] flex max-sm:flex-col gap-[6rem] text-[var(--white)] font-secondary"
        >
          <RevealItem className="flex flex-col gap-[1.8rem]">
            <h2 className="text-6xl font-secondary font-bold">Our Vision</h2>
            <p className="text-3xl">
              Our aim reaches past any one branch - we're building an organically grown hotel group that sets the standard on location, service, people, and the systems behind them.
            </p>
          </RevealItem>
          <RevealItem className="flex flex-col gap-[1.8rem]">
            <h2 className="text-6xl font-secondary font-bold">Our Mission</h2>
            <p className="text-3xl">
              At Caritas Inn Ilasan, that vision shows up in the details - we want to be remembered as the most hospitable stay of your trip.
            </p>
          </RevealItem>
        </RevealGroup>
      </div>
    </>
  );
}
