import type { ThemeCompositionProps } from "@/modules/theme/renderer";
import { Breakout } from "@/modules/theme/primitives/layout/breakout";
import { NarrowMeasure } from "@/modules/theme/primitives/layout/narrow-measure";
import { WideMeasure } from "@/modules/theme/primitives/layout/wide-measure";
import { ModernEditorialMotion } from "./motion";

export function Composition({ Navigation, Cover, Opening, Couple, Story, Events, Gallery, Video, Rsvp, Wishes, Gift, Closing }: ThemeCompositionProps) {
  return (
    <div className="me-composition">
      <ModernEditorialMotion />
      {Navigation}
      <Breakout className="me-slot me-slot-cover">{Cover}</Breakout>
      {Opening && <NarrowMeasure className="me-slot me-slot-opening">{Opening}</NarrowMeasure>}
      <Breakout className="me-slot me-slot-couple">{Couple}</Breakout>
      {Story && <Breakout className="me-slot me-slot-story">{Story}</Breakout>}
      <Breakout className="me-slot me-slot-events">{Events}</Breakout>
      {Gallery && <Breakout className="me-slot me-slot-gallery">{Gallery}</Breakout>}
      {Video && <WideMeasure className="me-slot me-slot-video">{Video}</WideMeasure>}
      {Rsvp && <WideMeasure className="me-slot me-slot-rsvp"><h2 className="sr-only">RSVP</h2>{Rsvp}</WideMeasure>}
      {Wishes && <WideMeasure className="me-slot me-slot-wishes">{Wishes}</WideMeasure>}
      {Gift && <WideMeasure className="me-slot me-slot-gift">{Gift}</WideMeasure>}
      <Breakout className="me-slot me-slot-closing">{Closing}</Breakout>
    </div>
  );
}
