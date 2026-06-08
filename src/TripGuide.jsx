import { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapPin, Star, Search, X, UtensilsCrossed, Landmark,
  Footprints, Trophy, CalendarDays, Car, Hotel, AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { supabase, getClientId } from './lib/supabase';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function daysUntil(isoDate) {
  const diff = new Date(isoDate) - new Date(new Date().toDateString());
  const d = Math.round(diff / 86400000);
  if (d < 0)  return 'played';
  if (d === 0) return 'today!';
  if (d === 1) return 'tomorrow';
  return `in ${d} days`;
}

function mapsUrl(q) {
  return `https://www.google.com/maps/search/?q=${q}`;
}

function Highlight({ text, query }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-100 rounded px-0.5" style={{ color: '#8A5A2A' }}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── SUPABASE HOOK ───────────────────────────────────────────────────────────

function useSavedCards() {
  const [saved, setSaved] = useState(new Set());
  const clientId = useRef(getClientId());

  useEffect(() => {
    supabase
      .from('saved_cards')
      .select('card_id')
      .eq('client_id', clientId.current)
      .then(({ data }) => {
        if (data) setSaved(new Set(data.map(r => r.card_id)));
      });
  }, []);

  const toggle = (cardId) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
        supabase.from('saved_cards').delete()
          .eq('client_id', clientId.current)
          .eq('card_id', cardId);
      } else {
        next.add(cardId);
        supabase.from('saved_cards').insert({ client_id: clientId.current, card_id: cardId });
      }
      return next;
    });
  };

  return [saved, toggle];
}

// ─── ACCENT COLOURS PER CITY ─────────────────────────────────────────────────

const CITY_ACCENT = {
  vancouver:  { hex: '#2A7A4A' },
  seattle1:   { hex: '#2A5A8A' },
  olympic:    { hex: '#2A7A7A' },
  seattle2:   { hex: '#2A5A8A' },
  portland:   { hex: '#8A2A2A' },
  craterlake: { hex: '#2A6A7A' },
  napa:       { hex: '#6A2A7A' },
  sf:         { hex: '#7A4A1A' },
};

// ─── SECTION META ─────────────────────────────────────────────────────────────

const SECTION_META = {
  dates:     { label: 'Dates',        Icon: CalendarDays,    color: '#6B6560' },
  sporting:  { label: 'Sporting',     Icon: Trophy,          color: '#4A7A5A' },
  culture:   { label: 'Culture',      Icon: Landmark,        color: '#4A5A8A' },
  running:   { label: 'Running',      Icon: Footprints,      color: '#5A7A8A' },
  food:      { label: 'Food & Drink', Icon: UtensilsCrossed, color: '#8A5A2A' },
  hotelZone: { label: 'Hotel Zone',   Icon: Car,             color: '#7A4A3A' },
};

// ─── CARD STYLING ─────────────────────────────────────────────────────────────

const CARD_STYLE = {
  wc:      { cardBg: '#FDF5F0', cardBorder: '#E8C0A0', title: '#C04E1A' },
  sport:   { cardBg: '#F3F7F3', cardBorder: '#B0CDB8', title: '#4A7A5A' },
  event:   { cardBg: '#FFFFFF', cardBorder: '#E8E0D8', title: '#4A5A8A' },
  note:    { cardBg: '#FFFFFF', cardBorder: '#E8E0D8', title: '#6B6560' },
  culture: { cardBg: '#FFFFFF', cardBorder: '#E8E0D8', title: '#4A5A8A' },
  running: { cardBg: '#FFFFFF', cardBorder: '#E8E0D8', title: '#5A7A8A' },
  food:    { cardBg: '#FFFFFF', cardBorder: '#E8E0D8', title: '#8A5A2A' },
  hotel:   { cardBg: '#FFFFFF', cardBorder: '#E8E0D8', title: '#7A4A3A' },
};

// ─── DATA ────────────────────────────────────────────────────────────────────

const HEADER_MATCHES = [
  { teams: 'Australia vs Türkiye', venue: 'BC Place · Vancouver', date: 'Sat 13 Jun', iso: '2026-06-13' },
  { teams: 'USA vs Australia',     venue: 'Lumen Field · Seattle', date: 'Fri 19 Jun', iso: '2026-06-19' },
  { teams: 'Paraguay vs Australia',venue: "Levi's Stadium · SF",   date: 'Thu 25 Jun', iso: '2026-06-25' },
];

const CHEAT_SHEET = [
  { date: 'Fri 12 Jun', city: 'Vancouver',    event: 'Vancouver Canadians (High-A) at The Nat, eve',                                   type: 'sport', note: 'confirm time' },
  { date: 'Sat 13 Jun', city: 'Vancouver',    event: 'Australia vs Türkiye — BC Place, 9pm',                                           type: 'wc' },
  { date: 'Sun 14 Jun', city: 'Seattle 1',    event: 'Tacoma Rainiers (AAA) vs Albuquerque, 1:35pm',                                   type: 'sport', note: 'only if arrive early' },
  { date: 'Mon 15 Jun', city: 'Seattle 1',    event: 'Belgium vs Egypt — Lumen Field, 12pm (fan zone)',                                type: 'wc' },
  { date: 'Tue 16 Jun', city: 'Olympic NP',   event: 'Port Angeles Lefties vs Bellingham, 6:35pm, Civic Field',                        type: 'sport' },
  { date: 'Wed 17 Jun', city: 'Olympic NP',   event: 'Port Angeles Lefties vs Bellingham, 6:35pm, Civic Field',                        type: 'sport' },
  { date: 'Thu 18 Jun', city: 'Seattle 2',    event: 'Mariners vs Baltimore, 1:10pm, T-Mobile Park',                                   type: 'sport', note: 'Everett AquaSox possible alt' },
  { date: 'Fri 19 Jun', city: 'Seattle 2',    event: 'USA vs Australia — Lumen, 12pm  +  Mariners vs Boston, 7:10pm',                  type: 'wc' },
  { date: 'Sat 20 Jun', city: 'Portland',     event: "Portland Pickles (WCL) Mom's Night  +  Portland Fire (WNBA) ~5:30pm",            type: 'sport', note: 'confirm' },
  { date: 'Tue 23 Jun', city: 'Napa',         event: 'Sacramento River Cats (AAA) vs Las Vegas, 6:45pm, Sutter Health Park',           type: 'sport', note: '≈1 hr from Napa' },
  { date: 'Thu 25 Jun', city: 'SF/South Bay', event: "Giants vs Athletics, Oracle Park, 12:45pm  +  Paraguay vs Australia, Levi's, 7pm", type: 'wc' },
  { date: 'Fri 26 Jun', city: 'SF/South Bay', event: 'Giants vs Braves 7:15pm  /  Valkyries (WNBA)  /  Oakland Ballers',               type: 'sport', note: "likely too late for Will's flight" },
];

const CITIES = [
  {
    id: 'vancouver', label: 'Vancouver', dates: '12–14 Jun',
    startDate: '2026-06-12', endDate: '2026-06-14',
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
        { title: 'BC Place Tour + BC Sports Hall of Fame', text: 'Inside the stadium; good pre- or post-match addition.', places: [{ name: 'BC Place', detail: 'Stadium tour + Hall of Fame', maps: 'BC+Place+Vancouver' }] },
        { title: 'Kayak / SUP on False Creek', text: 'Multiple outfitters along the creek, walkable from Yaletown.', places: [{ name: 'Ecomarine Paddlesports', detail: 'False Creek rentals', maps: 'Ecomarine+Paddlesports+Vancouver' }] },
      ],
      culture: [
        { title: 'Gastown & Chinatown', places: [{ name: 'Gastown Steam Clock', detail: 'Cobblestone old town', maps: 'Gastown+Vancouver' }, { name: 'Dr. Sun Yat-Sen Classical Garden', detail: 'Chinatown', maps: 'Dr+Sun+Yat-Sen+Garden+Vancouver' }] },
        { title: 'Granville Island Public Market', text: 'Aquabus across False Creek — food stalls, makers, buskers. Go before noon.', places: [{ name: 'Granville Island Public Market', detail: 'Take the Aquabus from Yaletown', maps: 'Granville+Island+Public+Market+Vancouver' }] },
        { title: 'Museums — Vanier Park', places: [{ name: 'Museum of Vancouver', detail: 'Vanier Park', maps: 'Museum+of+Vancouver' }, { name: 'Vancouver Maritime Museum', detail: 'Vanier Park', maps: 'Vancouver+Maritime+Museum' }] },
        { title: 'Art Galleries', places: [{ name: 'Vancouver Art Gallery', detail: 'Emily Carr, Indigenous art', maps: 'Vancouver+Art+Gallery' }, { name: 'Bill Reid Gallery', detail: 'Superb Haida/Indigenous art; free first Friday afternoons', maps: 'Bill+Reid+Gallery+Vancouver' }, { name: 'The Polygon Gallery', detail: 'North Van by SeaBus — pairs with Lonsdale Quay', maps: 'Polygon+Gallery+North+Vancouver' }] },
        { title: 'Nature & Gardens', places: [{ name: 'Capilano Suspension Bridge', detail: 'North Shore, ~25 min', maps: 'Capilano+Suspension+Bridge+Vancouver' }, { name: 'Grouse Mountain', detail: 'Forest and views half-day', maps: 'Grouse+Mountain+Vancouver' }, { name: 'VanDusen Botanical Garden', detail: '55 acres near Queen Elizabeth Park', maps: 'VanDusen+Botanical+Garden+Vancouver' }] },
      ],
      running: [
        { title: 'Stanley Park Seawall', text: '~10km car-free loop, ocean + old-growth forest. Reach it via the False Creek seawall straight from Yaletown.' },
        { title: 'False Creek Loop', text: 'Out the door for a shorter, flat outing.' },
      ],
      food: [
        { title: 'Pacific NW Seafood', places: [{ name: 'The Vancouver Fish Company', detail: 'Granville Island', maps: 'Vancouver+Fish+Company' }, { name: "Cardero's", detail: 'Coal Harbour patio — sablefish, spot prawns', maps: "Cardero's+Restaurant+Vancouver" }] },
        { title: 'Yaletown (walkable)', places: [{ name: 'Oshi Nori', detail: 'Handroll sushi', maps: 'Oshi+Nori+Vancouver' }, { name: 'Elisa', detail: 'Steak', maps: 'Elisa+Restaurant+Vancouver' }, { name: 'Dovetail', detail: 'Lively modern dining', maps: 'Dovetail+Restaurant+Yaletown' }, { name: 'Brix & Mortar', detail: 'Wine bar + small plates', maps: 'Brix+and+Mortar+Vancouver' }] },
        { title: 'Granville Island Market', text: 'Graze the stalls: BC oysters, smoked salmon, local cheese.' },
        { title: 'Richmond (~25 min)', text: 'Some of the best Chinese food outside Asia — worth a dim sum or night-market detour.' },
        { title: 'Ramen & Izakaya', places: [{ name: 'Tonkotsu Ramen Tsukiya', detail: 'West End, tiny, superb broth', maps: 'Tsukiya+Ramen+Vancouver' }, { name: 'Menya Raizo', detail: 'Broadway', maps: 'Menya+Raizo+Vancouver' }, { name: 'Oku Izakaya', detail: 'Gastown, sake + sushi', maps: 'Oku+Izakaya+Vancouver' }] },
        { title: 'Indian', places: [{ name: 'Desi Indian Lounge', detail: 'Downtown', maps: 'Desi+Indian+Lounge+Vancouver' }, { name: 'Bahubali Biryani House', detail: 'Downtown', maps: 'Bahubali+Biryani+House+Vancouver' }, { name: 'Hyderabad Haveli', detail: 'Kingsway · late-night biryani', maps: 'Hyderabad+Haveli+Vancouver' }] },
        { title: 'Main St / Mount Pleasant (Uber ~10 min)', places: [{ name: 'The Farmhouse', detail: 'Rustic Italian', maps: 'Farmhouse+Restaurant+Vancouver' }, { name: 'Mount Pleasant Vintage', detail: 'Open-fire kitchen', maps: 'Mount+Pleasant+Vintage+Vancouver' }, { name: 'The Watson', detail: 'Excellent cocktail bar', maps: 'The+Watson+Vancouver' }] },
        { title: 'Bars — Gastown', places: [{ name: 'Guilt & Co', detail: 'Live music basement', maps: 'Guilt+and+Co+Vancouver' }, { name: 'Arcana', detail: 'Theatrical cocktails', maps: 'Arcana+Cocktails+Vancouver' }, { name: 'Clough Club', detail: 'Gastown bar', maps: 'Clough+Club+Vancouver' }, { name: 'Pourhouse', detail: 'Classic Gastown bar', maps: 'Pourhouse+Vancouver' }] },
      ],
    },
  },
  {
    id: 'seattle1', label: 'Seattle 1', dates: '14–16 Jun',
    startDate: '2026-06-14', endDate: '2026-06-16',
    hotel: 'Fairfield by Marriott Downtown / Seattle Center',
    match: { teams: 'Belgium vs Egypt', venue: 'Lumen Field', time: 'Mon 15 Jun · 12pm', note: 'fan zone day' },
    sections: {
      dates: [
        { type: 'wc',    title: 'Belgium vs Egypt — Lumen Field, 12pm (fan zone)', text: 'Official FIFA fan celebration at Seattle Center — basically next to your hotel.' },
        { type: 'sport', title: 'Seattle Storm (WNBA) — Climate Pledge Arena', text: '5-minute walk from the hotel. Check for a home game on the 14th/15th at climatepledgearena.com — the easiest sporting add of the trip.' },
        { type: 'note',  title: 'Mariners Away', text: 'Away until June 15; homestand starts the 16th (your departure day) — no MLB this round.' },
        { type: 'sport', title: 'Tacoma Rainiers (AAA) — Sun 14, 1:35pm', text: "vs Albuquerque, ~35 min south — but it's your bus-arrival day, so only if you land early." },
      ],
      culture: [
        { title: 'Seattle Center (by your hotel)', places: [{ name: 'Chihuly Garden and Glass', detail: 'Unmissable glass art', maps: 'Chihuly+Garden+and+Glass+Seattle' }, { name: 'Space Needle', detail: 'Observation deck', maps: 'Space+Needle+Seattle' }, { name: 'Museum of Pop Culture (MoPOP)', detail: 'Hendrix/Nirvana, sci-fi props, guitar tower', maps: 'MoPOP+Seattle' }] },
        { title: 'Pioneer Square', places: [{ name: 'Pike Place Market', detail: 'Go early', maps: 'Pike+Place+Market+Seattle' }, { name: 'Smith Tower Speakeasy', detail: 'Observation bar', maps: 'Smith+Tower+Seattle' }, { name: 'Underground Tour', detail: 'The buried original city', maps: 'Underground+Tour+Seattle' }] },
        { title: 'Neighbourhoods & Museums', places: [{ name: 'MOHAI', detail: 'Lake Union — best city-history museum', maps: 'MOHAI+Seattle' }, { name: 'Frye Art Museum', detail: 'First Hill — free, excellent', maps: 'Frye+Art+Museum+Seattle' }, { name: 'Ballard Locks', detail: 'Boats lift between sea and lake + salmon ladder', maps: 'Ballard+Locks+Seattle' }] },
      ],
      running: [
        { title: 'Elliott Bay Trail / Myrtle Edwards Park', text: 'From the Olympic Sculpture Park (5 min away) — flat waterfront, Puget Sound views, the signature Seattle run.' },
        { title: 'Kerry Park (Queen Anne)', text: 'Add for the skyline-postcard hill.' },
      ],
      food: [
        { title: 'Oysters & Seafood', places: [{ name: 'Taylor Shellfish', detail: 'Pioneer Square', maps: 'Taylor+Shellfish+Pioneer+Square+Seattle' }, { name: 'The Walrus and the Carpenter', detail: 'Ballard', maps: 'Walrus+and+the+Carpenter+Seattle' }, { name: 'Local Tide', detail: 'Fremont · crab roll', maps: 'Local+Tide+Fremont+Seattle' }] },
        { title: 'Capitol Hill', places: [{ name: 'Kedai Makan', detail: 'Malaysian', maps: 'Kedai+Makan+Seattle' }, { name: 'Terra Plata', detail: 'Rooftop', maps: 'Terra+Plata+Seattle' }] },
        { title: 'Chinatown–International District', places: [{ name: 'E-Jae Pak Mor', detail: 'Modern Thai rice-noodle rolls', maps: 'E-Jae+Pak+Mor+Seattle' }, { name: 'Tendon Kohaku', detail: 'Tempura/katsu', maps: 'Tendon+Kohaku+Seattle' }, { name: 'Tai Tung', detail: "Historic Cantonese — Bruce Lee's old haunt", maps: 'Tai+Tung+Restaurant+Seattle' }] },
        { title: 'Ballard Dinners', places: [{ name: 'Fuego', detail: 'Salvadoran/Mexican in an old firehouse', maps: 'Fuego+Cocina+Ballard+Seattle' }, { name: 'Brimmer & Heeltap', detail: 'Seasonal bistro, near the Locks', maps: 'Brimmer+and+Heeltap+Seattle' }] },
        { title: 'Special Occasion', places: [{ name: 'Canlis', detail: 'Iconic Lake Union fine-diner — book well ahead', maps: 'Canlis+Restaurant+Seattle' }, { name: 'Archipelago', detail: 'Intimate Filipino tasting menu, Columbia City', maps: 'Archipelago+Restaurant+Seattle' }] },
        { title: 'Coffee & Bars', places: [{ name: 'Lighthouse Roasters', detail: 'Fremont', maps: 'Lighthouse+Roasters+Seattle' }, { name: 'Black Arrows', detail: 'Near hotel', maps: 'Black+Arrows+Coffee+Seattle' }, { name: 'Majnoon', detail: 'Queen Anne, near hotel, rare agave list', maps: 'Majnoon+Seattle' }, { name: 'Paper Fan', detail: 'Capitol Hill speakeasy', maps: 'Paper+Fan+Seattle' }] },
      ],
    },
  },
  {
    id: 'olympic', label: 'Olympic NP', dates: '16–18 Jun',
    startDate: '2026-06-16', endDate: '2026-06-18',
    hotel: 'Olympic Lodge by Ayres, Port Angeles',
    sections: {
      dates: [
        { type: 'sport', title: 'Port Angeles Lefties (WCL) — Tue 16 & Wed 17, 6:35pm', text: 'vs Bellingham Bells at Civic Field. Perfect small-town evening after the trails — cheap tickets, sunset over the Strait, mascot Timber the Olympic Marmot.', places: [{ name: 'Civic Field, Port Angeles', detail: 'West Coast League collegiate ball', maps: 'Civic+Field+Port+Angeles' }] },
        { type: 'note',  title: 'The Wilderness Reset', text: 'The park is the main event. Thursday the 18th is your drive-back day.' },
      ],
      culture: [
        { title: 'Hurricane Ridge', text: '~40 min up from Port Angeles. Go on your clearest morning.', places: [{ name: 'Hurricane Ridge', detail: 'Alpine meadows, Olympic Mountain panoramas', maps: 'Hurricane+Ridge+Olympic+National+Park' }] },
        { title: 'Lake Crescent', places: [{ name: 'Marymere Falls Trail', detail: 'Easy 1.5mi', maps: 'Marymere+Falls+Olympic+National+Park' }, { name: 'Mt. Storm King', detail: 'Steep scramble, ropes near top, huge payoff', maps: 'Mt+Storm+King+Olympic+National+Park' }] },
        { title: 'Hoh Rain Forest', text: '~2 hr drive — Hall of Mosses loop; otherworldly. Long but worthwhile full day.', places: [{ name: 'Hall of Mosses', detail: 'Hoh Rain Forest, Olympic NP', maps: 'Hall+of+Mosses+Hoh+Rain+Forest' }] },
        { title: 'Other Highlights', places: [{ name: 'Sol Duc Falls', detail: 'Easy trail', maps: 'Sol+Duc+Falls+Olympic+National+Park' }, { name: 'Rialto Beach', detail: 'Pacific sea stacks', maps: 'Rialto+Beach+Olympic+National+Park' }, { name: 'Ruby Beach', detail: 'Dramatic coastline', maps: 'Ruby+Beach+Olympic+National+Park' }, { name: 'Purple Haze Lavender', detail: 'Sequim, ~20 min east · starts blooming June', maps: 'Purple+Haze+Lavender+Farm+Sequim' }] },
      ],
      running: [
        { title: 'Olympic Discovery Trail', text: 'Paved waterfront/forest path through Port Angeles, flat, right by the lodge.' },
        { title: 'Hurricane Hill Trail', text: "Alpine hike-run once you've driven up — altitude is noticeable." },
      ],
      food: [
        { title: 'Dungeness Crab', text: 'The local catch — look for it around the harbor.' },
        { title: 'Port Angeles Dinners', places: [{ name: 'Next Door Gastropub', detail: 'Downtown', maps: 'Next+Door+Gastropub+Port+Angeles' }, { name: 'Kokopelli Grill', detail: 'Downtown', maps: 'Kokopelli+Grill+Port+Angeles' }, { name: 'Barhop Brewing', detail: 'Local pint', maps: 'Barhop+Brewing+Port+Angeles' }] },
        { title: 'Pro Tip', text: 'Stock the car with coffee and snacks in town — services inside the park are sparse and signal is patchy.' },
      ],
    },
  },
  {
    id: 'seattle2', label: 'Seattle 2', dates: '18–20 Jun',
    startDate: '2026-06-18', endDate: '2026-06-20',
    hotel: 'Four Points by Sheraton Seattle Airport South',
    hotelNote: 'Airport-strip hotel — nothing good is walkable here. Uber out.',
    match: { teams: 'USA vs Australia', venue: 'Lumen Field', time: 'Fri 19 Jun · 12pm' },
    sections: {
      dates: [
        { type: 'sport', title: 'Mariners vs Baltimore — Thu 18, 1:10pm, T-Mobile Park', text: 'Day game slots perfectly into your open day.', places: [{ name: 'T-Mobile Park', detail: 'Downtown Seattle', maps: 'T-Mobile+Park+Seattle' }] },
        { type: 'wc',    title: 'USA vs Australia — Lumen Field, Fri 19, 12pm', text: "Your match. Bonus: Mariners vs Boston at 7:10pm the same night — a noon WC match + evening MLB double is very doable if you've got the legs." },
        { type: 'sport', title: 'Mariners vs Boston Doubleheader — Sat 20', text: "Scheduled because of Friday's WC match. You're driving to Portland, so likely a pass." },
        { type: 'note',  title: 'Everett AquaSox (High-A)', text: '~35 min north — may be home on the 18th. Confirm at milb.com/everett.' },
      ],
      hotelZone: [
        { title: 'Georgetown (~10 min)', places: [{ name: 'Kuma Kitchen + Bar', detail: 'Pan-Asian', maps: 'Kuma+Kitchen+Georgetown+Seattle' }, { name: '1988 Cocktail Lounge', detail: 'Tiny, excellent', maps: '1988+Cocktail+Lounge+Georgetown+Seattle' }, { name: 'Star Brass Works', detail: 'Late-night, cheap burgers', maps: 'Star+Brass+Works+Seattle' }] },
        { title: 'Columbia City (~15 min)', places: [{ name: 'Marination', detail: 'Hawaiian-Korean', maps: 'Marination+Columbia+City+Seattle' }, { name: "Curry's Culture", detail: 'Indian', maps: "Curry's+Culture+Seattle" }, { name: 'Black & Tan Hall', detail: 'Black-owned music venue + food', maps: 'Black+and+Tan+Hall+Seattle' }] },
        { title: 'West Seattle / Alki Beach (~15 min)', places: [{ name: 'Driftwood', detail: 'Farm-to-table, superb', maps: 'Driftwood+Restaurant+West+Seattle' }, { name: 'Il Nido', detail: 'Italian', maps: 'Il+Nido+West+Seattle' }, { name: 'Otter on the Rocks', detail: 'Cocktails', maps: 'Otter+on+the+Rocks+Seattle' }] },
        { title: 'Pioneer Square / Capitol Hill (~15–20 min)', text: 'For a proper night out after the match.' },
      ],
      running: [
        { title: 'Des Moines Creek Trail', text: 'Paved, wooded, creek-side — the best run near the airport hotels.' },
        { title: 'Angle Lake Park Loop', text: 'Very close, short and pleasant.' },
      ],
    },
  },
  {
    id: 'portland', label: 'Portland', dates: '20–21 Jun',
    startDate: '2026-06-20', endDate: '2026-06-21',
    hotel: 'Embassy Suites Downtown',
    sections: {
      dates: [
        { type: 'sport', title: "Portland Pickles (WCL) — Sat 20, Walker Stadium", text: '"Mom\'s Night." They lead the WCL in attendance and are gloriously over-the-top — the most fun, most Portland thing you could do that evening.', places: [{ name: 'Walker Stadium', detail: 'Portland Pickles — West Coast League', maps: 'Walker+Stadium+Portland+Oregon' }] },
        { type: 'sport', title: 'Portland Fire (WNBA) — Sat 20, ~5:30pm, Moda Center', text: "Brand-new team's inaugural season. If home, it's a unique \"first season ever\" ticket. Check fire.wnba.com/schedule. You may have to choose between this and the Pickles.", places: [{ name: 'Moda Center', detail: 'Portland Fire WNBA', maps: 'Moda+Center+Portland' }] },
        { type: 'note',  title: 'Hillsboro Hops (High-A)', text: '~30 min west — possible Saturday option. Confirm at milb.com/hillsboro.' },
        { type: 'note',  title: 'No Timbers (MLS break)', text: 'Providence Park tours run; the Timbers Army scarf wall is worth a look.' },
      ],
      culture: [
        { title: 'Books & Gardens', places: [{ name: "Powell's City of Books", detail: 'A full city block. Non-negotiable.', maps: "Powell's+City+of+Books+Portland" }, { name: 'Portland Japanese Garden', detail: 'Washington Park — arguably the best outside Japan', maps: 'Portland+Japanese+Garden' }, { name: 'International Rose Test Garden', detail: 'Free, peak bloom in June', maps: 'International+Rose+Test+Garden+Portland' }] },
        { title: 'Downtown', places: [{ name: 'Lan Su Chinese Garden', detail: 'Compact, beautiful classical garden', maps: 'Lan+Su+Chinese+Garden+Portland' }, { name: 'Tom McCall Waterfront Park', detail: 'Along the river', maps: 'Tom+McCall+Waterfront+Park+Portland' }, { name: 'Portland Art Museum', detail: 'Recently expanded, Rothko room', maps: 'Portland+Art+Museum' }] },
      ],
      running: [
        { title: 'Waterfront Loop', text: 'Tom McCall Park → cross the river → Eastbank Esplanade → cross back. ~4mi car-free riverside loop.' },
        { title: 'Washington Park / Hoyt Arboretum', text: 'For hills and trees.' },
      ],
      food: [
        { title: 'Food-Cart Pods', places: [{ name: 'Cartopia', detail: 'Hawthorne · fire pits at night', maps: 'Cartopia+Portland' }, { name: 'WonderLove', detail: 'Multi-level, has a bar', maps: 'WonderLove+Food+Carts+Portland' }] },
        { title: 'Classics', places: [{ name: 'Voodoo Doughnut', detail: 'Touristy but obligatory', maps: 'Voodoo+Doughnut+Portland' }, { name: 'Screen Door', detail: 'Southern brunch — expect a line', maps: 'Screen+Door+Portland' }, { name: 'Farmhouse Kitchen Thai', detail: 'Spectacular', maps: 'Farmhouse+Kitchen+Thai+Portland' }] },
        { title: 'Beer', places: [{ name: "Treebeerd's Taphouse", detail: 'Huge list downtown', maps: "Treebeard's+Taphouse+Portland" }, { name: 'Little Beast', detail: 'Sours + garden', maps: 'Little+Beast+Brewing+Portland' }], text: 'Order a hazy IPA.' },
        { title: 'Cocktails', places: [{ name: 'Teardrop Lounge', detail: 'Top-tier', maps: 'Teardrop+Cocktail+Lounge+Portland' }, { name: 'Secret Grove', detail: 'Hidden bar', maps: 'Secret+Grove+Portland' }] },
        { title: 'More Dinners', places: [{ name: 'Lechon', detail: 'Peruvian/South American, downtown', maps: 'Lechon+Restaurant+Portland' }, { name: 'The Observatory', detail: 'Montavilla neighbourhood gem', maps: 'The+Observatory+Portland' }, { name: 'Hat Yai', detail: 'Famous Southern-Thai fried chicken + curry', maps: 'Hat+Yai+Portland' }] },
        { title: 'Dessert', places: [{ name: 'Salt & Straw', detail: "NW 23rd or SE Division — wildly creative flavours", maps: 'Salt+and+Straw+Portland' }] },
      ],
    },
  },
  {
    id: 'craterlake', label: 'Crater Lake', dates: '21–23 Jun',
    startDate: '2026-06-21', endDate: '2026-06-23',
    hotel: 'Crater Lake Lodge — remote and iconic',
    sections: {
      dates: [
        { type: 'note', title: 'No Events — The Lake Is the Show', text: 'The lodge sits at ~7,100 ft. Pace your runs and hikes, hydrate, and expect lingering snow on some trails into late June.' },
      ],
      culture: [
        { title: 'The Lodge & Rim', places: [{ name: 'Crater Lake Lodge (1915)', detail: 'Sunset drink on the terrace over the caldera', maps: 'Crater+Lake+Lodge+Oregon' }, { name: 'Rim Drive', detail: '33-mile loop — check plowing status', maps: 'Rim+Drive+Crater+Lake' }] },
        { title: 'Hikes', places: [{ name: 'Watchman Peak', detail: 'Short, steep, best sunset over Wizard Island', maps: 'Watchman+Peak+Crater+Lake' }, { name: 'Garfield Peak', detail: 'From the lodge, ~3.4mi, big caldera views', maps: 'Garfield+Peak+Crater+Lake' }, { name: 'Cleetwood Cove', detail: 'Only legal trail to the water; boat tours if running', maps: 'Cleetwood+Cove+Trail+Crater+Lake' }] },
      ],
      running: [
        { title: 'Rim Village Paths / Rim Drive Shoulder', text: 'Caldera views throughout — keep it easy at altitude.' },
        { title: 'Garfield Peak as Hike-Run', text: 'If fully acclimatized — steep and rewarding.' },
      ],
      food: [
        { title: 'On Site', places: [{ name: 'Crater Lake Lodge Dining Room', detail: 'Regional plates with the caldera view — book ahead', maps: 'Crater+Lake+Lodge+Dining+Room' }, { name: 'Annie Creek Restaurant', detail: 'Mazama Village, 7 miles south — casual', maps: 'Annie+Creek+Restaurant+Crater+Lake' }] },
        { title: 'Pro Tip', text: 'Bring your own wine and snacks — options are limited and signal is poor.' },
      ],
    },
  },
  {
    id: 'napa', label: 'Napa', dates: '23–25 Jun',
    startDate: '2026-06-23', endDate: '2026-06-25',
    hotel: 'Napa Valley Lodge, Yountville',
    sections: {
      dates: [
        { type: 'sport', title: 'Sacramento River Cats (Triple-A) — Sutter Health Park', text: "Home Tue 23 (6:45pm), Wed 24 (12:05pm) & Thu 25 (~1 hr from Napa). Also the temporary home of the Athletics through 2027. Tue the 23rd evening is the cleanest fit.", places: [{ name: 'Sutter Health Park', detail: 'Sacramento, ~1 hr from Napa', maps: 'Sutter+Health+Park+Sacramento' }] },
        { type: 'event', title: 'Wine-Country Alternative', text: 'Swap sport for a hot-air balloon sunrise or cycling the Napa Valley Vine Trail between wineries.' },
        { type: 'note',  title: 'Live Music Midweek', text: 'Check downtown Napa listings — Oxbow Public Market and Uptown Theatre are the spots.' },
      ],
      culture: [
        { title: 'Wineries & Art', places: [{ name: 'Castello di Amorosa', detail: 'Recreated 13th-century Tuscan castle + winery', maps: 'Castello+di+Amorosa+Napa' }, { name: 'Oxbow Public Market', detail: 'Artisan food stalls, local wine, coffee', maps: 'Oxbow+Public+Market+Napa' }, { name: 'di Rosa Center for Contemporary Art', detail: '200-acre estate, sculpture park + lake, Carneros', maps: 'di+Rosa+Center+Napa' }] },
        { title: 'Yountville', text: "One of the best restaurant-per-capita towns in the country. Just wander." },
      ],
      running: [
        { title: 'Napa Valley Vine Trail', text: 'Paved, vineyard-lined, runs through Yountville. Go early before the heat builds.' },
      ],
      food: [
        { title: 'Wineries', places: [{ name: 'Trefethen Family Vineyards', detail: 'Historic estate', maps: 'Trefethen+Family+Vineyards+Napa' }, { name: 'Truchard Vineyards', detail: 'Tiny family operation with caves', maps: 'Truchard+Vineyards+Napa' }, { name: 'Sequoia Grove Winery', detail: 'Relaxed, under the redwoods', maps: 'Sequoia+Grove+Winery+Napa' }] },
        { title: 'Yountville Dining', places: [{ name: 'Bistro Jeanty', detail: 'French country classic · tomato soup en croûte', maps: 'Bistro+Jeanty+Yountville' }, { name: 'The Kitchen at Priest Ranch', detail: 'Standout burger', maps: 'Kitchen+at+Priest+Ranch+Napa' }, { name: 'RH Yountville', detail: 'Stunning lunch', maps: 'RH+Yountville' }, { name: 'The French Laundry', detail: 'Book months ahead', maps: 'French+Laundry+Yountville' }] },
        { title: 'More Dining', places: [{ name: 'Bistro Don Giovanni', detail: 'Beloved local Italian, vineyard setting, ~30 yrs', maps: 'Bistro+Don+Giovanni+Napa' }, { name: 'Bear at Stanly Ranch', detail: 'Polished, scenic', maps: 'Bear+Restaurant+Stanly+Ranch+Napa' }] },
        { title: 'Cocktails', places: [{ name: 'ArBARetum', detail: 'Napa cocktail bar', maps: 'ArBARetum+Napa' }, { name: "Wilfred's Lounge", detail: 'Tiki rooftop on the river', maps: "Wilfred's+Lounge+Napa" }] },
      ],
    },
  },
  {
    id: 'sf', label: 'SF/South Bay', dates: '25–26 Jun',
    startDate: '2026-06-25', endDate: '2026-06-26',
    hotel: 'Country Inn & Suites, San Jose Airport',
    hotelNote: 'Bland North San Jose — Uber out for everything.',
    match: { teams: 'Paraguay vs Australia', venue: "Levi's Stadium, Santa Clara", time: 'Thu 25 Jun · 7pm' },
    sections: {
      dates: [
        { type: 'wc',    title: "Paraguay vs Australia — Levi's Stadium, 7pm", text: "The finale! Levi's is ~15 min from the hotel — leave a big buffer for match-day traffic.", places: [{ name: "Levi's Stadium", detail: 'Santa Clara · ~15 min from hotel', maps: "Levi's+Stadium+Santa+Clara" }] },
        { type: 'sport', title: 'SF Giants vs Athletics — Oracle Park, Thu 25, 12:45pm', text: "Great solo move for Will while Andy works until 4:30. Oracle → Levi's is doable on Caltrain/drive.", places: [{ name: 'Oracle Park', detail: 'SF Giants vs Athletics, 12:45pm', maps: 'Oracle+Park+San+Francisco' }] },
        { type: 'sport', title: 'Fri 26 Evening Options', text: "Giants vs Atlanta 7:15pm + Golden State Valkyries (WNBA) at Chase Center — both likely too late for Will's 10pm flight.", places: [{ name: 'Oracle Park', detail: 'Giants vs Braves 7:15pm', maps: 'Oracle+Park+San+Francisco' }, { name: 'Chase Center', detail: 'Golden State Valkyries WNBA', maps: 'Chase+Center+San+Francisco' }] },
        { type: 'note',  title: 'Oakland Ballers', text: "Fan-owned independent club, home Fri 26–Sun 28 at Raimondi Park — but the 26th is Will's departure day." },
      ],
      hotelZone: [
        { title: 'Downtown San Jose (~10 min)', places: [{ name: 'San Pedro Square Market', detail: 'Food hall + bars', maps: 'San+Pedro+Square+Market+San+Jose' }, { name: 'Eos & Nyx', detail: 'Modern Californian', maps: 'Eos+and+Nyx+San+Jose' }, { name: 'Fox Tale Fermentation', detail: 'Craft beer', maps: 'Fox+Tale+Fermentation+San+Jose' }, { name: "Hapa's Brewing", detail: 'Craft beer', maps: "Hapa's+Brewing+San+Jose" }] },
        { title: 'Santana Row (~12 min)', places: [{ name: 'El Jardín', detail: 'Mexican, great margaritas', maps: 'El+Jardin+Santana+Row+San+Jose' }, { name: 'Augustine', detail: 'Upscale dining', maps: 'Augustine+Restaurant+Santana+Row' }, { name: 'Yard House', detail: 'Huge beer list, sports on screens', maps: 'Yard+House+Santana+Row+San+Jose' }] },
        { title: "Santa Clara / Near Levi's (match day)", places: [{ name: 'Taplands', detail: 'Excellent rotating taproom', maps: 'Taplands+Santa+Clara' }, { name: 'thirsty.bar', detail: 'Pool/darts dive', maps: 'thirsty.bar+Santa+Clara' }, { name: 'The Stand', detail: 'Pre-match food', maps: 'The+Stand+American+Classics+Santa+Clara' }, { name: 'JOEY', detail: 'Pre-match food', maps: 'JOEY+Santa+Clara' }] },
        { title: 'San Francisco (~50 min)', text: 'Worth a full city day — see Culture section.' },
      ],
      culture: [
        { title: 'The Waterfront', places: [{ name: 'Ferry Building Marketplace', detail: 'Embarcadero food hall', maps: 'Ferry+Building+San+Francisco' }, { name: 'Golden Gate Bridge / Crissy Field', detail: 'Walk the bridge or run the waterfront', maps: 'Crissy+Field+San+Francisco' }, { name: 'Alcatraz', detail: 'Book well ahead', maps: 'Alcatraz+Island+San+Francisco' }, { name: 'Mission District', detail: 'Murals + taquerias', maps: 'Mission+District+San+Francisco' }] },
        { title: 'Museums', places: [{ name: 'SFMOMA', detail: 'Seven floors of modern art', maps: 'SFMOMA+San+Francisco' }, { name: 'de Young Museum', detail: 'Golden Gate Park · free observation tower', maps: 'de+Young+Museum+San+Francisco' }] },
        { title: 'Neighbourhoods', places: [{ name: 'Painted Ladies / Alamo Square', detail: 'The postcard Victorian row', maps: 'Painted+Ladies+San+Francisco' }] },
        { title: 'South Bay (no SF drive needed)', places: [{ name: 'Winchester Mystery House', detail: 'San Jose · ~10 min', maps: 'Winchester+Mystery+House+San+Jose' }, { name: 'The Tech Interactive', detail: 'Downtown San Jose', maps: 'The+Tech+Interactive+San+Jose' }, { name: 'Computer History Museum', detail: 'Mountain View — Silicon Valley pilgrimage', maps: 'Computer+History+Museum+Mountain+View' }] },
      ],
      running: [
        { title: 'SF: Embarcadero → Marina Green → Crissy Field', text: 'Toward the Golden Gate Bridge — the definitive SF waterfront run.' },
        { title: 'Guadalupe River Trail (San Jose)', text: 'Flat, paved, practical for a match-week jog near the hotel.' },
      ],
      food: [
        { title: 'Mission Burrito (the city specialty)', places: [{ name: 'The Morris', detail: 'Incredible duck, Chartreuse slushy', maps: 'The+Morris+San+Francisco' }, { name: 'Bottega', detail: 'On Valencia', maps: 'Bottega+Restaurant+San+Francisco' }] },
        { title: 'Ferry Building', places: [{ name: 'Hog Island Oyster Co.', detail: 'On the bay', maps: 'Hog+Island+Oyster+Ferry+Building+SF' }, { name: 'Dandelion Chocolate', detail: 'Local everything', maps: 'Dandelion+Chocolate+San+Francisco' }] },
        { title: 'SF Institutions', places: [{ name: 'Swan Oyster Depot', detail: 'Legendary counter seafood, Polk St — go early', maps: 'Swan+Oyster+Depot+San+Francisco' }, { name: 'House of Prime Rib', detail: 'Van Ness, a clubby classic', maps: 'House+of+Prime+Rib+San+Francisco' }, { name: 'Bix', detail: 'Art-deco jazz supper club, Jackson Square', maps: 'Bix+Restaurant+San+Francisco' }] },
        { title: 'Chinatown Dim Sum', places: [{ name: 'City View Restaurant', detail: 'Cheap, excellent', maps: 'City+View+Restaurant+San+Francisco' }, { name: 'Delicious Dim Sum', detail: 'Chinatown', maps: 'Delicious+Dim+Sum+San+Francisco' }] },
      ],
    },
  },
];

// ─── SAVE ID HELPERS ──────────────────────────────────────────────────────────

function lookupSavedItem(id) {
  const parts = id.split(':');
  const [cityId, sectionKey, cardIdx, placeIdx] = parts;
  const city = CITIES.find(c => c.id === cityId);
  const item = city?.sections[sectionKey]?.[+cardIdx];
  if (!item) return null;
  if (placeIdx !== undefined) {
    const place = item.places?.[+placeIdx];
    return place ? { city, sectionKey, item, place, isPlace: true, id } : null;
  }
  return { city, sectionKey, item, isPlace: false, id };
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────

function searchCards(query) {
  const q = query.toLowerCase();
  const results = [];
  CITIES.forEach(city => {
    Object.entries(city.sections).forEach(([sectionKey, items]) => {
      if (!Array.isArray(items)) return;
      items.forEach((item, idx) => {
        const haystack = [
          item.title || '',
          item.text || '',
          ...(item.places || []).map(p => `${p.name} ${p.detail || ''}`),
        ].join(' ').toLowerCase();
        if (haystack.includes(q)) {
          results.push({ city, sectionKey, item, idx });
        }
      });
    });
  });
  return results;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function PlacesList({ places, query, cardId, saved, onSave }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {places.map((place, i) => {
        const placeId = cardId ? `${cardId}:${i}` : null;
        const isSaved = placeId && saved?.has(placeId);
        return (
          <li key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D8' }}>
            <MapPin size={12} className="shrink-0" style={{ color: '#A89E96' }} />
            <a
              href={mapsUrl(place.maps)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 flex items-baseline gap-1.5 transition-opacity hover:opacity-70"
            >
              <span className="text-sm font-medium" style={{ color: '#1A1714' }}>
                <Highlight text={place.name} query={query} />
              </span>
              {place.detail && (
                <span className="text-xs shrink-0" style={{ color: '#A89E96' }}>
                  · <Highlight text={place.detail} query={query} />
                </span>
              )}
            </a>
            {placeId && onSave && (
              <button
                onClick={(e) => { e.preventDefault(); onSave(placeId); }}
                className="shrink-0 transition-colors"
                style={{ color: isSaved ? '#C04E1A' : '#D8CECA' }}
                aria-label={isSaved ? 'Unsave' : 'Save'}
              >
                <Star size={13} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            )}
            <ChevronRight size={12} className="shrink-0" style={{ color: '#D8CECA' }} />
          </li>
        );
      })}
    </ul>
  );
}

function Card({ title, text, places, type = 'culture', cardId, saved, onSave, query }) {
  const style = CARD_STYLE[type] || CARD_STYLE.culture;
  const hasPlaces = places && places.length > 0;
  const isSaved = !hasPlaces && saved?.has(cardId);

  return (
    <div
      className="rounded-xl px-3 py-2.5 border"
      style={{ backgroundColor: style.cardBg, borderColor: style.cardBorder, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold leading-snug" style={{ color: style.title }}>
          <Highlight text={title} query={query} />
        </p>
        {!hasPlaces && onSave && (
          <button
            onClick={() => onSave(cardId)}
            className="shrink-0 mt-0.5 transition-colors"
            style={{ color: isSaved ? '#C04E1A' : '#D8CECA' }}
            aria-label={isSaved ? 'Unsave' : 'Save'}
          >
            <Star size={13} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      {text && (
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6B6560' }}>
          <Highlight text={text} query={query} />
        </p>
      )}
      {hasPlaces && <PlacesList places={places} query={query} cardId={cardId} saved={saved} onSave={onSave} />}
    </div>
  );
}

function WCCard({ title, text, places, cardId, saved, onSave }) {
  const hasPlaces = places && places.length > 0;
  const isSaved = !hasPlaces && saved?.has(cardId);
  return (
    <div
      className="rounded-xl px-3 py-3 border"
      style={{ backgroundColor: '#FDF5F0', borderColor: '#E8C0A0', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold leading-snug" style={{ color: '#C04E1A' }}>⚽ {title}</p>
        {!hasPlaces && onSave && (
          <button
            onClick={() => onSave(cardId)}
            className="shrink-0 mt-0.5 transition-colors"
            style={{ color: isSaved ? '#C04E1A' : '#D8CECA' }}
            aria-label={isSaved ? 'Unsave' : 'Save'}
          >
            <Star size={13} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      {text && <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#8A5A2A' }}>{text}</p>}
      {hasPlaces && <PlacesList places={places} cardId={cardId} saved={saved} onSave={onSave} />}
    </div>
  );
}

function OnYourDatesSection({ items, cityId, saved, onSave }) {
  return (
    <div className="rounded-xl p-3 border" style={{ backgroundColor: '#F5F0E8', borderColor: '#E8E0D8' }}>
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={13} style={{ color: '#6B6560' }} />
        <h3 className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#6B6560' }}>On Your Dates</h3>
      </div>
      <div className="grid gap-2">
        {items.map((item, i) => {
          const cardId = `${cityId}:dates:${i}`;
          return item.type === 'wc'
            ? <WCCard key={i} title={item.title} text={item.text} places={item.places} cardId={cardId} saved={saved} onSave={onSave} />
            : <Card key={i} title={item.title} text={item.text} places={item.places} type={item.type} cardId={cardId} saved={saved} onSave={onSave} />;
        })}
      </div>
    </div>
  );
}

function HotelZoneCallout({ items, cityId, saved, onSave }) {
  return (
    <div className="rounded-xl p-3 border" style={{ backgroundColor: '#FBF7F4', borderColor: '#E8C8A0', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Car size={13} style={{ color: '#7A4A3A' }} />
        <h3 className="text-xs font-bold tracking-wider uppercase" style={{ color: '#7A4A3A' }}>Get out of the hotel zone</h3>
      </div>
      <div className="grid gap-2">
        {items.map((item, i) => {
          const cardId = `${cityId}:hotelZone:${i}`;
          return (
            <Card key={i} title={item.title} text={item.text} places={item.places} type="hotel" cardId={cardId} saved={saved} onSave={onSave} />
          );
        })}
      </div>
    </div>
  );
}

function SectionCards({ items, type, cityId, sectionKey, saved, onSave, query }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="grid gap-2">
      {items.map((item, i) => (
        <Card
          key={i}
          title={item.title}
          text={item.text}
          places={item.places}
          type={type}
          cardId={`${cityId}:${sectionKey}:${i}`}
          saved={saved}
          onSave={onSave}
          query={query}
        />
      ))}
    </div>
  );
}

function SectionDivider({ meta }) {
  const Icon = meta.Icon;
  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
      style={{ backgroundColor: '#F5F0E8', border: '1px solid #E8E0D8' }}
    >
      <Icon size={14} style={{ color: meta.color }} />
      <span className="text-sm font-semibold" style={{ color: '#1A1714' }}>{meta.label}</span>
    </div>
  );
}

function CityView({ city, activeTab, setActiveTab, saved, onSave }) {
  const accent = CITY_ACCENT[city.id] || CITY_ACCENT.vancouver;
  const sectionKeys = Object.keys(city.sections);
  const tabs = sectionKeys.filter(k => k !== 'dates' && k !== 'hotelZone');

  useEffect(() => {
    if (!activeTab || !tabs.includes(activeTab)) {
      setActiveTab(tabs[0] || null);
    }
  }, [city.id]);

  const currentTab = activeTab && tabs.includes(activeTab) ? activeTab : tabs[0];

  return (
    <div className="flex flex-col gap-4">
      {/* City header */}
      <div className="flex flex-col gap-0.5">
        <h2
          className="text-3xl font-semibold leading-tight"
          style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: accent.hex }}
        >
          {city.label}
        </h2>
        <hr style={{ borderColor: '#E8E0D8', margin: '8px 0 6px' }} />
        <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: '#6B6560' }}>
          <span className="flex items-center gap-1">
            <Hotel size={11} className="shrink-0" />
            {city.hotel}
          </span>
          {city.hotelNote && (
            <span className="flex items-center gap-1" style={{ color: '#C04E1A' }}>
              <AlertTriangle size={11} className="shrink-0" />
              {city.hotelNote}
            </span>
          )}
          <span style={{ color: '#A89E96' }}>{city.dates}</span>
        </div>
        {city.match && (
          <div
            className="mt-2 flex items-center gap-3 rounded-xl px-4 py-2.5 border"
            style={{ backgroundColor: '#FDF0E0', borderColor: '#E8C880' }}
          >
            <span className="text-lg">⚽</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#8A5A2A' }}>{city.match.teams}</p>
              <p className="text-xs" style={{ color: '#A89E96' }}>{city.match.venue} · {city.match.time}</p>
            </div>
          </div>
        )}
      </div>

      {city.sections.dates && (
        <OnYourDatesSection
          items={city.sections.dates}
          cityId={city.id}
          saved={saved}
          onSave={onSave}
        />
      )}

      {city.sections.hotelZone && (
        <HotelZoneCallout items={city.sections.hotelZone} cityId={city.id} saved={saved} onSave={onSave} />
      )}

      {tabs.length > 0 && (
        <>
          {/* Sticky section tabs */}
          <div
            className="sticky top-[112px] z-10 py-2 -mx-4 px-4"
            style={{ backgroundColor: '#FAF7F2' }}
          >
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map(key => {
                const meta = SECTION_META[key];
                if (!meta) return null;
                const { Icon, label, color } = meta;
                const isActive = currentTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors"
                    style={{
                      backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                      border: isActive ? '1px solid #E8E0D8' : '1px solid transparent',
                      color: isActive ? color : '#6B6560',
                      fontWeight: isActive ? 600 : 500,
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section divider bar */}
          {currentTab && SECTION_META[currentTab] && (
            <SectionDivider meta={SECTION_META[currentTab]} />
          )}

          <div>
            {currentTab && (
              <SectionCards
                items={city.sections[currentTab]}
                type={currentTab === 'sporting' ? 'sport' : currentTab === 'hotelZone' ? 'hotel' : currentTab}
                cityId={city.id}
                sectionKey={currentTab}
                saved={saved}
                onSave={onSave}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CheatSheet() {
  return (
    <div className="flex flex-col gap-3">
      <h2
        className="text-lg font-bold"
        style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: '#1A1714' }}
      >
        Cheat Sheet — All Events
      </h2>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-[480px] text-xs border-separate border-spacing-y-1">
          <thead>
            <tr className="uppercase tracking-wider text-[10px]" style={{ color: '#A89E96' }}>
              <th className="text-left px-2 py-1 font-semibold">Date</th>
              <th className="text-left px-2 py-1 font-semibold">City</th>
              <th className="text-left px-2 py-1 font-semibold">Event</th>
            </tr>
          </thead>
          <tbody>
            {CHEAT_SHEET.map((row, i) => {
              const isWC = row.type === 'wc';
              return (
                <tr key={i} style={{ backgroundColor: isWC ? '#FDF5F0' : i % 2 === 0 ? '#FFFFFF' : '#F5F0E8' }}>
                  <td className="px-2 py-2 font-semibold whitespace-nowrap rounded-l-lg" style={{ color: isWC ? '#C04E1A' : '#1A1714' }}>
                    {isWC && <span className="mr-1">⚽</span>}{row.date}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap" style={{ color: isWC ? '#8A5A2A' : '#6B6560' }}>{row.city}</td>
                  <td className="px-2 py-2 rounded-r-lg leading-relaxed" style={{ color: isWC ? '#8A5A2A' : '#6B6560' }}>
                    {row.event}
                    {row.note && <span className="italic ml-1" style={{ color: '#A89E96' }}>({row.note})</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 text-xs mt-1" style={{ color: '#A89E96' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: '#E8C0A0' }} />
          World Cup match
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: '#E8E0D8' }} />
          Sport / local event
        </span>
      </div>
    </div>
  );
}

function SavedView({ saved, onSave, navigate }) {
  const savedItems = useMemo(() => {
    return [...saved].map(lookupSavedItem).filter(Boolean);
  }, [saved]);

  if (savedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: '#A89E96' }}>
        <Star size={32} style={{ color: '#D8CECA' }} />
        <p className="text-sm">No saved items yet</p>
        <p className="text-xs" style={{ color: '#D8CECA' }}>Tap the star on any venue to save it here</p>
      </div>
    );
  }

  const grouped = savedItems.reduce((acc, item) => {
    const key = item.city.id;
    if (!acc[key]) acc[key] = { city: item.city, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5">
      <h2
        className="text-lg font-bold"
        style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: '#1A1714' }}
      >
        Saved — {savedItems.length} item{savedItems.length !== 1 ? 's' : ''}
      </h2>
      {Object.values(grouped).map(({ city, items }) => {
        const accent = CITY_ACCENT[city.id] || CITY_ACCENT.vancouver;
        return (
          <div key={city.id}>
            <button
              onClick={() => navigate(city.id)}
              className="flex items-center gap-1.5 mb-2 hover:opacity-80 transition-opacity"
              style={{ color: accent.hex }}
            >
              <span className="text-sm font-bold" style={{ fontFamily: "'Cormorant Garant', Georgia, serif" }}>{city.label}</span>
              <ChevronRight size={14} />
            </button>
            <div className="grid gap-2">
              {items.map(({ item, sectionKey, id, place, isPlace }) => {
                if (isPlace) {
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 border"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0D8', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                    >
                      <MapPin size={12} className="shrink-0" style={{ color: '#A89E96' }} />
                      <div className="flex-1 min-w-0">
                        <a
                          href={mapsUrl(place.maps)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:opacity-70 transition-opacity"
                        >
                          <span className="text-sm font-medium" style={{ color: '#1A1714' }}>{place.name}</span>
                          {place.detail && <span className="text-xs ml-1.5" style={{ color: '#A89E96' }}>{place.detail}</span>}
                        </a>
                        <p className="text-xs mt-0.5" style={{ color: '#A89E96' }}>
                          {SECTION_META[sectionKey]?.label}
                          {item.title && ` · ${item.title}`}
                        </p>
                      </div>
                      <button
                        onClick={() => onSave(id)}
                        className="shrink-0 transition-colors"
                        style={{ color: '#C04E1A' }}
                        aria-label="Unsave"
                      >
                        <Star size={13} fill="currentColor" />
                      </button>
                    </div>
                  );
                }
                const type = item.type || (sectionKey === 'sporting' ? 'sport' : sectionKey === 'hotelZone' ? 'hotel' : sectionKey);
                return item.type === 'wc'
                  ? <WCCard key={id} title={item.title} text={item.text} places={item.places} cardId={id} saved={saved} onSave={onSave} />
                  : <Card key={id} title={item.title} text={item.text} places={item.places} type={type} cardId={id} saved={saved} onSave={onSave} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SearchResults({ query, onNavigate }) {
  const results = useMemo(() => searchCards(query), [query]);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2" style={{ color: '#A89E96' }}>
        <p className="text-sm">No results for "{query}"</p>
      </div>
    );
  }

  const grouped = results.reduce((acc, r) => {
    const key = r.city.id;
    if (!acc[key]) acc[key] = { city: r.city, results: [] };
    acc[key].results.push(r);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs" style={{ color: '#A89E96' }}>{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</p>
      {Object.values(grouped).map(({ city, results: cityResults }) => {
        const accent = CITY_ACCENT[city.id] || CITY_ACCENT.vancouver;
        return (
          <div key={city.id}>
            <button
              onClick={() => onNavigate(city.id)}
              className="flex items-center gap-1.5 mb-2 hover:opacity-80 transition-opacity"
              style={{ color: accent.hex }}
            >
              <span className="text-sm font-bold" style={{ fontFamily: "'Cormorant Garant', Georgia, serif" }}>{city.label}</span>
              <ChevronRight size={14} />
            </button>
            <div className="grid gap-2">
              {cityResults.map(({ item, sectionKey, idx }) => {
                const type = item.type || (sectionKey === 'sporting' ? 'sport' : sectionKey === 'hotelZone' ? 'hotel' : sectionKey);
                const meta = SECTION_META[sectionKey];
                return (
                  <div key={`${city.id}:${sectionKey}:${idx}`} className="relative">
                    {meta && (
                      <div className="flex items-center gap-1 mb-1">
                        <meta.Icon size={10} style={{ color: '#A89E96' }} />
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#A89E96' }}>{meta.label}</span>
                      </div>
                    )}
                    {item.type === 'wc'
                      ? <WCCard title={item.title} text={item.text} places={item.places} />
                      : <Card title={item.title} text={item.text} places={item.places} type={type} query={query} />
                    }
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function TripGuide() {
  const [activeCity, setActiveCity] = useState('vancouver');
  const [activeTab, setActiveTab] = useState(null);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saved, toggleSave] = useSavedCards();
  const touchStartX = useRef(null);
  const searchRef = useRef(null);

  // Hash routing — parse on mount + popstate
  useEffect(() => {
    const parse = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        const today = new Date().toISOString().slice(0, 10);
        const current = CITIES.find(c => today >= c.startDate && today <= c.endDate);
        if (current) setActiveCity(current.id);
        return;
      }
      if (hash === 'cheatsheet') { setShowCheatSheet(true); setShowSaved(false); return; }
      if (hash === 'saved') { setShowSaved(true); setShowCheatSheet(false); return; }
      const [cityId, tab] = hash.split('/');
      const match = CITIES.find(c => c.id === cityId);
      if (match) {
        setActiveCity(match.id);
        setShowCheatSheet(false);
        setShowSaved(false);
        if (tab) setActiveTab(tab);
      }
    };
    parse();
    window.addEventListener('popstate', parse);
    return () => window.removeEventListener('popstate', parse);
  }, []);

  const navigate = (cityId, tab) => {
    const hash = tab ? `#${cityId}/${tab}` : `#${cityId}`;
    history.pushState(null, '', hash);
    setActiveCity(cityId);
    setShowCheatSheet(false);
    setShowSaved(false);
    setSearchQuery('');
    setSearchOpen(false);
    if (tab) setActiveTab(tab);
  };

  const goCheatSheet = () => { history.pushState(null, '', '#cheatsheet'); setShowCheatSheet(true); setShowSaved(false); setSearchQuery(''); setSearchOpen(false); };
  const goSaved      = () => { history.pushState(null, '', '#saved');      setShowSaved(true);  setShowCheatSheet(false); setSearchQuery(''); setSearchOpen(false); };

  const handleTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = e => {
    if (touchStartX.current === null || showCheatSheet || showSaved || searchQuery) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 60) return;
    const idx = CITIES.findIndex(c => c.id === activeCity);
    if (dx < 0 && idx < CITIES.length - 1) navigate(CITIES[idx + 1].id);
    if (dx > 0 && idx > 0)                  navigate(CITIES[idx - 1].id);
    touchStartX.current = null;
  };

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const city = CITIES.find(c => c.id === activeCity);
  const savedCount = saved.size;
  const isSearching = searchOpen && searchQuery.length > 0;

  return (
    <div className="min-h-dvh" style={{ backgroundColor: '#FAF7F2', color: '#1A1714' }}>
      {/* HEADER */}
      <header
        className="sticky top-0 z-30 px-4 py-4 border-b"
        style={{ backgroundColor: '#F5F0E8', borderColor: '#E8E0D8' }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1
                className="text-lg sm:text-xl font-semibold leading-tight"
                style={{ fontFamily: "'Cormorant Garant', Georgia, serif", color: '#1A1714' }}
              >
                World Cup 2026 Trip Guide
              </h1>
              <p className="text-xs mt-0.5" style={{ color: '#A89E96' }}>
                Pacific NW & Northern California · Socceroos Group Stage · 12–26 Jun
              </p>
            </div>
            <button
              onClick={() => { setSearchOpen(o => !o); setSearchQuery(''); }}
              className="shrink-0 p-1.5 transition-colors hover:opacity-70"
              style={{ color: '#A89E96' }}
              aria-label="Search"
            >
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
          </div>

          {/* Search input */}
          {searchOpen && (
            <div className="mt-2">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search venues, restaurants, activities…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8CECA', color: '#1A1714' }}
              />
            </div>
          )}

          {/* Match pills */}
          {!searchOpen && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {HEADER_MATCHES.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap"
                  style={{ backgroundColor: '#FDF0E0', border: '1px solid #E8C880', color: '#8A5A2A' }}
                >
                  <span>⚽</span>
                  <span>{m.teams}</span>
                  <span className="mx-0.5" style={{ color: '#D8B870' }}>·</span>
                  <span style={{ color: '#A89E96' }}>{m.date}</span>
                  <span className="mx-0.5" style={{ color: '#D8B870' }}>·</span>
                  <span className="font-bold" style={{ color: '#C04E1A' }}>{daysUntil(m.iso)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* CITY NAV */}
      <nav
        className="sticky top-[var(--header-h,0)] z-20 border-b"
        style={{ backgroundColor: '#F5F0E8', borderColor: '#E8E0D8' }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide">
            {CITIES.map(c => {
              const accent = CITY_ACCENT[c.id] || CITY_ACCENT.vancouver;
              const isActive = !showCheatSheet && !showSaved && !isSearching && activeCity === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(c.id)}
                  className="flex-none px-3.5 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors"
                  style={{
                    color: isActive ? accent.hex : '#6B6560',
                    borderBottomColor: isActive ? accent.hex : 'transparent',
                  }}
                >
                  {c.label}{c.match && <span className="ml-1" style={{ color: '#C04E1A' }}>⚽</span>}
                </button>
              );
            })}
            <button
              onClick={goCheatSheet}
              className="flex-none px-3.5 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors"
              style={{
                color: showCheatSheet && !isSearching ? '#1A1714' : '#6B6560',
                borderBottomColor: showCheatSheet && !isSearching ? '#1A1714' : 'transparent',
              }}
            >
              📋 Cheat Sheet
            </button>
            <button
              onClick={goSaved}
              className="flex-none px-3.5 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1"
              style={{
                color: showSaved && !isSearching ? '#C04E1A' : '#6B6560',
                borderBottomColor: showSaved && !isSearching ? '#C04E1A' : 'transparent',
              }}
            >
              <Star
                size={11}
                fill={savedCount > 0 ? 'currentColor' : 'none'}
                style={{ color: savedCount > 0 ? '#C04E1A' : undefined }}
              />
              Saved
              {savedCount > 0 && (
                <span
                  className="ml-0.5 rounded-full px-1.5 text-[10px] font-bold"
                  style={{ backgroundColor: 'rgba(192,78,26,0.12)', color: '#C04E1A' }}
                >
                  {savedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <main
        className="max-w-2xl mx-auto px-4 py-5 pb-16"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isSearching ? (
          <SearchResults query={searchQuery} onNavigate={navigate} />
        ) : showCheatSheet ? (
          <CheatSheet />
        ) : showSaved ? (
          <SavedView saved={saved} onSave={toggleSave} navigate={navigate} />
        ) : city ? (
          <CityView
            key={city.id}
            city={city}
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              history.replaceState(null, '', `#${city.id}/${tab}`);
            }}
            saved={saved}
            onSave={toggleSave}
          />
        ) : null}
      </main>

      <footer className="border-t text-center py-4 text-xs" style={{ borderColor: '#E8E0D8', color: '#A89E96' }}>
        Schedules current as of early June 2026 — confirm minor-league / WNBA times the week before.
      </footer>
    </div>
  );
}
