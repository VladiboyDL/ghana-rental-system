# Ghana Rental Mobile App - Figma Design Specification

## Design System

### Device Frame
- **Device**: iPhone 14 Pro (393 x 852 px)
- **Safe Area Top**: 59px
- **Safe Area Bottom**: 34px
- **Status Bar**: Light content on dark backgrounds, dark content on light backgrounds

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
Background:         #F5F5F5
Surface:            #FFFFFF
Surface Variant:    #F0F0F0
Border:             #E0E0E0
Divider:            #EEEEEE
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
Warning:            #FF9800
Error:              #F44336
Info:               #2196F3
```

### Typography

#### Font Family
- **Primary**: SF Pro Display (iOS) / Roboto (Android)
- **Fallback**: System default

#### Type Scale
```
H1:     32px / Bold (700) / Line Height 40px
H2:     28px / SemiBold (600) / Line Height 36px
H3:     24px / SemiBold (600) / Line Height 32px
H4:     20px / SemiBold (600) / Line Height 28px
Body:   16px / Regular (400) / Line Height 24px
Body Small: 14px / Regular (400) / Line Height 20px
Caption: 12px / Regular (400) / Line Height 16px
Button: 16px / SemiBold (600) / Line Height 24px
```

### Spacing Scale
```
XS:     4px
SM:     8px
MD:     16px
LG:     24px
XL:     32px
XXL:    48px
```

### Border Radius
```
SM:     4px
MD:     8px
LG:     12px
XL:     16px
XXL:    24px
Full:   9999px (circular)
```

### Shadows
```
Card Shadow: 0px 2px 8px rgba(0, 0, 0, 0.1)
Modal Shadow: 0px 4px 16px rgba(0, 0, 0, 0.15)
Button Shadow: 0px 2px 4px rgba(0, 0, 0, 0.1)
```

---

## Screen Specifications

---

### 1. Welcome Screen

**Background**: Linear gradient from #006B3F (top) to #004D2C (bottom)
**Status Bar**: Light content

#### Layout Structure
```
┌─────────────────────────────────────┐
│           Status Bar (59px)          │
├─────────────────────────────────────┤
│                                     │
│         ┌───────────────┐           │
│         │   Logo Icon   │           │  Logo Container: 100x100px
│         │   (home icon) │           │  Background: rgba(255,255,255,0.1)
│         │   #FCD116     │           │  Border Radius: 50px (circular)
│         └───────────────┘           │  Icon: 60px, color #FCD116
│                                     │
│         "Ghana Rental"              │  H1: 32px, Bold, #FFFFFF
│    "Tax Compliance System"          │  Body: 16px, rgba(255,255,255,0.8)
│                                     │
│         ┌───────────────────────┐   │
│         │ 📄 Digital Contracts  │   │  Feature Cards (4 total)
│         │ Create and sign...    │   │  Background: rgba(255,255,255,0.1)
│         └───────────────────────┘   │  Padding: 16px
│         ┌───────────────────────┐   │  Border Radius: 12px
│         │ 📱 ID Verification    │   │  Margin Bottom: 16px
│         │ Scan Ghana Card...    │   │
│         └───────────────────────┘   │  Icon Container: 48x48px
│         ┌───────────────────────┐   │  Icon: 24px, #FCD116
│         │ 💳 Easy Payments      │   │  Title: 16px, SemiBold, #FFFFFF
│         │ Pay rent with auto... │   │  Description: 13px, rgba(255,255,255,0.7)
│         └───────────────────────┘   │
│         ┌───────────────────────┐   │
│         │ ✓ GRA Compliant       │   │
│         │ Automatic 8% with...  │   │
│         └───────────────────────┘   │
│                                     │
│    ┌─────────────────────────────┐  │  Primary Button
│    │      Create Account         │  │  Background: #FCD116
│    └─────────────────────────────┘  │  Text: #006B3F, 16px, SemiBold
│                                     │  Height: 52px, Border Radius: 12px
│    ┌─────────────────────────────┐  │
│    │         Sign In             │  │  Secondary Button
│    └─────────────────────────────┘  │  Background: transparent
│                                     │  Border: 2px solid #FFFFFF
│   "A Ghana Revenue Authority        │  Text: #FFFFFF
│         Initiative"                 │  Height: 52px, Border Radius: 12px
│                                     │
│           Safe Area (34px)          │  Footer: 12px, rgba(255,255,255,0.5)
└─────────────────────────────────────┘
```

#### Feature Card Component
- Width: Full width - 48px (24px padding each side)
- Height: Auto (based on content)
- Background: rgba(255, 255, 255, 0.1)
- Border Radius: 12px
- Padding: 16px
- Layout: Row (icon left, text right)
- Icon Container: 48x48px, circular, rgba(255,255,255,0.1)

---

### 2. Login Screen

**Background**: #F5F5F5
**Header**: #006B3F with white text

#### Layout Structure
```
┌─────────────────────────────────────┐
│    ◀ Sign In            (Header)    │  Header: 56px, #006B3F
├─────────────────────────────────────┤  Back arrow: 24px, #FFFFFF
│                                     │
│         ┌───────────────┐           │
│         │   Lock Icon   │           │  Icon Container: 80x80px
│         │   #006B3F     │           │  Background: rgba(0,107,63,0.15)
│         └───────────────┘           │  Border Radius: 40px
│                                     │  Icon: 40px, #006B3F
│        "Welcome Back"               │  H3: 24px, SemiBold, #1A1A1A
│   "Sign in to continue"             │  Body Small: 14px, #999999
│                                     │
│   Email or Phone                    │  Label: 14px, SemiBold, #1A1A1A
│   ┌─────────────────────────────┐   │
│   │ landlord@demo.com           │   │  Input Field
│   └─────────────────────────────┘   │  Background: #FFFFFF
│                                     │  Border: 1px solid #E0E0E0
│   Password                          │  Border Radius: 12px
│   ┌─────────────────────────────┐   │  Height: 52px
│   │ ••••••••              👁    │   │  Padding: 16px
│   └─────────────────────────────┘   │  Font: 16px, #1A1A1A
│                                     │  Placeholder: #999999
│           Forgot Password?          │  Link: 14px, #006B3F
│                                     │
│   ┌─────────────────────────────┐   │
│   │          Sign In            │   │  Primary Button
│   └─────────────────────────────┘   │  Background: #006B3F
│                                     │  Text: #FFFFFF, 16px, SemiBold
│   ─────────── OR ───────────        │  Height: 52px
│                                     │  Border Radius: 12px
│   Demo Accounts:                    │
│   ┌─────────────┐ ┌─────────────┐   │  Demo Buttons (side by side)
│   │  Landlord   │ │   Tenant    │   │  Background: #F0F0F0
│   │ 🏠 demo123  │ │ 👤 demo123  │   │  Border Radius: 12px
│   └─────────────┘ └─────────────┘   │  Padding: 12px
│                                     │
│   Don't have an account? Sign Up    │  Body Small: 14px
│                                     │  "Sign Up": #006B3F, SemiBold
└─────────────────────────────────────┘
```

---

### 3. Register Screen (4-Step Wizard)

**Background**: #F5F5F5
**Header**: #006B3F

#### Progress Indicator
```
Step Dots (centered, horizontal):
┌───┐   ┌───┐   ┌───┐   ┌───┐
│ 1 │───│ 2 │───│ 3 │───│ 4 │
└───┘   └───┘   └───┘   └───┘

Inactive: 32x32px, Border: 2px #E0E0E0, Background: #FFFFFF
Active: Border: 2px #006B3F, Background: #FFFFFF
Completed: Background: #006B3F, Checkmark icon #FFFFFF
```

#### Step 1: Role Selection
```
┌─────────────────────────────────────┐
│    ◀ Create Account      (Header)   │
├─────────────────────────────────────┤
│         ① ─ ② ─ ③ ─ ④              │  Progress: Step 1 active
│                                     │
│         "I am a..."                 │  H3: 24px, SemiBold, #1A1A1A
│   "Select your role to continue"    │  Body Small: 14px, #999999
│                                     │
│   ┌─────────────────────────────┐   │  Role Card (Landlord)
│   │ ┌────┐                      │   │  Background: #FFFFFF
│   │ │ 🏠 │  Landlord         ✓  │   │  Border: 2px solid #E0E0E0
│   │ └────┘  I own properties... │   │  Selected: Border #006B3F
│   └─────────────────────────────┘   │  Border Radius: 12px
│                                     │  Padding: 16px
│   ┌─────────────────────────────┐   │  Height: ~80px
│   │ ┌────┐                      │   │
│   │ │ 👤 │  Tenant              │   │  Icon Container: 56x56px
│   │ └────┘  I want to rent...   │   │  Background: rgba(0,107,63,0.2)
│   └─────────────────────────────┘   │  Selected: #006B3F, icon #FFFFFF
│                                     │
│                                     │
│                                     │
│   ┌─────────────────────────────┐   │
│   │         Continue            │   │  Primary Button
│   └─────────────────────────────┘   │
│                                     │
│   Already have an account? Sign In  │
└─────────────────────────────────────┘
```

#### Step 2: Personal Information
```
┌─────────────────────────────────────┐
│    ◀ Create Account                 │
├─────────────────────────────────────┤
│         ✓ ─ ② ─ ③ ─ ④              │
│                                     │
│    "Personal Information"           │
│    "Tell us about yourself"         │
│                                     │
│   ┌──────────────┐ ┌──────────────┐ │  Two columns for names
│   │ First Name   │ │ Last Name    │ │
│   │ Kwame        │ │ Asante       │ │
│   └──────────────┘ └──────────────┘ │
│                                     │
│   Email                             │
│   ┌─────────────────────────────┐   │
│   │ kwame@example.com           │   │
│   └─────────────────────────────┘   │
│                                     │
│   Phone Number                      │
│   ┌─────────────────────────────┐   │
│   │ +233 24 123 4567            │   │
│   └─────────────────────────────┘   │
│                                     │
│   ◀ Back              Continue ▶    │  Navigation buttons
└─────────────────────────────────────┘
```

#### Step 3: Identity Verification
```
┌─────────────────────────────────────┐
│    ◀ Create Account                 │
├─────────────────────────────────────┤
│         ✓ ─ ✓ ─ ③ ─ ④              │
│                                     │
│    "Identity Verification"          │
│    "We need to verify your identity"│
│                                     │
│   Ghana Card Number                 │
│   ┌─────────────────────────────┐   │
│   │ GHA-123456789-0             │   │
│   └─────────────────────────────┘   │
│   Format: GHA-XXXXXXXXX-X           │  Hint: 12px, #999999
│                                     │
│   Digital Address                   │
│   ┌─────────────────────────────┐   │
│   │ GA-123-4567                 │   │
│   └─────────────────────────────┘   │
│                                     │
│   Region                            │
│   ┌─────────────────────────────┐   │
│   │ Greater Accra               │   │
│   └─────────────────────────────┘   │
│                                     │
│   ◀ Back              Continue ▶    │
└─────────────────────────────────────┘
```

#### Step 4: Create Password
```
┌─────────────────────────────────────┐
│    ◀ Create Account                 │
├─────────────────────────────────────┤
│         ✓ ─ ✓ ─ ✓ ─ ④              │
│                                     │
│    "Create Password"                │
│    "Secure your account"            │
│                                     │
│   Password                          │
│   ┌─────────────────────────────┐   │
│   │ ••••••••              👁    │   │  Eye icon toggles visibility
│   └─────────────────────────────┘   │
│                                     │
│   Confirm Password                  │
│   ┌─────────────────────────────┐   │
│   │ ••••••••                    │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │  Requirements Box
│   │ Password must:              │   │  Background: #FFFFFF
│   │ ✓ Be at least 6 characters  │   │  Border Radius: 12px
│   │ ✓ Match confirmation        │   │  Padding: 16px
│   └─────────────────────────────┘   │  Checkmark: #4CAF50 if met
│                                     │
│   ◀ Back          Create Account    │
└─────────────────────────────────────┘
```

---

### 4. OTP Verification Screen

**Background**: #F5F5F5

```
┌─────────────────────────────────────┐
│    ◀ Verify Phone       (Header)    │
├─────────────────────────────────────┤
│                                     │
│         ┌───────────────┐           │
│         │   📱 Phone    │           │  Icon Container: 80x80px
│         │   #006B3F     │           │  Background: rgba(0,107,63,0.15)
│         └───────────────┘           │
│                                     │
│      "Verify Your Phone"            │  H3: 24px, SemiBold, #1A1A1A
│   "We sent a 6-digit code to"       │  Body Small: 14px, #999999
│      +233 24 *** 4567               │  Phone: 14px, SemiBold, #1A1A1A
│                                     │
│   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐  OTP Input Boxes
│   │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │  Size: 48x56px each
│   └───┘ └───┘ └───┘ └───┘ └───┘ └───┘  Gap: 12px
│                                     │  Border: 2px solid #E0E0E0
│   ┌─────────────────────────────┐   │  Filled: Border #006B3F
│   │          Verify             │   │  Background filled: rgba(0,107,63,0.1)
│   └─────────────────────────────┘   │  Font: 24px, SemiBold, #1A1A1A
│                                     │
│   Didn't receive the code?          │  Body Small: 14px, #999999
│   Resend in 45s / Resend            │  Link: #006B3F when active
│                                     │
│   ┌─────────────────────────────┐   │  Info Box
│   │ ℹ️ Demo: Use code 123456    │   │  Background: rgba(33,150,243,0.15)
│   └─────────────────────────────┘   │  Text: #2196F3, 13px
│                                     │  Border Radius: 12px
│   ◀ Change phone number             │  Link: #006B3F, 14px
│                                     │
└─────────────────────────────────────┘
```

---

### 5. Landlord Dashboard

**Background**: #F5F5F5
**Header**: #006B3F

```
┌─────────────────────────────────────┐
│   Ghana Rental     🔔 (Header)      │  Header: 56px, #006B3F
├─────────────────────────────────────┤  Bell icon: 24px, #FFFFFF
│                                     │
│   Good morning, Kwame 👋            │  H4: 20px, SemiBold, #1A1A1A
│   Here's your overview              │  Body Small: 14px, #999999
│                                     │
│   ┌────────────────┬────────────────┐  Stats Grid (2x2)
│   │ Properties     │ Contracts      │  Card: Background #FFFFFF
│   │     5          │     3          │  Border Radius: 12px
│   │  ▲ 2 pending   │  ● Active      │  Padding: 16px
│   └────────────────┴────────────────┘  Shadow: Card Shadow
│   ┌────────────────┬────────────────┐
│   │ Total Revenue  │ Tax Paid       │  Number: 28px, Bold
│   │  GHS 45,000    │  GHS 3,600     │  Label: 12px, #999999
│   │  This year     │  This year     │  Sub: 12px, #666666
│   └────────────────┴────────────────┘
│                                     │
│   Quick Actions                     │  Section Title: 16px, SemiBold
│   ┌──────────┐ ┌──────────┐ ┌──────┐│
│   │ + Add    │ │ 📄 New   │ │ View ││  Action Buttons
│   │ Property │ │ Contract │ │ All  ││  Size: ~100px width
│   └──────────┘ └──────────┘ └──────┘│  Background: #FFFFFF
│                                     │  Border Radius: 12px
│   Recent Contracts                  │
│   ┌─────────────────────────────┐   │
│   │ 🏠 Apt 3B, East Legon       │   │  Contract Card
│   │ Tenant: Ama Mensah          │   │  Background: #FFFFFF
│   │ GHS 2,500/mo    ● Active    │   │  Border Radius: 12px
│   └─────────────────────────────┘   │  Status badge: pill shape
│   ┌─────────────────────────────┐   │
│   │ 🏠 Shop 12, Osu             │   │
│   │ Tenant: QuickMart Ltd       │   │
│   │ GHS 5,000/mo    ⏳ Pending  │   │
│   └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  🏠    🏢    📄    💳    👤        │  Bottom Tab Bar
│ Home  Props  Contr  Pay  Profile   │  Height: 80px (inc safe area)
└─────────────────────────────────────┘  Active: #006B3F
                                         Inactive: #999999
```

#### Status Badge Colors
```
Active:     Background #E8F5E9, Text #4CAF50
Pending:    Background #FFF3E0, Text #FF9800
Expired:    Background #FFEBEE, Text #F44336
Draft:      Background #F5F5F5, Text #999999
```

---

### 6. Tenant Dashboard

**Background**: #F5F5F5

```
┌─────────────────────────────────────┐
│   Ghana Rental     🔔 (Header)      │
├─────────────────────────────────────┤
│                                     │
│   Hello, Ama 👋                     │
│   Your rental at a glance           │
│                                     │
│   ┌─────────────────────────────┐   │  Pending Contract Alert
│   │ ⚠️ Contract Pending          │   │  Background: #FFF3E0
│   │ You have 1 contract to      │   │  Border: 1px #FF9800
│   │ confirm                     │   │  Border Radius: 12px
│   │            Review Now ▶     │   │
│   └─────────────────────────────┘   │
│                                     │
│   Next Payment Due                  │  Section Title
│   ┌─────────────────────────────┐   │
│   │ 📅 Due: February 1, 2025    │   │  Payment Due Card
│   │                             │   │  Background: #FFFFFF
│   │     GHS 2,500.00            │   │  Amount: 28px, Bold, #006B3F
│   │                             │   │
│   │ ┌─────────────────────────┐ │   │
│   │ │      Pay Now       ▶   │ │   │  Pay Button: #006B3F
│   │ └─────────────────────────┘ │   │
│   └─────────────────────────────┘   │
│                                     │
│   Your Rental                       │
│   ┌─────────────────────────────┐   │
│   │ 🏠 Apartment 3B             │   │  Property Card
│   │ 15 Oxford Street, East Legon│   │  With property image placeholder
│   │ Landlord: Kwame Asante      │   │
│   │ Contract ends: Dec 2025     │   │
│   │                View ▶       │   │
│   └─────────────────────────────┘   │
│                                     │
│   Payment History                   │
│   ┌─────────────────────────────┐   │
│   │ Jan 2025   GHS 2,500   ✓   │   │  Payment History List
│   ├─────────────────────────────┤   │  Checkmark: #4CAF50
│   │ Dec 2024   GHS 2,500   ✓   │   │
│   └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  🏠    📄    💳    👤              │  Bottom Tab Bar (4 tabs)
│ Home  Contracts  Pay  Profile       │
└─────────────────────────────────────┘
```

---

### 7. Properties List Screen (Landlord)

**Background**: #F5F5F5

```
┌─────────────────────────────────────┐
│   Properties              + Add     │  Header with FAB
├─────────────────────────────────────┤
│                                     │
│   ┌─────────────────────────────┐   │  Filter Pills (horizontal scroll)
│   │ All (5) │ Active │ Pending  │   │  Background: #FFFFFF / #006B3F
│   └─────────────────────────────┘   │  Border Radius: Full
│                                     │  Height: 32px
│   ┌─────────────────────────────┐   │
│   │ ┌─────────────────────────┐ │   │  Property Card
│   │ │      Property Image     │ │   │  Image: 100% width, 160px height
│   │ │      (placeholder)      │ │   │  Border Radius: 12px (top only)
│   │ └─────────────────────────┘ │   │
│   │  🏠 Luxury Apartment       │   │  Title: 16px, SemiBold
│   │  East Legon, Greater Accra │   │  Address: 14px, #666666
│   │  3 🛏  2 🚿  GHS 3,500/mo  │   │  Details row: 13px, #999999
│   │  ● Available    ✓ Verified │   │  Status badges
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │ ┌─────────────────────────┐ │   │
│   │ │      Property Image     │ │   │
│   │ └─────────────────────────┘ │   │
│   │  🏠 Shop Space             │   │
│   │  Osu, Greater Accra        │   │
│   │  Commercial  GHS 5,000/mo  │   │
│   │  ⏳ Pending   Unverified   │   │
│   └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  🏠    🏢    📄    💳    👤        │
└─────────────────────────────────────┘
```

---

### 8. Add Property Screen (3-Step Wizard)

#### Step 1: Location
```
┌─────────────────────────────────────┐
│   ◀ Add Property                    │
├─────────────────────────────────────┤
│   Step 1 of 3: Location             │  Progress: 14px, #006B3F
│   ━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░  │  Progress bar: 4px height
│                                     │
│   Digital Address *                 │
│   ┌─────────────────────────────┐   │
│   │ GA-123-4567                 │   │
│   └─────────────────────────────┘   │
│                                     │
│   Region *                          │
│   ┌─────────────────────────────┐   │
│   │ Greater Accra            ▼  │   │  Dropdown selector
│   └─────────────────────────────┘   │
│                                     │
│   District *                        │
│   ┌─────────────────────────────┐   │
│   │ Accra Metropolitan       ▼  │   │
│   └─────────────────────────────┘   │
│                                     │
│   City/Town                         │
│   ┌─────────────────────────────┐   │
│   │ East Legon                  │   │
│   └─────────────────────────────┘   │
│                                     │
│   Street Address                    │
│   ┌─────────────────────────────┐   │
│   │ 15 Oxford Street            │   │  Multiline input
│   │                             │   │  Height: 80px
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │       Continue              │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### Step 2: Property Details
```
┌─────────────────────────────────────┐
│   ◀ Add Property                    │
├─────────────────────────────────────┤
│   Step 2 of 3: Details              │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░  │
│                                     │
│   Property Type *                   │
│   ┌─────────────────────────────┐   │
│   │ 2 Bedroom Apartment      ▼  │   │
│   └─────────────────────────────┘   │
│                                     │
│   Category *                        │
│   ┌───────────────┐ ┌───────────────┐
│   │ 🏠 Residential│ │ 🏢 Commercial │  Toggle buttons
│   └───────────────┘ └───────────────┘  Active: #006B3F bg
│                                     │
│   ┌──────────────┐ ┌──────────────┐ │
│   │ Bedrooms     │ │ Bathrooms    │ │  Number inputs
│   │     3     +- │ │     2     +- │ │  With stepper controls
│   └──────────────┘ └──────────────┘ │
│                                     │
│   Features (optional)               │
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐      │  Toggle chips
│   │ 🪑 │ │ 🚗 │ │ 🔒 │ │ ⚡ │      │  Size: ~80px each
│   │Furn│ │Park│ │Sec │ │Gen │      │  Selected: #006B3F border
│   └────┘ └────┘ └────┘ └────┘      │  Unselected: #E0E0E0 border
│                                     │
│   ◀ Back              Continue ▶    │
└─────────────────────────────────────┘
```

---

### 9. Create Contract Screen (4-Step)

#### Step 3: Scan Tenant ID
```
┌─────────────────────────────────────┐
│   ◀ Create Contract                 │
├─────────────────────────────────────┤
│   Step 3: Tenant Verification       │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░  │
│                                     │
│   Scan Tenant's Ghana Card          │
│   Capture or upload the tenant's ID │
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │  Scan Button
│   │       📷 Scan ID Card       │   │  Background: rgba(0,107,63,0.1)
│   │                             │   │  Border: 2px dashed #006B3F
│   │    Tap to open camera       │   │  Border Radius: 12px
│   │                             │   │  Height: 120px
│   └─────────────────────────────┘   │
│                                     │
│   ── OR ──                          │
│                                     │
│   Enter Tenant Details Manually     │
│                                     │
│   Tenant Phone/Email                │
│   ┌─────────────────────────────┐   │
│   │ +233 20 123 4567            │   │
│   └─────────────────────────────┘   │
│                                     │
│   [Extracted data appears here      │  After scan, show:
│    when ID is scanned]              │  - Ghana Card Number
│                                     │  - Full Name
│   ◀ Back              Continue ▶    │  - Date of Birth
└─────────────────────────────────────┘
```

---

### 10. Scan Document Screen (Camera)

**Full screen camera interface**
**Status Bar**: Light content

```
┌─────────────────────────────────────┐
│ ✕                 Scan Ghana Card   │  Close button: 44x44px
├─────────────────────────────────────┤  Background: rgba(0,0,0,0.3)
│                                     │
│                                     │
│     ┌─────────────────────────┐     │  Camera viewfinder
│     │                         │     │  Full screen behind
│     │    ┌───────────────┐    │     │
│     │    │               │    │     │  Scan Frame
│     │    │   ID CARD     │    │     │  Corners only (Ghana Gold)
│     │    │   AREA        │    │     │  Size: 80% width
│     │    │               │    │     │  Aspect ratio: 3:2
│     │    └───────────────┘    │     │  Corner lines: 4px, #FCD116
│     │                         │     │
│     └─────────────────────────┘     │
│                                     │
│   Position the Ghana Card within    │  Instructions
│   the frame                         │  Text: 16px, #FFFFFF
│   Ensure good lighting              │  Subtext: 13px, rgba(255,255,255,0.8)
│                                     │
│   ┌────┐              ┌────────┐    │
│   │ 🖼️ │              │   ⚪   │    │  Gallery: 56x56px
│   └────┘              │   ⚪⚪  │    │  Capture: 80x80px outer
│                       └────────┘    │  Inner: 60x60px white
│                                     │
└─────────────────────────────────────┘
```

#### After Capture - Results View
```
┌─────────────────────────────────────┐
│              Preview                │
├─────────────────────────────────────┤
│   ┌─────────────────────────────┐   │
│   │                             │   │  Captured Image
│   │    [Captured ID Image]      │   │  Height: 35% screen
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
│   Extracted Information             │  Section Title
│   ┌─────────────────────────────┐   │
│   │ Ghana Card Number           │   │  Data Card
│   │ GHA-123456789-0             │   │  Background: #FFFFFF
│   ├─────────────────────────────┤   │  Border Radius: 12px
│   │ Full Name                   │   │
│   │ Kwame Asante Mensah         │   │  Label: 14px, #999999
│   ├─────────────────────────────┤   │  Value: 14px, SemiBold, #1A1A1A
│   │ Date of Birth               │   │
│   │ 15/03/1985                  │   │
│   ├─────────────────────────────┤   │
│   │ Gender                      │   │
│   │ Male                        │   │
│   └─────────────────────────────┘   │
│                                     │
│   Confidence: ━━━━━━━━━━━░░ 85%     │  Progress bar: #4CAF50
│                                     │
│   ┌─────────────┐ ┌─────────────┐   │
│   │ 📷 Retake   │ │ ✓ Confirm   │   │  Two buttons side by side
│   └─────────────┘ └─────────────┘   │
└─────────────────────────────────────┘
```

---

### 11. Sign Contract Screen

**Full screen signature pad**

```
┌─────────────────────────────────────┐
│   ◀ Sign Contract                   │
├─────────────────────────────────────┤
│                                     │
│   Please sign below                 │  H4: 20px, SemiBold
│   Your signature will be added to   │  Body Small: 14px, #666666
│   the rental contract               │
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │  Signature Canvas
│   │                             │   │  Background: #FFFFFF
│   │                             │   │  Border: 2px solid #E0E0E0
│   │    [Signature Area]         │   │  Border Radius: 12px
│   │                             │   │  Height: 50% available space
│   │                             │   │
│   │                             │   │  Pen color: #1A1A1A
│   │    ─────────────────────    │   │  Pen width: 2px
│   │    Sign above the line      │   │  Baseline: dashed #E0E0E0
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │  Clear Button
│   │     🗑️ Clear Signature      │   │  Background: #F5F5F5
│   └─────────────────────────────┘   │  Text: #666666
│                                     │
│   By signing, you agree to the      │  Legal text: 12px, #999999
│   terms and conditions...           │  Center aligned
│                                     │
│   ┌─────────────────────────────┐   │
│   │      Submit Signature       │   │  Primary Button
│   └─────────────────────────────┘   │  Disabled until signature exists
└─────────────────────────────────────┘
```

---

### 12. Make Payment Screen

**Background**: #F5F5F5

```
┌─────────────────────────────────────┐
│   ◀ Make Payment                    │
├─────────────────────────────────────┤
│                                     │
│   Payment Details                   │
│   ┌─────────────────────────────┐   │
│   │ Rent for February 2025      │   │  Payment Info Card
│   │ Apartment 3B, East Legon    │   │  Background: #FFFFFF
│   │                             │   │
│   │ Amount:        GHS 2,500.00 │   │  Amounts aligned right
│   │ Tax (8%):        GHS 200.00 │   │  Tax: #F44336
│   │ ─────────────────────────── │   │
│   │ Total:         GHS 2,500.00 │   │  Total: Bold
│   │ To Landlord:   GHS 2,300.00 │   │  Net: #4CAF50
│   └─────────────────────────────┘   │
│                                     │
│   Select Payment Method             │  Section Title
│                                     │
│   ┌─────────────────────────────┐   │  Payment Method Card
│   │ ┌────┐  MTN Mobile Money    │   │  Background: #FFFFFF
│   │ │ 📱 │  Pay with MTN MoMo   │   │  Border: 2px solid #E0E0E0
│   │ └────┘                   ○  │   │  Selected: Border #FFC300
│   └─────────────────────────────┘   │  Radio: 24px
│   ┌─────────────────────────────┐   │  Icon bg: #FFC300
│   │ ┌────┐  Vodafone Cash       │   │
│   │ │ 📱 │  Pay with VodaCash   │   │
│   │ └────┘                   ○  │   │  Icon bg: #E60000
│   └─────────────────────────────┘   │
│   ┌─────────────────────────────┐   │
│   │ ┌────┐  AirtelTigo Money    │   │
│   │ │ 📱 │  Pay with AT Money   │   │  Icon bg: #FF0000
│   │ └────┘                   ○  │   │
│   └─────────────────────────────┘   │
│                                     │
│   Phone Number                      │
│   ┌─────────────────────────────┐   │
│   │ +233 24 123 4567            │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │     Pay GHS 2,500.00        │   │  Primary Button
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

### 13. Profile Screen

**Background**: #F5F5F5

```
┌─────────────────────────────────────┐
│           Profile         (Header)  │
├─────────────────────────────────────┤
│                                     │
│         ┌───────────────┐           │  Avatar Circle
│         │               │           │  Size: 100x100px
│         │      KA       │           │  Background: #006B3F
│         │               │           │  Initials: 32px, #FFFFFF
│         └───────────────┘           │  Border: 4px solid #FFFFFF
│                                     │  Shadow: Card Shadow
│         Kwame Asante                │  Name: 24px, SemiBold
│         landlord@demo.com           │  Email: 14px, #666666
│         Landlord                    │  Role Badge
│                                     │
│   ┌─────────────────────────────┐   │  Info Section
│   │ 📱 +233 24 123 4567         │   │  Background: #FFFFFF
│   ├─────────────────────────────┤   │  Border Radius: 12px
│   │ 🏠 GA-123-4567              │   │
│   ├─────────────────────────────┤   │  Each row: 52px height
│   │ 📍 Greater Accra            │   │  Icon: 20px, #006B3F
│   └─────────────────────────────┘   │  Divider: 1px #EEEEEE
│                                     │
│   Settings                          │
│   ┌─────────────────────────────┐   │
│   │ 🔔 Notifications          ▶ │   │  Settings List
│   ├─────────────────────────────┤   │  Same styling as info
│   │ 🔒 Security               ▶ │   │  Arrow: 20px, #999999
│   ├─────────────────────────────┤   │
│   │ ❓ Help & Support         ▶ │   │
│   ├─────────────────────────────┤   │
│   │ 📄 Terms & Conditions     ▶ │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │     🚪 Sign Out             │   │  Logout Button
│   └─────────────────────────────┘   │  Background: #FFEBEE
│                                     │  Text: #F44336, SemiBold
├─────────────────────────────────────┤
│  🏠    🏢    📄    💳    👤        │  Tab bar, Profile active
└─────────────────────────────────────┘
```

---

### 14. Contracts List Screen

```
┌─────────────────────────────────────┐
│           Contracts                 │
├─────────────────────────────────────┤
│                                     │
│   ┌─────────────────────────────┐   │  Filter Tabs
│   │ All │ Active │ Pending │ ▼  │   │  Horizontal scroll
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │  Contract Card
│   │ Contract #GRC-2025-001      │   │  Background: #FFFFFF
│   │ ─────────────────────────── │   │  Border Radius: 12px
│   │ 🏠 Apartment 3B, East Legon │   │  Shadow: Card Shadow
│   │                             │   │
│   │ 👤 Tenant: Ama Mensah       │   │  For Landlord view
│   │ 🏠 Landlord: Kwame Asante   │   │  For Tenant view
│   │                             │   │
│   │ 📅 Jan 2025 - Dec 2025      │   │  Date range
│   │ 💰 GHS 2,500/month          │   │  Rent amount
│   │                             │   │
│   │ ┌────────┐                  │   │  Status Badge
│   │ │ Active │                  │   │  Background: #E8F5E9
│   │ └────────┘              ▶   │   │  Text: #4CAF50
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │ Contract #GRC-2025-002      │   │
│   │ ─────────────────────────── │   │
│   │ 🏠 Shop 12, Osu             │   │
│   │ 👤 Tenant: QuickMart Ltd    │   │
│   │ 📅 Feb 2025 - Jan 2026      │   │
│   │ 💰 GHS 5,000/month          │   │
│   │ ┌─────────┐                 │   │
│   │ │ Pending │             ▶   │   │  Background: #FFF3E0
│   │ └─────────┘                 │   │  Text: #FF9800
│   └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  Tab Bar                            │
└─────────────────────────────────────┘
```

---

### 15. Payment History Screen

```
┌─────────────────────────────────────┐
│           Payments                  │
├─────────────────────────────────────┤
│                                     │
│   Summary                           │
│   ┌────────────────┬────────────────┐  Summary Cards
│   │ Total Paid     │ Tax Withheld   │  2 columns
│   │ GHS 25,000     │ GHS 2,000      │
│   │ This year      │ This year      │
│   └────────────────┴────────────────┘
│                                     │
│   January 2025                      │  Month Header
│   ┌─────────────────────────────┐   │  14px, SemiBold, #666666
│   │ Rent - Apt 3B               │   │
│   │ Jan 1, 2025                 │   │  Payment Item
│   │                             │   │  Background: #FFFFFF
│   │ GHS 2,500.00         ✓ Paid │   │  Amount: 16px, SemiBold
│   └─────────────────────────────┘   │  Status: Pill badge
│   ┌─────────────────────────────┐   │
│   │ Rent - Shop 12              │   │
│   │ Jan 5, 2025                 │   │
│   │                             │   │
│   │ GHS 5,000.00         ✓ Paid │   │
│   └─────────────────────────────┘   │
│                                     │
│   December 2024                     │
│   ┌─────────────────────────────┐   │
│   │ Rent - Apt 3B               │   │
│   │ Dec 1, 2024                 │   │
│   │                             │   │
│   │ GHS 2,500.00         ✓ Paid │   │
│   └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  Tab Bar                            │
└─────────────────────────────────────┘
```

---

## Component Library

### Buttons

#### Primary Button
```
Height: 52px
Border Radius: 12px
Background: #006B3F
Text: #FFFFFF, 16px, SemiBold
Pressed: Background #004D2C
Disabled: Opacity 0.5
Shadow: 0px 2px 4px rgba(0, 0, 0, 0.1)
Padding: 16px horizontal
```

#### Secondary Button
```
Height: 52px
Border Radius: 12px
Background: transparent
Border: 2px solid #006B3F
Text: #006B3F, 16px, SemiBold
Pressed: Background rgba(0, 107, 63, 0.1)
```

#### Outline Button (on dark)
```
Height: 52px
Border Radius: 12px
Background: transparent
Border: 2px solid #FFFFFF
Text: #FFFFFF, 16px, SemiBold
```

#### Text Button
```
Height: 44px
Text: #006B3F, 14px, SemiBold
No background
```

### Input Fields

#### Text Input
```
Height: 52px
Border Radius: 12px
Background: #FFFFFF
Border: 1px solid #E0E0E0
Focused Border: 2px solid #006B3F
Error Border: 2px solid #F44336
Padding: 16px
Font: 16px, Regular, #1A1A1A
Placeholder: #999999
```

#### Label
```
Font: 14px, SemiBold, #1A1A1A
Margin Bottom: 8px
```

#### Helper/Hint Text
```
Font: 12px, Regular, #999999
Margin Top: 4px
```

### Cards

#### Standard Card
```
Background: #FFFFFF
Border Radius: 12px
Padding: 16px
Shadow: 0px 2px 8px rgba(0, 0, 0, 0.1)
```

#### List Item Card
```
Background: #FFFFFF
Border Radius: 12px
Padding: 16px
Margin Bottom: 12px
Shadow: 0px 2px 8px rgba(0, 0, 0, 0.1)
```

### Status Badges

#### Pill Badge
```
Height: 24px
Border Radius: 12px (full)
Padding: 4px 12px
Font: 12px, SemiBold

Active:   Background #E8F5E9, Text #4CAF50
Pending:  Background #FFF3E0, Text #FF9800
Expired:  Background #FFEBEE, Text #F44336
Draft:    Background #F5F5F5, Text #999999
Verified: Background #E3F2FD, Text #2196F3
```

### Icons
- **Icon Set**: Ionicons
- **Standard Size**: 24px
- **Small Size**: 20px
- **Large Size**: 32px
- **Tab Bar Icons**: 24px

### Tab Bar

```
Height: 80px (including 34px safe area)
Background: #FFFFFF
Border Top: 1px solid #EEEEEE
Shadow: 0px -2px 8px rgba(0, 0, 0, 0.05)

Tab Item:
- Icon: 24px
- Label: 10px, Medium
- Active Color: #006B3F
- Inactive Color: #999999
- Spacing between icon and label: 4px
```

### Header/Navigation Bar

```
Height: 56px (+ status bar)
Background: #006B3F
Title: 18px, SemiBold, #FFFFFF, centered
Back Arrow: 24px, #FFFFFF, left aligned with 16px padding
Action Icons: 24px, #FFFFFF, right aligned with 16px padding
```

---

## Animation Specifications

### Transitions
- **Screen transitions**: Slide from right (300ms, ease-out)
- **Modal presentations**: Slide from bottom (300ms, ease-out)
- **Tab switches**: Cross-fade (150ms)

### Micro-interactions
- **Button press**: Scale down to 0.98 (100ms)
- **Card press**: Scale down to 0.99, slight shadow reduction (100ms)
- **Input focus**: Border color transition (150ms)
- **Toggle switch**: Slide with spring animation (200ms)

### Loading States
- **Spinner**: 24px, #006B3F, rotating
- **Skeleton**: Shimmer animation, #F0F0F0 to #E0E0E0
- **Pull to refresh**: Standard iOS/Android behavior

---

## Accessibility

### Touch Targets
- Minimum: 44x44px
- Recommended: 48x48px

### Contrast Ratios
- All text meets WCAG AA standards
- Primary text (#1A1A1A) on white: 15.6:1
- Secondary text (#666666) on white: 5.7:1
- White text on primary (#006B3F): 5.8:1

### Focus States
- 2px solid #FCD116 outline
- 2px offset from element edge
