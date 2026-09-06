import type { StartHereSection } from '../types';

// Transcribed verbatim from KUKO_WAY_Fascial_Maneuvers_BG.docx ("Наръчник за
// начинаещи по фасциални маневри") and its approved English counterpart,
// KUKO_WAY_Fascial_Maneuvers_EN.docx. Do not paraphrase or invent — this is
// the approved bilingual source.
export const startHereSections: StartHereSection[] = [
  {
    id: 'intro',
    slug: 'vavedenie',
    order: 1,
    title: { bg: 'Въведение', en: 'Introduction' },
    paragraphs: [
      {
        bg: 'KUKO WAY развива философия за движение чрез фасциални маневри, насочена към подпомагане на естествените процеси на тялото. В този наръчник маневрите са комбинирани с прости и достъпни препоръки, които могат да бъдат включени в ежедневието. До края на наръчника ще имате нов поглед върху начина, по който работи тялото, ще разполагате с инструменти за подобряване на подвижността и функционалността и ще можете по-съзнателно да проследявате собственото си усещане и движение.',
        en: 'KUKO WAY develops a philosophy of movement through fascial maneuvers, aimed at supporting the body’s natural processes. In this guide, the maneuvers are combined with simple and accessible recommendations that can be incorporated into everyday life. By the end of the guide, you will have a new perspective on how the body works, practical tools for improving mobility and functionality, and a greater ability to consciously observe your own sensations and movement.',
      },
    ],
  },
  {
    id: 'what-is-kuko-way',
    slug: 'kakvo-e-kuko-way',
    order: 2,
    title: { bg: 'Какво е KUKO WAY?', en: 'What Is KUKO WAY?' },
    paragraphs: [
      {
        bg: 'KUKO WAY е подход и общност, посветени на това хората да развиват по-добро разбиране за собственото си тяло и да поемат по-активна роля в грижата за себе си. Основната идея е, че съвременният начин на живот често поставя организма под постоянно натоварване — чрез липса на движение, продължително седене, стрес, среда, хранителни навици и недостатъчно време за възстановяване. Когато тялото е под продължително напрежение, естествената му функционалност може да бъде нарушена.',
        en: 'KUKO WAY is an approach and community dedicated to helping people develop a better understanding of their own bodies and take a more active role in self-care. The core idea is that modern life often places the body under constant strain — through lack of movement, prolonged sitting, stress, environmental factors, eating habits, and insufficient time for recovery. When the body is under prolonged tension, its natural functionality may become disrupted.',
      },
      {
        bg: 'В първоизточника е описан опитът на Garry Lineham, който работи в присъствена клиника с широк екип от специалисти — лекари, акупунктуристи, хиропрактици, терапевти, специалисти по фасция, функционална медицина, масаж и други направления. Клиниката обслужва хора от различни среди, включително професионални атлети и публични личности. Екипът често успява да осигури краткосрочно облекчение, но много от клиентите се връщат със същите устойчиви проблеми.',
        en: 'The original source describes the experience of Garry Lineham, who works in an in-person clinic with a broad team of specialists — doctors, acupuncturists, chiropractors, therapists, fascia specialists, functional medicine practitioners, massage therapists, and professionals from other fields. The clinic serves people from a wide range of backgrounds, including professional athletes and public figures. The team is often able to provide short-term relief, but many clients return with the same persistent problems.',
      },
      {
        bg: 'Самият Garry получава чести мануални и хиропрактични корекции, но ефектът не се задържа дълго. Когато остава за няколко дни без обичайната подкрепа на екипа, болката му отново се усилва. Това го кара да преосмисли модела, в който човек разчита постоянно на външна намеса, вместо да развива собствено разбиране и ежедневни практики.',
        en: 'Garry himself receives frequent manual and chiropractic adjustments, but the effects do not last long. When he goes for several days without the usual support of the team, his pain increases again. This leads him to reconsider a model in which a person relies continuously on external intervention rather than developing their own understanding and daily practices.',
      },
      {
        bg: 'Макар клиниката да е успешна, Garry стига до извода, че краткото „поправяне“ на симптомите не е достатъчно, ако човек продължава със същите навици и натоварвания. В крайна сметка той затваря клиниката и започва да търси по-достъпен начин хората да бъдат обучавани да разбират телата си.',
        en: 'Although the clinic is successful, Garry comes to the conclusion that briefly “fixing” symptoms is not enough if a person continues with the same habits and physical demands. Eventually, he closes the clinic and begins looking for a more accessible way to teach people to understand their own bodies.',
      },
      {
        bg: 'По-късно в Канада Garry се свързва с Cynthia Leavoy и Jason van Blerk. Чрез наблюдение, експериментиране и интердисциплинарни знания те развиват фасциалните маневри като цялостна практика за движение. Подходът комбинира идеи от различни форми на работа с тялото, вместо да се ограничава до една система.',
        en: 'Later, in Canada, Garry connects with Cynthia Leavoy and Jason van Blerk. Through observation, experimentation, and interdisciplinary knowledge, they develop fascial maneuvers as a comprehensive movement practice. The approach combines ideas from different forms of bodywork rather than being limited to a single system.',
      },
      {
        bg: 'Фасциалните маневри продължават да се развиват с натрупването на опит и ново разбиране за фасцията. Основната философия е тялото да се изследва с отворено съзнание, чрез лична практика, наблюдение и постоянно адаптиране. KUKO WAY използва този принцип като основа за собствена практика, насочена към по-добра връзка с тялото, движението и възстановяването.',
        en: 'Fascial maneuvers continue to evolve as experience accumulates and understanding of fascia develops. The underlying philosophy is to explore the body with an open mind, through personal practice, observation, and continuous adaptation. KUKO WAY uses this principle as the foundation for its own practice, focused on developing a better connection with the body, movement, and recovery.',
      },
    ],
  },
  {
    id: 'our-beliefs',
    slug: 'nashite-ubezhdeniya',
    order: 3,
    title: { bg: 'Нашите убеждения', en: 'Our Beliefs' },
    paragraphs: [
      {
        bg: 'Човешкото тяло е създадено с естествена способност да се възстановява.',
        en: 'The human body is designed with a natural ability to recover.',
      },
      {
        bg: 'Осъзнаването на несъзнателните поведения е първата стъпка към цялостна житейска промяна.',
        en: 'Becoming aware of unconscious behaviors is the first step toward meaningful change in life.',
      },
      {
        bg: 'Убежденията, намерението и възприятието са сред най-влиятелните фактори върху начина, по който преживяваме тялото си.',
        en: 'Beliefs, intention, and perception are among the most influential factors affecting how we experience our bodies.',
      },
      {
        bg: 'Според философията на оригиналния материал, задържаните емоции могат да бъдат важен фактор за дисфункция и напрежение.',
        en: 'According to the philosophy of the original material, held emotions can be an important factor in dysfunction and tension.',
      },
      { bg: 'Силата да променяте тялото и живота си принадлежи на вас.', en: 'The power to change your body and your life belongs to you.' },
      {
        bg: 'Фасциалните маневри са предназначени да подпомагат естествените процеси на адаптация, движение и възстановяване.',
        en: 'Fascial maneuvers are intended to support the body’s natural processes of adaptation, movement, and recovery.',
      },
      {
        bg: 'Телата се адаптират към средата си. Колкото по-екстремни са условията, толкова по-изразени могат да бъдат адаптациите.',
        en: 'Bodies adapt to their environment. The more extreme the conditions, the more pronounced these adaptations may become.',
      },
      {
        bg: 'Диагнозата може да бъде полезен ориентир, но не описва цялостно човека. Прекаленото идентифициране със симптомите понякога може да ограничи начина, по който човек възприема възможностите си за промяна и възстановяване.',
        en: 'A diagnosis can be a useful point of reference, but it does not fully describe a person. Over-identifying with symptoms can sometimes limit the way a person perceives their possibilities for change and recovery.',
      },
    ],
  },
  {
    id: 'evolution-of-training',
    slug: 'razvitie-na-obuchenieto',
    order: 4,
    title: { bg: 'Развитие на обучението по фасциални маневри', en: 'Development of Fascial Maneuver Training' },
    paragraphs: [
      {
        bg: 'Първо ще представим и обясним основите на фасциалните маневри. Разбирането на принципа зад всяко движение е важно, особено ако по-късно искате да адаптирате практиката към собственото си тяло. След като усвоите философията, можете да я прилагате по индивидуален начин.',
        en: 'First, we will introduce and explain the foundations of fascial maneuvers. Understanding the principle behind each movement is important, especially if you later want to adapt the practice to your own body. Once you understand the philosophy, you can apply it in an individual way.',
      },
      {
        bg: 'След това ще преминем през всяка маневра. Първите три — Плъзгане по небцето, Пълно усукване и Антигравитация — съставят приблизително 15-минутен рестарт за напрежение. Целта им е да помогнат на тялото да излезе от режим на повишена бдителност и да го подготвят за последващо движение и отпускане.',
        en: 'We will then move through each maneuver. The first three — Palate Swipe, Totally Twisted, and Antigravity — form an approximately 15-minute reset for tension. Their purpose is to help the body move out of a state of heightened alertness and prepare it for subsequent movement and relaxation.',
      },
      {
        bg: 'Останалите маневри в наръчника оформят практика за цялото тяло. След завършването ѝ се работи последователно и с трите фасциални зони.',
        en: 'The remaining maneuvers in the guide form a full-body practice. After completing it, the three fascial zones are worked with sequentially.',
      },
      {
        bg: 'Според оригиналния подход, най-добрите резултати се получават при редовна ежедневна практика. След този наръчник можете постепенно да преминавате към по-дълги и структурирани програми, като запазвате основния принцип — наблюдение, постепенност и адаптиране към собственото тяло.',
        en: 'According to the original approach, the best results are achieved through regular daily practice. After this guide, you can gradually move toward longer and more structured programs while maintaining the fundamental principles — observation, gradual progression, and adaptation to your own body.',
      },
    ],
  },
  {
    id: 'what-is-fascia',
    slug: 'kakvo-e-fastsiya',
    order: 5,
    title: { bg: 'Какво е фасция?', en: 'What Is Fascia?' },
    paragraphs: [
      {
        bg: 'Определението за фасция продължава да се развива с натрупването на знания. В най-общ смисъл фасцията представлява многопластова мрежа от съединителна тъкан, която обгръща, свързва и организира структури в цялото тяло. Тя участва в предаването на механично напрежение, движението и взаимодействието между различни тъкани.',
        en: 'The definition of fascia continues to evolve as knowledge increases. In the broadest sense, fascia is a multilayered network of connective tissue that surrounds, connects, and organizes structures throughout the body. It participates in the transmission of mechanical tension, movement, and interaction between different tissues.',
      },
      {
        bg: 'В оригиналната философия фасцията се разглежда и като структура, която отразява преживяванията, навиците и емоционалното състояние. Тя реагира на вътрешни и външни стимули и чрез нервната система участва в начина, по който мозъкът получава информация за положението и състоянието на тялото. Триизмерната ѝ структура наподобява мрежа и се простира навсякъде в организма.',
        en: 'In the original philosophy, fascia is also viewed as a structure that reflects experiences, habits, and emotional states. It responds to internal and external stimuli and, through the nervous system, participates in the way the brain receives information about the position and condition of the body. Its three-dimensional structure resembles a network and extends throughout the body.',
      },
      {
        bg: 'Макар много аспекти на фасцията все още да се изследват, практическата работа с движение, дишане и натиск може да помогне на човек да усеща по-добре тялото си и да подобрява свободата на движение.',
        en: 'Although many aspects of fascia are still being studied, practical work with movement, breathing, and pressure may help a person become more aware of their body and improve freedom of movement.',
      },
    ],
  },
  {
    id: 'what-is-fascial-maneuver',
    slug: 'kakvo-e-fastsialna-manevra',
    order: 6,
    title: { bg: 'Какво е фасциална маневра?', en: 'What Is a Fascial Maneuver?' },
    paragraphs: [
      {
        bg: 'Фасциалната маневра комбинира намерение, движение и дишане с цел да се намали усещането за напрежение и ограничение в движението. При последователна практика маневрите са предназначени да подпомогнат мобилността, телесната осъзнатост и по-ефективните двигателни модели.',
        en: 'A fascial maneuver combines intention, movement, and breathing with the aim of reducing the sensation of tension and restriction in movement. With consistent practice, the maneuvers are intended to support mobility, body awareness, and more efficient movement patterns.',
      },
      {
        bg: 'Редовното изпълнение на маневрите е само една част от цялостния подход. Храненето, сънят, здравословните взаимоотношения, средата, движението през деня и възстановяването също имат значение за начина, по който се чувстваме и функционираме.',
        en: 'Regularly performing the maneuvers is only one part of the overall approach. Nutrition, sleep, healthy relationships, environment, movement throughout the day, and recovery also play a role in how we feel and function.',
      },
    ],
  },
  {
    id: 'body-zones',
    slug: 'zoni-na-tyaloto',
    order: 7,
    title: { bg: 'Зони на тялото', en: 'Body Zones' },
    paragraphs: [
      {
        bg: 'В практиката тялото условно се разделя на три зони, които участват във фасциалните маневри:',
        en: 'In the practice, the body is conditionally divided into three zones that participate in fascial maneuvers:',
      },
      { bg: 'Зона 1 — глава и врат.', en: 'Zone 1 — head and neck.' },
      { bg: 'Зона 2 — рамене, торс и таз.', en: 'Zone 2 — shoulders, torso, and pelvis.' },
      { bg: 'Зона 3 — крака.', en: 'Zone 3 — legs.' },
      {
        bg: 'В идеалния случай натискът и движението се разпределят сравнително равномерно между трите зони. На практика много хора имат различни нива на напрежение и ограничение в отделните части на тялото. Един от основните инструменти за работа между зоните е контра-ротацията.',
        en: 'Ideally, pressure and movement are distributed relatively evenly among the three zones. In practice, many people have different levels of tension and restriction in different parts of the body. One of the primary tools for working between the zones is counter-rotation.',
      },
    ],
  },
  {
    id: 'fascia-fundamentals',
    slug: 'osnovi-na-fastsiyata',
    order: 8,
    title: { bg: 'Основи на фасцията', en: 'Foundations of Fascia' },
    subsections: [
      {
        title: { bg: 'Намерение', en: 'Intention' },
        paragraphs: [
          {
            bg: 'Поставянето на намерение помага на различните системи на тялото да се организират около конкретна задача. Ясното намерение често е по-ефективно от механичното изпълнение на движение без внимание.',
            en: 'Setting an intention helps different systems of the body organize around a specific task. A clear intention is often more effective than mechanically performing a movement without attention.',
          },
          {
            bg: 'Това се свързва с ретикуларната активираща система (RAS) — мозъчна система, която участва във филтрирането на огромното количество информация, което получаваме. Когато насочим вниманието си към конкретно усещане или цел, започваме по-лесно да забелязваме сигнали, свързани с нея.',
            en: 'This is connected to the reticular activating system (RAS) — a brain system involved in filtering the enormous amount of information we receive. When we direct our attention toward a specific sensation or goal, we begin to notice signals related to it more easily.',
          },
          {
            bg: 'Например, ако искате да отпуснете определен мускул преди маневра, фокусирайте вниманието си върху усещането в тази зона и върху качеството на движението. Това създава по-съзнателна връзка между внимание, тяло и движение.',
            en: 'For example, if you want to relax a particular muscle before a maneuver, focus your attention on the sensation in that area and on the quality of the movement. This creates a more conscious connection between attention, the body, and movement.',
          },
        ],
      },
      {
        title: { bg: 'Фиксиране и заключване', en: 'Fixing and Locking' },
        paragraphs: [
          {
            bg: 'Фиксирането на кожата в различни точки на тялото насочва вниманието и механичното напрежение към конкретни зони. „Фиксиране“ означава леко усукване или разтягане на кожата, а „заключване“ — стабилен захват, който не позволява тя да се плъзга свободно. Почти всяка маневра започва с такъв контакт.',
            en: 'Fixing the skin at different points on the body directs attention and mechanical tension toward specific areas. “Fixing” means gently twisting or stretching the skin, while “locking” means maintaining a stable grip that prevents it from sliding freely. Almost every maneuver begins with this type of contact.',
          },
        ],
      },
      {
        title: { bg: 'Контра-ротация', en: 'Counter-Rotation' },
        paragraphs: [
          {
            bg: 'Контра-ротацията е естествен двигателен модел. Когато една част от тялото се завърта в една посока, друга често се завърта в противоположна, за да се запази балансът.',
            en: 'Counter-rotation is a natural movement pattern. When one part of the body rotates in one direction, another part often rotates in the opposite direction to maintain balance.',
          },
          {
            bg: 'Фасцията има спираловидни връзки през цялото тяло. Когато стоим неподвижно, контра-ротацията е фина, но при ходене се вижда ясно: едната ръка се движи напред, другата назад; торсът и тазът се завъртат в противоположни посоки; единият крак ротира навътре, а другият навън. Всички тези движения заедно разпределят натоварването.',
            en: 'Fascia has spiral connections throughout the body. When we stand still, counter-rotation is subtle, but during walking it becomes clear: one arm moves forward while the other moves backward; the torso and pelvis rotate in opposite directions; one leg rotates inward while the other rotates outward. All of these movements together distribute the load.',
          },
          {
            bg: 'Фасциалните маневри използват контра-ротация, за да възстановят по-свободен двигателен поток. В комбинация с вътрешното налягане, създавано от дишането, ефектът може да се сравни с изстискване на кърпа — напрежението се разпределя и тъканите получават различен механичен стимул.',
            en: 'Fascial maneuvers use counter-rotation to restore a freer flow of movement. Combined with the internal pressure created by breathing, the effect can be compared to wringing out a towel — tension is redistributed and the tissues receive a different mechanical stimulus.',
          },
        ],
      },
      {
        title: { bg: 'Движете се бавно', en: 'Move Slowly' },
        paragraphs: [
          {
            bg: 'Бавните и контролирани движения са важни. Внезапното движение може да бъде възприето от нервната система като заплаха, което води до автоматично стягане на мускулите с цел стабилизация и защита.',
            en: 'Slow and controlled movements are important. Sudden movement may be perceived by the nervous system as a threat, leading to automatic tightening of the muscles for stabilization and protection.',
          },
          {
            bg: 'Когато изпълнявате маневрите, движете се бавно и изследвайте различните ъгли около зоната, която сте фиксирали, без да насилвате обхвата.',
            en: 'When performing the maneuvers, move slowly and explore different angles around the area you have fixed, without forcing your range of motion.',
          },
        ],
      },
      {
        title: { bg: 'Дишане', en: 'Breathing' },
        paragraphs: [
          {
            bg: 'Дишането е ключова част от практиката, защото създава движение и промяна във вътрешното налягане. С намерение и конкретни дихателни модели можем да насочим усещането към по-компресирани области и да добавим допълнително измерение към разтягането.',
            en: 'Breathing is a key part of the practice because it creates movement and changes in internal pressure. With intention and specific breathing patterns, we can direct sensation toward more compressed areas and add another dimension to stretching.',
          },
          {
            bg: 'В оригиналната система дишането през носа се използва по-често за насочване на вниманието към горната половина на тялото — гръден кош, рамене, ръце, врат и глава. Дишането през устата се използва повече за работа с долната част — диафрагма, корем и тазово дъно.',
            en: 'In the original system, breathing through the nose is used more often to direct attention toward the upper half of the body — chest, shoulders, arms, neck, and head. Breathing through the mouth is used more for working with the lower part — diaphragm, abdomen, and pelvic floor.',
          },
          {
            bg: 'По време на маневрите ще се редуват дишане през носа, през устата и т.нар. етапно дишане. Всеки модел има конкретна цел и минимален брой повторения. Ако вече използвате други безопасни дихателни практики, можете внимателно да експериментирате и да наблюдавате как реагира тялото ви.',
            en: 'During the maneuvers, nasal breathing, mouth breathing, and so-called step breathing will be alternated. Each pattern has a specific purpose and a minimum number of repetitions. If you already use other safe breathing practices, you can carefully experiment and observe how your body responds.',
          },
        ],
      },
      {
        title: { bg: 'Ходене', en: 'Walking' },
        paragraphs: [
          {
            bg: 'След всяка маневра се препоръчва кратка разходка. Ходенето помага на нервната система да интегрира новия обхват на движение, промените в натоварването и усещането за позиция на тялото.',
            en: 'After each maneuver, a short walk is recommended. Walking helps the nervous system integrate the new range of movement, changes in loading, and the sensation of body position.',
          },
          {
            bg: 'След травма често инстинктивно се опитваме да „се разходим“, докато тялото намери нов начин да разпредели натоварването. По подобен начин краткото ходене след маневра може да помогне новото усещане да стане част от естественото движение.',
            en: 'After an injury, we often instinctively try to “walk it off” while the body finds a new way to distribute the load. Similarly, a short walk after a maneuver may help the new sensation become part of natural movement.',
          },
        ],
      },
      {
        title: { bg: 'Наблюдение', en: 'Observation' },
        paragraphs: [
          {
            bg: 'Важно е да наблюдавате промените след всяка маневра. Това подпомага интеграцията и ви учи да различавате какво работи добре за вашето тяло.',
            en: 'It is important to observe the changes after each maneuver. This supports integration and teaches you to distinguish what works well for your body.',
          },
          {
            bg: 'След движение се запитайте: Чувствам ли се по-свободен или по-стегнат? Имам ли повече енергия или усещам умора? Променило ли се е дишането ми? Чувствам ли повече стабилност? Променило ли се е възприятието ми за пространството и тялото?',
            en: 'After moving, ask yourself: Do I feel freer or more tense? Do I have more energy, or do I feel tired? Has my breathing changed? Do I feel more stable? Has my perception of space and my body changed?',
          },
          {
            bg: 'Разпознаването на тези промени развива телесната осъзнатост и помага да адаптирате практиката към собствените си нужди.',
            en: 'Recognizing these changes develops body awareness and helps you adapt the practice to your own needs.',
          },
        ],
      },
    ],
  },
  {
    id: 'body-fundamentals',
    slug: 'osnovi-na-tyaloto',
    order: 9,
    title: { bg: 'Основи на тялото', en: 'Foundations of the Body' },
    subsections: [
      {
        title: { bg: 'Възприятие', en: 'Perception' },
        paragraphs: [
          {
            bg: 'Възприятието е един от най-силните фактори, влияещи върху преживяването ни. Начинът, по който възприемаме дадена ситуация, променя мислите и емоциите ни и може да предизвика различни физиологични реакции.',
            en: 'Perception is one of the strongest factors influencing our experience. The way we perceive a situation changes our thoughts and emotions and can trigger different physiological responses.',
          },
          {
            bg: 'Ако двама души видят змия и единият я харесва, а другият се страхува от нея, телата им могат да реагират коренно различно. Единият може да изпита любопитство и удоволствие, а другият — стрес, стягане и ускорен пулс.',
            en: 'If two people see a snake and one likes it while the other is afraid of it, their bodies may react very differently. One may experience curiosity and pleasure, while the other may experience stress, tension, and an accelerated heartbeat.',
          },
          {
            bg: 'Ако възприятието може да предизвика толкова силна реакция в момента, представете си как може да влияе с течение на времето. Нашият „филтър“ се формира от възпитание, социални модели, емоции, желания и минал опит, но може да бъде променян.',
            en: 'If perception can trigger such a strong reaction in the moment, imagine how it may influence us over time. Our “filter” is shaped by upbringing, social patterns, emotions, desires, and past experiences, but it can be changed.',
          },
          {
            bg: 'Помислете за ситуация, която ви затруднява в момента. Има ли друг начин да я погледнете? Има ли човек, с когото можете да разговаряте и който да ви даде честна обратна връзка или нова перспектива? Променете гледната точка и наблюдавайте как се променят тялото, мислите и чувствата ви.',
            en: 'Think about a situation that is difficult for you right now. Is there another way to look at it? Is there someone you can talk to who can offer honest feedback or a new perspective? Change your point of view and observe how your body, thoughts, and feelings change.',
          },
        ],
      },
      {
        title: { bg: 'Мозъкът', en: 'The Brain' },
        paragraphs: [
          {
            bg: 'Тялото усеща, а мозъкът интерпретира информацията и решава проблеми. Голямата част от входящата информация от тялото се преживява като усещане. Мозъкът използва сетивата и контекста, за да разбере какво означава това усещане и какво действие е необходимо.',
            en: 'The body senses, while the brain interprets information and solves problems. Much of the incoming information from the body is experienced as sensation. The brain uses the senses and context to understand what that sensation means and what action is needed.',
          },
        ],
      },
      {
        title: { bg: 'Налягане', en: 'Pressure' },
        paragraphs: [
          {
            bg: 'В оригиналния модел тялото се разглежда като био-хидравлична система, която балансира вътрешно и външно налягане. На морското равнище атмосферното налягане е приблизително 14,7 psi. При изкачване на по-голяма височина външното налягане намалява и ушите могат да „пукат“. При гмуркане налягането на водата се увеличава.',
            en: 'In the original model, the body is viewed as a bio-hydraulic system that balances internal and external pressure. At sea level, atmospheric pressure is approximately 14.7 psi. When ascending to a higher altitude, external pressure decreases and the ears may “pop.” When diving, water pressure increases.',
          },
          {
            bg: 'Разбирането на налягането насочва вниманието към начина, по който въздухът и течностите се движат през тялото. Кръвта, дишането и течностите участват в механиката на тъканите и в начина, по който те се разширяват и отпускат. Затова движението не е само двумерно разтягане, а многопосочно взаимодействие между тъкани, течности, въздух и натоварване.',
            en: 'Understanding pressure directs attention toward the way air and fluids move through the body. Blood, breathing, and fluids participate in tissue mechanics and in the way tissues expand and relax. Therefore, movement is not simply a two-dimensional stretch, but a multidirectional interaction between tissues, fluids, air, and load.',
          },
        ],
      },
      {
        title: { bg: 'Електромагнитни процеси', en: 'Electromagnetic Processes' },
        paragraphs: [
          {
            bg: 'Човешкото тяло е изградено от огромен брой клетки, които използват електрохимични сигнали. Всеки вътрешен или външен стимул — мисъл, емоция, звук, миризма или допир — се обработва чрез нервната система.',
            en: 'The human body is made up of an enormous number of cells that use electrochemical signals. Every internal or external stimulus — a thought, emotion, sound, smell, or touch — is processed through the nervous system.',
          },
          {
            bg: 'Оригиналният материал използва електрически и енергийни метафори, за да опише тялото като система, която непрекъснато приема и предава сигнали. От практическа гледна точка идеята е да развиваме по-добра чувствителност към собствените телесни сигнали чрез движение, хидратация, сън и подходящо възстановяване.',
            en: 'The original material uses electrical and energetic metaphors to describe the body as a system that continuously receives and transmits signals. From a practical perspective, the idea is to develop greater sensitivity to our own bodily signals through movement, hydration, sleep, and appropriate recovery.',
          },
        ],
      },
      {
        title: { bg: 'Кости', en: 'Bones' },
        paragraphs: [
          {
            bg: 'Костите са само една част от структурната система. Те са свързани и обградени от съединителни тъкани, включително фасцията. Когато тъканите са еластични и добре организирани, те подпомагат стабилността и движението.',
            en: 'Bones are only one part of the structural system. They are connected to and surrounded by connective tissues, including fascia. When tissues are elastic and well organized, they support stability and movement.',
          },
          {
            bg: 'В оригиналната философия фасцията се разглежда като основна мрежа, която поддържа структурата на тялото, докато костите служат като стабилни ориентири за позицията в пространството.',
            en: 'In the original philosophy, fascia is viewed as a primary network that supports the structure of the body, while bones serve as stable reference points for position in space.',
          },
        ],
      },
      {
        title: { bg: 'Точки на контакт', en: 'Points of Contact' },
        paragraphs: [
          {
            bg: 'Представете си, че вървите в тъмна стая и единственият ви контакт със средата е чрез стъпалата. Ако не виждате къде отивате, тялото естествено се стяга. Ако протегнете ръка и докоснете стена, усещането за сигурност се увеличава.',
            en: 'Imagine walking through a dark room where your only contact with the environment is through your feet. If you cannot see where you are going, the body naturally becomes tense. If you reach out and touch a wall, your sense of security increases.',
          },
          {
            bg: 'Колкото повече надеждни точки на контакт има тялото, толкова повече информация получава нервната система за положението в пространството. Това може да обясни защо прегръдка, тежко одеяло или потапяне във вода често създават усещане за стабилност и спокойствие.',
            en: 'The more reliable points of contact the body has, the more information the nervous system receives about its position in space. This may help explain why a hug, a weighted blanket, or immersion in water can often create a sense of stability and calm.',
          },
          {
            bg: 'В първоизточника тази идея е прилагана чрез „теорията за трите точки на контакт“ — едновременно стабилно докосване в три различни точки на тялото, което може да увеличи усещането за сигурност и да намали защитното напрежение.',
            en: 'In the original source, this idea is applied through the “three points of contact theory” — stable contact at three different points of the body at the same time, which may increase the sense of security and reduce protective tension.',
          },
          {
            bg: 'Можете да изследвате това с партньор: нека постави единия си крак върху вашия, една ръка върху ръката ви и една върху гърдите ви. Затворете очи и усетете тялото. Нека постепенно махне едната точка на контакт и след това я върне. Наблюдавайте дали усещането за стабилност и пространствена ориентация се променя.',
            en: 'You can explore this with a partner: have them place one foot on yours, one hand on your hand, and one hand on your chest. Close your eyes and feel your body. Have them gradually remove one point of contact and then restore it. Observe whether your sense of stability and spatial orientation changes.',
          },
        ],
      },
      {
        title: { bg: 'Фетална позиция', en: 'Fetal Position' },
        paragraphs: [
          {
            bg: 'При изследването на движението в оригиналния метод се обръща внимание на феталната позиция, размерите и зоните на тялото и контра-ротацията. При много сложни и мощни движения тялото първо се „свива“, за да натрупа сила, а след това се разгъва. Това се вижда например при хвърляне на топка, когато атлетът събира тялото, преди да освободи движението.',
            en: 'When exploring movement in the original method, attention is given to the fetal position, body dimensions and zones, and counter-rotation. During many complex and powerful movements, the body first “contracts” to gather strength and then unfolds. This can be seen, for example, when throwing a ball, when an athlete gathers the body before releasing the movement.',
          },
          {
            bg: 'В практиката феталната позиция се използва за създаване на усещане за защита, компактност и вътрешен натиск. В оригиналния опит някои хора съобщават, че в тази позиция възникват силни емоции или спомени.',
            en: 'In the practice, the fetal position is used to create a sense of protection, compactness, and internal pressure. In the original experience, some people report that strong emotions or memories arise in this position.',
          },
          {
            bg: 'Феталната позиция е позната на тялото още от периода в утробата. Затова в тази система тя се използва като основен принцип заедно с контра-ротацията — тялото се навива, усуква и след това постепенно се освобождава.',
            en: 'The fetal position is familiar to the body from the time in the womb. For this reason, within this system it is used as a fundamental principle together with counter-rotation — the body curls, twists, and then gradually releases.',
          },
        ],
      },
    ],
  },
  {
    id: 'getting-started-tips',
    slug: 'saveti-za-nachalo',
    order: 10,
    title: { bg: 'Съвети за начало', en: 'Tips for Getting Started' },
    paragraphs: [
      {
        bg: 'Гръбначно-тазово заключване: приберете пъпа към гръбначния стълб и едновременно активирайте тазовото дъно нагоре, подобно на усещането, когато се опитвате да задържите уриниране. Опитайте да запазите лека активност по време на движението, без да стискате прекомерно.',
        en: 'Spinal-pelvic lock: draw the navel toward the spine while simultaneously activating the pelvic floor upward, similar to the sensation of trying to stop urination. Try to maintain light activation during movement without excessive squeezing.',
      },
      {
        bg: 'Етапно дишане: вдишайте, задръжте; вдишайте още малко, задръжте; вдишайте още малко. Задръжте за кратко и после издишайте спокойно. Целта е постепенно разширяване, а не насилване.',
        en: 'Step breathing: inhale, hold; inhale a little more, hold; inhale a little more. Hold briefly and then exhale calmly. The goal is gradual expansion, not forcing.',
      },
      {
        bg: 'При издишване не изтласквайте въздуха насила — оставете го да излезе естествено.',
        en: 'When exhaling, do not forcefully push the air out — allow it to leave naturally.',
      },
      {
        bg: 'Ако почувствате замайване, спрете. Седнете или легнете безопасно и изчакайте усещането да отмине. Не продължавайте, ако се чувствате нестабилни.',
        en: 'If you feel dizzy, stop. Sit or lie down safely and wait for the sensation to pass. Do not continue if you feel unstable.',
      },
      {
        bg: 'Докато ходите между движенията, сканирайте тялото. Чувствате ли се по-леко? Има ли разлика между ляво и дясно? Има ли гадене, енергия, топлина, промяна в дишането?',
        en: 'While walking between movements, scan your body. Do you feel lighter? Is there a difference between the left and right sides? Is there nausea, energy, warmth, or a change in breathing?',
      },
      {
        bg: 'След по-дълга практика или индивидуална сесия може да направите спокойна разходка около 30 минути, ако се чувствате добре.',
        en: 'After a longer practice or individual session, you may take a relaxed walk of around 30 minutes if you feel well.',
      },
    ],
  },
  {
    id: 'what-to-expect',
    slug: 'kakvo-da-ochakvate',
    order: 11,
    title: { bg: 'Какво да очаквате', en: 'What to Expect' },
    paragraphs: [
      {
        bg: 'Всяко тяло реагира по различен начин. Следващите усещания са описани в оригиналния материал като често наблюдавани, но не бива да приемате болка, припадък или силни симптоми като задължителна част от практиката.',
        en: 'Every body responds differently. The following sensations are described in the original material as commonly observed, but pain, fainting, or severe symptoms should not be considered a required part of the practice.',
      },
    ],
    subsections: [
      {
        title: { bg: 'По време на практиката', en: 'During the Practice' },
        paragraphs: [
          {
            bg: 'Някои хора могат да усетят замайване или ускорен пулс. Ако се чувствате нестабилни или имате усещане, че ще припаднете, спрете, седнете и изчакайте тялото да се успокои.',
            en: 'Some people may experience dizziness or an increased heart rate. If you feel unstable or feel as though you may faint, stop, sit down, and wait for your body to settle.',
          },
          {
            bg: 'Понякога ставите издават звук при движение. Други възможни реакции са изпотяване, сърбеж, газове, оригване или емоционална реакция. Това може да се дължи на промяна в движението, дишането, вниманието и напрежението.',
            en: 'Sometimes joints may make sounds during movement. Other possible reactions include sweating, itching, gas, burping, or an emotional response. These may be related to changes in movement, breathing, attention, and tension.',
          },
          {
            bg: 'Оригиналният текст свързва фасцията и с емоционални преживявания. Независимо от интерпретацията, ако по време на движение се появи силна емоция, дайте си време да я наблюдавате без да се насилвате.',
            en: 'The original text also connects fascia with emotional experiences. Regardless of interpretation, if a strong emotion arises during movement, give yourself time to observe it without forcing yourself.',
          },
          {
            bg: 'Ако усетите остро прищипване, разкъсваща болка, изтръпване или нова силна болка, спрете маневрата и променете позицията. Ако симптомът не отшумява или е тревожен, потърсете медицинска оценка.',
            en: 'If you experience a sharp pinching sensation, tearing pain, numbness, or new severe pain, stop the maneuver and change position. If the symptom does not subside or is concerning, seek medical evaluation.',
          },
        ],
      },
      {
        title: { bg: 'След практиката', en: 'After the Practice' },
        paragraphs: [
          {
            bg: 'След маневрите много хора съобщават за усещане за лекота, спокойствие и по-голяма свобода на движение. Това може да е свързано с промяна в кръвотока, дишането, нервната регулация и вниманието.',
            en: 'After the maneuvers, many people report a feeling of lightness, calm, and greater freedom of movement. This may be related to changes in blood flow, breathing, nervous system regulation, and attention.',
          },
          {
            bg: 'Понякога след по-интензивна практика е възможна временна умора или мускулна чувствителност. Подкрепете възстановяването с вода, храна, сън, спокойна разходка и умереност. Не приемайте силни или продължителни симптоми като „детокс“ без медицинска оценка.',
            en: 'Sometimes temporary fatigue or muscle sensitivity may occur after more intensive practice. Support recovery with water, food, sleep, a gentle walk, and moderation. Do not interpret severe or prolonged symptoms as “detox” without medical evaluation.',
          },
          {
            bg: 'KUKO WAY насърчава практикуващите да споделят опита си в общността и да учат от хора, които преминават през сходен процес. Важно е обаче собственото усещане и безопасността да останат водещи.',
            en: 'KUKO WAY encourages practitioners to share their experiences within the community and learn from people going through a similar process. However, your own sensations and safety should remain the priority.',
          },
        ],
      },
      {
        title: { bg: 'Адаптации за достъпност', en: 'Accessibility Adaptations' },
        paragraphs: [
          {
            bg: 'Фасциалните маневри могат да се изпълняват и седнали. В този вариант част от зоните участват по-малко, но практиката все пак може да бъде полезна за движение и осъзнатост.',
            en: 'Fascial maneuvers can also be performed while seated. In this version, some zones participate less, but the practice can still be useful for movement and awareness.',
          },
          {
            bg: 'Някои маневри включват достигане през тялото, захват, усукване на китките и завъртане на главата. При ограничена подвижност може да е полезна помощ от друг човек или адаптиране на позицията. Не насилвайте стави, които не позволяват даден обхват.',
            en: 'Some maneuvers involve reaching across the body, gripping, twisting the wrists, and turning the head. With limited mobility, assistance from another person or adaptation of the position may be helpful. Do not force joints into a range of motion they do not allow.',
          },
        ],
      },
    ],
  },
];
