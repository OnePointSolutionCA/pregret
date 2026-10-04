import snapshot from "@/data/home-snapshot.json";
import HeroMosaicClient from "./HeroMosaicClient";

/**
 * Hero backdrop: 12 floating tiles that cycle through popular product photos on ~10s
 * crossfades. Images come from the build-time snapshot (scripts/build-home-snapshot.mjs).
 */
export default function HeroMosaic() {
  return <HeroMosaicClient images={snapshot.mosaic} />;
}
