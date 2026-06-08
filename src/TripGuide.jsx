import { useState } from 'react';

// ─── DATA ────────────────────────────────────────────────────────────────────

const CHEAT_SHEET = [
  { date: 'Fri 12 Jun', city: 'Vancouver',   event: 'Vancouver Canadians (High-A) at The Nat, eve', type: 'sport', note: 'confirm time' },
  { date: 'Sat 13 Jun', city: 'Vancouver',   event: 'Australia vs Türkiye — BC Place, 9pm',          type: 'wc' },
  { date: 'Sun 14 Jun', city: 'Seattle 1',   event: 'Tacoma Rainiers (AAA) vs Albuquerque, 1:35pm',  type: 'sport', note: 'only if arrive early' },
  { date: 'Mon 15 Jun', city: 'Seattle 1',   event: 'Belgium vs Egypt — Lumen Field, 12pm (fan zone)', type: 'wc' },
  { date: 'Tue 16 Jun', city: 'Olympic NP',  event: 'Port Angeles Lefties vs Bellingham, 6:35pm, Civic Field', type: 'sport' },
  { date: 'Wed 17 Jun', city: 'Olympic NP',  event: 'Port Angeles Lefties vs Bellingham, 6:35pm, Civic Field', type: 'sport' },
  { date: 'Thu 18 Jun', city: 'Seattle 2',   event: 'Mariners vs Baltimore, 1:10pm, T-Mobile Park',  type: 'sport', note: 'Everett AquaSox possible alt' },
  { date: 'Fri 19 Jun', city: 'Seattle 2',   event: 'USA vs Australia — Lumen Field, 12pm  +  Mariners vs Boston, 7:10pm', type: 'wc' },
  { date: 'Sat 20 Jun', city: 'Portland',    event: "Portland Pickles (WCL) Mom's Night  +  Portland Fire (WNBA) ~5:30pm", type: 'sport', note: 'confirm' },
  { date: 'Tue 23 Jun', city: 'Napa',        event: 'Sacramento River Cats (AAA) vs Las Vegas, 6:45pm, Sutter Health Park', type: 'sport', note: '≈1 hr from Napa' },
  { date: 'Thu 25 Jun', city: 'SF/South Bay', event: 'Giants vs Athletics — Oracle Park, 12:45pm  +  Paraguay vs Australia — Levi\'s, 7pm', type: 'wc' },
  { date: 'Fri 26 Jun', city: 'SF/South Bay', event: 'Giants vs Braves 7:15pm  /  Valkyries (WNBA)  /  Oakland Ballers', type: 'sport', note: "likely too late for Will's flight" },
];

const CITIES = [
  {
    id: 'vancouver',
    label: 'Vancouver',
    dates: '12–14 Jun',
    hotel: 'OPUS Vancouver, Yaletown',
    match: { teams: 'Australia vs Türkiye', venue: 'BC Place', time: 'Sat 13 Jun · 9pm' },
    sections: {
      dates: [
        { type: 'wc',    title: 'Australia vs Türkiye — BC Place, 9pm', text: 'Stadium–Chinatown SkyTrain CLOSED on match days — use Main Street–Science World. The "Last Mile" fan walk from Science World starts ~2 hrs before kickoff.' },
        { type: 'sport', title: 'Vancouver Canadians (High-A) — The Nat', text: 'Home series through ~June 14. Friday the 12th evening is your window — classic small-park night and perfect first-night landing. Confirm time at milb.com/vancouver.' },
        { type: 'event', title: 'FIFA Fan Festival at PNE (Hastings Park)', text: 'Free entry, giant screens, runs the entire tournament.' },
        { type: 'note',  title: 'BC Lions / Whitecaps / Bandits', text: 'BC Lions playing away. Whitecaps on the MLS break. Bandits clash with the 9pm match (~45 min to Langley) — skip this trip.' },
      ],
      sporting: [
        { title: 'BC Place Tour + BC Sports Hall of Fame', text: 'Inside the stadium; good pre- or post-match addition.' },
        { title: 'Kayak / SUP Rentals on False Creek', text: 'Multiple outfitters along the creek, walkable from Yaletown.' },
      ],
      culture: [
        { title: 'Gastown & Chinatown', text: 'Cobblestone old town with the Steam Clock; Dr. Sun Yat-Sen Classical Garden.' },
        { title: 'Granville Island Public Market', text: 'Aquabus across False Creek — food stalls, makers, buskers. Go before noon.' },
        { title: 'Museum of Vancouver + Maritime Museum', text: 'Vanier Park cluster; easy half-day.' },
        { title: 'Vancouver Art Gallery', text: 'Emily Carr and strong Indigenous art collections.' },
        { title: 'Capilano Suspension Bridge / Grouse Mountain', text: 'North Shore, ~25 min — forest and views half-day.' },
        { title: 'Bill Reid Gallery of Northwest Coast Art', text: 'Superb Haida / Indigenous art downtown; free on the first Friday afternoon of the month.' },
        { title: 'VanDusen Botanical Garden', text: '55 acres near Queen Elizabeth Park — close to The Nat.' },
        { title: 'The Polygon Gallery', text: 'North Van by the SeaBus — striking waterfront photography; pairs with Lonsdale Quay market.' },
      ],
      running: [
        { title: 'Stanley Park Seawall', text: '~10km car-free loop, ocean + old-growth forest. Reach it via the False Creek seawall straight from Yaletown.' },
        { title: 'False Creek Loop', text: 'Out the door for a shorter, flat outing.' },
      ],
      food: [
        { title: 'Pacific NW Seafood', text: 'The Vancouver Fish Company and Cardero\'s (Coal Harbour patio) — sablefish, spot prawns, oysters.' },
        { title: 'Yaletown (walkable)', text: 'Oshi Nori (handroll sushi), Elisa (steak), Dovetail (lively modern), Brix & Mortar.' },
        { title: 'Granville Island', text: 'Graze the market: BC oysters, smoked salmon, local cheese.' },
        { title: 'Richmond (~25 min)', text: 'Some of the best Chinese food outside Asia — worth a dim sum or night-market detour.' },
        { title: 'Ramen / Izakaya', text: 'Tonkotsu Ramen Tsukiya (West End, tiny, superb broth), Menya Raizo (Broadway), Oku Izakaya (Gastown, sake + sushi).' },
        { title: 'Indian', text: 'Desi Indian Lounge and Bahubali Biryani House (both downtown); Hyderabad Haveli (Kingsway) for late-night biryani.' },
        { title: 'Main St / Mount Pleasant', text: 'Uber ~10 min: The Farmhouse (rustic Italian), Mount Pleasant Vintage (open-fire kitchen), The Watson (excellent cocktail bar).' },
        { title: 'Bars — Gastown', text: 'Guilt & Co (live music basement), Arcana (theatrical cocktails), Clough Club, Pourhouse.' },
      ],
    },
  },
  {
    id: 'seattle1',
    label: 'Seattle 1',
    dates: '14–16 Jun',
    hotel: 'Fairfield by Marriott Downtown / Seattle Center',
    match: { teams: 'Belgium vs Egypt', venue: 'Lumen Field', time: 'Mon 15 Jun · 12pm', note: 'fan zone day' },
    sections: {
      dates: [
        { type: 'wc',    title: 'Belgium vs Egypt — Lumen Field, 12pm (fan zone)', text: 'Official FIFA fan celebration at Seattle Center — basically next to your hotel.' },
        { type: 'sport', title: 'Seattle Storm (WNBA) — Climate Pledge Arena', text: '5-minute walk from the hotel. Check for a home game on the 14th/15th at climatepledgearena.com — the easiest sporting add of the trip.' },
        { type: 'note',  title: 'Mariners Away', text: 'Away until June 15; homestand starts the 16th (your departure day) — no MLB this round.' },
        { type: 'sport', title: 'Tacoma Rainiers (AAA) — Sun 14, 1:35pm', text: 'vs Albuquerque, ~35 min south — but it\'s your bus-arrival day, so only if you land early.' },
      ],
      culture: [
        { title: 'Pike Place Market', text: 'Go early — before the crowds arrive.' },
        { title: 'Chihuly Garden and Glass + Space Needle', text: 'Right by your hotel at Seattle Center.' },
        { title: 'Museum of Pop Culture (MoPOP)', text: 'Hendrix/Nirvana, sci-fi and horror props, the guitar tower — also at Seattle Center.' },
        { title: 'MOHAI on Lake Union', text: 'Best city-history museum.' },
        { title: 'Smith Tower Speakeasy', text: 'Observation bar in Pioneer Square.' },
        { title: 'Underground Tour', text: 'Pioneer Square — the buried original city; great rainy-hour option.' },
        { title: 'Frye Art Museum', text: 'First Hill — small, excellent, and free.' },
        { title: 'Ballard Locks (Hiram M. Chittenden)', text: 'Watch boats lift between sea and lake, plus a salmon-ladder viewing window. Pairs with a Ballard dinner.' },
      ],
      running: [
        { title: 'Elliott Bay Trail / Myrtle Edwards Park', text: 'From the Olympic Sculpture Park (5 min away) — flat waterfront, Puget Sound views, the signature Seattle run.' },
        { title: 'Kerry Park (Queen Anne)', text: 'Add for the skyline-postcard hill.' },
      ],
      food: [
        { title: 'Oysters / Seafood', text: 'Taylor Shellfish (Pioneer Square), The Walrus and the Carpenter (Ballard), Local Tide (Fremont, crab roll).' },
        { title: 'Capitol Hill', text: 'Kedai Makan (Malaysian), Terra Plata (rooftop).' },
        { title: 'Chinatown–International District', text: 'E-Jae Pak Mor (modern Thai rice-noodle rolls), Tendon Kohaku (tempura/katsu), Tai Tung (historic Cantonese — Bruce Lee\'s old haunt).' },
        { title: 'Ballard Dinners', text: 'Fuego (Salvadoran/Mexican in an old firehouse) and Brimmer & Heeltap (seasonal bistro), near the Locks.' },
        { title: 'Special Occasion', text: 'Canlis (iconic Lake Union fine-diner — book well ahead) or Archipelago (intimate Filipino tasting menu, Columbia City).' },
        { title: 'Coffee', text: 'Lighthouse Roasters (Fremont) or Black Arrows (near hotel).' },
        { title: 'Bars', text: 'Majnoon (Queen Anne, near hotel, rare agave list), Paper Fan (Capitol Hill speakeasy).' },
      ],
    },
  },
  {
    id: 'olympic',
    label: 'Olympic NP',
    dates: '16–18 Jun',
    hotel: 'Olympic Lodge by Ayres, Port Angeles',
    sections: {
      dates: [
        { type: 'sport', title: 'Port Angeles Lefties (WCL) — Tue 16 & Wed 17, 6:35pm', text: 'vs Bellingham Bells at Civic Field. Perfect small-town evening after the trails — cheap tickets, sunset over the Strait, mascot Timber the Olympic Marmot.' },
        { type: 'note',  title: 'The Wilderness Reset', text: 'The park is the main event. Thursday the 18th is your drive-back day.' },
      ],
      culture: [
        { title: 'Hurricane Ridge', text: '~40 min up — alpine meadows, Olympic Mountain panoramas. Go on your clearest morning.' },
        { title: 'Lake Crescent', text: 'Marymere Falls (easy 1.5mi) and Mt. Storm King (steep scramble, ropes near top, huge payoff).' },
        { title: 'Hoh Rain Forest', text: '~2 hr drive — Hall of Mosses loop; otherworldly. Long but worthwhile full day.' },
        { title: 'Sol Duc Falls + Coastal Beaches', text: 'Sol Duc Falls; Rialto / Ruby Beach for Pacific sea stacks if you swing coastward.' },
        { title: 'Sequim Lavender Farms', text: '~20 min east (e.g. Purple Haze) — fields start blooming in June; easy, fragrant detour with lavender lemonade.' },
      ],
      running: [
        { title: 'Olympic Discovery Trail', text: 'Paved waterfront/forest path through Port Angeles, flat, right by the lodge.' },
        { title: 'Hurricane Hill Trail', text: 'Alpine hike-run once you\'ve driven up — altitude is noticeable.' },
      ],
      food: [
        { title: 'Dungeness Crab', text: 'The local catch — look for it around the harbor.' },
        { title: 'Dinners in Town', text: 'Next Door Gastropub, Kokopelli Grill (downtown Port Angeles); Barhop Brewing for a local pint.' },
        { title: 'Pro Tip', text: 'Stock the car with coffee and snacks in town — services inside the park are sparse and signal is patchy.' },
      ],
    },
  },
  {
    id: 'seattle2',
    label: 'Seattle 2',
    dates: '18–20 Jun',
    hotel: 'Four Points by Sheraton Seattle Airport South',
    hotelNote: 'Airport-strip hotel — nothing good is walkable here. Uber out.',
    match: { teams: 'USA vs Australia', venue: 'Lumen Field', time: 'Fri 19 Jun · 12pm' },
    sections: {
      dates: [
        { type: 'sport', title: 'Mariners vs Baltimore — Thu 18, 1:10pm, T-Mobile Park', text: 'Day game slots perfectly into your open day — a better fit than the AquaSox (~30 min north).' },
        { type: 'wc',    title: 'USA vs Australia — Lumen Field, Fri 19, 12pm', text: 'Your match. Bonus: Mariners vs Boston at 7:10pm the same night — a noon WC match + evening MLB is very doable if you\'ve got the legs.' },
        { type: 'sport', title: 'Mariners vs Boston Doubleheader — Sat 20', text: 'Scheduled because of Friday\'s WC match. You\'re driving to Portland, so likely a pass.' },
        { type: 'note',  title: 'Everett AquaSox (High-A)', text: '~35 min north — may be home on the 18th. Confirm at milb.com/everett.' },
      ],
      hotelZone: [
        { title: 'Georgetown (~10 min Uber)', text: 'Kuma Kitchen + Bar (Pan-Asian), 1988 Cocktail Lounge (tiny, excellent), Star Brass Works (late-night, cheap burgers).' },
        { title: 'Columbia City (~15 min)', text: 'Marination (Hawaiian-Korean), Curry\'s Culture (Indian), Black & Tan Hall (Black-owned music venue + food).' },
        { title: 'West Seattle / Alki Beach (~15 min)', text: 'Driftwood (farm-to-table, superb), Il Nido (Italian), Otter on the Rocks (cocktails).' },
        { title: 'Pioneer Square / Capitol Hill (~15–20 min)', text: 'For a proper night out after the match.' },
      ],
      running: [
        { title: 'Des Moines Creek Trail', text: 'Paved, wooded, creek-side — the best run near the airport hotels.' },
        { title: 'Angle Lake Park Loop', text: 'Very close, short and pleasant.' },
      ],
    },
  },
  {
    id: 'portland',
    label: 'Portland',
    dates: '20–21 Jun',
    hotel: 'Embassy Suites Downtown',
    sections: {
      dates: [
        { type: 'sport', title: 'Portland Pickles (WCL) — Sat 20, Walker Stadium', text: '"Mom\'s Night." They lead the WCL in attendance and are gloriously over-the-top (wrestling nights, Emo Night, \'Get Married at the Game\') — the most fun, most Portland thing you could do that evening.' },
        { type: 'sport', title: 'Portland Fire (WNBA) — Sat 20, ~5:30pm, Moda Center', text: 'Brand-new team\'s inaugural season. If home, it\'s a unique "first season ever" ticket. Check fire.wnba.com/schedule. You may have to choose between this and the Pickles.' },
        { type: 'note',  title: 'Hillsboro Hops (High-A)', text: '~30 min west — possible Saturday option. Confirm at milb.com/hillsboro.' },
        { type: 'note',  title: 'No Timbers (MLS break)', text: 'Providence Park tours run; the Timbers Army scarf wall is worth a look.' },
      ],
      culture: [
        { title: "Powell's City of Books", text: 'A full city block of books. Non-negotiable.' },
        { title: 'Portland Japanese Garden', text: 'Washington Park — regularly called the best outside Japan; the adjacent International Rose Test Garden is free and in peak bloom in June.' },
        { title: 'Lan Su Chinese Garden', text: 'Compact, beautiful classical garden downtown.' },
        { title: 'Tom McCall Waterfront Park', text: 'Along the river — good for a stroll or the running loop below.' },
        { title: 'Portland Art Museum', text: 'Recently expanded, with a room devoted to Portland-raised Mark Rothko.' },
      ],
      running: [
        { title: 'Waterfront Loop', text: 'Tom McCall Park → cross the river → Eastbank Esplanade → cross back. ~4mi car-free riverside loop.' },
        { title: 'Washington Park / Hoyt Arboretum', text: 'For hills and trees.' },
      ],
      food: [
        { title: 'Food-Cart Pods', text: 'Cartopia (Hawthorne, fire pits at night) or WonderLove (multi-level, has a bar).' },
        { title: 'Classics', text: 'Voodoo Doughnut (touristy but obligatory); Screen Door (Southern brunch, expect a line); Farmhouse Kitchen Thai (spectacular).' },
        { title: 'Beer (Portland\'s whole thing)', text: "Treebeerd's Taphouse (huge list downtown) or Little Beast (sours + garden). Order a hazy IPA." },
        { title: 'Cocktails', text: 'Teardrop Lounge (top-tier) or hidden Secret Grove.' },
        { title: 'More Dinners', text: 'Lechon (Peruvian/South American, downtown), The Observatory (Montavilla gem); Hat Yai for famous Southern-Thai fried chicken + curry.' },
        { title: 'Salt & Straw', text: "Portland's cult ice cream — wildly creative flavours, generous samples; locations on NW 23rd and SE Division." },
      ],
    },
  },
  {
    id: 'craterlake',
    label: 'Crater Lake',
    dates: '21–23 Jun',
    hotel: 'Crater Lake Lodge — remote and iconic',
    sections: {
      dates: [
        { type: 'note', title: 'No Events — The Lake Is the Show', text: 'The lodge sits at ~7,100 ft. Pace your runs and hikes, hydrate, and expect lingering snow on some trails into late June.' },
      ],
      culture: [
        { title: 'Crater Lake Lodge (1915)', text: 'Sunset drink on the terrace over the caldera. Book the dining room well ahead.' },
        { title: 'Rim Drive', text: '33-mile loop — check how much is plowed/open before you go.' },
        { title: 'Watchman Peak', text: 'Short, steep, best sunset view over Wizard Island.' },
        { title: 'Garfield Peak', text: 'From the lodge, ~3.4mi with big caldera views.' },
        { title: 'Cleetwood Cove', text: 'The only legal trail to the water; boat tours if running.' },
      ],
      running: [
        { title: 'Rim Village Paths / Rim Drive Shoulder', text: 'Caldera views throughout — keep it easy at altitude.' },
        { title: 'Garfield Peak as Hike-Run', text: 'If fully acclimatized — steep and rewarding.' },
      ],
      food: [
        { title: 'Crater Lake Lodge Dining Room', text: 'Regional plates with the caldera view — book ahead.' },
        { title: 'Annie Creek (Mazama Village)', text: 'Casual alternative, 7 miles south.' },
        { title: 'Pro Tip', text: 'Bring your own wine and snacks — options are limited and signal is poor.' },
      ],
    },
  },
  {
    id: 'napa',
    label: 'Napa',
    dates: '23–25 Jun',
    hotel: 'Napa Valley Lodge, Yountville',
    sections: {
      dates: [
        { type: 'sport', title: 'Sacramento River Cats (Triple-A) — Sutter Health Park', text: 'Home Tue 23 (6:45pm), Wed 24 (12:05pm) & Thu 25 (~1 hr from Napa). Also the temporary home of the Athletics through 2027. Tue the 23rd evening is the cleanest fit if you\'re not wrecked from the Crater Lake drive.' },
        { type: 'event', title: 'Wine-Country Alternative', text: 'Swap sport for a hot-air balloon sunrise or cycling the Napa Valley Vine Trail between wineries.' },
        { type: 'note',  title: 'Live Music Midweek', text: 'Check downtown Napa listings — Oxbow Public Market and Uptown Theatre are the spots.' },
      ],
      culture: [
        { title: 'Castello di Amorosa', text: 'Recreated 13th-century Tuscan castle + winery in Calistoga.' },
        { title: 'Oxbow Public Market', text: 'Walkable from downtown Napa — artisan food stalls, local wine, coffee.' },
        { title: 'di Rosa Center for Contemporary Art', text: 'Carneros — 200-acre estate with a big contemporary collection, sculpture park and lake, between Napa and Sonoma.' },
        { title: 'Walkable Yountville', text: 'One of the best restaurant-per-capita towns in the country. Just wander.' },
      ],
      running: [
        { title: 'Napa Valley Vine Trail', text: 'Paved, vineyard-lined, runs through Yountville. Go early before the heat builds.' },
      ],
      food: [
        { title: 'Wineries', text: 'Trefethen (historic estate), Truchard (tiny family operation with caves), Sequoia Grove (relaxed, under the redwoods).' },
        { title: 'Bistro Jeanty (Yountville)', text: 'French country classic — the tomato soup en croûte is the signature. Book ahead.' },
        { title: 'More Yountville', text: 'The Kitchen at Priest Ranch (standout burger); RH Yountville (stunning lunch). Splurge: The French Laundry (book months ahead).' },
        { title: 'Cocktails', text: "ArBARetum; Wilfred's Lounge (tiki rooftop on the river)." },
        { title: 'Other Options', text: "Bistro Don Giovanni (beloved local Italian in a vineyard setting, ~30 yrs) and Bear at Stanly Ranch (polished, scenic)." },
      ],
    },
  },
  {
    id: 'sf',
    label: 'SF/South Bay',
    dates: '25–26 Jun',
    hotel: 'Country Inn & Suites, San Jose Airport',
    hotelNote: 'Bland North San Jose — Uber out for everything.',
    match: { teams: 'Paraguay vs Australia', venue: "Levi's Stadium, Santa Clara", time: 'Thu 25 Jun · 7pm' },
    sections: {
      dates: [
        { type: 'wc',    title: "Paraguay vs Australia — Levi's Stadium, 7pm", text: "The finale! Levi's is ~15 min from the hotel — leave a big buffer for match-day traffic." },
        { type: 'sport', title: 'SF Giants vs Athletics — Oracle Park, Thu 25, 12:45pm', text: "Great solo move for Will while Andy works until 4:30 — a day game at one of the best ballparks anywhere, then meet for the 7pm match. Oracle → Levi's is doable on Caltrain or by car." },
        { type: 'sport', title: 'Fri 26 — Evening Options', text: "Giants vs Atlanta 7:15pm + Golden State Valkyries (WNBA) at Chase Center — both likely too late for Will's 10pm flight, but good solo options for Andy." },
        { type: 'note',  title: 'Oakland Ballers (fan-owned independent club)', text: "Home Fri 26–Sun 28 at Raimondi Park — but the 26th is Will's departure day. San Jose Giants (High-A) are away these dates." },
      ],
      hotelZone: [
        { title: 'Downtown San Jose (~10 min)', text: "San Pedro Square Market (food hall + bars), Eos & Nyx (modern Californian), Fox Tale Fermentation (craft beer), Hapa's Brewing." },
        { title: 'Santana Row (~12 min)', text: 'Upscale outdoor dining: El Jardín (Mexican, great margaritas), Augustine, Yard House (huge beer list, sports on screens).' },
        { title: "Santa Clara / Near Levi's (match day)", text: 'Taplands (excellent rotating taproom), thirsty.bar (pool/darts dive), The Stand and JOEY for pre-match food.' },
        { title: 'San Francisco (~50 min)', text: 'Worth a full city day — see Culture section below.' },
      ],
      culture: [
        { title: 'Ferry Building + Embarcadero', text: 'Golden Gate Bridge / Crissy Field, Alcatraz (book well ahead), Mission District murals + taquerias.' },
        { title: 'SFMOMA + de Young', text: 'SFMOMA has seven floors of modern art; de Young (Golden Gate Park) has a free observation tower.' },
        { title: 'Painted Ladies / Alamo Square', text: 'The postcard Victorian row — best shot from up in the park.' },
        { title: 'South Bay (no SF drive)', text: 'Winchester Mystery House (San Jose, ~10 min away), The Tech Interactive (downtown SJ), Computer History Museum (Mountain View) — a proper Silicon Valley pilgrimage.' },
      ],
      running: [
        { title: 'SF: Embarcadero → Marina Green → Crissy Field', text: 'Toward the Golden Gate Bridge — the definitive SF waterfront run.' },
        { title: 'Guadalupe River Trail (San Jose)', text: 'Flat, paved, practical for a match-week jog near the hotel.' },
      ],
      food: [
        { title: 'Mission Burrito (the city specialty)', text: 'Sit-down: The Morris (incredible duck, Chartreuse slushy) or Bottega on Valencia.' },
        { title: 'Ferry Building', text: 'Hog Island oysters, Dandelion chocolate, local everything.' },
        { title: 'SF Institutions', text: 'Swan Oyster Depot (legendary counter seafood, Polk St — go early), House of Prime Rib (Van Ness), Bix (art-deco jazz supper club near Jackson Square).' },
        { title: 'Chinatown Dim Sum', text: 'City View or Delicious Dim Sum — cheap, excellent, and right downtown.' },
      ],
    },
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const SECTION_META = {
  dates:      { label: 'Dates',    icon: '📅' },
  sporting:   { label: 'Sporting', icon: '⚽' },
  culture:    { label: 'Culture',  icon: '🏛' },
  running:    { label: 'Running',  icon: '🏃' },
  food:       { label: 'Food & Drink', icon: '🍴' },
  hotelZone:  { label: 'Hotel Zone', icon: '🚗' },
};

// Left-border colours per card type (Tailwind class strings)
const CARD_BORDER = {
  wc:      'border-l-amber-400',
  sport:   'border-l-green-500',
  event:   'border-l-teal-400',
  note:    'border-l-slate-500',
  culture: 'border-l-indigo-400',
  running: 'border-l-teal-400',
  food:    'border-l-amber-500',
  hotel:   'border-l-orange-400',
};

const CARD_ICON = {
  wc:      '⚽',
  sport:   '🎟',
  event:   '🗓',
  note:    'ℹ',
  culture: '🏛',
  running: '🏃',
  food:    '🍴',
  hotel:   '🚗',
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function MatchPill({ match, compact = false }) {
  if (!match) return null;
  return (
    <div className={`inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/50 rounded-full text-amber-300 font-medium ${compact ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm'}`}>
      <span className="text-amber-400">⚽</span>
      <span>{match.teams}</span>
      <span className="text-amber-400/70">·</span>
      <span className="text-amber-200/80">{match.time}</span>
    </div>
  );
}

function Card({ title, text, type = 'culture' }) {
  const border = CARD_BORDER[type] || 'border-l-slate-500';
  const icon   = CARD_ICON[type]   || '•';

  const accentText = type === 'wc'
    ? 'text-amber-300'
    : type === 'sport'
    ? 'text-green-400'
    : type === 'running'
    ? 'text-teal-400'
    : type === 'food' || type === 'event'
    ? 'text-amber-400'
    : type === 'hotel'
    ? 'text-orange-400'
    : 'text-indigo-400';

  return (
    <div className={`border-l-2 ${border} bg-slate-800/60 rounded-r-lg px-3 py-2.5 flex gap-2.5`}>
      <span className="text-sm mt-0.5 select-none shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className={`text-sm font-semibold leading-snug ${accentText}`}>{title}</p>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function WCCard({ title, text }) {
  return (
    <div className="border-l-2 border-l-amber-400 bg-amber-500/10 rounded-r-lg px-3 py-3 flex gap-2.5">
      <span className="text-base mt-0.5 select-none shrink-0">⚽</span>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-snug text-amber-300">{title}</p>
        <p className="text-xs text-amber-200/70 mt-0.5 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function HotelZoneCallout({ items }) {
  return (
    <div className="bg-slate-800/80 border border-orange-400/30 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">🚗</span>
        <h3 className="text-xs font-bold tracking-widest uppercase text-orange-400">Get out of the hotel zone</h3>
      </div>
      <div className="grid gap-2">
        {items.map((item, i) => (
          <div key={i} className="border-l-2 border-l-orange-400 bg-slate-700/40 rounded-r-lg px-3 py-2">
            <p className="text-sm font-semibold text-orange-300">{item.title}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OnYourDatesSection({ items }) {
  return (
    <div className="bg-slate-800/50 border border-slate-600/40 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">📅</span>
        <h3 className="text-xs font-bold tracking-widest uppercase text-slate-300">On Your Dates</h3>
      </div>
      <div className="grid gap-2">
        {items.map((item, i) =>
          item.type === 'wc'
            ? <WCCard key={i} title={item.title} text={item.text} />
            : <Card key={i} title={item.title} text={item.text} type={item.type} />
        )}
      </div>
    </div>
  );
}

function SectionCards({ items, type }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="grid gap-2">
      {items.map((item, i) => (
        <Card key={i} title={item.title} text={item.text} type={type} />
      ))}
    </div>
  );
}

function CityView({ city }) {
  const sectionKeys = Object.keys(city.sections);
  const firstNonDates = sectionKeys.find(k => k !== 'dates' && k !== 'hotelZone') || sectionKeys[0];
  const [activeTab, setActiveTab] = useState(firstNonDates);

  // Determine visible tabs (exclude 'dates' and 'hotelZone' from tabs — they're shown inline)
  const tabs = sectionKeys.filter(k => k !== 'dates' && k !== 'hotelZone');

  return (
    <div className="flex flex-col gap-4">
      {/* City header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between flex-wrap gap-x-3 gap-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {city.label}
          </h2>
          <span className="text-xs text-slate-500 font-medium tracking-wide">{city.dates}</span>
        </div>
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span>🏨</span> {city.hotel}
        </p>
        {city.hotelNote && (
          <p className="text-xs text-orange-400/80 flex items-center gap-1 mt-0.5">
            <span>⚠</span> {city.hotelNote}
          </p>
        )}
        {city.match && <div className="mt-1"><MatchPill match={city.match} /></div>}
      </div>

      {/* On Your Dates — always visible */}
      {city.sections.dates && <OnYourDatesSection items={city.sections.dates} />}

      {/* Hotel Zone callout — always visible if present */}
      {city.sections.hotelZone && <HotelZoneCallout items={city.sections.hotelZone} />}

      {/* Section tabs */}
      {tabs.length > 0 && (
        <>
          <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {tabs.map(key => {
              const meta = SECTION_META[key] || { label: key, icon: '•' };
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-600 text-slate-100'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{meta.icon}</span>
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'sporting' && <SectionCards items={city.sections.sporting} type="sport" />}
            {activeTab === 'culture'  && <SectionCards items={city.sections.culture}  type="culture" />}
            {activeTab === 'running'  && <SectionCards items={city.sections.running}  type="running" />}
            {activeTab === 'food'     && <SectionCards items={city.sections.food}     type="food" />}
          </div>
        </>
      )}
    </div>
  );
}

function CheatSheet() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-slate-100" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        Cheat Sheet — All Events
      </h2>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-[480px] text-xs border-separate border-spacing-y-1">
          <thead>
            <tr className="text-slate-500 uppercase tracking-wider text-[10px]">
              <th className="text-left px-2 py-1 font-semibold">Date</th>
              <th className="text-left px-2 py-1 font-semibold">City</th>
              <th className="text-left px-2 py-1 font-semibold">Event</th>
            </tr>
          </thead>
          <tbody>
            {CHEAT_SHEET.map((row, i) => {
              const isWC = row.type === 'wc';
              return (
                <tr
                  key={i}
                  className={`rounded-lg ${
                    isWC
                      ? 'bg-amber-500/15'
                      : i % 2 === 0
                      ? 'bg-slate-800/60'
                      : 'bg-slate-800/30'
                  }`}
                >
                  <td className={`px-2 py-2 font-semibold whitespace-nowrap rounded-l-lg ${isWC ? 'text-amber-300' : 'text-slate-300'}`}>
                    {isWC && <span className="mr-1">⚽</span>}
                    {row.date}
                  </td>
                  <td className={`px-2 py-2 whitespace-nowrap ${isWC ? 'text-amber-200/70' : 'text-slate-500'}`}>
                    {row.city}
                  </td>
                  <td className={`px-2 py-2 rounded-r-lg leading-relaxed ${isWC ? 'text-amber-200/90' : 'text-slate-400'}`}>
                    {row.event}
                    {row.note && <span className="text-slate-500 italic ml-1">({row.note})</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/30 inline-block"></span> World Cup match</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-700 inline-block"></span> Sport / local event</span>
      </div>
    </div>
  );
}

// ─── ROOT COMPONENT ──────────────────────────────────────────────────────────

export default function TripGuide() {
  const [activeCity, setActiveCity] = useState('vancouver');
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const city = CITIES.find(c => c.id === activeCity);

  const HEADER_MATCHES = [
    { teams: 'Australia vs Türkiye', venue: 'BC Place Vancouver', time: 'Sat 13 Jun' },
    { teams: 'USA vs Australia',     venue: 'Lumen Field Seattle',  time: 'Fri 19 Jun' },
    { teams: 'Paraguay vs Australia',venue: "Levi's Stadium SF",    time: 'Thu 25 Jun' },
  ];

  return (
    <div className="min-h-dvh bg-slate-900 text-slate-100 font-sans">
      {/* ── HEADER ── */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h1
              className="text-lg sm:text-xl font-bold text-slate-100 leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              World Cup 2026 Trip Guide
            </h1>
            <span className="text-xs text-slate-500 font-medium">12–26 Jun</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 mb-2.5">Pacific NW & Northern California · Socceroos Group Stage</p>
          {/* Match pills */}
          <div className="flex flex-wrap gap-1.5">
            {HEADER_MATCHES.map((m, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full px-2.5 py-1 text-[11px] text-amber-300 font-medium whitespace-nowrap">
                <span>⚽</span>
                <span>{m.teams}</span>
                <span className="text-amber-500/60">·</span>
                <span className="text-amber-400/70">{m.time}</span>
                <span className="text-amber-500/40">·</span>
                <span className="text-amber-500/60">{m.venue}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── CITY NAV ── */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-[var(--header-h,0)] z-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide">
            {CITIES.map(c => (
              <button
                key={c.id}
                onClick={() => { setActiveCity(c.id); setShowCheatSheet(false); }}
                className={`flex-none px-3.5 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  !showCheatSheet && activeCity === c.id
                    ? 'border-b-amber-400 text-amber-300'
                    : 'border-b-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {c.label}
                {c.match && <span className="ml-1 text-amber-500">⚽</span>}
              </button>
            ))}
            <button
              onClick={() => setShowCheatSheet(true)}
              className={`flex-none px-3.5 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                showCheatSheet
                  ? 'border-b-slate-400 text-slate-200'
                  : 'border-b-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              📋 Cheat Sheet
            </button>
          </div>
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <main className="max-w-2xl mx-auto px-4 py-5 pb-16">
        {showCheatSheet
          ? <CheatSheet />
          : city && <CityView key={city.id} city={city} />
        }
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800 text-center py-4 text-xs text-slate-600">
        Schedules current as of early June 2026 — confirm minor-league / WNBA times the week before.
      </footer>
    </div>
  );
}
