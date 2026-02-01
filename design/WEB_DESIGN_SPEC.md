# Ghana Rental Authority Portal - Web Design Specification

## Overview
This document provides Figma-ready design specifications for the web-based authority portal used by GRA Officers, Inspectors, and System Administrators.

---

## Design System

### Viewport & Grid
```
Minimum Width:     1280px
Maximum Width:     1920px (centered)
Sidebar Width:     280px (collapsed: 80px)
Content Padding:   32px
Grid:              12 columns, 24px gutter
Card Gap:          24px
```

### Color Palette

#### Primary Colors (Ghana Flag Inspired)
```
Primary Green:      #006B3F (Ghana Green)
Primary Light:      #4CAF50
Primary Dark:       #004D2C

Secondary Gold:     #FCD116 (Ghana Yellow)
Secondary Light:    #FFEB3B
Secondary Dark:     #C9A800

Accent Red:         #CE1126 (Ghana Red)
Accent Light:       #FF5252
Accent Dark:        #9B0D1C
```

#### Neutral Colors
```
Background:         #F5F7FA
Surface:            #FFFFFF
Surface Hover:      #F9FAFB
Surface Active:     #F0F0F0
Border:             #E0E0E0
Border Light:       #EEEEEE
Divider:            #F0F0F0
```

#### Text Colors
```
Text Primary:       #1A1A1A
Text Secondary:     #666666
Text Light:         #999999
Text On Primary:    #FFFFFF
Text On Secondary:  #1A1A1A
```

#### Status Colors
```
Success:            #4CAF50
Success Light:      #E8F5E9
Warning:            #FF9800
Warning Light:      #FFF3E0
Error:              #F44336
Error Light:        #FFEBEE
Info:               #2196F3
Info Light:         #E3F2FD
```

### Typography

#### Font Family
- **Primary**: Inter (Google Fonts)
- **Monospace**: JetBrains Mono (for codes, IDs)
- **Fallback**: -apple-system, BlinkMacSystemFont, sans-serif

#### Type Scale
```
H1:         32px / Bold (700) / Line Height 40px
H2:         28px / SemiBold (600) / Line Height 36px
H3:         24px / SemiBold (600) / Line Height 32px
H4:         20px / SemiBold (600) / Line Height 28px
H5:         18px / SemiBold (600) / Line Height 24px
Body:       16px / Regular (400) / Line Height 24px
Body Small: 14px / Regular (400) / Line Height 20px
Caption:    12px / Regular (400) / Line Height 16px
Button:     14px / SemiBold (600) / Line Height 20px
Table:      14px / Regular (400) / Line Height 20px
```

### Spacing Scale
```
XS:     4px
SM:     8px
MD:     16px
LG:     24px
XL:     32px
XXL:    48px
XXXL:   64px
```

### Border Radius
```
SM:     4px
MD:     8px
LG:     12px
XL:     16px
```

### Shadows
```
Card:       0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)
Dropdown:   0px 4px 6px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.06)
Modal:      0px 20px 25px rgba(0, 0, 0, 0.15), 0px 10px 10px rgba(0, 0, 0, 0.04)
Sidebar:    2px 0px 8px rgba(0, 0, 0, 0.05)
```

---

## Screen Specifications

---

### 1. Login Screen

**Full Page Layout - Centered**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│                                                                                      │
│                         ┌────────────────────────────────────┐                       │
│                         │                                    │                       │
│                         │     ┌──────────────────────┐       │                       │
│                         │     │    🏛️ GRA Logo       │       │  Logo: 80x80px
│                         │     │    #006B3F           │       │  Background: rgba(0,107,63,0.1)
│                         │     └──────────────────────┘       │  Border Radius: 16px
│                         │                                    │
│                         │     Ghana Rental Authority         │  H2: 28px, Bold, #1A1A1A
│                         │           Portal                   │  Body: 16px, #666666
│                         │                                    │
│                         │     ┌──────────────────────────┐   │
│                         │     │ Email                    │   │  Input Fields
│                         │     │ admin@gra.gov.gh         │   │  Width: 360px
│                         │     └──────────────────────────┘   │  Height: 48px
│                         │     ┌──────────────────────────┐   │  Border Radius: 8px
│                         │     │ Password              👁  │   │
│                         │     │ ••••••••                 │   │
│                         │     └──────────────────────────┘   │
│                         │                                    │
│                         │     ☐ Remember me on this device   │  Checkbox: 18px
│                         │                                    │
│                         │     ┌──────────────────────────┐   │
│                         │     │        Sign In           │   │  Button: 48px height
│                         │     └──────────────────────────┘   │  Background: #006B3F
│                         │                                    │  Border Radius: 8px
│                         │     Forgot your password?          │  Link: #006B3F
│                         │                                    │
│                         │  ─────────────── OR ───────────────│
│                         │                                    │
│                         │     Demo Accounts:                 │
│                         │     ┌────────────┐ ┌────────────┐  │  Demo buttons
│                         │     │ GRA Officer│ │  Inspector │  │  Background: #F5F7FA
│                         │     └────────────┘ └────────────┘  │  Border: 1px #E0E0E0
│                         │     ┌────────────────────────────┐ │
│                         │     │       Administrator        │ │
│                         │     └────────────────────────────┘ │
│                         │                                    │
│                         └────────────────────────────────────┘
│                                                                                      │
│                          © 2025 Ghana Revenue Authority                              │
│                          Privacy Policy | Terms of Service                           │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Card Specifications**
```
Login Card:
- Width: 440px
- Padding: 48px
- Background: #FFFFFF
- Border Radius: 16px
- Shadow: Modal Shadow
```

---

### 2. Main Layout Structure

**Authenticated Layout with Sidebar**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  ┌────────────────────┬──────────────────────────────────────────────────────────┐  │
│  │                    │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  ┌──────────────┐  │  │  🔍 Search properties, contracts, users...    🔔 👤  │ │  │  Top Bar
│  │  │ 🏛️ GRA       │  │  └──────────────────────────────────────────────────────┘ │  │  Height: 64px
│  │  │ Portal       │  │                                                          │  │
│  │  └──────────────┘  │                                                          │  │
│  │                    │                                                          │  │
│  │  ─────────────────  │                                                          │  │
│  │                    │                                                          │  │
│  │  📊 Dashboard      │                                                          │  │  Sidebar
│  │  ────────────────  │                    CONTENT AREA                          │  │  Width: 280px
│  │  🏠 Properties     │                                                          │  │  Background: #FFFFFF
│  │  📄 Contracts      │                                                          │  │  Border Right: 1px #E0E0E0
│  │  💳 Payments       │                                                          │  │
│  │  📈 Tax Reports    │                                                          │  │  Content
│  │  ────────────────  │                                                          │  │  Background: #F5F7FA
│  │  👥 Users          │                                                          │  │  Padding: 32px
│  │  🔍 Inspections    │                                                          │  │
│  │  ⚙️ Settings       │                                                          │  │
│  │                    │                                                          │  │
│  │                    │                                                          │  │
│  │                    │                                                          │  │
│  │  ─────────────────  │                                                          │  │
│  │  Admin User        │                                                          │  │
│  │  admin@gra.gov.gh  │                                                          │  │
│  │  🚪 Logout         │                                                          │  │
│  └────────────────────┴──────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Sidebar Navigation Item**
```
Height: 44px
Padding: 12px 16px
Border Radius: 8px
Font: 14px, Medium
Icon: 20px, margin-right 12px

Default:   Background transparent, Text #666666, Icon #999999
Hover:     Background #F5F7FA, Text #1A1A1A
Active:    Background rgba(0,107,63,0.1), Text #006B3F, Icon #006B3F
           Left border: 3px solid #006B3F
```

---

### 3. GRA Officer Dashboard

**Role: GRA_OFFICER**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Sidebar │                                                                           │
├──────────┤  Dashboard                                          Last updated: 2 min ago│
│          │                                                                           │
│          │  ┌─────────────────────┬─────────────────────┬─────────────────────┬─────│
│          │  │                     │                     │                     │     │
│          │  │  Total Properties   │  Active Contracts   │  Tax Collected      │ ... │
│          │  │       1,234         │       892           │   GHS 2.4M          │     │
│          │  │   ↑ 12% this month  │   ↑ 8% this month   │   ↑ 15% this month  │     │
│          │  │                     │                     │                     │     │
│          │  └─────────────────────┴─────────────────────┴─────────────────────┴─────│
│          │                                                                           │
│          │  ┌─────────────────────────────────────┬─────────────────────────────────┐│
│          │  │  Tax Collection Overview            │  Regional Distribution          ││
│          │  │  ┌───────────────────────────────┐  │  ┌───────────────────────────┐  ││
│          │  │  │                               │  │  │                           │  ││
│          │  │  │   [LINE CHART]                │  │  │   [PIE CHART]             │  ││
│          │  │  │   Monthly tax revenue         │  │  │   By region               │  ││
│          │  │  │                               │  │  │                           │  ││
│          │  │  │                               │  │  │  ● Greater Accra  45%     │  ││
│          │  │  │                               │  │  │  ● Ashanti       25%      │  ││
│          │  │  │                               │  │  │  ● Western       15%      │  ││
│          │  │  │                               │  │  │  ● Other         15%      │  ││
│          │  │  └───────────────────────────────┘  │  └───────────────────────────┘  ││
│          │  └─────────────────────────────────────┴─────────────────────────────────┘│
│          │                                                                           │
│          │  ┌───────────────────────────────────────────────────────────────────────┐│
│          │  │  Recent Tax Payments                                      View All ▶  ││
│          │  │  ┌─────────────────────────────────────────────────────────────────┐  ││
│          │  │  │ ID           │ Property        │ Amount      │ Tax      │ Status │  ││
│          │  │  ├─────────────────────────────────────────────────────────────────┤  ││
│          │  │  │ PAY-001234   │ Apt 3B, Legon   │ GHS 2,500   │ GHS 200  │ ✓ Paid │  ││
│          │  │  │ PAY-001233   │ Shop 12, Osu    │ GHS 5,000   │ GHS 400  │ ✓ Paid │  ││
│          │  │  │ PAY-001232   │ Office, Airport │ GHS 8,000   │ GHS 640  │ ⏳ Pend │  ││
│          │  │  └─────────────────────────────────────────────────────────────────┘  ││
│          │  └───────────────────────────────────────────────────────────────────────┘│
│          │                                                                           │
└──────────┴───────────────────────────────────────────────────────────────────────────┘
```

**Stats Card**
```
Width: 25% (minus gaps)
Height: 120px
Background: #FFFFFF
Border Radius: 12px
Padding: 24px
Shadow: Card Shadow

Icon Container: 48x48px, Border Radius 12px
- Properties: Background #E8F5E9, Icon #4CAF50
- Contracts: Background #E3F2FD, Icon #2196F3
- Tax: Background #FFF3E0, Icon #FF9800
- Compliance: Background #FFEBEE, Icon #F44336

Value: 32px, Bold, #1A1A1A
Label: 14px, #666666
Trend: 12px, with arrow icon
  Positive: #4CAF50
  Negative: #F44336
```

---

### 4. Properties Management Screen

**For GRA Officers & Inspectors**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Sidebar │                                                                           │
├──────────┤  Properties                                                               │
│          │                                                                           │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │  🔍 Search by address, owner, ID...          │ Region ▼ │ Status ▼ │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │ All (1,234) │ Verified (892) │ Pending (245) │ Flagged (97)          │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │                                                                     │  │
│          │  │  ☐  │ Property               │ Owner           │ Region    │ Status │  │
│          │  │  ───────────────────────────────────────────────────────────────────│  │
│          │  │  ☐  │ 🏠 Apartment 3B        │ Kwame Asante    │ Greater   │ ✓ Verified │
│          │  │     │    15 Oxford St, Legon │ GHA-123456789-0 │ Accra     │          │  │
│          │  │  ───────────────────────────────────────────────────────────────────│  │
│          │  │  ☐  │ 🏢 Shop Space 12       │ Ama Mensah      │ Greater   │ ⏳ Pending │
│          │  │     │    Ring Road, Osu      │ GHA-987654321-0 │ Accra     │          │  │
│          │  │  ───────────────────────────────────────────────────────────────────│  │
│          │  │  ☐  │ 🏠 House No. 45        │ Kofi Boateng    │ Ashanti   │ ⚠️ Flagged │
│          │  │     │    Adum, Kumasi        │ GHA-111222333-0 │           │          │  │
│          │  │  ───────────────────────────────────────────────────────────────────│  │
│          │  │                                                                     │  │
│          │  │  ◀ Previous    Page 1 of 124    Next ▶          Showing 1-10 of 1234│  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
└──────────┴───────────────────────────────────────────────────────────────────────────┘
```

**Table Specifications**
```
Header Row:
- Height: 48px
- Background: #F9FAFB
- Font: 12px, SemiBold, #666666, uppercase
- Border Bottom: 1px #E0E0E0

Data Row:
- Height: 72px (for two-line content)
- Background: #FFFFFF
- Hover: #F9FAFB
- Border Bottom: 1px #F0F0F0
- Font: 14px, Regular, #1A1A1A
- Secondary text: 13px, #999999

Checkbox: 18px, Border Radius 4px
```

---

### 5. Property Detail View (Side Panel)

**Slide-in Panel from Right**

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                        ┌─────────────────────────────┐ │
│  Properties List (dimmed)                              │  ✕                          │ │
│                                                        │                             │ │
│                                                        │  Property Details           │ │
│                                                        │                             │ │
│                                                        │  ┌───────────────────────┐  │ │
│                                                        │  │   [Property Image]    │  │ │
│                                                        │  │   Placeholder/Map     │  │ │
│                                                        │  └───────────────────────┘  │ │
│                                                        │                             │ │
│                                                        │  Apartment 3B               │ │
│                                                        │  15 Oxford Street, East Legon│ │
│                                                        │  GA-123-4567                │ │
│                                                        │                             │ │
│                                                        │  ┌─────────┬─────────┐      │ │
│                                                        │  │✓ Verified│ 3🛏 2🚿 │      │ │
│                                                        │  └─────────┴─────────┘      │ │
│                                                        │                             │ │
│                                                        │  ─────────────────────────  │ │
│                                                        │                             │ │
│                                                        │  Owner Information          │ │
│                                                        │  👤 Kwame Asante            │ │
│                                                        │  📱 +233 24 123 4567        │ │
│                                                        │  🪪 GHA-123456789-0         │ │
│                                                        │                             │ │
│                                                        │  ─────────────────────────  │ │
│                                                        │                             │ │
│                                                        │  Financial Summary          │ │
│                                                        │  Monthly Rent: GHS 2,500    │ │
│                                                        │  Tax Rate: 8%               │ │
│                                                        │  Tax/Month: GHS 200         │ │
│                                                        │  Total Tax Collected:       │ │
│                                                        │  GHS 2,400 (12 months)      │ │
│                                                        │                             │ │
│                                                        │  ─────────────────────────  │ │
│                                                        │                             │ │
│                                                        │  Active Contracts (1)       │ │
│                                                        │  ┌───────────────────────┐  │ │
│                                                        │  │ GRC-2025-001          │  │ │
│                                                        │  │ Tenant: Ama Mensah    │  │ │
│                                                        │  │ Jan 2025 - Dec 2025   │  │ │
│                                                        │  │              View ▶   │  │ │
│                                                        │  └───────────────────────┘  │ │
│                                                        │                             │ │
│                                                        │  ┌───────────────────────┐  │ │
│                                                        │  │  🔍 Request Inspection │  │ │
│                                                        │  └───────────────────────┘  │ │
│                                                        │  ┌───────────────────────┐  │ │
│                                                        │  │  ⚠️ Flag Property      │  │ │
│                                                        │  └───────────────────────┘  │ │
│                                                        └─────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Side Panel Specifications**
```
Width: 480px
Background: #FFFFFF
Shadow: Modal Shadow
Animation: Slide from right (300ms ease-out)
Overlay: rgba(0, 0, 0, 0.4)
```

---

### 6. Contracts Monitoring Screen

**For GRA Officers**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Sidebar │                                                                           │
├──────────┤  Contracts                                                    + New Filter│
│          │                                                                           │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │  Date Range: [Jan 1, 2025 📅] to [Jan 31, 2025 📅]  │ Apply │ Reset │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  Summary                                                                  │
│          │  ┌──────────────┬──────────────┬──────────────┬──────────────┐           │
│          │  │ Total        │ Active       │ Pending Sign │ Expired      │           │
│          │  │   2,456      │   1,892      │     234      │    330       │           │
│          │  └──────────────┴──────────────┴──────────────┴──────────────┘           │
│          │                                                                           │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │                                                                     │  │
│          │  │  Contract ID    │ Property       │ Parties         │ Value    │ Status│
│          │  │  ─────────────────────────────────────────────────────────────────── │  │
│          │  │  GRC-2025-0012  │ Apt 3B, Legon  │ K. Asante →     │ GHS 2,500│ Active│
│          │  │  📅 Jan-Dec '25 │                │ A. Mensah       │ /month   │   ✓   │  │
│          │  │  ─────────────────────────────────────────────────────────────────── │  │
│          │  │  GRC-2025-0011  │ Shop 12, Osu   │ A. Mensah →     │ GHS 5,000│ Pending│
│          │  │  📅 Feb-Jan '26 │                │ QuickMart Ltd   │ /month   │   ⏳   │  │
│          │  │  ─────────────────────────────────────────────────────────────────── │  │
│          │  │  GRC-2024-0892  │ Office, Airport│ K. Boateng →    │ GHS 8,000│ Expired│
│          │  │  📅 Jan-Dec '24 │                │ TechCorp Ltd    │ /month   │   ⚠️   │  │
│          │  │                                                                     │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  Bulk Actions: [ Select All ] [ Export CSV ] [ Generate Report ]          │
│          │                                                                           │
└──────────┴───────────────────────────────────────────────────────────────────────────┘
```

---

### 7. Tax Reports & Analytics Screen

**For GRA Officers**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Sidebar │                                                                           │
├──────────┤  Tax Reports                                              📥 Export Report│
│          │                                                                           │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │ Period: │ Monthly │ Quarterly │ Yearly │    📅 2025   │   Generate   │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  Tax Collection Summary - 2025                                            │
│          │  ┌──────────────┬──────────────┬──────────────┬──────────────┐           │
│          │  │ Total        │ Collected    │ Pending      │ Rate         │           │
│          │  │ GHS 45.2M    │ GHS 38.7M    │ GHS 6.5M     │ 85.6%        │           │
│          │  │ Expected     │ ↑ 12%        │ ↓ 8%         │ ↑ 3.2%       │           │
│          │  └──────────────┴──────────────┴──────────────┴──────────────┘           │
│          │                                                                           │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │  Monthly Tax Collection Trend                                       │  │
│          │  │  ┌───────────────────────────────────────────────────────────────┐  │  │
│          │  │  │                                                               │  │  │
│          │  │  │   [BAR CHART - Monthly collections]                           │  │  │
│          │  │  │                                                               │  │  │
│          │  │  │   Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   │  │  │
│          │  │  │    ▓▓    ▓▓    ▓▓    ▓▓    ▓▓    ▓▓    ▓▓    ▓▓    ░░    ░░   │  │  │
│          │  │  │   3.2M  3.4M  3.6M  3.8M  4.0M  4.2M  4.1M  3.9M  ---   ---  │  │  │
│          │  │  │                                                               │  │  │
│          │  │  └───────────────────────────────────────────────────────────────┘  │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  ┌────────────────────────────────┬────────────────────────────────────┐  │
│          │  │  Top Contributing Regions      │  Tax by Property Type              │  │
│          │  │  ┌──────────────────────────┐  │  ┌──────────────────────────────┐  │  │
│          │  │  │ 1. Greater Accra  45%    │  │  │  ● Residential    65%        │  │  │
│          │  │  │ 2. Ashanti       25%     │  │  │  ● Commercial     30%        │  │  │
│          │  │  │ 3. Western       12%     │  │  │  ● Industrial      5%        │  │  │
│          │  │  │ 4. Eastern        8%     │  │  │                              │  │  │
│          │  │  │ 5. Others        10%     │  │  │     [DONUT CHART]            │  │  │
│          │  │  └──────────────────────────┘  │  └──────────────────────────────┘  │  │
│          │  └────────────────────────────────┴────────────────────────────────────┘  │
│          │                                                                           │
└──────────┴───────────────────────────────────────────────────────────────────────────┘
```

**Chart Specifications**
```
Chart Container:
- Background: #FFFFFF
- Border Radius: 12px
- Padding: 24px
- Shadow: Card Shadow

Bar Chart:
- Primary bars: #006B3F
- Secondary bars: rgba(0, 107, 63, 0.3)
- Grid lines: #F0F0F0
- Labels: 12px, #666666

Donut Chart:
- Colors: #006B3F, #4CAF50, #FCD116, #FF9800
- Center label: 24px, Bold
- Legend: 14px, #1A1A1A
```

---

### 8. Inspector Dashboard

**Role: INSPECTOR**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Sidebar │                                                                           │
├──────────┤  Inspector Dashboard                             Welcome, Inspector Mensah│
│          │                                                                           │
│          │  ┌─────────────────────┬─────────────────────┬─────────────────────┐      │
│          │  │  Assigned Cases     │  Completed Today    │  Pending Review     │      │
│          │  │       12            │        3            │        4            │      │
│          │  │  🔴 5 High Priority │  ✓ All submitted    │  Awaiting approval  │      │
│          │  └─────────────────────┴─────────────────────┴─────────────────────┘      │
│          │                                                                           │
│          │  My Inspection Queue                                                      │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │                                                                     │  │
│          │  │  ┌───────────────────────────────────────────────────────────────┐  │  │
│          │  │  │ 🔴 HIGH PRIORITY                           Assigned: Jan 15   │  │  │
│          │  │  │                                                               │  │  │
│          │  │  │ Property: House No. 45, Adum, Kumasi                          │  │  │
│          │  │  │ Owner: Kofi Boateng                                           │  │  │
│          │  │  │ Issue: Suspected unreported rental income                     │  │  │
│          │  │  │                                                               │  │  │
│          │  │  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │  │  │
│          │  │  │ │ View Details│ │ Start Insp. │ │ Get Directns│               │  │  │
│          │  │  │ └─────────────┘ └─────────────┘ └─────────────┘               │  │  │
│          │  │  └───────────────────────────────────────────────────────────────┘  │  │
│          │  │                                                                     │  │
│          │  │  ┌───────────────────────────────────────────────────────────────┐  │  │
│          │  │  │ 🟡 MEDIUM PRIORITY                         Assigned: Jan 14   │  │  │
│          │  │  │                                                               │  │  │
│          │  │  │ Property: Shop Complex, Ring Road, Osu                        │  │  │
│          │  │  │ Owner: Ama Mensah                                             │  │  │
│          │  │  │ Issue: Routine verification - new registration               │  │  │
│          │  │  │                                                               │  │  │
│          │  │  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │  │  │
│          │  │  │ │ View Details│ │ Start Insp. │ │ Get Directns│               │  │  │
│          │  │  │ └─────────────┘ └─────────────┘ └─────────────┘               │  │  │
│          │  │  └───────────────────────────────────────────────────────────────┘  │  │
│          │  │                                                                     │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
└──────────┴───────────────────────────────────────────────────────────────────────────┘
```

**Priority Badge Colors**
```
High (Red):     Background #FFEBEE, Text #F44336, Border-left: 4px #F44336
Medium (Yellow): Background #FFF3E0, Text #FF9800, Border-left: 4px #FF9800
Low (Blue):     Background #E3F2FD, Text #2196F3, Border-left: 4px #2196F3
```

---

### 9. Inspection Form Screen

**For Inspectors - Conducting an Inspection**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Sidebar │                                                                           │
├──────────┤  ◀ Back to Queue     Inspection: INS-2025-0045                           │
│          │                                                                           │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │  Property Information                                               │  │
│          │  │  ─────────────────────────────────────────────────────────────────  │  │
│          │  │  🏠 House No. 45, Adum, Kumasi                                      │  │
│          │  │  👤 Owner: Kofi Boateng  |  📱 +233 20 345 6789                     │  │
│          │  │  📍 Digital Address: AK-456-7890                                    │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  Inspection Checklist                                                     │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │                                                                     │  │
│          │  │  ☑ Property exists at specified address                            │  │
│          │  │  ☑ Property matches description (type, bedrooms, etc.)             │  │
│          │  │  ☐ Owner identity verified (Ghana Card checked)                    │  │
│          │  │  ☐ Current tenants interviewed                                     │  │
│          │  │  ☐ Rental agreement documents reviewed                             │  │
│          │  │  ☐ Payment records verified                                        │  │
│          │  │                                                                     │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  Findings                                                                 │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │  Inspection Result *                                                │  │
│          │  │  ┌─────────────────────────────────────────────────────────────┐    │  │
│          │  │  │ ○ Compliant  ○ Non-Compliant  ○ Requires Follow-up          │    │  │
│          │  │  └─────────────────────────────────────────────────────────────┘    │  │
│          │  │                                                                     │  │
│          │  │  Notes / Observations *                                             │  │
│          │  │  ┌─────────────────────────────────────────────────────────────┐    │  │
│          │  │  │ Property has 3 rental units. Owner claims only 1 is        │    │  │
│          │  │  │ rented but evidence suggests all 3 are occupied...          │    │  │
│          │  │  │                                                             │    │  │
│          │  │  └─────────────────────────────────────────────────────────────┘    │  │
│          │  │                                                                     │  │
│          │  │  Evidence Photos                                                    │  │
│          │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐                  │  │
│          │  │  │  📷    │ │  📷    │ │  📷    │ │  + Add Photo │                  │  │
│          │  │  │ IMG_01 │ │ IMG_02 │ │ IMG_03 │ │              │                  │  │
│          │  │  └────────┘ └────────┘ └────────┘ └──────────────┘                  │  │
│          │  │                                                                     │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  ┌─────────────────┐          ┌─────────────────────────────────────────┐ │
│          │  │  Save as Draft  │          │         Submit Inspection Report        │ │
│          │  └─────────────────┘          └─────────────────────────────────────────┘ │
│          │                                                                           │
└──────────┴───────────────────────────────────────────────────────────────────────────┘
```

---

### 10. Administrator - User Management Screen

**Role: ADMIN**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Sidebar │                                                                           │
├──────────┤  User Management                                          + Add New User  │
│          │                                                                           │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │  🔍 Search users...          │ Role ▼  │ Status ▼  │ Region ▼      │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  User Statistics                                                          │
│          │  ┌──────────────┬──────────────┬──────────────┬──────────────┐           │
│          │  │ Total Users  │ GRA Officers │ Inspectors   │ Admins       │           │
│          │  │    156       │     45       │     89       │     22       │           │
│          │  └──────────────┴──────────────┴──────────────┴──────────────┘           │
│          │                                                                           │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │                                                                     │  │
│          │  │  ☐  │ User                  │ Role         │ Region      │ Status   │  │
│          │  │  ───────────────────────────────────────────────────────────────────│  │
│          │  │  ☐  │ 👤 Kwaku Mensah       │ GRA Officer  │ Greater     │ ● Active │  │
│          │  │     │    kwaku@gra.gov.gh   │              │ Accra       │          │  │
│          │  │     │    Last login: 2 hours ago                        │ ⋯ Actions│  │
│          │  │  ───────────────────────────────────────────────────────────────────│  │
│          │  │  ☐  │ 👤 Adwoa Sarpong      │ Inspector    │ Ashanti     │ ● Active │  │
│          │  │     │    adwoa@gra.gov.gh   │              │             │          │  │
│          │  │     │    Last login: 1 day ago                          │ ⋯ Actions│  │
│          │  │  ───────────────────────────────────────────────────────────────────│  │
│          │  │  ☐  │ 👤 Yaw Asante         │ Admin        │ National    │ ○ Inact. │  │
│          │  │     │    yaw@gra.gov.gh     │              │             │          │  │
│          │  │     │    Last login: 30 days ago                        │ ⋯ Actions│  │
│          │  │                                                                     │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  Bulk Actions: [ Select All ] [ Activate ] [ Deactivate ] [ Export ]      │
│          │                                                                           │
└──────────┴───────────────────────────────────────────────────────────────────────────┘
```

**Actions Dropdown Menu**
```
┌─────────────────────┐
│ 👁️ View Profile     │
│ ✏️ Edit User        │
│ 🔑 Reset Password   │
│ ─────────────────── │
│ 🚫 Deactivate       │
│ 🗑️ Delete           │
└─────────────────────┘

Width: 180px
Background: #FFFFFF
Border Radius: 8px
Shadow: Dropdown Shadow
Item Height: 40px
Padding: 8px 16px
Hover: #F5F7FA
Danger items: #F44336 text
```

---

### 11. Add/Edit User Modal

**Modal Dialog**

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│              ┌─────────────────────────────────────────────────┐              │
│              │                                           ✕     │              │
│              │                                                 │              │
│              │  Add New User                                   │              │
│              │                                                 │              │
│              │  ┌────────────────────┐ ┌────────────────────┐  │              │
│              │  │ First Name *       │ │ Last Name *        │  │              │
│              │  │ Kwaku              │ │ Mensah             │  │              │
│              │  └────────────────────┘ └────────────────────┘  │              │
│              │                                                 │              │
│              │  Email Address *                                │              │
│              │  ┌─────────────────────────────────────────┐    │              │
│              │  │ kwaku.mensah@gra.gov.gh                 │    │              │
│              │  └─────────────────────────────────────────┘    │              │
│              │                                                 │              │
│              │  Phone Number *                                 │              │
│              │  ┌─────────────────────────────────────────┐    │              │
│              │  │ +233 24 567 8901                        │    │              │
│              │  └─────────────────────────────────────────┘    │              │
│              │                                                 │              │
│              │  Role *                                         │              │
│              │  ┌───────────────��─────────────────────────┐    │              │
│              │  │ GRA Officer                          ▼  │    │              │
│              │  └─────────────────────────────────────────┘    │              │
│              │                                                 │              │
│              │  Assigned Region *                              │              │
│              │  ┌─────────────────────────────────────────┐    │              │
│              │  │ Greater Accra                        ▼  │    │              │
│              │  └─────────────────────────────────────────┘    │              │
│              │                                                 │              │
│              │  ☑ Send welcome email with login instructions   │              │
│              │                                                 │              │
│              │  ┌─────────────┐    ┌─────────────────────────┐ │              │
│              │  │   Cancel    │    │      Create User        │ │              │
│              │  └─────────────┘    └─────────────────────────┘ │              │
│              │                                                 │              │
│              └─────────────────────────────────────────────────┘              │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Modal Specifications**
```
Width: 520px
Background: #FFFFFF
Border Radius: 16px
Padding: 32px
Shadow: Modal Shadow
Overlay: rgba(0, 0, 0, 0.5)
Animation: Fade in + scale from 0.95 (200ms ease-out)
```

---

### 12. System Settings Screen

**For Administrators**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Sidebar │                                                                           │
├──────────┤  System Settings                                                          │
│          │                                                                           │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │ General │ Tax Config │ Notifications │ Integrations │ Security      │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  Tax Configuration                                                        │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │                                                                     │  │
│          │  │  Withholding Tax Rate                                               │  │
│          │  │  ┌──────────────────────────────────────────────────┐               │  │
│          │  │  │ 8                                            %   │               │  │
│          │  │  └──────────────────────────────────────────────────┘               │  │
│          │  │  Current GRA mandated rate for rental income                        │  │
│          │  │                                                                     │  │
│          │  │  Minimum Taxable Rent (GHS)                                         │  │
│          │  │  ┌──────────────────────────────────────────────────┐               │  │
│          │  │  │ 0                                                │               │  │
│          │  │  └──────────────────────────────────────────────────┘               │  │
│          │  │  Rent below this amount is exempt from withholding tax              │  │
│          │  │                                                                     │  │
│          │  │  Tax Payment Due Day                                                │  │
│          │  │  ┌──────────────────────────────────────────────────┐               │  │
│          │  │  │ 15                                               │               │  │
│          │  │  └──────────────────────────────────────────────────┘               │  │
│          │  │  Day of month when tax payments are due to GRA                      │  │
│          │  │                                                                     │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  Mobile Money Integration                                                 │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │                                                                     │  │
│          │  │  ┌────────────────────────────────────────────┬────────────────┐    │  │
│          │  │  │  MTN Mobile Money                         │ ● Connected    │    │  │
│          │  │  │  API Key: ****-****-****-1234             │   Configure    │    │  │
│          │  │  └────────────────────────────────────────────┴────────────────┘    │  │
│          │  │  ┌────────────────────────────────────────────┬────────────────┐    │  │
│          │  │  │  Vodafone Cash                            │ ○ Disconnected │    │  │
│          │  │  │  Not configured                           │   Setup        │    │  │
│          │  │  └────────────────────────────────────────────┴────────────────┘    │  │
│          │  │  ┌────────────────────────────────────────────┬────────────────┐    │  │
│          │  │  │  AirtelTigo Money                         │ ○ Disconnected │    │  │
│          │  │  │  Not configured                           │   Setup        │    │  │
│          │  │  └────────────────────────────────────────────┴────────────────┘    │  │
│          │  │                                                                     │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  ┌───────────────────────┐                                                │
│          │  │     Save Changes      │                                                │
│          │  └───────────────────────┘                                                │
│          │                                                                           │
└──────────┴───────────────────────────────────────────────────────────────────────────┘
```

---

### 13. Compliance Reports Screen

**For GRA Officers & Admins**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Sidebar │                                                                           │
├──────────┤  Compliance Reports                                       📥 Download All │
│          │                                                                           │
│          │  Compliance Overview                                                      │
│          │  ┌──────────────┬──────────────┬──────────────┬──────────────┐           │
│          │  │ Compliant    │ At Risk      │ Non-Compliant│ Under Review │           │
│          │  │   78%        │   12%        │    7%        │    3%        │           │
│          │  │  1,456       │   224        │   131        │   56         │           │
│          │  └──────────────┴──────────────┴──────────────┴──────────────┘           │
│          │                                                                           │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │  Compliance by Region                                               │  │
│          │  │  ┌───────────────────────────────────────────────────────────────┐  │  │
│          │  │  │                                                               │  │  │
│          │  │  │  [HORIZONTAL BAR CHART]                                       │  │  │
│          │  │  │                                                               │  │  │
│          │  │  │  Greater Accra   ████████████████████░░░░░░░ 85%              │  │  │
│          │  │  │  Ashanti         ███████████████████░░░░░░░░ 80%              │  │  │
│          │  │  │  Western         ██████████████████░░░░░░░░░ 75%              │  │  │
│          │  │  │  Eastern         █████████████████░░░░░░░░░░ 72%              │  │  │
│          │  │  │  Central         ████████████████░░░░░░░░░░░ 68%              │  │  │
│          │  │  │                                                               │  │  │
│          │  │  │  ■ Compliant  □ Non-Compliant                                 │  │  │
│          │  │  └───────────────────────────────────────────────────────────────┘  │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  Non-Compliant Properties Requiring Action                                │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │                                                                     │  │
│          │  │  Property          │ Issue                │ Days    │ Action       │  │
│          │  │  ────────────────────────────────────────────────────────────────── │  │
│          │  │  House 45, Kumasi  │ Unreported income    │ 45      │ View | Flag  │  │
│          │  │  Shop 12, Osu      │ Missing contracts    │ 30      │ View | Flag  │  │
│          │  │  Apt 8B, Tema      │ Overdue tax payment  │ 15      │ View | Flag  │  │
│          │  │                                                                     │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
└──────────┴───────────────────────────────────────────────────────────────────────────┘
```

---

### 14. Notifications Center

**Dropdown Panel from Header Bell Icon**

```
                                              ┌────────────────────────────────────┐
                                              │  Notifications              Mark All│
                                              │  ─────────────────────────────────  │
                                              │                                    │
                                              │  Today                             │
                                              │  ┌────────────────────────────────┐│
                                              │  │ 🔴 New inspection assigned      ││
                                              │  │    House 45, Kumasi - High Prio ││
                                              │  │    2 minutes ago                ││
                                              │  └────────────────────────────────┘│
                                              │  ┌────────────────────────────────┐│
                                              │  │ 💰 Payment received             ││
                                              │  │    GHS 5,000 tax from PAY-001  ││
                                              │  │    15 minutes ago               ││
                                              │  └────────────────────────────────┘│
                                              │                                    │
                                              │  Yesterday                         │
                                              │  ┌────────────────────────────────┐│
                                              │  │ 📄 New contract registered      ││
                                              │  │    GRC-2025-0015 submitted     ││
                                              │  │    Yesterday at 4:30 PM        ││
                                              │  └────────────────────────────────┘│
                                              │  ┌────────────────────────────────┐│
                                              │  │ ✓ Inspection completed          ││
                                              │  │    INS-2025-0042 marked done   ││
                                              │  │    Yesterday at 2:15 PM        ││
                                              │  └────────────────────────────────┘│
                                              │                                    │
                                              │  ────────────────────────────────  │
                                              │           View All Notifications   │
                                              └────────────────────────────────────┘
```

**Notification Panel Specifications**
```
Width: 400px
Max Height: 480px (scrollable)
Background: #FFFFFF
Border Radius: 12px
Shadow: Dropdown Shadow

Notification Item:
- Padding: 16px
- Border Bottom: 1px #F0F0F0
- Unread: Background #F5F7FA
- Hover: Background #F9FAFB

Icon colors by type:
- Inspection: #F44336
- Payment: #4CAF50
- Contract: #2196F3
- Alert: #FF9800
```

---

### 15. Payment Transactions Screen

**For GRA Officers**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Sidebar │                                                                           │
├──────────┤  Payment Transactions                                      📥 Export CSV  │
│          │                                                                           │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │ Date Range: [ Jan 1 📅 ] - [ Jan 31 📅 ]  │ Status ▼ │ Provider ▼  │  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
│          │  Transaction Summary                                                      │
│          │  ┌──────────────┬──────────────┬──────────────┬──────────────┐           │
│          │  │ Total Volume │ Tax Withheld │ Successful   │ Failed       │           │
│          │  │ GHS 4.2M     │ GHS 336K     │    1,234     │     12       │           │
│          │  │ 1,246 trans  │ 8% rate      │    99%       │     1%       │           │
│          │  └──────────────┴──────────────┴──────────────┴──────────────┘           │
│          │                                                                           │
│          │  ┌─────────────────────────────────────────────────────────────────────┐  │
│          │  │                                                                     │  │
│          │  │  Trans. ID     │ Date/Time       │ Amount    │ Tax     │ Provider │ S│  │
│          │  │  ────────────────────────────────────────────────────────────────── │  │
│          │  │  PAY-2025-0123 │ Jan 28, 10:45   │ GHS 2,500 │ GHS 200 │ MTN MoMo │✓│  │
│          │  │  Contract: GRC-2025-0012                                           │  │
│          │  │  ────────────────────────────────────────────────────────────────── │  │
│          │  │  PAY-2025-0122 │ Jan 28, 09:30   │ GHS 5,000 │ GHS 400 │ Vodafone │✓│  │
│          │  │  Contract: GRC-2025-0011                                           │  │
│          │  │  ────────────────────────────────────────────────────────────────── │  │
│          │  │  PAY-2025-0121 │ Jan 27, 16:20   │ GHS 3,200 │ GHS 256 │ MTN MoMo │✗│  │
│          │  │  Contract: GRC-2024-0892  │ Error: Insufficient funds             │  │
│          │  │  ────────────────────────────────────────────────────────────────── │  │
│          │  │                                                                     │  │
│          │  │  ◀ Previous      Page 1 of 62      Next ▶      Showing 1-20 of 1234│  │
│          │  └─────────────────────────────────────────────────────────────────────┘  │
│          │                                                                           │
└──────────┴───────────────────────────────────────────────────────────────────────────┘
```

---

## Component Library

### Buttons

#### Primary Button
```
Height: 44px
Border Radius: 8px
Background: #006B3F
Text: #FFFFFF, 14px, SemiBold
Padding: 12px 24px
Hover: Background #004D2C
Active: Background #003D22
Disabled: Opacity 0.5
Focus: 2px solid #FCD116 outline
```

#### Secondary Button
```
Height: 44px
Border Radius: 8px
Background: transparent
Border: 1px solid #006B3F
Text: #006B3F, 14px, SemiBold
Hover: Background rgba(0, 107, 63, 0.05)
```

#### Tertiary/Ghost Button
```
Height: 44px
Border Radius: 8px
Background: transparent
Text: #006B3F, 14px, SemiBold
Hover: Background rgba(0, 107, 63, 0.05)
```

#### Danger Button
```
Height: 44px
Border Radius: 8px
Background: #F44336
Text: #FFFFFF, 14px, SemiBold
Hover: Background #D32F2F
```

#### Icon Button
```
Size: 40px x 40px
Border Radius: 8px
Background: transparent
Icon: 20px, #666666
Hover: Background #F5F7FA
```

### Input Fields

#### Text Input
```
Height: 44px
Border Radius: 8px
Background: #FFFFFF
Border: 1px solid #E0E0E0
Padding: 12px 16px
Font: 14px, Regular, #1A1A1A
Placeholder: #999999

Focus: Border 2px solid #006B3F
Error: Border 2px solid #F44336
Disabled: Background #F5F7FA, Text #999999
```

#### Select/Dropdown
```
Height: 44px
Border Radius: 8px
Background: #FFFFFF
Border: 1px solid #E0E0E0
Dropdown icon: 20px, #666666

Options Panel:
- Max Height: 300px
- Shadow: Dropdown Shadow
- Border Radius: 8px
- Option Height: 40px
- Option Hover: #F5F7FA
- Selected: Background rgba(0, 107, 63, 0.1), Text #006B3F
```

#### Search Input
```
Height: 44px
Border Radius: 8px
Background: #FFFFFF
Border: 1px solid #E0E0E0
Search icon: 20px, #999999, left side
Padding Left: 44px
Clear button: 20px, #999999, right side (when has value)
```

#### Textarea
```
Min Height: 120px
Border Radius: 8px
Background: #FFFFFF
Border: 1px solid #E0E0E0
Padding: 12px 16px
Resize: vertical
```

### Cards

#### Standard Card
```
Background: #FFFFFF
Border Radius: 12px
Padding: 24px
Shadow: Card Shadow
```

#### Stats Card
```
Background: #FFFFFF
Border Radius: 12px
Padding: 24px
Shadow: Card Shadow

Icon Container: 48px, Border Radius 12px, colored background
Value: 32px, Bold
Label: 14px, #666666
Trend: 12px, with icon
```

### Tables

#### Table Container
```
Background: #FFFFFF
Border Radius: 12px
Shadow: Card Shadow
Overflow: hidden
```

#### Table Header
```
Height: 48px
Background: #F9FAFB
Font: 12px, SemiBold, #666666, uppercase, letter-spacing 0.5px
Padding: 0 16px
Border Bottom: 1px #E0E0E0
```

#### Table Row
```
Height: 64px (single line) / 72px (two lines)
Background: #FFFFFF
Hover: #F9FAFB
Border Bottom: 1px #F0F0F0
Padding: 0 16px
Font: 14px, Regular, #1A1A1A
```

#### Pagination
```
Height: 48px
Background: #FFFFFF
Border Top: 1px #F0F0F0
Padding: 0 16px

Page Button:
- Size: 32px x 32px
- Border Radius: 6px
- Current: Background #006B3F, Text #FFFFFF
- Default: Text #666666
- Hover: Background #F5F7FA
```

### Status Badges

```
Height: 24px
Border Radius: 12px (full)
Padding: 4px 12px
Font: 12px, Medium

Active/Success:   Background #E8F5E9, Text #4CAF50
Pending/Warning:  Background #FFF3E0, Text #FF9800
Error/Failed:     Background #FFEBEE, Text #F44336
Info/Default:     Background #E3F2FD, Text #2196F3
Inactive/Muted:   Background #F5F5F5, Text #999999
Connected:        Background #E8F5E9, Text #4CAF50, with dot
Disconnected:     Background #F5F5F5, Text #999999, with dot
```

### Tabs

```
Tab Container:
- Height: 48px
- Border Bottom: 1px #E0E0E0
- Background: transparent

Tab Item:
- Padding: 12px 24px
- Font: 14px, Medium
- Default: Text #666666
- Active: Text #006B3F, Border Bottom 2px #006B3F
- Hover: Text #1A1A1A
```

### Tooltips

```
Background: #1A1A1A
Text: #FFFFFF, 12px
Padding: 8px 12px
Border Radius: 6px
Max Width: 200px
Arrow: 6px
```

### Empty States

```
Container:
- Padding: 64px
- Text Align: center

Icon: 64px, #E0E0E0
Title: 18px, SemiBold, #1A1A1A
Description: 14px, #666666, max-width 400px
Action Button: Primary, margin-top 24px
```

---

## Responsive Breakpoints

```
Desktop Large:   1920px and above
Desktop:         1280px - 1919px
Tablet:          768px - 1279px (sidebar collapses)
Mobile:          Below 768px (not primary target, but basic support)
```

### Sidebar Behavior
```
Desktop Large/Desktop: Full sidebar (280px)
Tablet: Collapsed sidebar (80px) - icons only, tooltip labels
Mobile: Hidden sidebar, hamburger menu
```

---

## Animation Specifications

### Transitions
```
Default: all 200ms ease-out
Hover effects: 150ms
Modal/Panel: 300ms ease-out
Sidebar toggle: 200ms ease-out
```

### Loading States
```
Spinner: 24px circular, #006B3F, 1s rotation
Skeleton: Shimmer effect, #F0F0F0 to #E8E8E8, 1.5s loop
Progress bar: Indeterminate, #006B3F, smooth animation
```

### Page Transitions
```
Fade in: opacity 0 to 1, 200ms
Slide in (panel): translateX(100%) to translateX(0), 300ms
Scale (modal): scale(0.95) to scale(1) + opacity, 200ms
```

---

## Accessibility Guidelines

### Focus States
```
All interactive elements: 2px solid #FCD116 outline, 2px offset
Skip to content link: visible on focus
Tab order: logical, follows visual layout
```

### Color Contrast
```
Primary text on white: #1A1A1A (15.6:1) ✓
Secondary text on white: #666666 (5.7:1) ✓
Primary button text: White on #006B3F (5.8:1) ✓
Error text: #F44336 on white (4.5:1) ✓
```

### Screen Reader Support
```
All images: descriptive alt text
Icons: aria-labels for interactive icons
Tables: proper th scope attributes
Forms: labels associated with inputs
Status updates: aria-live regions
```

---

## Icons

### Icon Library
- **Recommended**: Heroicons (https://heroicons.com/)
- **Alternative**: Lucide Icons, Feather Icons
- **Style**: Outline for navigation, Solid for status indicators

### Common Icons Used
```
Dashboard:       chart-bar
Properties:      home
Contracts:       document-text
Payments:        credit-card
Tax Reports:     chart-pie
Users:           users
Inspections:     magnifying-glass-circle
Settings:        cog-6-tooth
Notifications:   bell
Profile:         user-circle
Logout:          arrow-right-on-rectangle
Add/Create:      plus
Edit:            pencil
Delete:          trash
View:            eye
Search:          magnifying-glass
Filter:          funnel
Export:          arrow-down-tray
Calendar:        calendar
Location:        map-pin
Phone:           phone
Email:           envelope
Checkmark:       check-circle
Warning:         exclamation-triangle
Error:           x-circle
Info:            information-circle
```

---

## Dark Mode (Optional Future)

### Dark Mode Colors
```
Background:       #0F1419
Surface:          #1C2128
Surface Hover:    #21262D
Border:           #30363D
Text Primary:     #F0F6FC
Text Secondary:   #8B949E
Primary Green:    #3FB950 (lighter for contrast)
```

---

## Design Handoff Notes

1. **Figma Organization**: Create separate pages for:
   - Design System (colors, typography, components)
   - Login & Auth flows
   - Dashboard views (by role)
   - Feature screens
   - Modals & Overlays
   - Empty/Error states

2. **Auto Layout**: Use Figma auto-layout for all components to ensure responsive behavior

3. **Variants**: Create component variants for:
   - Button states (default, hover, active, disabled)
   - Input states (default, focus, error, disabled)
   - Card types (stats, list item, detail)
   - Badge types (all status colors)

4. **Prototyping**: Add interactions for:
   - Sidebar navigation
   - Modal open/close
   - Side panel slide in/out
   - Dropdown menus
   - Tab switching

5. **Developer Notes**: Include in each screen:
   - API endpoints to be called
   - Data requirements
   - Loading state behavior
   - Error state handling
