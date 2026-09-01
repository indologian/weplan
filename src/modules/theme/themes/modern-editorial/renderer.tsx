import { createRenderer } from "@/modules/theme/renderer";
import { modernEditorialBody, modernEditorialDisplay } from "./fonts";
import { Composition } from "./composition";
import { Cover } from "./cover";
import { Couple } from "./couple";
import { Events } from "./events";
import { Story } from "./story";
import { Gallery } from "./gallery";
import { Gift } from "./gift";
import { Closing } from "./closing";

export const ModernEditorialRenderer = createRenderer({
  rootClassName: `wedding-theme modern-editorial ${modernEditorialDisplay.variable} ${modernEditorialBody.variable}`,
  Composition,
  Cover,
  Couple,
  Events,
  Story,
  Gallery,
  Gift,
  Closing,
});
