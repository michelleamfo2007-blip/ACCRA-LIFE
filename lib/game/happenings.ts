import { spotById, type Verb } from "@/lib/game/world";

export type Heat = "quiet" | "busy" | "packed";

export type Happening = {
  id: string;
  emoji: string;
  line: string;
  heat: Heat;
  verbs: Verb[];
};

function verb(partial: Partial<Verb> & Pick<Verb, "id" | "label" | "detail">): Verb {
  return { minutes: 40, cost: 0, earn: 0, effects: {}, social: true, ...partial };
}

type Slot = "dawn" | "morning" | "afternoon" | "evening" | "night";

function slotOf(hour: number): Slot {
  if (hour < 6) return "dawn";
  if (hour < 11) return "morning";
  if (hour < 16) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

function accraHour(at: Date) {
  return at.getUTCHours();
}

type Beat = { slots: Slot[]; weekend?: boolean; weekday?: boolean; heat: Heat; emoji: string; line: string; verbs: Verb[] };

const BEATS: Record<string, Beat[]> = {
  buka: [
    { slots: ["morning"], heat: "packed", emoji: "🍲", line: "Waakye line is already around the corner. Shito is loud.", verbs: [verb({ id: "hap-buka-rush", label: "Join the waakye rush", detail: "Egg, spaghetti, no talking till the first bite.", minutes: 35, cost: 20, effects: { hunger: 48, social: 8 }, tag: "food", emoji: "🍲" })] },
    { slots: ["afternoon", "evening"], heat: "busy", emoji: "🗣️", line: "The tables are full of gist. Somebody just shouted a name from across the road.", verbs: [verb({ id: "hap-buka-gist", label: "Sit in the gist", detail: "You hear three stories and only one is true.", minutes: 30, cost: 10, effects: { social: 20, fun: 10 }, emoji: "🗣️" })] },
  ],
  viewing: [
    { slots: ["afternoon", "evening", "night"], heat: "packed", emoji: "⚽", line: "The screen is on. Every chair has a coach.", verbs: [verb({ id: "hap-view-cheer", label: "Cheer with the room", detail: "You lose your voice on a corner that goes wide.", minutes: 90, cost: 12, effects: { fun: 34, social: 22, energy: -12 }, tag: "party", emoji: "⚽" })] },
    { slots: ["morning"], heat: "quiet", emoji: "🪑", line: "Empty chairs and a replay nobody asked for.", verbs: [verb({ id: "hap-view-quiet", label: "Watch the replay alone", detail: "Quiet room. Good for thinking.", minutes: 40, cost: 5, effects: { fun: 12, energy: 4 }, emoji: "📺" })] },
  ],
  hub: [
    { slots: ["morning", "afternoon"], heat: "busy", emoji: "💻", line: "Laptops open. Somebody is pitching into a headset.", verbs: [verb({ id: "hap-hub-focus", label: "Deep work block", detail: "Headphones on. One real page of work.", minutes: 75, cost: 25, effects: { energy: -10 }, skill: "coding", emoji: "💻" }), verb({ id: "hap-hub-meet", label: "Coffee with a founder", detail: "They want intros. You want a story.", minutes: 40, cost: 18, effects: { social: 16, fun: 6 }, skill: "charm", emoji: "☕" })] },
    { slots: ["evening"], heat: "quiet", emoji: "🌙", line: "The coworking floor is thinning. Good wifi, soft lights.", verbs: [verb({ id: "hap-hub-late", label: "Late session", detail: "You finish what the day almost ate.", minutes: 60, cost: 15, effects: { energy: -8, fun: 4 }, skill: "coding", emoji: "🌙" })] },
  ],
  makola: [
    { slots: ["morning", "afternoon"], heat: "packed", emoji: "🧺", line: "The lanes are shoulder-to-shoulder. Tomatoes, lace, speakers.", verbs: [verb({ id: "hap-makola-bargain", label: "Bargain hard", detail: "You walk away twice. The price comes down.", minutes: 35, cost: 14, effects: { social: 12, fun: 10, hunger: -4 }, skill: "charm", emoji: "💬" }), verb({ id: "hap-makola-chop", label: "Chop kenkey at the stall", detail: "Pepper that clears the sinuses.", minutes: 25, cost: 12, effects: { hunger: 36, fun: 6 }, tag: "food", emoji: "🥣" })] },
  ],
  theatre: [
    { slots: ["evening", "night"], heat: "busy", emoji: "🎭", line: "The steps are a hangout. Inside, the house lights are warm.", verbs: [verb({ id: "hap-theatre-show", label: "Catch tonight's show", detail: "Accra on stage. You clap till your hands hurt.", minutes: 120, cost: 45, effects: { fun: 36, social: 12 }, skill: "music", emoji: "🎭" })] },
    { slots: ["afternoon"], heat: "quiet", emoji: "📸", line: "Couples on the steps. A photographer counts down.", verbs: [verb({ id: "hap-theatre-steps", label: "People-watch on the steps", detail: "Traffic, fashion, and somebody practising lines.", minutes: 30, effects: { fun: 14, energy: 4 }, emoji: "👀" })] },
  ],
  gym: [
    { slots: ["morning", "evening"], heat: "packed", emoji: "🏋️", line: "Afrobeats on the speakers. Somebody is filming a set.", verbs: [verb({ id: "hap-gym-class", label: "Join the class", detail: "Sweat, mirrors, and a playlist that does not quit.", minutes: 55, cost: 30, effects: { energy: -20, hygiene: -18, fun: 10 }, skill: "fitness", tag: "gym", emoji: "🏋️" })] },
    { slots: ["afternoon"], heat: "busy", emoji: "💪", line: "The floor is open. Trainers walking the room.", verbs: [verb({ id: "hap-gym-lift", label: "Lift with a spotter", detail: "One honest set. No phone in the rack.", minutes: 45, cost: 25, effects: { energy: -16, hygiene: -12, fun: 8 }, skill: "fitness", tag: "gym", emoji: "💪" })] },
  ],
  office: [
    { slots: ["morning", "afternoon"], heat: "busy", emoji: "🏢", line: "Badges flashing. The canteen queue is already arguing.", verbs: [verb({ id: "hap-office-shift", label: "Help on a desk", detail: "Someone needs a hand with forms. You earn a little.", minutes: 90, earn: 35, effects: { energy: -12, social: 6 }, skill: "hustle", emoji: "📝" })] },
  ],
  plus233: [
    { slots: ["evening", "night"], heat: "packed", emoji: "🎷", line: "Jazz is live. The grill is smoking. Tables are scarce.", verbs: [verb({ id: "hap-233-set", label: "Sit for the set", detail: "You listen more than you talk. That is the point.", minutes: 90, cost: 55, effects: { fun: 34, social: 14, energy: -6 }, tag: "party", skill: "music", emoji: "🎷" }), verb({ id: "hap-233-grill", label: "Order off the grill", detail: "Smoke, pepper, and a cold drink.", minutes: 40, cost: 40, effects: { hunger: 42, fun: 10 }, tag: "food", emoji: "🍖" })] },
  ],
  aburi: [
    { slots: ["morning", "afternoon"], heat: "busy", emoji: "🌳", line: "Cooler air. Families on the paths. The city feels far.", verbs: [verb({ id: "hap-aburi-walk", label: "Long garden walk", detail: "Tall trees, soft light, and a quiet that Accra rarely gives.", minutes: 80, cost: 15, effects: { fun: 22, energy: 8, social: 6 }, emoji: "🌳" })] },
  ],
  mall: [
    { slots: ["afternoon", "evening"], heat: "packed", emoji: "🛍️", line: "Air-con full. Cinema queue. Food court smelling like everything.", verbs: [verb({ id: "hap-mall-film", label: "Catch a film", detail: "Cold room, loud trailer, popcorn you did not need.", minutes: 130, cost: 50, effects: { fun: 28, energy: -4 }, emoji: "🎬" }), verb({ id: "hap-mall-food", label: "Food court round", detail: "You share three plates and still want dessert.", minutes: 45, cost: 35, effects: { hunger: 40, fun: 10, social: 8 }, tag: "food", emoji: "🍟" })] },
  ],
  beach: [
    { slots: ["afternoon", "evening"], heat: "packed", emoji: "🏖️", line: "Drums on the sand. Horses. A grill every few steps.", verbs: [verb({ id: "hap-beach-drums", label: "Dance to the drums", detail: "The circle opens. Somebody pulls you in.", minutes: 50, cost: 10, effects: { fun: 30, social: 18, energy: -10, hygiene: -8 }, tag: "party", emoji: "🥁" }), verb({ id: "hap-beach-swim", label: "Swim and dry off", detail: "Salt water, then the sun does the rest.", minutes: 40, cost: 0, effects: { fun: 22, energy: -6, hygiene: -6 }, emoji: "🌊" })] },
    { slots: ["morning"], heat: "quiet", emoji: "🌅", line: "Soft light. Joggers. The sea before the speakers wake up.", verbs: [verb({ id: "hap-beach-dawn", label: "Morning shoreline walk", detail: "Just you, the tide, and Accra waking up.", minutes: 35, effects: { fun: 16, energy: 10 }, emoji: "🌅" })] },
  ],
  korlebu: [
    { slots: ["morning", "afternoon", "evening"], heat: "busy", emoji: "🏥", line: "The waiting area is full. Somebody is praying under their breath.", verbs: [verb({ id: "hap-hospital-visit", label: "Sit with someone", detail: "You brought fruit and quiet company.", minutes: 50, effects: { social: 18, fun: -2, energy: -4 }, emoji: "🙏" })] },
  ],
  salon: [
    { slots: ["afternoon", "evening"], heat: "busy", emoji: "💇", line: "Dryers humming. Nollywood on the TV. A braid halfway done.", verbs: [verb({ id: "hap-salon-style", label: "Get your hair done", detail: "You leave looking intentional.", minutes: 90, cost: 60, effects: { fun: 18, hygiene: 20, social: 10 }, skill: "charm", emoji: "💇" })] },
  ],
  republic: [
    { slots: ["evening", "night"], heat: "packed", emoji: "🎺", line: "Highlife is live. Kokroko on the tables. The floor is moving.", verbs: [verb({ id: "hap-rep-dance", label: "Dance till the set ends", detail: "Aunties first. Then everybody.", minutes: 90, cost: 30, effects: { fun: 38, social: 22, energy: -14 }, tag: "party", skill: "music", emoji: "🎺" })] },
    { slots: ["afternoon"], heat: "busy", emoji: "🍽️", line: "Lunch crowd. The grill is already hot.", verbs: [verb({ id: "hap-rep-lunch", label: "Long lunch", detail: "Slow plates and Accra conversation.", minutes: 70, cost: 45, effects: { hunger: 44, fun: 14, social: 12 }, tag: "food", emoji: "🍽️" })] },
  ],
  church: [
    { slots: ["morning"], weekend: true, heat: "packed", emoji: "⛪", line: "Sunday best. Choir warming up. The pews are filling.", verbs: [verb({ id: "hap-church-service", label: "Join the service", detail: "You sing even if you do not know every word.", minutes: 100, effects: { fun: 18, social: 20, energy: 6 }, tag: "church", emoji: "⛪" })] },
    { slots: ["afternoon", "evening"], heat: "quiet", emoji: "🕯️", line: "A quiet pew. Soft light through the windows.", verbs: [verb({ id: "hap-church-pray", label: "Sit and breathe", detail: "The city can wait ten minutes.", minutes: 25, effects: { fun: 10, energy: 8 }, tag: "church", emoji: "🕯️" })] },
  ],
  mosque: [
    { slots: ["dawn", "evening"], heat: "busy", emoji: "🕌", line: "The call cuts through the traffic. Shoes off at the door.", verbs: [verb({ id: "hap-mosque-pray", label: "Join the prayer", detail: "Shoulders down. The street noise falls away.", minutes: 35, effects: { fun: 12, social: 14, energy: 6 }, emoji: "🕌" })] },
  ],
  joy: [
    { slots: ["morning", "afternoon"], heat: "busy", emoji: "🎙️", line: "On-air light is hot. Somebody is waiting with a story.", verbs: [verb({ id: "hap-joy-tour", label: "Studio tour", detail: "Glass, mics, and a producer who has heard every excuse.", minutes: 40, cost: 0, effects: { fun: 18, social: 8 }, skill: "music", emoji: "🎙️" })] },
  ],
  hotel: [
    { slots: ["evening", "night"], heat: "busy", emoji: "🏨", line: "Lobby soft. Guests checking in. The bar is starting.", verbs: [verb({ id: "hap-hotel-lobby", label: "Lobby hang", detail: "People-watch with a cold drink.", minutes: 40, cost: 35, effects: { fun: 16, social: 12 }, emoji: "🥂" }), verb({ id: "hap-hotel-pool", label: "Poolside hour", detail: "Sun, chlorine, and Accra soft in the distance.", minutes: 60, cost: 40, effects: { fun: 22, energy: 6, hygiene: 8 }, emoji: "🏊" })] },
  ],
  kotoka: [
    { slots: ["morning", "afternoon", "evening"], heat: "packed", emoji: "✈️", line: "Boarding calls. Trolleys. Somebody running for Gate B.", verbs: [verb({ id: "hap-kotoka-people", label: "People-watch departures", detail: "Hugs, delays, and Accra saying goodbye again.", minutes: 30, effects: { fun: 12, social: 8 }, emoji: "👀" }), verb({ id: "hap-kotoka-chop", label: "Airport chop", detail: "Overpriced, but the gate is far.", minutes: 25, cost: 40, effects: { hunger: 28, fun: 4 }, tag: "food", emoji: "🥪" })] },
  ],
  stadium: [
    { slots: ["afternoon", "evening"], heat: "packed", emoji: "🏟️", line: "Drums outside. Scarves. The pitch is green under the lights.", verbs: [verb({ id: "hap-stad-match", label: "Match day energy", detail: "You sing with strangers and mean it.", minutes: 110, cost: 25, effects: { fun: 40, social: 26, energy: -12 }, tag: "party", emoji: "🏟️" })] },
  ],
  legon: [
    { slots: ["morning", "afternoon"], weekday: true, heat: "busy", emoji: "🎓", line: "Lectures spilling out. Groups on the grass. Posters everywhere.", verbs: [verb({ id: "hap-legon-class", label: "Sit in on a talk", detail: "You learn one useful thing and meet two people.", minutes: 60, effects: { fun: 10, social: 12 }, skill: "coding", emoji: "📚" })] },
    { slots: ["evening"], heat: "busy", emoji: "🌙", line: "Night study lights. Food sellers by the gate.", verbs: [verb({ id: "hap-legon-night", label: "Campus night chop", detail: "Cheap, hot, and enough for the walk home.", minutes: 30, cost: 15, effects: { hunger: 34, social: 8 }, tag: "food", emoji: "🍛" })] },
  ],
  monsoon: [
    { slots: ["evening", "night"], heat: "packed", emoji: "🎉", line: "Oxford Street is loud. Speakers on every balcony.", verbs: [verb({ id: "hap-osu-jam", label: "Join the street jam", detail: "You lose your friends and find the night.", minutes: 100, cost: 35, effects: { fun: 42, social: 28, energy: -16, hygiene: -10 }, tag: "party", emoji: "🎉" })] },
  ],
  "osu-night-market": [
    { slots: ["evening", "night"], heat: "packed", emoji: "🔥", line: "Charcoal, kelewele, and a DJ by the gutter.", verbs: [verb({ id: "hap-night-market", label: "Eat down the lanes", detail: "Kelewele, guinea fowl, coconut, then kelewele again.", minutes: 70, cost: 28, effects: { hunger: 42, fun: 24, social: 16 }, tag: "food", emoji: "🔥" })] },
  ],
  bojo: [
    { slots: ["afternoon"], heat: "busy", emoji: "🏖️", line: "Day-trippers, coolers, and the beach road dust.", verbs: [verb({ id: "hap-bojo-day", label: "Beach day trip energy", detail: "Swim, grill, nap, repeat.", minutes: 120, cost: 40, effects: { fun: 34, social: 16, energy: -10, hygiene: -10 }, emoji: "🏖️" })] },
  ],
  still: [
    { slots: ["evening", "night"], heat: "busy", emoji: "🍸", line: "Soft lights. A playlist that knows Accra. Tables filling.", verbs: [verb({ id: "hap-still-drink", label: "Slow drink and talk", detail: "One round. Real conversation.", minutes: 50, cost: 45, effects: { fun: 22, social: 18 }, tag: "party", emoji: "🍸" })] },
  ],
  golf: [
    { slots: ["morning", "afternoon"], heat: "quiet", emoji: "⛳", line: "Green fairways. Quiet money. A cart in the distance.", verbs: [verb({ id: "hap-golf-round", label: "Walk nine holes", detail: "You pretend you belong. It almost works.", minutes: 120, cost: 80, effects: { fun: 20, social: 10, energy: -12 }, emoji: "⛳" })] },
  ],
  motors: [
    { slots: ["morning", "afternoon"], heat: "busy", emoji: "🚗", line: "Showroom polish. A salesman already smiling.", verbs: [verb({ id: "hap-motors-look", label: "Window-shop the cars", detail: "You sit in one. Just to see.", minutes: 30, effects: { fun: 14, social: 6 }, emoji: "🚗" })] },
  ],
  polls: [
    { slots: ["morning", "afternoon"], heat: "busy", emoji: "🗳️", line: "Queues, forms, and somebody arguing with a clipboard.", verbs: [verb({ id: "hap-polls-help", label: "Help with the forms", detail: "You clear a line. They thank you twice.", minutes: 45, effects: { social: 16, fun: 6 }, skill: "charm", emoji: "📋" })] },
  ],
  police: [
    { slots: ["morning", "afternoon", "evening"], heat: "busy", emoji: "🚓", line: "Fans, forms, and a bench that has heard everything.", verbs: [verb({ id: "hap-police-wait", label: "Wait with someone", detail: "Company makes the hours shorter.", minutes: 40, effects: { social: 14, fun: -2 }, emoji: "🪑" })] },
  ],
  court: [
    { slots: ["morning", "afternoon"], weekday: true, heat: "busy", emoji: "⚖️", line: "Suits, files, and quiet tension in the corridor.", verbs: [verb({ id: "hap-court-watch", label: "Watch a hearing", detail: "You learn how Accra argues in public.", minutes: 60, effects: { fun: 8, social: 6 }, emoji: "⚖️" })] },
  ],
};

const GROUP_FALLBACK: Record<string, Beat[]> = {
  hang: [
    { slots: ["evening", "night"], heat: "packed", emoji: "✨", line: "The room is filling. Somebody just walked in looking for friends.", verbs: [verb({ id: "hap-hang-meet", label: "Make a new friend", detail: "You start with Accra weather and end with a plan.", minutes: 25, effects: { social: 18, fun: 10 }, emoji: "🤝" }), verb({ id: "hap-hang-dance", label: "Join the floor", detail: "One song becomes three. Your feet decide.", minutes: 55, cost: 20, effects: { fun: 28, social: 16, energy: -10 }, tag: "party", emoji: "💃" })] },
    { slots: ["afternoon"], heat: "busy", emoji: "🧃", line: "Day crowd. Soft music. Good for sitting long.", verbs: [verb({ id: "hap-hang-linger", label: "Linger and people-watch", detail: "You stay longer than you meant to.", minutes: 35, cost: 12, effects: { fun: 14, social: 8 }, emoji: "👀" })] },
    { slots: ["morning"], heat: "busy", emoji: "☕", line: "Early faces. Somebody is already on their second cup.", verbs: [verb({ id: "hap-hang-morning", label: "Morning hang", detail: "Quiet chat before Accra gets loud.", minutes: 30, cost: 10, effects: { social: 12, fun: 8, energy: 4 }, emoji: "☕" })] },
  ],
  work: [
    { slots: ["morning", "afternoon"], weekday: true, heat: "busy", emoji: "💼", line: "The floor is working. Phones, badges, quiet hustle.", verbs: [verb({ id: "hap-work-hustle", label: "Put in an hour", detail: "You help, you learn, you leave a little sharper.", minutes: 60, earn: 20, effects: { energy: -8, social: 6 }, skill: "hustle", emoji: "💼" })] },
    { slots: ["evening"], heat: "busy", emoji: "🗂️", line: "Overtime lights. Somebody is still answering emails.", verbs: [verb({ id: "hap-work-late", label: "Stay for overtime", detail: "Extra cedis. Tired eyes.", minutes: 75, earn: 28, effects: { energy: -12, social: 4 }, skill: "hustle", emoji: "🗂️" })] },
  ],
  sea: [
    { slots: ["afternoon", "evening"], heat: "packed", emoji: "🌊", line: "Salt air. Coolers. Accra at the edge of the water.", verbs: [verb({ id: "hap-sea-chill", label: "Sit by the water", detail: "Waves do the talking.", minutes: 40, effects: { fun: 18, energy: 6 }, emoji: "🌊" }), verb({ id: "hap-sea-grill", label: "Grab from the grill", detail: "Smoke, pepper, cold drink.", minutes: 35, cost: 25, effects: { hunger: 34, fun: 10, social: 8 }, tag: "food", emoji: "🍖" })] },
    { slots: ["morning"], heat: "quiet", emoji: "🌅", line: "Soft tide. Joggers. The speakers are still asleep.", verbs: [verb({ id: "hap-sea-dawn", label: "Shoreline stretch", detail: "Salt and quiet before the city wakes.", minutes: 30, effects: { fun: 14, energy: 8 }, emoji: "🌅" })] },
  ],
  trip: [
    { slots: ["morning", "afternoon"], heat: "busy", emoji: "🚌", line: "Day-trip energy. Bags, snacks, somebody already late.", verbs: [verb({ id: "hap-trip-photo", label: "Take the scenic photo", detail: "You look like you meant to be here.", minutes: 20, effects: { fun: 12, social: 4 }, emoji: "📸" }), verb({ id: "hap-trip-snack", label: "Buy a roadside snack", detail: "Warm, messy, worth it.", minutes: 15, cost: 8, effects: { hunger: 18, fun: 6 }, tag: "food", emoji: "🌽" })] },
  ],
  civic: [
    { slots: ["morning", "afternoon"], weekday: true, heat: "busy", emoji: "🏛️", line: "Forms, fans, and Accra doing official business.", verbs: [verb({ id: "hap-civic-queue", label: "Survive the queue", detail: "You make a friend before your number is called.", minutes: 45, effects: { social: 12, fun: 4, energy: -4 }, emoji: "🎫" })] },
  ],
};

function matches(beat: Beat, slot: Slot, weekend: boolean) {
  if (!beat.slots.includes(slot)) return false;
  if (beat.weekend && !weekend) return false;
  if (beat.weekday && weekend) return false;
  return true;
}

export function happeningsAt(spotId: string, at = new Date()): Happening[] {
  if (spotId === "home") return [];
  const spot = spotById(spotId);
  const hour = accraHour(at);
  const slot = slotOf(hour);
  const weekend = at.getUTCDay() === 0 || at.getUTCDay() === 6;
  const pool = [...(BEATS[spotId] ?? []), ...(GROUP_FALLBACK[spot.group] ?? [])];
  const live = pool.filter((beat) => matches(beat, slot, weekend)).slice(0, 2);
  if (live.length) {
    return live.map((beat, index) => ({
      id: `${spotId}-${slot}-${index}`,
      emoji: beat.emoji,
      line: beat.line,
      heat: beat.heat,
      verbs: beat.verbs,
    }));
  }
  return [
    {
      id: `${spotId}-ambient`,
      emoji: spot.emoji,
      line: `${spot.name} is open. Accra is already moving through it.`,
      heat: "quiet",
      verbs: [
        verb({
          id: `hap-${spotId}-look`,
          label: "Take it in",
          detail: `Walk ${spot.name} slowly and see who is here.`,
          minutes: 20,
          effects: { fun: 10, social: 6 },
          emoji: spot.emoji,
        }),
      ],
    },
  ];
}

export function happeningVerbs(spotId: string, at = new Date()): Verb[] {
  return happeningsAt(spotId, at).flatMap((item) => item.verbs);
}

export function heatLabel(heat: Heat) {
  if (heat === "packed") return "Packed";
  if (heat === "busy") return "Busy";
  return "Quiet";
}
