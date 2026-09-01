import { ThemeSectionRenderers } from "@/modules/theme/renderer";
import { Breakout } from "@/modules/theme/primitives/layout/breakout";
import { NarrowMeasure } from "@/modules/theme/primitives/layout/narrow-measure";
import { WideMeasure } from "@/modules/theme/primitives/layout/wide-measure";
import { LuxuryMidnightMotion } from "./motion";

export const LuxuryMidnightComposition: ThemeSectionRenderers["Composition"] = ({
  Cover,
  Opening,
  Couple,
  Events,
  Story,
  Gallery,
  Video,
  Gift,
  Rsvp,
  Wishes,
  Closing,
}) => {
  return (
    <>
      <LuxuryMidnightMotion />
      <Breakout>{Cover}</Breakout>
      
      {Opening && <NarrowMeasure>{Opening}</NarrowMeasure>}
      
      <WideMeasure>
        {Couple}
      </WideMeasure>

      <NarrowMeasure>
        {Events}
        {Story}
      </NarrowMeasure>

      {Gallery && <Breakout>{Gallery}</Breakout>}

      <NarrowMeasure>
        {Video}
        {Gift}
        {Rsvp}
        {Wishes}
      </NarrowMeasure>

      <Breakout>
        {Closing}
      </Breakout>
    </>
  );
};


