import { lang, t } from "./i18n";
import { ACT2, ACT3, CHAPTERS, COMP_BY_ID, ENDINGS, ERLIK, ERLIK_SHADE, KARA_HAN, KASIM, KOK_BORU, ACT3_LV, OTUKEN_RENOWN, type Chapter, type CompId } from "./game/story";
import { COMP_QUESTS } from "./game/bonds";
import { BOYS, DUMRUL, SOKLU, TEPEGOZ } from "./game/korkut";
import { CODEX } from "./game/codex";
import { DAILY_POOL } from "./game/daily";
import { TITLE_CATS } from "./game/titles";
import type { Game } from "./game/game";

type Txt = string | ((g: Game) => string);
interface ChEn {
  title: string;
  goal: string;
  intro: string;
  scene?: Txt;
  choices?: string[];
  outro?: [string, Txt];
}

const fn = (x: Txt) => (typeof x === "string" ? () => x : x);

function chapters(list: Chapter[], en: ChEn[]): void {
  list.forEach((c, i) => {
    const e = en[i];
    if (!e) return;
    c.title = e.title;
    c.goal = e.goal;
    c.intro = e.intro;
    if (c.scene && e.scene) {
      c.scene.text = fn(e.scene);
      c.scene.choices.forEach((ch, k) => {
        if (e.choices?.[k]) ch.label = e.choices[k];
        const why = ch.why;
        if (why) ch.why = (g) => {
          const r = why(g);
          return r && t(r);
        };
      });
    }
    if (c.outro && e.outro) {
      c.outro.title = e.outro[0];
      c.outro.text = fn(e.outro[1]);
    }
    const req = c.req;
    if (req) c.req = (g) => {
      const r = req(g);
      return r && t(r);
    };
  });
}

const ACT1_EN: ChEn[] = [
  {
    title: "The Branded Past",
    goal: "Go to Bukhara and find Dervish Korkut.",
    intro: "As your master freed you, he looked at the black brand on your shoulder and whispered: <i>\"That brand is the mark of the Black Tamga. Whatever happened to your family, they did it. Dervish Korkut in Bukhara knows the secret of this mark.\"</i>",
    scene: (g) => `The white-bearded dervish set down his kopuz and studied the brand on your shoulder for a long time.<br><br><i>"So you are one of them too, ${g.s.hero.name}. The Black Tamga… Kara Han's slave hunters. They imprison the souls of captives in the old kurgans and wake the balbals. The more stones wake, the darker the steppe grows."</i><br><br><i>"If you want to follow your family's trail, first break a Kurgan Stone. The souls inside will show you the way. I will come with you; an old dervish's word is sometimes sharper than a sword."</i>`,
    choices: ["Take Korkut with you"],
  },
  {
    title: "The Waking Stones",
    goal: "Break a Kurgan Stone glowing with purple light on the map.",
    intro: "Korkut pointed to the stones flickering with purple light on the map. <i>\"Each one is a tomb, and in each tomb lies a captive's soul. Break one and let the souls speak.\"</i>",
    outro: ["Whispers of the souls", "As the stone cracked, a purple light rose from within. In the light you heard a little girl's voice: <i>\"Brother… Merv… chains…\"</i><br><br>Korkut closed his eyes: <i>\"Your sister Ayşe is alive. She is about to be sold at the slave market of Merv. But you must be strong enough to go there.\"</i>"],
  },
  {
    title: "The Slave Market of Merv",
    goal: "Reach level 5, go to Merv and rescue Ayşe.",
    intro: "Ayşe is in Merv. Kasım, the Black Tamga's merchant, hopes to sell her at a high price. Either your purse or your sword will have to speak.",
    scene: `In the middle of the slave market, among girls bound in chains, you saw her. Her hair cropped short, the same black brand on her shoulder… Ayşe!<br><br>The fat merchant Kasım grinned: <i>"This girl is precious, brave one. 400 gold. Or my men will put you in chains too."</i>`,
    choices: ["Pay 400 gold", "Break the chains (fight)"],
    outro: ["Ayşe", (g) => `Ayşe threw her arms around your neck and wept for a long time. <i>"I thought you were dead, ${g.s.hero.name}… They took our mother and little Ertuğrul to Kara Han's fortress. Only the gang leaders know where it is."</i><br><br>Ayşe is with you now. She will tend your wounds.`],
  },
  {
    title: "Trail of the Black Tamga",
    goal: "Destroy 3 bandit camps and reach 60 renown. One of the gang leaders will reveal the fortress.",
    intro: "Kara Han's fortress is hidden. But every bandit pays him tribute. Bring their camps down one by one and one of the gang leaders will surely talk.",
    outro: ["The fortress revealed", "A wounded gang leader fell at your feet: <i>\"I'll tell, I'll tell! The Black Tamga Fortress lies to the west, among the crags. Kara Han is there… preparing to wake the last stone with the captives' souls.\"</i><br><br>The fortress is marked on the map. Kara Han's army is very strong; grow your band and strengthen your gear."],
  },
  {
    title: "Kara Han",
    goal: "Attack the Black Tamga Fortress and defeat Kara Han.",
    intro: "The last chapter of the saga. Kara Han awaits you in his fortress. Bring a strong band; his army is large and he himself is a deadly warrior.",
  },
];

const ACT2_EN: ChEn[] = [
  {
    title: "Kara Han's Legacy",
    goal: "Reach level 15 and listen to Dervish Korkut in Bukhara.",
    intro: "Kara Han's fortress has fallen, but the Kurgan Stones still flicker with purple light. Korkut calls you to Bukhara: <i>\"It is not over, child. The real thing has not even begun.\"</i>",
    scene: (g) => `Korkut sat without touching the strings of his kopuz. His eyes were red.<br><br><i>"Kara Han was a servant, ${g.s.hero.name}. His master lies nine layers beneath the earth: <b>Erlik Han</b>. Every stone woken with the captives' souls loosened a link of Erlik's chain. Kara Han is dead, but the chain has slackened."</i><br><br><i>"To find Erlik's gate you must first go under the earth. In the deepest floors of the kurgans our ancestors carved the gate's location into the stones."</i>`,
    choices: ["I will descend into the depths"],
  },
  {
    title: "Nine Layers Down",
    goal: "Descend to floor 10 of the Kurgan Depths.",
    intro: "The ancestors' inscriptions lie deep below. Enter through a tomb door and push on to floor 10. Prepare your torches and soldiers well.",
    outro: ["The inscription in stone", "On the wall of the tenth floor, Göktürk letters glowing purple: <i>\"In the east, where the sky touches the mountain, Erlik's gate was sealed by seven beys and a shaman. If the beys scatter, the seal breaks.\"</i><br><br>Korkut whispered: <i>\"You must unite the beys again. By sword or by word.\"</i>"],
  },
  {
    title: "Unity of the Steppe",
    goal: "Make at least 2 beys your allies or vassals.",
    intro: "A single banner is not enough against Erlik. Gather the beys of the steppe under your flag with gifts, oaths or the sword.",
    outro: ["Banners together", (g) => `The beys gathered in your tent; bowls of kumis passed from hand to hand. <i>"Where ${g.s.hero.name} goes, we go."</i><br><br>That night a messenger came from Kashgar: old Umay Kam, who lives at the foot of the Tengri Mountains, wishes to see you.`],
  },
  {
    title: "The Shaman's Prophecy",
    goal: "Go to Kashgar and join Umay Kam's rite.",
    intro: "Umay Kam is the only one who can open Erlik's gate. But the rite demands a price: either souls or blood.",
    scene: `By the fire an old woman with bone bells and bird feathers beat her drum. Her eyes were milk-white.<br><br><i>"Erlik's gate opens only two ways, brave one. Either you return thirty captive souls to Umay, or you fight Erlik's shadow here, inside the fire."</i>`,
    choices: ["Return the souls (30 Soul Stones, 3 Parchments)", "Fight the shadow"],
  },
  {
    title: "Erlik Han",
    goal: "Go to Erlik's Gate and defeat the Lord of the Underworld.",
    intro: "The gate is open. Nine layers of darkness rise from beneath the earth. All the beys of the steppe, your blood brothers and companions stand behind you. The last page of the saga.",
  },
];

const ACT3_EN: ChEn[] = [
  {
    title: "Call of the Sky",
    goal: `Reach level ${ACT3_LV} and listen to Umay Kam in Kashgar.`,
    intro: "Erlik has sunk to the bottom of the earth, but the sky over the steppe still trembles. At night the stars shift; the eagles do not fly south. Another messenger came from Kashgar: Umay Kam awaits you.",
    scene: (g) => `This time Umay Kam had lit no fire. Her drum lay on her knees; she was gazing at the sky.<br><br><i>"You defeated Erlik, ${g.s.hero.name}. But when the underworld emptied, the sky shook too. Tengri's <b>Kut</b>, the right to rule over beys, broke from Ötüken and was flung into the sky. If the Kut stays masterless, the steppe will bathe in brothers' blood for a hundred years."</i><br><br><i>"The Kut descends upon the one who gathers the beys at a single table, whose name is spoken in the seven climes. First unite the beys in a kurultay. Then the Tengri Mountain will show you the way."</i>`,
    choices: ["I will go after the Kut"],
  },
  {
    title: "The Kut of Ötüken",
    goal: `Hold at least one kurultay in Samarkand and reach ${OTUKEN_RENOWN} renown.`,
    intro: "The Kut is won by word and by sword, but never alone. Call your allied and vassal beys to a kurultay in Samarkand; let your name spread to the four corners of the steppe.",
    outro: ["Light from the sky", (g) => `On the last night of the kurultay, as the beys left the tent, they saw a pillar of light in the eastern sky. Blue, icy, hanging without touching the ground.<br><br>Korkut pressed his kopuz to his chest: <i>"The Tengri Mountain… the Kut of Ötüken has descended there. At the summit Kök Börü waits, ${g.s.hero.name}. The wolf who led our ancestors out of Ergenekon. Only the one who passes him may take the Kut."</i>`],
  },
  {
    title: "Tengri Mountain",
    goal: "Climb to the summit of the Tengri Mountain and pass Kök Börü.",
    intro: "Beyond Kashgar, on the snow-covered summit, the sky touches the steppe. The Sky Wardens guard the path. The last climb of the saga.",
  },
  {
    title: "Master of the Kut",
    goal: "Choose the fate of the Kut at the summit of the Tengri Mountain.",
    intro: "Kök Börü bowed its head. At the summit, inside the ice, the Kut stands like a blue flame. The fate of the steppe is in your hands.",
  },
];

const ENDINGS_EN: Record<string, [string, string, (g: Game) => string]> = {
  kagan: ["Sky Khagan", "Crown yourself with the Kut: rule the steppe under one banner", (g) => `When you took the Kut into your palms, the blue flame burned above your head like a crown. As you came down from the summit, all the beys drove their banners into the ground at the foot of the Tengri Mountain.<br><br><i>"Sky Khagan ${g.s.hero.name}!"</i><br><br>From Samarkand to Kashgar the steppe is now a single table. Vassal beys bring their tribute to the Khagan's tent; no brother's blood is spilled. The child who once hauled stones at his master's hearth now sits on the throne of the sky.`],
  hurriyet: ["Chain Breaker", "Use the Kut's power to break every chain on the steppe", (g) => `You raised the Kut to the sky and made a wish: <b>let no child ever be chained again</b>.<br><br>That night, in every slave market from Merv to Constantinople, the locks opened on their own. The iron rings rusted and crumbled to dust.${g.hasComp("ayse") ? " Ayşe looked at the black brand on her shoulder: it was gone." : ""}<br><br>Villagers speak your name like a prayer by their hearths. Your banner became not a dynasty's flag but the flag of freedom.`],
  ozan: ["Korkut's Way", "Bury the Kut back in Ötüken, take up the kopuz and hit the road", (g) => `You did not take the Kut. With your own hands you buried it in the black earth of Ötüken, beside your ancestors. <i>"The Kut belongs to no one; it belongs to the steppe."</i><br><br>${g.hasComp("korkut") ? "Without wiping his tears, Korkut held out his kopuz to you" : "An old bard held out his kopuz to you"}: <i>"From now on, you will sing the saga."</i><br><br>Every state regards you as an arbiter; beys bring their quarrels to your tent. You did not rule, yet every word of yours was taken as a decree.`],
  noyan: ["Shadow of the Noyan", "Carry the Kut to Genghis's tent: rule the steppe in the Mongols' name", (g) => `You wrapped the Kut in felt and carried it east, to Genghis's golden tent. The Great Khan weighed the flame in his palm, then turned to you: <i>"Whoever brings the steppe's Kut becomes the steppe's noyan."</i><br><br>Now the taxes of ${g.s.mongol?.fallen.length ? `${g.s.mongol.fallen.length} burned cities` : "the whole Silk Road"} pass through your ledger. The beys bow before you, but in their eyes is fear, not loyalty.<br><br>Once you were a chained child. Now the key to the chains hangs from your belt.`],
  tengri: ["Defier of the Sky", "Seal the Kut into your own soul (50 Soul Stones)", (g) => `You hurled fifty captive souls into the Kut's flame and drew the flame into your own chest. The sky thundered, Kök Börü howled, Umay Kam's drum split.<br><br>You no longer age. Your sword carries the weight of the sky. But the beys fear you, and fear is not loyalty. Was a new Erlik born, or did the only one who defeated Erlik take the sky's place? ${g.s.hero.name}'s sword will write the answer.`],
  kardes: ["Hearth of Kin", "Forsake the Kut; with Ayşe build a hearth for those freed from chains", (g) => `You looked at the Kut's flame and shook your head. Taking Ayşe's hand beside you: <i>"This flame is not for me, but for whoever needs us."</i><br><br>You did not take the Kut; instead you raised a hearth outside Samarkand. Every child, woman and elder freed from chains found a place by that fire.${g.s.story.familyPath === "anne" ? " Your mother sat in the eldest seat of honour; no one feared her anymore." : ""}<br><br>Every night Ayşe circles the fire like an old slave still bandaging a wound. The bards do not call you Khagan; they call you <b>Keeper of the Hearth of Kin</b>, a name heavier than a crown in some ears.`],
  izsurucu: ["Trail Walker", "Forsake the Kut; with Ferhat follow the endless tracks of the steppe", (_g) => `You looked one last time at the Kut's blue flame, then turned your back. Ferhat was at your side, silent as always: <i>"The throne waits for you, and so does the steppe. You cannot choose both."</i><br><br>The two of you came down from the summit and never stayed long in any tent again. Finding lost caravans, hidden children, wandering clans became your saga.<br><br>You sat on no city's throne, yet every city's gate opened to you. The bards named you <b>Trail Walker</b>: wherever you went, something or someone lost kept following until it found you.`],
};

const COMP_EN: Record<CompId, [string, string, string]> = {
  ayse: ["Your sister · Healer", "The sister you rescued from the Black Tamga. She dresses wounds with the herbs your mother taught her.", "Heals 4% of your health every battle round."],
  korkut: ["Bard · Sage", "The old dervish of Bukhara. He sings ancient sagas on his kopuz and knows the secret of the Kurgan Stones.", "Experience gained +15%; your troops are 4% stronger."],
  ferhat: ["Tracker", "A silent hunter who learned to track on the steppe from wolves.", "Walking speed +12%; you see farther."],
  batu: ["Former captain", "An old captain expelled from the Khagan's army. He still gives the best sword drills.", "Your attack +10%, your troops' power +6%."],
  leyla: ["Merchant's daughter", "The sharpest haggler in the Tabriz bazaar. She knows every city's prices by heart.", "3% better market prices, +30 load."],
  lucia: ["Venetian merchant", "A bold woman from the Venetian colony in Constantinople. She builds bridges between East and West.", "4% better market prices, +40 load."],
};

type QEn = { title: string; offer: string; steps: { text: string; btn?: string; choices?: [string, string][] }[]; sworn: string };
const CQ_EN: Record<CompId, QEn> = {
  ayse: {
    title: "Our Mother's Grave",
    offer: "One night by the fire Ayşe spoke quietly: \"They buried our mother on the Bukhara road after the Black Tamga raid. We never even prayed at her grave. Will you come with me?\"",
    steps: [
      { text: "Bukhara's old gravedigger remembered: \"We buried those killed in that raid outside the city, beside the caravan road. But now a bey has claimed that field and pulled up the gravestones.\"", btn: "Go to the bey's mansion" },
      { text: "The bey used the stones to build his stable. Ayşe is trembling: \"What will we do?\"", choices: [
        ["Buy back the stones (300 gold)", "The bey took the money and the stones were set back in place. Ayşe wept for hours at her mother's grave, then smiled for the first time."],
        ["Bring the bey before the kurultay", "The töre was clear: no one touches a dead man's stone. The bey had to restore the stones and pay a fine."],
        ["Take the stones back by force", "You scattered the bey's men and raised the stones again. Ayşe is grateful but shaken by the violence."],
      ] },
    ],
    sworn: "Ayşe is no longer just your sister but half of your soul. Her healing is twice as strong.",
  },
  korkut: {
    title: "The Lost Kopuz",
    offer: "Dervish Korkut stroked the strings of his kopuz: \"This kopuz was my master's. His master's is in the hands of a treasure hunter in Merv. They say a saga sung on that kopuz makes even the dead weep.\"",
    steps: [
      { text: "In the Merv bazaar you found Tahir the treasure hunter. \"The kopuz? I sold it to a merchant in Nishapur. Let's hope he hasn't stripped its silver strings!\"", btn: "Set out for Nishapur" },
      { text: "The merchant has hung the kopuz on his wall and has no intention of selling. Korkut's eyes are full of tears.", choices: [
        ["Propose a song contest", "Korkut sang such a saga on his kopuz that the merchant wept and handed over the kopuz himself."],
        ["Buy the kopuz (450 gold)", "The merchant enjoyed the haggling but finally agreed. Korkut pressed the kopuz to his chest."],
      ] },
    ],
    sworn: "With his master's kopuz, Korkut's words now cut deeper. Experience and army bonus +50%.",
  },
  ferhat: {
    title: "The White Wolf",
    offer: "Ferhat crouched and pointed at a track: \"This is the White Wolf, leader of the pack I grew up with. Hunters are after it. I must save it.\"",
    steps: [
      { text: "In Kashgar you learned the hunters work for a merchant offering a hundred gold for a white wolf pelt. They have camped on the mountain road.", btn: "Track the hunters" },
      { text: "Before the camp: the wounded White Wolf in a cage, armed hunters all around.", choices: [
        ["Attack the camp", "You scattered the hunters. Ferhat opened the cage; the White Wolf looked at him, howled and ran for the mountains."],
        ["Pay the hunters more than the bounty (250 gold)", "The hunters took the money and left. Ferhat freed the wolf and quietly thanked you because no blood was spilled."],
      ] },
    ],
    sworn: "Ferhat's tracking now sees through the eyes of a wolf pack. Speed and sight +50%.",
  },
  batu: {
    title: "Stain on the Banner",
    offer: "Batu sharpened his sword: \"They threw me out of the army for cowardice. The one who really fled was my accuser, Togan Tarkan. Now he's captain of the guard in Rey. I want to clear my name.\"",
    steps: [
      { text: "In Rey an old soldier spoke: \"That day Togan ran, and Batu stayed behind carrying the wounded. But no one dares testify against Togan.\"", btn: "Confront Togan" },
      { text: "Togan Tarkan stands before you with his guards. Batu grits his teeth.", choices: [
        ["Demand single combat", "Batu floored Togan in front of everyone but spared his life. The soldiers speak his name with respect again."],
        ["Take the witnesses to the kurultay", "The witnesses spoke and Togan lost his rank. Batu sheathed his sword: \"Justice is sharper than a sword.\""],
      ] },
    ],
    sworn: "Batu's honor is restored; fighting beside him gives your soldiers heart. Attack and army bonus +50%.",
  },
  leyla: {
    title: "My Father's Debt",
    offer: "Leyla closed her ledger: \"Tabriz's moneylender took my father's shop over a debt. But that debt was written with a forged bond. The proof is with his partner in Konya.\"",
    steps: [
      { text: "In Konya her father's old partner brought out the real bond with trembling hands: \"I was afraid, I couldn't show it to anyone.\"", btn: "Take the bond to Tabriz" },
      { text: "The moneylender stands before the kadı, forged bond in hand, hired men at his side.", choices: [
        ["Present the bond to the kadı", "The kadı saw the forgery; the shop returned to Leyla and the moneylender went to the dungeon. Leyla stood behind her father's counter for the first time."],
        ["Scatter the moneylender's men", "The hired swords fled and the moneylender handed over the shop key himself. Leyla is pleased, but the bazaar has started gossiping."],
      ] },
    ],
    sworn: "Leyla's shop is now a warehouse for your caravans too. Trade and load bonus +50%.",
  },
  lucia: {
    title: "The Venetian Seal",
    offer: "Lucia showed a golden seal: \"This is the seal of the Venetian council. If I bring it to Constantinople, we will win the right to trade freely in the East. But Genoese spies are after me.\"",
    steps: [
      { text: "A Genoese spy was waiting for you at the Tabriz inn: \"Give us the seal and we'll pay double.\" Lucia shook her head.", btn: "Continue the journey" },
      { text: "Genoese guards blocked the road at the Galata gate.", choices: [
        ["Force the gate", "You scattered the guards and the seal reached the council. Lucia had you named an honorary merchant of Venice."],
        ["Bribe the Byzantine guards (300 gold)", "You slipped through a secret gate. Lucia delivered the seal and winked at you: \"You know the East well.\""],
      ] },
    ],
    sworn: "With the Venetian trade charter, Lucia's connections are now yours. Trade and load bonus +50%.",
  },
};

type BoyEn = { name: string; intro: string; steps: { place: string; text: string; btn: string; done: string; choices?: [string, string][] }[] };
const BOYS_EN: Record<string, BoyEn> = {
  dumrul: {
    name: "The Tale of Deli Dumrul",
    intro: "Dede Korkut tuned his kopuz: \"Deli Dumrul, son of Duha Koca, built a bridge over a dry stream. From those who crossed he took thirty-three coins, from those who didn't, forty, with a beating. One day he challenged Azrael himself...\"",
    steps: [
      { place: "Dry Stream Bridge", text: "A pointless bridge over a bone-dry stream. At its head stands a giant of a warrior, mace in hand: \"Thirty-three from those who cross, forty from those who don't!\"", btn: "Talk to Deli Dumrul", done: "", choices: [
        ["Pay the thirty-three coins", "Dumrul roared with laughter: \"A sensible man!\" Then his eyes darkened: \"Yesterday a warrior died; they say Azrael took his life. Who is this Azrael? I will find him and take his life!\""],
        ["Say \"A dry stream needs no bridge\"", "Dumrul's face reddened, then he laughed: \"You speak true, but my word is my word.\" His eyes drifted to the steppe: \"I will find that bird they call Azrael!\""],
      ] },
      { place: "Dumrul's Tent", text: "Dumrul lies on his bed; Azrael sits on his chest. His wife weeps at his side: \"Let my life be given for his!\"", btn: "Enter the tent", done: "", choices: [
        ["Pray to God together with Dumrul", "Dumrul cast off his pride and raised his hands to the sky. A voice came from above: \"Let husband and wife live a hundred and forty years!\" Dumrul embraced you and joined your banner with his riders."],
        ["Goad Dumrul against Azrael", "Dumrul leapt from his bed, seized his sword… and turned on you in his pride: \"Let me test you first!\""],
      ] },
      { place: "Dry Stream Bridge", text: "Deli Dumrul swings his mace at the head of the bridge. \"Come then, brave one, you before Azrael!\"", btn: "Fight Dumrul", done: "Dumrul was knocked down and his mace broken. Rising, he laughed: \"I lost to you before Azrael. Lesson learned.\" He tore down the bridge and gave the tolls to the poor." },
    ],
  },
  tepegoz: {
    name: "How Basat Killed Tepegöz",
    intro: "Dede Korkut lowered his voice: \"A curse fell upon the Oghuz: one-eyed Tepegöz, whom no arrow pierces and no sword cuts. Every day he demands two men and five hundred sheep. He ate Basat's brother too...\"",
    steps: [
      { place: "Oghuz Shepherds' Camp", text: "Shepherds trembling with fear. The granaries are empty; tribute goes to Tepegöz every day. \"Brave one, we will die of hunger. Feed us first, then we'll show you the way.\"", btn: "Hand out supplies", done: "The shepherds ate their fill. An old woman whispered: \"Tepegöz's strength is in his eye. Basat heated a spit in the fire and drove it into his eye… His cave is in the southern crags.\"" },
      { place: "Tepegöz's Cave", text: "Piles of bones, a giant hearth and a snore like thunder from within. Tepegöz's thralls keep watch at the cave mouth.", btn: "Enter the cave", done: "The red-hot spit plunged into Tepegöz's single eye. The giant bellowed and brought the cave down; Basat was avenged. The Oghuz camps breathed again." },
    ],
  },
  beyrek: {
    name: "The Tale of Bamsı Beyrek",
    intro: "Dede Korkut pressed his kopuz to his chest: \"On his wedding night Bamsı Beyrek was taken captive at Bayburt Fortress. He spent sixteen years in the dungeon. His betrothed, Banı Çiçek, still waits for him...\"",
    steps: [
      { place: "Bayburt Fortress", text: "A fortress buried in the rocks. In its dungeon an Oghuz warrior has rotted for sixteen years. On the ramparts, the infidel soldiers of the lord of Bayburt.", btn: "Storm the fortress", done: "The dungeon door was smashed. A man with a white beard stepped into the light: \"I am Bamsı Beyrek. Is my Banı Çiçek still waiting for me?\"" },
      { place: "Banı Çiçek's Wedding", text: "Drums beat in the camp: Banı Çiçek is being forced to marry Yalancıoğlu. Beyrek disguised himself as a bard and seized a kopuz. \"I need a bow,\" he says, \"and a friend's hand.\"", btn: "Join the wedding", done: "", choices: [
        ["Give Beyrek your own bow", "Beyrek drew the bow; the bow no one else could string sang in his hands. His arrow struck the ring and Banı Çiçek knew him. Yalancıoğlu fled and the wedding went to its rightful groom."],
        ["Expose Yalancıoğlu in the square", "You exposed Yalancıoğlu's lie before everyone. Beyrek won without drawing his sword; the Oghuz beys praised your respect for the töre."],
      ] },
    ],
  },
  kazan: {
    name: "The Plundering of Salur Kazan's House",
    intro: "Dede Korkut's voice trembled: \"While Kazan Han was out hunting, Şöklü Melik raided his tent and took his mother, his wife and his son Uruz captive. Kazan was left alone...\"",
    steps: [
      { place: "The Plundered Tent", text: "Burned tents, scattered herds. Salur Kazan sits alone with a shepherd: \"Brave one, friend or foe? My family is in Şöklü Melik's hands.\"", btn: "Offer Kazan your hand", done: "Kazan girded his sword: \"Then let us march together. Melik's fortress is in the eastern crags.\"" },
      { place: "Şöklü Melik's Fortress", text: "Oghuz captives lie chained in the courtyard. Şöklü Melik mocks from the rampart: \"I'll hang Kazan's son on a hook!\"", btn: "Storm the fortress", done: "Şöklü Melik's head rolled down from the rampart. Uruz, Kazan's mother and Lady Burla were freed from their chains." },
      { place: "Kazan's Tent", text: "The tent is raised again and the cauldrons boil. Kazan Han offers you half the spoils.", btn: "Join the feast", done: "", choices: [
        ["Share the spoils among the Oghuz beys", "\"The spoils belong to the beys,\" you said. Kazan Han rose: \"This warrior knows the töre better than I!\" All the Oghuz spoke your name."],
        ["Take your share", "Kazan Han sent half in chests. Your treasury filled."],
      ] },
    ],
  },
  bugac: {
    name: "The Tale of Dirsek Son of Bugaç",
    intro: "Dede Korkut stroked his kopuz: \"Dirse Han had a son, but by the töre he was nameless until fifteen. At an Oghuz feast a wild bull was loosed; the nameless youth faced it...\"",
    steps: [
      { place: "Oghuz Feast", text: "While drums beat, a bull breaks its rope and charges the square; children flee, warriors hang back. Dirse Han's nameless son clenches his fist and stands before the bull.", btn: "Rein in the bull", done: "The bull bellowed one last time and sank to its knees. Dede Korkut laid his hand on the youth's head: \"Your name shall be Bugaç, and the tale yours!\"" },
      { place: "Dirse Han's Tent", text: "A scheming concubine convinced Dirse Han that his son coveted the throne. Bugaç was struck from behind on the hunt and left among the rocks; Hızır's balm restored him. Now he stands before his father's tent.", btn: "Enter the tent", done: "", choices: [
        ["Forgive your father, embrace your mother", "His mother fainted when she knew him; Dirse Han fell weeping at his feet. Bugaç raised him: \"The töre does not demand blood; it asks for mercy.\""],
        ["Accuse the concubine before the töre", "The Oghuz beys heard her out; the lie was exposed. Bugaç won justice without a sword; Dirse Han clasped his son."],
      ] },
      { place: "Raided Camp", text: "Hearing Bugaç was wounded, enemy raiders struck the camp. Women and shepherds are helpless; Bugaç, not fully healed, girds his sword.", btn: "Defend the camp", done: "The raiders were scattered and the camp saved. Dede Korkut came and sang the tale: \"Henceforth Bugaç's name means valour among the Oghuz.\"" },
    ],
  },
  kanturali: {
    name: "The Tale of Kan Turalı, Son of Kanlı Koca",
    intro: "Dede Korkut narrowed his eyes: \"Kan Turalı wished to marry, but his father said: 'Whoever seeks Selcen Hatun, daughter of the lord of Trabzon, must first beat her three beasts.' Kan Turalı laughed: 'No hardship for me.'\"",
    steps: [
      { place: "Trabzon Lord's Square", text: "A lion, a bull and a camel are loosed at once. Selcen Hatun watches from the rampart; Kan Turalı grins and draws: \"Do you want help, or will you only watch?\"", btn: "Fight the beasts", done: "All three beasts lay in the dust. Selcen Hatun came down; her eyes lingered more on the warrior beside Kan Turalı. The lord kept his word; wedding preparations began." },
      { place: "The Road Home", text: "On the wedding road Kan Turalı fell asleep from exhaustion; the lord's regretful men laid an ambush. Selcen Hatun alone holds her bow.", btn: "Answer the ambush", done: "", choices: [
        ["Fight at Selcen's side", "Together you broke the ambush. When Kan Turalı woke he bowed to Selcen: \"So valour was enough for both of us.\""],
        ["Wake Kan Turalı and push him forward", "Kan Turalı woke and scattered the ambush with his own sword, saving his honour. He thanked Selcen from the heart."],
      ] },
    ],
  },
  yigenek: {
    name: "The Tale of Yigenek, Son of Kazılık Koca",
    intro: "Dede Korkut's voice grew heavy: \"Kazılık Koca lay sixteen years in Düzmürd's dungeon. His son Yigenek grew up, learned his father was captive, and took up his bow...\"",
    steps: [
      { place: "Oghuz Divan", text: "Yigenek has learned his father has rotted sixteen years in chains; the beys try to dissuade him: \"Düzmürd's fortress cannot be taken.\" Yigenek strikes his bow on the ground: \"If it cannot, I will take it.\"", btn: "Declare you will ride", done: "Seeing Yigenek's resolve, the Oghuz beys followed. Düzmürd's fortress stands in the eastern crags." },
      { place: "Düzmürd's Fortress", text: "On the ramparts Düzmürd; from the dungeon stairs come Kazılık Koca's chains. Düzmürd mocks: \"Sixteen years and no one came — will you?\"", btn: "Storm the fortress", done: "Düzmürd's head rolled from the rampart. When the dungeon door broke, Kazılık Koca saw his son's face for the first time in sixteen years." },
      { place: "Father's Hearth", text: "Kazılık Koca is free but wants his honour back: \"I bowed for sixteen years; give a feast so the Oghuz see I am still a Koca.\"", btn: "Prepare the feast", done: "", choices: [
        ["Hold a great feast", "At the feast Dede Korkut sang: \"The son who freed his father became the youngest hero of the Oghuz.\" Kazılık Koca held his head high."],
        ["Return home quietly", "No ceremony, but a heartfelt return. Kazılık Koca gripped his son's hand; no more words were needed."],
      ] },
    ],
  },
  segrek: {
    name: "The Tale of Segrek, Son of Uşun Koca",
    intro: "Dede Korkut nodded: \"Uşun Koca's son Egrek was captive at Alinca Fortress. His younger brother Segrek was never told; they tried to distract him with a wedding. On the wedding night he learned the truth...\"",
    steps: [
      { place: "Segrek's Wedding", text: "Drums beat, the bride waits, but Segrek's face is dark: someone whispered that his brother Egrek is captive at Alinca. \"Shall I wed while my brother wears chains?\"", btn: "Decide", done: "", choices: [
        ["Leave the wedding, ride at once", "Under shocked stares he leapt to the saddle. \"I'll finish the wedding when I return,\" he said, \"but first my brother.\""],
        ["Finish the wedding, ride at dawn", "He honoured the töre but his eyes stayed on the door. At first light he took his brother's road."],
      ] },
      { place: "Alinca Fortress", text: "From the ramparts come Egrek's chains. The lord of Alinca would jail Segrek who does not know his brother; but Segrek has drawn his sword.", btn: "Storm the fortress", done: "The lord of Alinca fell. When the dungeon broke the brothers embraced before they even knew each other; at last Egrek wept: \"Are you Segrek?\"" },
      { place: "The Road Home", text: "On the way home Egrek asks about the bride Segrek left. Segrek laughs: \"I freed you first; the töre was not broken.\"", btn: "Walk home", done: "When they reached the village the bride waited at the gate; this time the wedding was complete. Dede Korkut took his kopuz: \"When brother frees brother, neither töre nor wedding is left wanting.\"" },
    ],
  },
  uruz: {
    name: "The Captivity of Uruz, Son of Kazan Bey",
    intro: "Dede Korkut tautened the strings: \"Kazan Bey's son Uruz was taken on the hunt. His mother Burla Hatun keened, Kazan girded his sword… But true valour shows on the road to free him.\"",
    steps: [
      { place: "Hunt Road", text: "Uruz's hunters are scattered, swords in the dust. A shepherd whispers: \"Süfrek Tekfur took the boy to his fortress; Burla Hatun is keening.\"", btn: "Follow the trail", done: "You tracked him through the pass the shepherd named. Uruz's horseshoe still marks the earth." },
      { place: "Süfrek Fortress", text: "From the ramparts Süfrek Tekfur mocks: \"I'll sell Kazan's son for ransom!\" From within come Uruz's chains.", btn: "Storm the fortress", done: "Süfrek fell. In the dungeon you found Uruz; his face dusty but his eyes still brave: \"I thought my father would come… You came.\"" },
      { place: "Burla Hatun's Tent", text: "Burla Hatun clasped her son. Kazan Han offers you a cup of kumis: \"Whoever brings my son is my brother.\"", btn: "Accept", done: "", choices: [
        ["Take the honour, stay in the tent", "Kazan took you into his tent; the Oghuz beys spoke your name. Uruz gifted you his sword."],
        ["Quietly continue your road", "You declined Kazan's gift but kept his goodwill. Burla Hatun filled your travel bag."],
      ] },
    ],
  },
  emren: {
    name: "The Tale of Emren, Son of Begil",
    intro: "Dede Korkut lowered his voice: \"Begil broke his leg on the hunt; hearing this, the foe Yartıküç raided the camp. Begil's son Emren is still a youth, but he has taken up his father's bow...\"",
    steps: [
      { place: "Begil's Tent", text: "Begil looks at the bandage on his leg, ashamed: \"Valour is over, my son. Flee.\" Emren has hung his father's bow on his shoulder: \"Flight is not the töre.\"", btn: "Speak with Emren", done: "", choices: [
        ["Encourage Emren", "\"Whoever bears his father's bow bears his father's honour,\" you said. Emren nodded, eyes wet."],
        ["Leave balm and rations for Begil", "You dressed Begil's wound and left food. Emren looked grateful: \"We are not alone now.\""],
      ] },
      { place: "Yartıküç's Camp", text: "Hearing Begil was wounded, Yartıküç came to plunder. Emren draws his bow, standing alone against them.", btn: "Fight beside Emren", done: "Yartıküç fled; Emren raised his father's bow to the sky. Begil embraced his son: \"Your name is Emren now, and the tale yours.\"" },
      { place: "Victory Feast", text: "Dede Korkut came and laid his hand on Emren's head. The Oghuz beys await a feast.", btn: "Hear the feast", done: "The kopuz sang: \"When the father is wounded and the son girds a sword, the töre is born anew.\" Emren's name spread across the steppe." },
    ],
  },
  salur: {
    name: "The Captivity of Salur Kazan",
    intro: "Dede Korkut drew a deep breath: \"One night Salur Kazan went hunting alone and was taken. His son Uruz, mother Burla, all the Oghuz keened… Freeing him needs a true warrior.\"",
    steps: [
      { place: "Oghuz Divan", text: "Keening fills the tent. Uruz has drawn: \"Who will free my father?\" The beys look at each other; no one takes the first step.", btn: "Speak", done: "", choices: [
        ["Say \"I will go\"", "The beys stared. Uruz set his hand on your shoulder: \"Then the two of us.\""],
        ["Call the beys to swear an oath", "Everyone raised a cup of kumis. The Oghuz rode together; you at the front."],
      ] },
      { place: "Captive Fortress", text: "Kazan Han is in the dungeon, chained but upright. Guards at the door; from within Kazan's voice: \"If it is not my son, let no one come!\"", btn: "Storm the dungeon", done: "The doors broke. Kazan snapped his own chains and laughed when he saw you: \"So the Oghuz are still Oghuz.\"" },
      { place: "Return Feast", text: "Kazan is free; Burla Hatun has stopped weeping. Dede Korkut waits with his kopuz.", btn: "Hear the tale", done: "\"Whoever frees a captive bey shares the bey's throne,\" said Korkut. Kazan gifted you a banner." },
    ],
  },
  icdis: {
    name: "Inner Oghuz Against Outer Oghuz",
    intro: "Dede Korkut's voice grew heavy: \"Inner and Outer Oghuz were called to one feast; Outer Oghuz did not come, and rebelled. The blood between them reached even Bamsı Beyrek's death… This is the tale where brotherhood breaks.\"",
    steps: [
      { place: "Divided Feast", text: "In the Inner Oghuz tent the cauldron boils; Outer Oghuz banners stand on the horizon, unanswered. Beyrek would mediate, but swords are drawn.", btn: "Intervene", done: "", choices: [
        ["Offer an oath of peace", "Both sides listened. The oath hung in the air but no blood was spilled — yet."],
        ["Threaten Outer Oghuz into the road", "You raised your banner; Outer Oghuz beys drew back, but their grudge grew."],
      ] },
      { place: "Rebel Camp", text: "Outer Oghuz beys have gathered; some mark Beyrek as the target. \"Let Inner Oghuz's favourite fall,\" they say. War is inevitable.", btn: "Stop the brothers' blood", done: "The rebels scattered. Beyrek is wounded but standing; he set his hand on your shoulder: \"You defended brotherhood.\"" },
      { place: "Table Remade", text: "Inner and Outer Oghuz share one table again. Dede Korkut lowered his kopuz: this is the last tale.", btn: "Hear the last tale", done: "\"When brother strikes brother the töre weeps; whoever defends his brother is the greatest of the Oghuz,\" said Korkut. Twelve tales are complete; your name is sealed in the bitig." },
    ],
  },
};

const HINT_EN: Record<string, string> = {
  kut: "Found a beylik.", tore: "Pass judgment in your first töre case.", tamga: "Design your tamga in the bard's ledger.", ozan: "Have a song sung about you.",
  otag: "Pitch a nomad tent.", kurultay: "Attend a kurultay.", turan: "Use a feigned retreat in battle.", kabak: "Play a steppe game.", hanedan: "Become in-laws with a bey.",
  tengri: "Win your freedom.", umay: "Check the narrator settings.", erlik: "Reach Erlik's gate.", kam: "Choose the Kam path or meet a shaman.", kurgan: "Topple a Kurgan Stone.",
  tulpar: "Find a legendary horse.", korkut: "Listen to Dede Korkut at an inn.", samarkand: "See Samarkand.", bukhara: "See Bukhara.", kashgar: "See Kashgar.", merv: "See Merv.",
  nishapur: "See Nishapur.", rey: "See Rey.", tabriz: "See Tabriz.", konya: "See Konya.", constantinople: "See Constantinople.", ipekyolu: "Make your first trade profit.",
  kervansaray: "Build a caravanserai.", harami: "Defeat a bandit gang.", kus: "Acquire a hunting bird.", hazar: "Sail on the Caspian.",
};

/** Hikâye, yoldaş, Korkut boyları ve Bitig ipuçlarını İngilizceye çevirir. */
export function localizeStory(): void {
  if (lang() !== "en") return;
  chapters(CHAPTERS, ACT1_EN);
  chapters(ACT2, ACT2_EN);
  chapters(ACT3, ACT3_EN);
  for (const e of ENDINGS) {
    const x = ENDINGS_EN[e.id];
    if (!x) continue;
    [e.name, e.label, e.text] = x;
    const why = e.why;
    if (why) e.why = (g) => {
      const r = why(g);
      return r && t(r);
    };
  }
  KASIM.name = "Kasım the Slaver";
  KARA_HAN.name = "Kara Han";
  ERLIK.name = "Erlik Han";
  ERLIK_SHADE.name = "Erlik's Shadow";
  KOK_BORU.name = "Kök Börü";
  TEPEGOZ.name = "Tepegöz";
  DUMRUL.name = "Deli Dumrul";
  SOKLU.name = "Şöklü Melik";
  for (const [id, [role, desc, perk]] of Object.entries(COMP_EN)) Object.assign(COMP_BY_ID[id as CompId], { role, desc, perk });
  COMP_BY_ID.korkut.name = "Dervish Korkut";
  for (const [id, e] of Object.entries(CQ_EN)) {
    const q = COMP_QUESTS[id as CompId];
    q.title = e.title;
    q.offer = e.offer;
    q.sworn = e.sworn;
    q.steps.forEach((st, i) => {
      const s = e.steps[i];
      if (!s) return;
      st.text = s.text;
      if (s.btn) st.btn = s.btn;
      st.choices?.forEach((ch, k) => {
        if (s.choices?.[k]) [ch.label, ch.text] = s.choices[k];
      });
    });
  }
  for (const b of BOYS) {
    const e = BOYS_EN[b.id];
    if (!e) continue;
    b.name = e.name;
    b.intro = e.intro;
    b.steps.forEach((st, i) => {
      const s = e.steps[i];
      if (!s) return;
      st.place = s.place;
      st.text = s.text;
      st.btn = s.btn;
      st.done = s.done;
      st.choices?.forEach((ch, k) => {
        if (s.choices?.[k]) [ch.label, ch.text] = s.choices[k];
      });
    });
  }
  for (const c of CODEX) if (HINT_EN[c.id]) c.hint = HINT_EN[c.id];
  for (const d of DAILY_POOL) if (DAILY_EN[d.key]) d.what = DAILY_EN[d.key];
  for (const c of TITLE_CATS) {
    const e = TITLES_EN[c.id];
    if (!e) continue;
    c.what = e[0];
    c.tiers.forEach((tr, i) => (tr.name = e[1][i] ?? tr.name));
  }
}

const DAILY_EN: Record<string, string> = {
  floors: "floors descended in the Kurgan Depths", wins: "bandit gangs defeated", camps: "camps destroyed", kurgans: "Kurgan Stones toppled",
  crafted: "items crafted at the workshop", sides: "city quests completed", profit: "gold trade profit", rescued: "besieged caravans rescued",
  trains: "training sessions", contracts: "caravan consignments delivered",
};

const TITLES_EN: Record<string, [string, string[]]> = {
  wins: ["bandit gangs defeated", ["Road Warden", "Bandit Hunter", "Sword of the Steppe"]],
  camps: ["camps destroyed", ["Den Breaker", "Gang Crusher", "Bandits' Nightmare"]],
  kurgans: ["Kurgan Stones toppled", ["Soul Keeper", "Kurgan Breaker", "Voice of the Ancestors"]],
  profit: ["gold trade profit", ["Peddler", "Merchant", "Master of Merchants"]],
  crafted: ["items crafted", ["Apprentice", "Journeyman", "Master"]],
  sides: ["city quests completed", ["Helping Hand", "People's Champion", "Hero of Sagas"]],
  codex: ["legendary items discovered", ["Treasure Seeker", "Legend Hunter", "Saga Collector"]],
  robbed: ["caravans robbed", ["Highwayman", "Black Rider", "Scourge of the Steppe"]],
  rescued: ["caravans rescued", ["Caravan Friend", "Caravan Shield", "Guardian of the Roads"]],
  deep: ["floors descended", ["Tomb Wanderer", "Traveller of Darkness", "One Who Saw Erlik"]],
  slain: ["sworn enemies slain", ["Bloodtaker", "Avenger", "Chieftains' Nightmare"]],
  foals: ["foals raised", ["Groom", "Master of Horse", "Tulpar Breeder"]],
  conq: ["cities conquered", ["Wall Breaker", "Conqueror", "World Conqueror"]],
  beyq: ["beys' requests fulfilled", ["Man of His Word", "Friend of Beys", "Head of the Kurultay"]],
  lv: ["level", ["Alp", "Bey", "Han"]],
};
