import { bodoniModa, montserrat } from "./fonts";
import { createRenderer } from "@/modules/theme/renderer";
import { Cover } from "./cover";
import { Couple } from "./couple";
import { Events } from "./events";
import { Story } from "./story";
import { Gallery } from "./gallery";
import { Gift } from "./gift";
import { Closing } from "./closing";
import { LuxuryMidnightComposition } from "./composition";
import { LuxuryMidnightMotion } from "./motion";

export const LuxuryMidnightRenderer = createRenderer({
  rootClassName: `wedding-theme luxury-midnight ${bodoniModa.variable} ${montserrat.variable}`,
  Composition: LuxuryMidnightComposition,

  Cover,
  Couple,
  Events,
  Story,
  Gallery,
  Gift,
  Closing,
});


