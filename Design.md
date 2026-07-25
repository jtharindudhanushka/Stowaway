---
version: 2.0.0
name: Stowaway-Bounce-Orange-Theme
description: A clean, modern, high-contrast design system featuring a Vibrant Warm Orange accent, rich Dark Brown dark shades, crisp white canvas, soft rounded cards, and generous breathing space.

colors:
  primary: "#EA580C" # Vibrant Orange (Orange-600)
  primary-hover: "#C2410C" # Deep Orange (Orange-700)
  primary-soft: "#FFEDD5" # Warm Soft Amber/Orange (Orange-100)
  on-primary: "#ffffff"
  
  dark-surface: "#1C130E" # Rich Dark Brown
  dark-surface-card: "#2E1C14" # Medium Dark Brown
  dark-surface-border: "#382319" # Warm Border
  on-dark: "#ffffff"

  canvas: "#ffffff"
  canvas-soft: "#FDFBF7" # Warm Soft Ivory
  surface-card: "#ffffff"
  surface-border: "#E7E5E4" # Stone-200

  text-heading: "#1C130E" # Rich Dark Brown
  text-body: "#44403C" # Warm Stone-700
  text-muted: "#78716C" # Stone-500

  tiles:
    small-bag: "#FFF7ED" # Soft Orange Tile
    regular-bag: "#ECFDF5" # Soft Mint Tile
    large-suitcase: "#FEF3C7" # Soft Amber Tile
    odd-size: "#F3E8FF" # Soft Purple Tile
    tea-chest: "#FEF2F2" # Soft Warm Red Tile

typography:
  fontFamily: Inter, system-ui, -apple-system, sans-serif
  display-xxl: 52px / 1.1 / Bold
  display-xl: 36px / 1.2 / Bold
  display-lg: 28px / 1.3 / Bold
  display-md: 20px / 1.4 / Bold
  body-lg: 18px / 1.5 / Regular
  body-md: 16px / 1.5 / Regular
  body-sm: 14px / 1.4 / Medium

rounded:
  card: 16px (rounded-2xl)
  tile: 16px (rounded-2xl)
  pill: 9999px (rounded-full)

components:
  button-primary:
    backgroundColor: "#EA580C"
    hoverBackgroundColor: "#C2410C"
    textColor: "#ffffff"
    rounded: "9999px"
    padding: "16px 32px font-bold"

  item-card:
    backgroundColor: "#ffffff"
    borderColor: "#E7E5E4"
    rounded: "16px"
    padding: "20px"

  modal-dialog:
    backgroundColor: "#ffffff"
    borderColor: "#E7E5E4"
    desktopPlacement: "centered-modal (middle screen)"
    mobilePlacement: "bottom-sheet"
---

# Stowaway Design System Guidelines (Orange & Dark Brown)

## Overview
1. **Primary Accent**: Vibrant Orange (`#EA580C`). Used for all main CTAs, active pills, highlights, and primary actions.
2. **Dark Shades**: Rich Dark Brown (`#1C130E`). Used for dark bands, dark headers, dark footers, text headings, and dark promo cards.
3. **Pill Geometry**: All CTAs, steppers, tags, and time slots use `rounded-full` pills.
4. **Desktop Modal Centering**: All dialogs (including OTP verification) are centered in the middle of the screen on desktop (`md:` viewports).
