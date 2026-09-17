import React from "react";
import { Image } from "react-native";

import ArabicIcon from "@/assets/icons/arabic.svg";
import EnglishIcon from "@/assets/icons/english.svg";

import type { Locale } from "@/shared/translations/resources";

const UrduIconSource = require("@/assets/icons/urdu.png");

const UrduIcon = ({ width, height }: { width: number; height: number }) =>
  React.createElement(Image, {
    source: UrduIconSource,
    style: { width, height },
  });

/**
 * Map each locale code to its corresponding icon component.
 * Urdu and Roman Urdu (rmu) use the same PNG image; others use SVG components.
 */
export const LANGUAGE_ICONS: Record<Locale, React.ElementType> = {
  en: EnglishIcon,
  ar: ArabicIcon,
  ur: UrduIcon,
  rmu: UrduIcon,
};
