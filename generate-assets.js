import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// SVGs definitions
const iconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4c1d95;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="112" fill="url(#grad)" />
  
  <!-- Icon Graphics Group -->
  <g filter="url(#shadow)">
    <!-- Main shopping bag / calculator card body -->
    <rect x="136" y="160" width="240" height="240" rx="40" fill="#ffffff" />
    
    <!-- Bag Handle -->
    <path d="M196 160 C196 100, 316 100, 316 160" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="round" />
    
    <!-- Calculator Screen/Grid Details inside Card -->
    <!-- Screen -->
    <rect x="166" y="196" width="180" height="54" rx="12" fill="#0f172a" />
    <!-- Screen display text/numbers -->
    <rect x="186" y="214" width="60" height="18" rx="4" fill="#a7f3d0" opacity="0.9" />
    <circle cx="316" cy="223" r="10" fill="#10b981" />
    
    <!-- Keypad Grid -->
    <!-- Row 1 -->
    <rect x="166" y="272" width="48" height="34" rx="8" fill="#e2e8f0" />
    <rect x="232" y="272" width="48" height="34" rx="8" fill="#e2e8f0" />
    <rect x="298" y="272" width="48" height="34" rx="8" fill="#8b5cf6" />
    
    <!-- Row 2 -->
    <rect x="166" y="324" width="48" height="34" rx="8" fill="#e2e8f0" />
    <rect x="232" y="324" width="48" height="34" rx="8" fill="#e2e8f0" />
    <rect x="298" y="324" width="48" height="34" rx="8" fill="#10b981" />
  </g>
</svg>
`;

const maskableIconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4c1d95;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <!-- Background with no rounded corners for PWA maskable standard -->
  <rect width="512" height="512" fill="url(#grad)" />
  
  <!-- Icon Graphics Group scaled down slightly to fit the maskable safe zone (79.6% diameter circle) -->
  <g transform="translate(38, 38) scale(0.85)" filter="url(#shadow)">
    <!-- Main shopping bag / calculator card body -->
    <rect x="136" y="160" width="240" height="240" rx="40" fill="#ffffff" />
    
    <!-- Bag Handle -->
    <path d="M196 160 C196 100, 316 100, 316 160" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="round" />
    
    <!-- Calculator Screen/Grid Details inside Card -->
    <!-- Screen -->
    <rect x="166" y="196" width="180" height="54" rx="12" fill="#0f172a" />
    <!-- Screen display text/numbers -->
    <rect x="186" y="214" width="60" height="18" rx="4" fill="#a7f3d0" opacity="0.9" />
    <circle cx="316" cy="223" r="10" fill="#10b981" />
    
    <!-- Keypad Grid -->
    <!-- Row 1 -->
    <rect x="166" y="272" width="48" height="34" rx="8" fill="#e2e8f0" />
    <rect x="232" y="272" width="48" height="34" rx="8" fill="#e2e8f0" />
    <rect x="298" y="272" width="48" height="34" rx="8" fill="#8b5cf6" />
    
    <!-- Row 2 -->
    <rect x="166" y="324" width="48" height="34" rx="8" fill="#e2e8f0" />
    <rect x="232" y="324" width="48" height="34" rx="8" fill="#e2e8f0" />
    <rect x="298" y="324" width="48" height="34" rx="8" fill="#10b981" />
  </g>
</svg>
`;

const screenshotDesktopSvg = `
<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <!-- Dark theme background -->
  <rect width="1280" height="720" fill="#09090b" />
  
  <!-- Subtle purple accent light glow in background -->
  <circle cx="640" cy="360" r="400" fill="#7c3aed" opacity="0.12" filter="blur(100px)" />
  
  <!-- Desktop App Window frame -->
  <rect x="120" y="80" width="1040" height="560" rx="20" fill="#18181b" stroke="#27272a" stroke-width="4" />
  
  <!-- Window Header / Title Bar -->
  <rect x="120" y="80" width="1040" height="60" rx="20" fill="#202023" />
  <!-- Window Control Buttons -->
  <circle cx="160" cy="110" r="8" fill="#ef4444" />
  <circle cx="184" cy="110" r="8" fill="#f59e0b" />
  <circle cx="208" cy="110" r="8" fill="#10b981" />
  
  <!-- Tab indicator or Title -->
  <text x="240" y="116" font-family="'Inter', sans-serif" font-size="16" font-weight="600" fill="#f4f4f5">Shop Calculator &amp; Invoice Maker</text>
  <rect x="960" y="94" width="160" height="32" rx="16" fill="#7c3aed" />
  <text x="1040" y="114" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#ffffff" text-anchor="middle">Active Session</text>
  
  <!-- Split Dashboard Content -->
  <!-- Left Column: Calculator Panel -->
  <rect x="160" y="180" width="440" height="420" rx="16" fill="#09090b" stroke="#27272a" stroke-width="2" />
  <text x="190" y="220" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#f4f4f5">Smart Calculator</text>
  
  <!-- Screen mockup inside Calculator -->
  <rect x="190" y="240" width="380" height="80" rx="12" fill="#18181b" />
  <text x="550" y="275" font-family="'JetBrains Mono', monospace" font-size="16" fill="#a1a1aa" text-anchor="end">45.50 + 120.00 + 15.25</text>
  <text x="550" y="308" font-family="'JetBrains Mono', monospace" font-size="24" font-weight="700" fill="#10b981" text-anchor="end">$180.75</text>
  
  <!-- Buttons mockup grid -->
  <!-- Row 1 -->
  <rect x="190" y="340" width="80" height="50" rx="8" fill="#27272a" />
  <text x="230" y="372" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#f4f4f5" text-anchor="middle">7</text>
  <rect x="290" y="340" width="80" height="50" rx="8" fill="#27272a" />
  <text x="330" y="372" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#f4f4f5" text-anchor="middle">8</text>
  <rect x="390" y="340" width="80" height="50" rx="8" fill="#27272a" />
  <text x="430" y="372" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#f4f4f5" text-anchor="middle">9</text>
  <rect x="490" y="340" width="80" height="50" rx="8" fill="#7c3aed" />
  <text x="530" y="372" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#ffffff" text-anchor="middle">÷</text>
  
  <!-- Row 2 -->
  <rect x="190" y="405" width="80" height="50" rx="8" fill="#27272a" />
  <text x="230" y="437" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#f4f4f5" text-anchor="middle">4</text>
  <rect x="290" y="405" width="80" height="50" rx="8" fill="#27272a" />
  <text x="330" y="437" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#f4f4f5" text-anchor="middle">5</text>
  <rect x="390" y="405" width="80" height="50" rx="8" fill="#27272a" />
  <text x="430" y="437" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#f4f4f5" text-anchor="middle">6</text>
  <rect x="490" y="405" width="80" height="50" rx="8" fill="#7c3aed" />
  <text x="530" y="437" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#ffffff" text-anchor="middle">×</text>
  
  <!-- Row 3 -->
  <rect x="190" y="470" width="80" height="50" rx="8" fill="#27272a" />
  <text x="230" y="502" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#f4f4f5" text-anchor="middle">1</text>
  <rect x="290" y="470" width="80" height="50" rx="8" fill="#27272a" />
  <text x="330" y="502" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#f4f4f5" text-anchor="middle">2</text>
  <rect x="390" y="470" width="80" height="50" rx="8" fill="#27272a" />
  <text x="430" y="502" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#f4f4f5" text-anchor="middle">3</text>
  <rect x="490" y="470" width="80" height="50" rx="8" fill="#7c3aed" />
  <text x="530" y="502" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#ffffff" text-anchor="middle">-</text>

  <!-- Row 4 -->
  <rect x="190" y="535" width="80" height="50" rx="8" fill="#ef4444" opacity="0.8" />
  <text x="230" y="567" font-family="'Inter', sans-serif" font-size="16" font-weight="600" fill="#ffffff" text-anchor="middle">C</text>
  <rect x="290" y="535" width="80" height="50" rx="8" fill="#27272a" />
  <text x="330" y="567" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#f4f4f5" text-anchor="middle">0</text>
  <rect x="390" y="535" width="80" height="50" rx="8" fill="#27272a" />
  <text x="430" y="567" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#f4f4f5" text-anchor="middle">.</text>
  <rect x="490" y="535" width="80" height="50" rx="8" fill="#10b981" />
  <text x="530" y="567" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#ffffff" text-anchor="middle">+</text>

  <!-- Right Column: Bill Receipt & Shop Stats -->
  <rect x="640" y="180" width="480" height="420" rx="16" fill="#09090b" stroke="#27272a" stroke-width="2" />
  <text x="670" y="220" font-family="'Inter', sans-serif" font-size="18" font-weight="600" fill="#f4f4f5">Current Bill / Receipt</text>
  
  <!-- Receipt layout -->
  <rect x="670" y="240" width="420" height="230" rx="12" fill="#18181b" />
  <text x="690" y="275" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#a1a1aa">CASH MEMO</text>
  <text x="1070" y="275" font-family="'JetBrains Mono', monospace" font-size="12" fill="#71717a" text-anchor="end">#INV-2026-001</text>
  
  <line x1="690" y1="290" x2="1070" y2="290" stroke="#27272a" stroke-width="2" stroke-dasharray="4 4" />
  
  <text x="690" y="320" font-family="'Inter', sans-serif" font-size="14" fill="#e4e4e7">1. Premium Groceries</text>
  <text x="1070" y="320" font-family="'JetBrains Mono', monospace" font-size="14" fill="#e4e4e7" text-anchor="end">$45.50</text>
  
  <text x="690" y="350" font-family="'Inter', sans-serif" font-size="14" fill="#e4e4e7">2. Fresh Fruits &amp; Veggies</text>
  <text x="1070" y="350" font-family="'JetBrains Mono', monospace" font-size="14" fill="#e4e4e7" text-anchor="end">$120.00</text>
  
  <text x="690" y="380" font-family="'Inter', sans-serif" font-size="14" fill="#e4e4e7">3. Eco Carry Bag</text>
  <text x="1070" y="380" font-family="'JetBrains Mono', monospace" font-size="14" fill="#e4e4e7" text-anchor="end">$15.25</text>
  
  <line x1="690" y1="410" x2="1070" y2="410" stroke="#27272a" stroke-width="2" />
  
  <text x="690" y="440" font-family="'Inter', sans-serif" font-size="16" font-weight="700" fill="#ffffff">Grand Total</text>
  <text x="1070" y="440" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="700" fill="#10b981" text-anchor="end">$180.75</text>
  
  <rect x="670" y="490" width="200" height="46" rx="8" fill="#27272a" />
  <text x="770" y="518" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#f4f4f5" text-anchor="middle">Add Discount</text>
  
  <rect x="890" y="490" width="200" height="46" rx="8" fill="#10b981" />
  <text x="990" y="518" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">Share Bill</text>
  
  <rect x="670" y="555" width="420" height="30" rx="6" fill="#202023" />
  <circle cx="685" cy="570" r="4" fill="#10b981" />
  <text x="700" y="574" font-family="'Inter', sans-serif" font-size="11" fill="#a1a1aa">Offline auto-save is enabled. Data preserved locally.</text>
</svg>
`;

const screenshotMobileSvg = `
<svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg">
  <!-- Dark theme background -->
  <rect width="720" height="1280" fill="#09090b" />
  
  <!-- Ambient glow background -->
  <circle cx="360" cy="640" r="300" fill="#7c3aed" opacity="0.15" filter="blur(80px)" />
  
  <!-- Mobile Phone Frame -->
  <rect x="40" y="60" width="640" height="1160" rx="40" fill="#18181b" stroke="#27272a" stroke-width="6" />
  
  <!-- Speaker and camera notch -->
  <rect x="280" y="80" width="160" height="30" rx="15" fill="#09090b" />
  <circle cx="410" cy="95" r="5" fill="#1f2937" />
  
  <!-- Status bar mockup -->
  <text x="90" y="132" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#e4e4e7">9:41 AM</text>
  <text x="630" y="132" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#e4e4e7" text-anchor="end">📶 🔋</text>
  
  <!-- App Title inside screen -->
  <text x="360" y="190" font-family="'Inter', sans-serif" font-size="24" font-weight="700" fill="#ffffff" text-anchor="middle">Shop Calculator</text>
  <text x="360" y="215" font-family="'Inter', sans-serif" font-size="13" font-weight="500" fill="#a1a1aa" text-anchor="middle">Quick Ledger &amp; Cash Memo</text>
  
  <!-- Tabs representation -->
  <rect x="80" y="245" width="560" height="48" rx="24" fill="#09090b" stroke="#27272a" stroke-width="2" />
  <!-- Left active tab -->
  <rect x="84" y="249" width="276" height="40" rx="20" fill="#7c3aed" />
  <text x="222" y="274" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">Smart Calc</text>
  <!-- Right tab -->
  <text x="502" y="274" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#a1a1aa" text-anchor="middle">Invoice Maker</text>
  
  <!-- Display screen mockup -->
  <rect x="80" y="320" width="560" height="150" rx="16" fill="#09090b" stroke="#27272a" stroke-width="2" />
  <text x="610" y="365" font-family="'JetBrains Mono', monospace" font-size="20" fill="#71717a" text-anchor="end">29.99 + 4.50 + 12.00</text>
  <text x="610" y="425" font-family="'JetBrains Mono', monospace" font-size="36" font-weight="700" fill="#10b981" text-anchor="end">$46.49</text>
  <rect x="615" y="380" width="10" height="2" fill="#7c3aed" opacity="0.6" />
  
  <!-- Keypad section -->
  <!-- Row 1 -->
  <rect x="80" y="500" width="120" height="80" rx="16" fill="#1f1f23" />
  <text x="140" y="548" font-family="'Inter', sans-serif" font-size="24" font-weight="600" fill="#ffffff" text-anchor="middle">7</text>
  <rect x="226" y="500" width="120" height="80" rx="16" fill="#1f1f23" />
  <text x="286" y="548" font-family="'Inter', sans-serif" font-size="24" font-weight="600" fill="#ffffff" text-anchor="middle">8</text>
  <rect x="372" y="500" width="120" height="80" rx="16" fill="#1f1f23" />
  <text x="432" y="548" font-family="'Inter', sans-serif" font-size="24" font-weight="600" fill="#ffffff" text-anchor="middle">9</text>
  <rect x="520" y="500" width="120" height="80" rx="16" fill="#7c3aed" />
  <text x="580" y="548" font-family="'Inter', sans-serif" font-size="26" font-weight="600" fill="#ffffff" text-anchor="middle">÷</text>
  
  <!-- Row 2 -->
  <rect x="80" y="605" width="120" height="80" rx="16" fill="#1f1f23" />
  <text x="140" y="653" font-family="'Inter', sans-serif" font-size="24" font-weight="600" fill="#ffffff" text-anchor="middle">4</text>
  <rect x="226" y="605" width="120" height="80" rx="16" fill="#1f1f23" />
  <text x="286" y="653" font-family="'Inter', sans-serif" font-size="24" font-weight="600" fill="#ffffff" text-anchor="middle">5</text>
  <rect x="372" y="605" width="120" height="80" rx="16" fill="#1f1f23" />
  <text x="432" y="653" font-family="'Inter', sans-serif" font-size="24" font-weight="600" fill="#ffffff" text-anchor="middle">6</text>
  <rect x="520" y="605" width="120" height="80" rx="16" fill="#7c3aed" />
  <text x="580" y="653" font-family="'Inter', sans-serif" font-size="26" font-weight="600" fill="#ffffff" text-anchor="middle">×</text>
  
  <!-- Row 3 -->
  <rect x="80" y="710" width="120" height="80" rx="16" fill="#1f1f23" />
  <text x="140" y="758" font-family="'Inter', sans-serif" font-size="24" font-weight="600" fill="#ffffff" text-anchor="middle">1</text>
  <rect x="226" y="710" width="120" height="80" rx="16" fill="#1f1f23" />
  <text x="286" y="758" font-family="'Inter', sans-serif" font-size="24" font-weight="600" fill="#ffffff" text-anchor="middle">2</text>
  <rect x="372" y="710" width="120" height="80" rx="16" fill="#1f1f23" />
  <text x="432" y="758" font-family="'Inter', sans-serif" font-size="24" font-weight="600" fill="#ffffff" text-anchor="middle">3</text>
  <rect x="520" y="710" width="120" height="80" rx="16" fill="#7c3aed" />
  <text x="580" y="758" font-family="'Inter', sans-serif" font-size="26" font-weight="600" fill="#ffffff" text-anchor="middle">-</text>
  
  <!-- Row 4 -->
  <rect x="80" y="815" width="120" height="80" rx="16" fill="#ef4444" opacity="0.9" />
  <text x="140" y="863" font-family="'Inter', sans-serif" font-size="22" font-weight="600" fill="#ffffff" text-anchor="middle">C</text>
  <rect x="226" y="815" width="120" height="80" rx="16" fill="#1f1f23" />
  <text x="286" y="863" font-family="'Inter', sans-serif" font-size="24" font-weight="600" fill="#ffffff" text-anchor="middle">0</text>
  <rect x="372" y="815" width="120" height="80" rx="16" fill="#1f1f23" />
  <text x="432" y="863" font-family="'Inter', sans-serif" font-size="24" font-weight="600" fill="#ffffff" text-anchor="middle">.</text>
  <rect x="520" y="815" width="120" height="80" rx="16" fill="#10b981" />
  <text x="580" y="863" font-family="'Inter', sans-serif" font-size="26" font-weight="600" fill="#ffffff" text-anchor="middle">+</text>
  
  <!-- Bottom PWA Promo banner/Bill preview -->
  <rect x="80" y="920" width="560" height="110" rx="16" fill="#111827" stroke="#374151" stroke-width="2" />
  <text x="110" y="955" font-family="'Inter', sans-serif" font-size="16" font-weight="600" fill="#ffffff">Active Memo: 3 Items Added</text>
  <text x="110" y="980" font-family="'Inter', sans-serif" font-size="13" fill="#9ca3af">Total shopping bill is compiled offline.</text>
  <rect x="510" y="950" width="100" height="40" rx="20" fill="#10b981" />
  <text x="560" y="974" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="#ffffff" text-anchor="middle">Add Item</text>

  <!-- Navigation indicator line -->
  <rect x="260" y="1200" width="200" height="5" rx="2.5" fill="#52525b" />
</svg>
`;

async function main() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Generating brand new icons and screenshots from scratch using sharp...');

  // 1. icon-192.png (exactly 192x192 PNG)
  await sharp(Buffer.from(iconSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Generated icon-192.png');

  // 2. icon-512.png (exactly 512x512 PNG)
  await sharp(Buffer.from(iconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Generated icon-512.png');

  // 3. icon-maskable.png (exactly 512x512 PNG with safe padding)
  await sharp(Buffer.from(maskableIconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable.png'));
  console.log('✓ Generated icon-maskable.png');

  // 4. screenshot-desktop.png (exactly 1280x720 PNG)
  await sharp(Buffer.from(screenshotDesktopSvg))
    .resize(1280, 720)
    .png()
    .toFile(path.join(publicDir, 'screenshot-desktop.png'));
  console.log('✓ Generated screenshot-desktop.png');

  // 5. screenshot-mobile.png (exactly 720x1280 PNG)
  await sharp(Buffer.from(screenshotMobileSvg))
    .resize(720, 1280)
    .png()
    .toFile(path.join(publicDir, 'screenshot-mobile.png'));
  console.log('✓ Generated screenshot-mobile.png');

  console.log('All PWA assets have been created successfully!');
}

main().catch(err => {
  console.error('Error generating PWA assets:', err);
  process.exit(1);
});
