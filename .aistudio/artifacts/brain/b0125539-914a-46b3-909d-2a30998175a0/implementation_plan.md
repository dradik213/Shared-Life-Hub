# November Test Schedule for Dustin & Katherine

A complete, realistic 30-day November schedule for a test couple (Dustin & Katherine) featuring alternating house stays, evening pet routines, independent and shared work/crafting blocks, weekend pop-up markets, daily shared cooking, homeowner chores, and a themed Thanksgiving week.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters were confirmed during interactive clarification and govern the November schedule generation:

- **Confirmed Decision 1 (Data Mode)**: Replace existing mock data with a complete, curated 30-day November schedule, while adding a 1-click "Reload November Test Data" button in the Workspace Admin panel for continuous re-testing.
- **Confirmed Decision 2 (Couple Profiles)**: 
  - **Dustin**: He/Him (Boy), 9:00 AM – 5:00 PM M–F regular work schedule, homeowner chores, craft projects.
  - **Katherine**: She/Her (Girl), sporadic shifts (up to 5 days/week, 6-hour shifts: 6:00 AM – 12:00 PM morning shift or 12:00 PM – 6:00 PM afternoon shift), dog owner, crafter.
- **Confirmed Decision 3 (Thanksgiving Week Focus)**: Thanksgiving week (Nov 23–29) features pre-holiday grocery runs, Thanksgiving feast hosting with family, and a Black Friday / Small Business Saturday weekend craft market.

---

## 1. Overview & Core Concept

### What It Delivers
A rich, lifelike shared calendar for November 2026 that allows testing all views (Month, Week, Day Schedule, Agenda, Reflection, Market POS Register, and Packout) without manually entering events:
1. **Alternating Stays & Evening Dog Care**: The couple spends various nights at one another's house (never their own separately). On every night they stay at Dustin's house, an evening event at 9:30 PM is scheduled: *"Let Katherine's Dogs Out & Evening Walk"* before heading to Dustin's.
2. **Work Schedules**:
   - Dustin: Steady 9:00 AM – 5:00 PM Monday through Friday.
   - Katherine: Variable shifts 4–5 days/week, scheduled as either 6:00 AM – 12:00 PM (Morning Shift) or 12:00 PM – 6:00 PM (Afternoon Shift).
3. **Daily Shared Cooking (7:00 PM – 8:00 PM)**: Everyday dinner prep, cooking, or grocery shop together between 7:00 PM and 8:00 PM.
4. **Weekend Craft Markets**:
   - Saturdays and/or Sundays (e.g. *Autumn Harvest Makers Market*, *Downtown Holiday Bazaar*, *Small Business Saturday Craft Fair*).
   - Pre-configured with booth fees, revenue targets, and sample packout inventory for register testing.
5. **Crafting & Maker Projects**:
   - Solo and joint sessions (e.g. ceramic mug glazing, holiday wreath assembly, laser-cut ornaments, candle pouring).
6. **Homeowner Chores & Seasonality**:
   - Fall gutter cleaning, furnace filter check, lawn leaf mulching, seasonal vehicle tire swap.
7. **Thanksgiving Week**:
   - Nov 24: Thanksgiving Bulk Grocery Run (turkey, produce, baking essentials).
   - Nov 25: Thanksgiving Meal Prep & Pie Baking.
   - Nov 26 (Thanksgiving Day): Host Family Thanksgiving Dinner (1:00 PM – 6:00 PM).
   - Nov 27 (Black Friday): Downtown Makers Fair Pop-up Market.
   - Nov 28 (Small Business Saturday): Community Artisans Market.

---

## 2. User Experience & Visual Design

### Calendar & Schedule Experience
- **Initial View & Focus Date**: Default the calendar view to November 2026 (`2026-11-01` to `2026-11-30`) so the test month is immediately visible upon loading.
- **Partner Badges & Contrast**:
  - Dustin: Blue badge theme with distinct possessive tags (`His` / `Dustin`).
  - Katherine: Purple/Rose badge theme with distinct possessive tags (`Hers` / `Katherine`).
  - Shared: Neutral warm slate for items assigned to `Both`.
- **Category Color Harmony (WCAG AA compliant)**:
  - `market`: Amber badge & gold accent with booth fee & revenue indicators.
  - `dinner_date`: Rose-600 badge for shared dinners and Thanksgiving celebrations.
  - `pets`: Sky-600 badge for evening dog walks and vet visits.
  - `maintenance`: Emerald-600 badge for seasonal homeowner tasks and chores.
  - `grocery_errand`: Purple-600 badge for market prep and holiday shopping.
  - `other`: Slate/stone neutral for standard work shifts and solo crafting sessions.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full 30-Day Coverage vs Scattered Samples**:
  - *Chosen Approach*: Generate a cohesive schedule spanning all 30 days of November 2026 with 60+ realistic events and 30 day stays.
  - *Why*: Allows thorough evaluation of daily schedule density, side-by-side time column clustering, week views, and the reflection dashboard without empty gaps.
- **Decision 2: Automatic Hydration + Admin Workspace Re-load Button**:
  - *Chosen Approach*: Update `INITIAL_EVENTS` and `MOCK_STAYS` in `src/data/mockEvents.ts`, update default user accounts in `src/context/AuthContext.tsx`, and add a 1-tap "Load November Test Dataset" action in Admin settings so users can reset or re-seed anytime.
  - *Why*: Ensures existing local storage caches don't mask the new test data while giving the user permanent control to reload it on demand.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Data Architecture                    │
└────────────────────────────────────────────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│  src/data/mockEvents.ts      │    │  src/context/AuthContext.tsx │
│  - 30-day Stays (Nov 1-30)   │    │  - User 1: Dustin (He/Him)   │
│  - 65+ Events for Nov 2026   │    │  - User 2: Katherine (She)   │
│  - Market Details & Packouts │    │  - Hub: "Dustin & Katherine" │
└──────────────────────────────┘    └──────────────────────────────┘
               │                                   │
               └─────────────────┬─────────────────┘
                                 ▼
                    ┌──────────────────────────────┐
                    │       src/App.tsx            │
                    │  - Calendar State & Views    │
                    │  - Initial Date: 2026-11-01  │
                    │  - Admin Re-seed Handler     │
                    └──────────────────────────────┘
```

### Event & Stay Mapping Rules for November 2026:
1. **Stays (`stays` Record)**:
   - Alternating pattern throughout November:
     - Days 1–3: Dustin's Place
     - Days 4–6: Katherine's Place
     - Days 7–9: Dustin's Place
     - Days 10–12: Katherine's Place
     - Days 13–15: Dustin's Place
     - Days 16–18: Katherine's Place
     - Days 19–21: Dustin's Place
     - Days 22–26 (Thanksgiving at Host House): Dustin's Place
     - Days 27–30: Katherine's Place
2. **Dog Walking Rule**:
   - On every date where `stayAt === "Dustin's Place"`, an event at 9:30 PM is placed:
     - Title: *"Evening Dog Walk & Let Dogs Out"*
     - Time: `21:30` – `22:00`
     - Location: *"Katherine's House"*
     - Category: `pets`
     - Assigned to: `both`
3. **Daily Dinner (7:00 PM – 8:00 PM)**:
   - Nov 1 to Nov 30 (except Thanksgiving Day feast):
     - Title: *"Dinner & Cooking Together"* (with varied menu themes: Taco Tuesday, Homemade Pasta Night, Autumn Squash Soup, Sheet Pan Salmon, etc.)
     - Time: `19:00` – `20:00`
     - Category: `dinner_date`
     - Assigned to: `both`

---

## 5. Verification Plan

1. **Compilation**: Run `compile_applet` and `lint_applet` (`tsc --noEmit`).
2. **Date Inspection**: Verify November 1, 2026 displays properly in Month, Week, and Day Schedule views.
3. **Dog Walk Verification**: Confirm every Dustin's Place stay has the 9:30 PM dog walk at Katherine's house.
4. **Market POS Testing**: Open the Saturday/Sunday markets and test the POS register and packout modals.
5. **Thanksgiving Flow**: Confirm Thanksgiving Day events and pre-holiday prep blocks render cleanly.
