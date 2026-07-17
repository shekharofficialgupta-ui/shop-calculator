import os
import subprocess

# Define the rounded icon SVG (used for icon-192.png and icon-512.png)
rounded_svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient (Violet-Blue to Cyan-Teal) -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5B5AF1" />
      <stop offset="50%" stop-color="#3A8DF3" />
      <stop offset="100%" stop-color="#00E5C9" />
    </linearGradient>

    <!-- Clip path to round the icon corners -->
    <clipPath id="iconClip">
      <rect width="512" height="512" rx="112" ry="112" />
    </clipPath>
  </defs>

  <!-- Background with rounded corners -->
  <rect width="512" height="512" rx="112" ry="112" fill="url(#bgGrad)" />

  <!-- Shadow, Bag, Rupee and Calculator grouped and clipped -->
  <g clip-path="url(#iconClip)">
    <!-- Flat 45-degree Long Shadow -->
    <polygon points="170,341 327,199 415,280 512,377 512,512 341,512" fill="#090B1E" opacity="0.18" />

    <!-- Shopping Bag Handle -->
    <path d="M 215 175 C 215 110, 297 110, 297 175" fill="none" stroke="#FFFFFF" stroke-width="20" stroke-linecap="round" />

    <!-- Shopping Bag Body -->
    <path d="M 210 175 h 92 a 25 25 0 0 1 25 24 l 15 142 a 25 25 0 0 1 -25 24 H 195 a 25 25 0 0 1 -25 -24 l 15 -142 a 25 25 0 0 1 25 -24 z" fill="#FFFFFF" />

    <!-- Rupee Symbol -->
    <g stroke="#1E222F" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <!-- Top Bar -->
      <path d="M 200 215 H 260" />
      <!-- Middle Bar -->
      <path d="M 200 235 H 252" />
      <!-- Loop -->
      <path d="M 222 215 C 255 215, 255 255, 222 255 H 205" />
      <!-- Diagonal Leg -->
      <path d="M 220 255 L 255 305" />
    </g>

    <!-- Calculator Body -->
    <rect x="270" y="265" width="145" height="185" rx="20" ry="20" fill="#1E222F" />

    <!-- Calculator Screen -->
    <rect x="285" y="278" width="115" height="18" rx="5" fill="#0F172A" />

    <!-- Calculator Buttons -->
    <!-- Top Left Button (+) -->
    <rect x="284" y="309" width="52" height="52" rx="12" fill="#2E3440" />
    <path d="M 310 323 V 347 M 298 335 H 322" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" />

    <!-- Top Right Button (-) -->
    <rect x="349" y="309" width="52" height="52" rx="12" fill="#2E3440" />
    <path d="M 363 335 H 387" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" />

    <!-- Bottom Left Button (*) -->
    <rect x="284" y="374" width="52" height="52" rx="12" fill="#2E3440" />
    <path d="M 299 389 L 321 411 M 321 389 L 299 411" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" />

    <!-- Bottom Right Button (=) -->
    <rect x="349" y="374" width="52" height="52" rx="12" fill="#F97316" />
    <path d="M 363 394 H 387 M 363 406 H 387" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" />
  </g>
</svg>
"""

# Define the maskable icon SVG (used for icon-maskable.png, full-bleed square with scaled center components)
maskable_svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient (Violet-Blue to Cyan-Teal) -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5B5AF1" />
      <stop offset="50%" stop-color="#3A8DF3" />
      <stop offset="100%" stop-color="#00E5C9" />
    </linearGradient>
  </defs>

  <!-- Full-bleed background (no rounded corners) -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Scale and center the main elements to fit within the PWA circular safe zone -->
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <!-- Flat 45-degree Long Shadow -->
    <polygon points="170,341 327,199 415,280 512,377 512,512 341,512" fill="#090B1E" opacity="0.18" />

    <!-- Shopping Bag Handle -->
    <path d="M 215 175 C 215 110, 297 110, 297 175" fill="none" stroke="#FFFFFF" stroke-width="20" stroke-linecap="round" />

    <!-- Shopping Bag Body -->
    <path d="M 210 175 h 92 a 25 25 0 0 1 25 24 l 15 142 a 25 25 0 0 1 -25 24 H 195 a 25 25 0 0 1 -25 -24 l 15 -142 a 25 25 0 0 1 25 -24 z" fill="#FFFFFF" />

    <!-- Rupee Symbol -->
    <g stroke="#1E222F" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <!-- Top Bar -->
      <path d="M 200 215 H 260" />
      <!-- Middle Bar -->
      <path d="M 200 235 H 252" />
      <!-- Loop -->
      <path d="M 222 215 C 255 215, 255 255, 222 255 H 205" />
      <!-- Diagonal Leg -->
      <path d="M 220 255 L 255 305" />
    </g>

    <!-- Calculator Body -->
    <rect x="270" y="265" width="145" height="185" rx="20" ry="20" fill="#1E222F" />

    <!-- Calculator Screen -->
    <rect x="285" y="278" width="115" height="18" rx="5" fill="#0F172A" />

    <!-- Calculator Buttons -->
    <!-- Top Left Button (+) -->
    <rect x="284" y="309" width="52" height="52" rx="12" fill="#2E3440" />
    <path d="M 310 323 V 347 M 298 335 H 322" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" />

    <!-- Top Right Button (-) -->
    <rect x="349" y="309" width="52" height="52" rx="12" fill="#2E3440" />
    <path d="M 363 335 H 387" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" />

    <!-- Bottom Left Button (*) -->
    <rect x="284" y="374" width="52" height="52" rx="12" fill="#2E3440" />
    <path d="M 299 389 L 321 411 M 321 389 L 299 411" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" />

    <!-- Bottom Right Button (=) -->
    <rect x="349" y="374" width="52" height="52" rx="12" fill="#F97316" />
    <path d="M 363 394 H 387 M 363 406 H 387" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" />
  </g>
</svg>
"""

# Ensure tmp directory exists
os.makedirs("tmp", exist_ok=True)

# Save SVG files relative to the project root
with open("tmp/icon-rounded.svg", "w") as f:
    f.write(rounded_svg_content)

with open("tmp/icon-maskable.svg", "w") as f:
    f.write(maskable_svg_content)

print("SVG files generated successfully. Now converting to PNG...")

# Use rsvg-convert to render the PNG files directly to public/
subprocess.run(["rsvg-convert", "-w", "512", "-h", "512", "tmp/icon-rounded.svg", "-o", "public/icon-512.png"], check=True)
subprocess.run(["rsvg-convert", "-w", "192", "-h", "192", "tmp/icon-rounded.svg", "-o", "public/icon-192.png"], check=True)
subprocess.run(["rsvg-convert", "-w", "512", "-h", "512", "tmp/icon-maskable.svg", "-o", "public/icon-maskable.png"], check=True)

print("All icons successfully rendered to public/!")
