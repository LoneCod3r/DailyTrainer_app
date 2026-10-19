import type { PracticeOverview } from '../types';

// The Practice hub's "About the practice" content, from the client's
// Fascial Maneuvers brochure (19.10.2026/Pictures/Fascial_Maneuvers_Kukov_BG.docx
// and Fascial_Maneuvers_A4_.docx).
//   • intro — the brochure's opening paragraph, both languages;
//   • sections — the brochure's five headed sections. Bulgarian is the full
//     text as supplied for the page (source of truth), with its paragraph
//     breaks; English is a faithful translation of it, reusing the client's
//     own English brochure wording wherever it says the same thing.
// Editorial changes, nothing else: the practice name follows the site's style
// in running text ("фасциални маневри" / "fascial maneuvers", not
// capitalised), and section titles are stored in normal case (the brochure
// sets them in capitals; the page restores that with CSS).
// The quote and the welcome note were set inside the client's artwork; they
// are page text now (the photo carries no text). The quote is the brochure's
// "About the practice" line, in both languages; the welcome note is the
// client's wording as approved for the page.
export const practiceOverview: PracticeOverview = {
  intro: {
    bg: 'Фасциалните маневри са нежна практика за движение, която съчетава осъзнато движение, дишане и телесна осъзнатост, за да ни помогне да възстановим по-дълбоката връзка със себе си и със своето тяло.',
    en: 'Fascial maneuvers are a gentle movement practice that combines mindful movement, breath, and body awareness to support a deeper connection with ourselves and our physical experience.',
  },
  sections: [
    {
      id: 'heart-of-the-practice',
      title: { bg: 'В основата на тази практика', en: 'At the Heart of This Practice' },
      paragraphs: [
        {
          bg: 'В основата на тази практика стои идеята да върнем тялото към усещането за безопасност – състояние, което ни е дълбоко познато още от най-ранните моменти на живота, когато сме били напълно подкрепени и обгърнати в защитената среда на майчината утроба.',
          en: 'At the heart of this practice is the idea of returning the body to a sense of safety – a state deeply familiar to us from the earliest moments of life, when we were completely supported and held within the protective environment of the mother’s womb.',
        },
      ],
    },
    {
      id: 'held-and-supported',
      title: { bg: 'Подкрепени и обгърнати', en: 'Held and Supported' },
      paragraphs: [
        {
          bg: 'Това преживяване на подкрепа и обгръщане от всички страни създава фундаментално усещане за сигурност, доверие и свързаност.',
          en: 'This experience of being supported and held from all sides creates a fundamental sense of security, trust and connection.',
        },
        {
          bg: 'Именно от това състояние на безопасност тялото може постепенно да освободи защитните си модели и да се свърже отново със своята естествена мъдрост.',
          en: 'It is from this state of safety that the body can gradually let go of its protective patterns and reconnect with its natural wisdom.',
        },
      ],
    },
    {
      id: 'safe-and-connected',
      title: { bg: 'Когато тялото се чувства в безопасност и свързано', en: 'When the Body Feels Safe and Connected' },
      paragraphs: [
        {
          bg: 'Когато тялото се чувства спокойно и свързано, движенията стават по-плавни, дишането – по-свободно, а естествените процеси на кръвообращение, движение на лимфата, хидратация и обмен в организма протичат по-хармонично.',
          en: 'When the body feels calm and connected, movement becomes more fluid, breathing becomes freer, and the body’s natural processes of circulation, lymphatic movement, hydration and exchange run more harmoniously.',
        },
      ],
    },
    {
      id: 'more-than-movement',
      title: { bg: 'Повече от физическо движение', en: 'More Than Physical Movement' },
      paragraphs: [
        {
          bg: 'Фасциалните маневри не са само физическа практика.',
          en: 'Fascial maneuvers are not only a physical practice.',
        },
        {
          bg: 'Те са покана да се свържем отново със себе си на различни нива – физическо, емоционално и умствено. Чрез присъствие, осъзнато дишане и любопитно изследване се учим да слушаме тялото, да разбираме неговите сигнали и постепенно да изграждаме отношения на уважение и доверие към самите себе си.',
          en: 'They are an invitation to reconnect with ourselves on different levels – physical, emotional and mental. Through presence, mindful breathing and curious exploration, we learn to listen to the body, understand its signals and gradually build a relationship of respect and trust with ourselves.',
        },
      ],
    },
    {
      id: 'journey-home',
      title: { bg: 'Пътешествие обратно към дома – към тялото', en: 'A Journey Back Home – to the Body' },
      paragraphs: [
        {
          bg: 'Тази практика е пътешествие обратно към дома – към собственото тяло. Тя ни напомня, че движението може да бъде път към по-дълбока осъзнатост, баланс, устойчивост и истинско благополучие.',
          en: 'This practice is a journey back home – to our own body. It reminds us that movement can be a path to deeper awareness, balance, resilience and true well-being.',
        },
      ],
    },
  ],
  quote: {
    bg: 'Движението може да бъде път към осъзнатост, баланс, устойчивост и по-дълбоко усещане за благополучие.',
    en: 'Movement can be a pathway to awareness, balance, resilience and a deeper sense of well-being.',
  },
  welcome: {
    title: { bg: 'Всички нива са добре дошли', en: 'All levels are welcome' },
    text: { bg: 'Няма нужда от опит.', en: 'No experience needed.' },
  },
};
