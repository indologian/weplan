"use client";

import { createRenderer } from "@/modules/theme/renderer";
import { Cover } from "./cover";
import { Couple } from "./couple";
import { Events } from "./events";
import { Story } from "./story";
import { Gallery } from "./gallery";
import { Gift } from "./gift";
import { Closing } from "./closing";

export const BaselineRenderer = createRenderer({
  Cover,
  Couple,
  Events,
  Story,
  Gallery,
  Gift,
  Closing,
});
