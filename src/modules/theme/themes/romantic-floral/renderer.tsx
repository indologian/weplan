import { createRenderer } from "@/modules/theme/renderer";
import { Cover } from "./cover";
import { Couple } from "./couple";
import { Events } from "./events";
import { Story } from "./story";
import { Gallery } from "./gallery";
import { Gift } from "./gift";
import { Closing } from "./closing";

export const RomanticFloralRenderer = createRenderer({
  rootClassName: "wedding-theme romantic-floral",
  Cover,
  Couple,
  Events,
  Story,
  Gallery,
  Gift,
  Closing,
});
