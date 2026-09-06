import type { Practice } from '../types';

// Transcribed verbatim from KUKO_WAY_Fascial_Maneuvers_BG.docx and its
// approved English counterpart, KUKO_WAY_Fascial_Maneuvers_EN.docx. Titles,
// benefits, instructions and safety notes are the approved bilingual
// source — nothing here is invented, including the absence of a duration
// field (the source never specifies one).
export const practices: Practice[] = [
  {
    id: 'body-scan-1',
    slug: 'body-scan-1',
    category: 'reset',
    order: 1,
    title: { bg: 'Сканиране на тялото #1', en: 'Body Scan #1' },
    intro: [
      {
        bg: 'Преди да започнете, отделете момент, за да установите изходна точка — как се чувствате сега. Това наричаме сканиране на тялото.',
        en: 'Before you begin, take a moment to establish a baseline — how do you feel right now? We call this a body scan.',
      },
      {
        bg: 'След като се свържете с усещанията си, поставете ясно намерение. Какво искате да получите от практиката днес? Искате ли да се движите по-свободно, да се чувствате по-заземени или да намалите напрежението в определена зона? По какво ще разберете, че има промяна?',
        en: 'After connecting with your sensations, set a clear intention. What would you like to get from the practice today? Do you want to move more freely, feel more grounded, or reduce tension in a particular area? How will you know that something has changed?',
      },
    ],
    instructions: [
      {
        steps: [
          { bg: 'Седнете, застанете или легнете удобно.', en: 'Sit, stand, or lie down comfortably.' },
          {
            bg: 'Поемете дълбоко въздух през носа и издишайте през устата.',
            en: 'Take a deep breath through your nose and exhale through your mouth.',
          },
          { bg: 'При издишването затворете очи.', en: 'As you exhale, close your eyes.' },
          { bg: 'Забележете как се чувства тялото ви в момента.', en: 'Notice how your body feels in this moment.' },
          {
            bg: 'Започнете от върха на главата и преминете с внимание надолу до пръстите на краката.',
            en: 'Start at the top of your head and move your attention slowly down to your toes.',
          },
          {
            bg: 'Отбележете кое е комфортно и кое не. Не осъждайте усещанията и не се опитвайте веднага да ги променяте.',
            en: 'Notice what feels comfortable and what does not. Do not judge the sensations or immediately try to change them.',
          },
          { bg: 'Когато сте готови, отворете очи.', en: 'When you are ready, open your eyes.' },
        ],
      },
    ],
  },
  {
    id: 'palate-slide',
    slug: 'plazgane-po-nebtseto',
    category: 'reset',
    order: 2,
    title: { bg: 'Плъзгане по небцето', en: 'Palate Swipe' },
    intro: [
      {
        bg: 'Зона 1 — глава, лице и врат — може да натрупва напрежение през деня от дъвчене, говорене и стискане на челюстта. Движението на челюстта влияе на мускулите и фасцията около главата, а напрежението в тази област често върви заедно с ограничение в други части на тялото.',
        en: 'Zone 1 — head, face, and neck — may accumulate tension throughout the day from chewing, speaking, and clenching the jaw. Jaw movement affects the muscles and fascia around the head, and tension in this area often occurs alongside restriction in other parts of the body.',
      },
      {
        bg: 'Твърдото небце е леснодостъпна точка за работа. Плъзгането на палеца в задната част на твърдото небце, от единия кътник към другия, е проста техника за създаване на нов сензорен стимул в зона 1.',
        en: 'The hard palate is an easily accessible point for working with the area. Sliding the thumb along the back of the hard palate, from one molar toward the other, is a simple technique for creating a new sensory stimulus in Zone 1.',
      },
    ],
    benefits: [
      { bg: 'Намалява напрежението в главата и врата.', en: 'Reduces tension in the head and neck.' },
      { bg: 'Може да облекчи напрежение, свързано с главоболие.', en: 'May relieve tension associated with headaches.' },
      { bg: 'Успокоява препускащите мисли и подпомага фокуса.', en: 'Calms racing thoughts and supports focus.' },
      {
        bg: 'Създава индиректна връзка с тазовото дъно и тазобедрените стави.',
        en: 'Creates an indirect connection with the pelvic floor and hip joints.',
      },
      { bg: 'Подпомага усещането за по-свободно дишане.', en: 'Supports a feeling of freer breathing.' },
    ],
    instructions: [
      {
        steps: [
          { bg: 'Застанете с крака на ширината на раменете.', en: 'Stand with your feet shoulder-width apart.' },
          {
            bg: 'Активирайте леко гръбначно-тазовото заключване: приберете пъпа и активирайте тазовото дъно.',
            en: 'Lightly activate the spinal-pelvic lock: draw in the navel and activate the pelvic floor.',
          },
          { bg: 'Кръстосайте десния крак пред левия.', en: 'Cross the right leg in front of the left.' },
          { bg: 'Поставете дясната ръка върху лявото рамо.', en: 'Place the right hand on the left shoulder.' },
          { bg: 'Поставете лявата ръка върху дясното рамо.', en: 'Place the left hand on the right shoulder.' },
          {
            bg: 'С десния палец плъзнете по твърдото небце отдясно наляво 6 пъти.',
            en: 'With the right thumb, slide across the hard palate from right to left 6 times.',
          },
          { bg: 'Разходете се за кратко и наблюдавайте как се чувствате.', en: 'Walk briefly and observe how you feel.' },
        ],
      },
    ],
  },
  {
    id: 'full-twist',
    slug: 'palno-usukvane',
    category: 'reset',
    order: 3,
    title: { bg: 'Пълно усукване', en: 'Totally Twisted' },
    intro: [
      {
        bg: 'Тази маневра за цялото тяло използва елементи от феталната позиция, за да включи и трите зони. Чрез контра-ротация, фиксиране на тъканите и насочено дишане се създава постепенно усукване и последващо освобождаване на натрупано напрежение.',
        en: 'This full-body maneuver uses elements of the fetal position to engage all three zones. Through counter-rotation, tissue fixation, and directed breathing, it creates a gradual twisting motion followed by the release of accumulated tension.',
      },
    ],
    benefits: [
      { bg: 'Намалява общото напрежение.', en: 'Reduces overall tension.' },
      { bg: 'Подпомага успокояването на нервната система.', en: 'Supports calming of the nervous system.' },
      { bg: 'Създава усещане за добро настроение и отпускане.', en: 'Creates a feeling of improved mood and relaxation.' },
      {
        bg: 'Намалява компресията и сковаността по гръбначния стълб и торса.',
        en: 'Reduces compression and stiffness along the spine and torso.',
      },
      { bg: 'Подпомага по-свободното дишане.', en: 'Supports freer breathing.' },
    ],
    instructions: [
      {
        label: { bg: 'Част 1', en: 'Part 1' },
        steps: [
          { bg: 'Застанете с крака на ширината на раменете.', en: 'Stand with your feet shoulder-width apart.' },
          { bg: 'Активирайте гръбначно-тазовото заключване.', en: 'Activate the spinal-pelvic lock.' },
          { bg: 'Кръстосайте десния крак пред левия.', en: 'Cross the right leg in front of the left.' },
          {
            bg: 'Прекарайте дясната ръка през тялото и я поставете под лявата мишница.',
            en: 'Bring the right arm across the body and place it under the left armpit.',
          },
          {
            bg: 'Прекарайте лявата ръка и я поставете върху дясното рамо.',
            en: 'Bring the left arm across and place it on the right shoulder.',
          },
          { bg: 'Прегърнете се стабилно с двете ръце.', en: 'Hold yourself firmly in a self-embrace with both arms.' },
          {
            bg: 'Запазете заключването и бавно завъртете главата максимално наляво в комфортния си обхват.',
            en: 'Maintain the lock and slowly turn your head as far to the left as is comfortable.',
          },
          {
            bg: 'Притиснете езика към вътрешната страна на лявата буза и намерете по-напрегната точка.',
            en: 'Press your tongue against the inside of your left cheek and find an area of greater tension.',
          },
          {
            bg: 'Завъртете горната част на тялото надясно, докато таза остава насочен напред.',
            en: 'Rotate your upper body to the right while keeping your pelvis facing forward.',
          },
          { bg: 'Направете 6 вдишвания през носа.', en: 'Take 6 breaths through your nose.' },
          { bg: 'Отпуснете езика.', en: 'Relax your tongue.' },
          {
            bg: 'Свийте устните сякаш пиете през сламка и направете етапно вдишване: вдишайте, задръжте; вдишайте още, задръжте; вдишайте още малко, задръжте; после бавно издишайте.',
            en: 'Purse your lips as if drinking through a straw and perform step breathing: inhale, hold; inhale more, hold; inhale a little more, hold; then slowly exhale.',
          },
          { bg: 'Повторете етапното дишане още два пъти — общо 3.', en: 'Repeat the step breathing two more times — 3 times total.' },
          {
            bg: 'Ако е комфортно, увеличете леко ротацията на торса надясно и на главата наляво.',
            en: 'If comfortable, slightly increase the rotation of your torso to the right and your head to the left.',
          },
          {
            bg: 'Фиксирайте поглед в една точка над лявото рамо и направете 6 спокойни цикъла: вдишване през носа, издишване през устата.',
            en: 'Fix your gaze on a point over your left shoulder and complete 6 calm cycles: inhale through the nose, exhale through the mouth.',
          },
          {
            bg: 'Върнете главата и торса към центъра, като още се прегръщате.',
            en: 'Return your head and torso toward center while maintaining the self-embrace.',
          },
          {
            bg: 'Активирайте отново заключването и бавно завъртете главата надясно.',
            en: 'Reactivate the lock and slowly turn your head to the right.',
          },
          {
            bg: 'Притиснете езика към вътрешната страна на дясната буза.',
            en: 'Press your tongue against the inside of your right cheek.',
          },
          {
            bg: 'Завъртете горната част на тялото наляво, таза остава напред.',
            en: 'Rotate your upper body to the left while keeping your pelvis facing forward.',
          },
          { bg: 'Направете 6 вдишвания през носа.', en: 'Take 6 breaths through your nose.' },
          { bg: 'Отпуснете езика.', en: 'Relax your tongue.' },
          { bg: 'Направете 3 етапни вдишвания.', en: 'Perform 3 step breaths.' },
          {
            bg: 'Ако е комфортно, увеличете леко ротацията на торса наляво и главата надясно.',
            en: 'If comfortable, slightly increase the rotation of your torso to the left and your head to the right.',
          },
          {
            bg: 'Фиксирайте поглед над дясното рамо и направете 6 цикъла: вдишване през носа, издишване през устата.',
            en: 'Fix your gaze over your right shoulder and complete 6 cycles: inhale through the nose, exhale through the mouth.',
          },
          {
            bg: 'Бавно се върнете в неутрална позиция и отпуснете ръцете.',
            en: 'Slowly return to a neutral position and release your arms.',
          },
          { bg: 'Разходете се, за да интегрирате промените.', en: 'Walk to integrate the changes.' },
        ],
      },
      {
        label: { bg: 'Част 2', en: 'Part 2' },
        steps: [
          {
            bg: 'Повторете същата последователност с левия крак кръстосан пред десния.',
            en: 'Repeat the same sequence with the left leg crossed in front of the right.',
          },
          { bg: 'Лявата ръка минава под дясната мишница.', en: 'The left arm passes under the right armpit.' },
          { bg: 'Дясната ръка се поставя върху лявото рамо.', en: 'The right arm is placed on the left shoulder.' },
          {
            bg: 'Прегърнете се и изпълнете същата последователност на ротация, език, 6 вдишвания, 3 етапни вдишвания и работа с погледа и в двете посоки.',
            en: 'Embrace yourself and perform the same sequence of rotation, tongue positioning, 6 breaths, 3 step breaths, and gaze work in both directions.',
          },
          {
            bg: 'Накрая се върнете бавно в нормален стоеж и направете кратка разходка.',
            en: 'Finally, slowly return to a normal standing position and take a short walk.',
          },
        ],
      },
    ],
  },
  {
    id: 'anti-gravity',
    slug: 'antigravitatsiya',
    category: 'reset',
    order: 4,
    title: { bg: 'Антигравитация', en: 'Antigravity' },
    intro: [
      {
        bg: 'Когато вдигнем лактите над главата, докато фиксираме тъканите в тилната област, удължаваме мускулно-скелетната мрежа. Чрез гравитация, вътрешно налягане и ротация тази маневра създава усещане за декомпресия по гръбначния стълб.',
        en: 'When we raise the elbows above the head while fixing the tissues in the occipital area, we lengthen the musculoskeletal network. Through gravity, internal pressure, and rotation, this maneuver creates a sensation of decompression along the spine.',
      },
    ],
    benefits: [
      { bg: 'Декомпресия на гръбначния стълб.', en: 'Decompression of the spine.' },
      { bg: 'Намаляване на напрежението около гръбнака и торса.', en: 'Reduction of tension around the spine and torso.' },
      { bg: 'Стимулиране на движението и дишането.', en: 'Stimulation of movement and breathing.' },
      { bg: 'Успокояване на нервната система.', en: 'Calming of the nervous system.' },
      { bg: 'Създаване на усещане за отпускане.', en: 'Creation of a sense of relaxation.' },
    ],
    instructions: [
      {
        steps: [
          { bg: 'Застанете с крака на ширината на раменете.', en: 'Stand with your feet shoulder-width apart.' },
          { bg: 'Активирайте гръбначно-тазовото заключване.', en: 'Activate the spinal-pelvic lock.' },
          {
            bg: 'Преплетете пръстите зад врата, така че палците да се допират или застъпват, и поставете ръцете в основата на черепа.',
            en: 'Interlace your fingers behind your neck so that your thumbs touch or overlap, and place your hands at the base of your skull.',
          },
          {
            bg: 'Изтеглете кожата и меките тъкани нагоре и задръжте. Не натискайте главата напред.',
            en: 'Draw the skin and soft tissues upward and hold. Do not push your head forward.',
          },
          {
            bg: 'Запазете заключването и бавно погледнете към тавана.',
            en: 'Maintain the lock and slowly look toward the ceiling.',
          },
          { bg: 'Направете 3 дълбоки вдишвания и издишвания през устата.', en: 'Take 3 deep breaths in and out through your mouth.' },
          {
            bg: 'След това направете 3 вдишвания през носа и издишвания през устата.',
            en: 'Then take 3 breaths in through your nose and out through your mouth.',
          },
          {
            bg: 'Спуснете брадичката към гърдите и приближете лактите един към друг.',
            en: 'Lower your chin toward your chest and bring your elbows closer together.',
          },
          { bg: 'Направете 3 цикъла през устата.', en: 'Perform 3 cycles through the mouth.' },
          {
            bg: 'Направете 3 вдишвания през носа и издишвания през устата.',
            en: 'Take 3 breaths in through your nose and out through your mouth.',
          },
          { bg: 'Вдишайте дълбоко през устата и задръжте.', en: 'Inhale deeply through your mouth and hold.' },
          {
            bg: 'Погледнете нагоре и надясно, като запазите ръцете на място и лактите следват посоката.',
            en: 'Look up and to the right while keeping your hands in place and allowing your elbows to follow the direction.',
          },
          {
            bg: 'Издишайте при връщане към центъра с брадичка към гърдите.',
            en: 'Exhale as you return toward center with your chin toward your chest.',
          },
          { bg: 'Повторете наляво.', en: 'Repeat to the left.' },
          { bg: 'Направете общо 3 повторения на всяка страна.', en: 'Perform 3 repetitions on each side in total.' },
          { bg: 'Разширете разкрача.', en: 'Widen your stance.' },
          { bg: 'Свийте леко коленете.', en: 'Slightly bend your knees.' },
          { bg: 'Избутайте таза назад и влезте в клек.', en: 'Push your hips back and move into a squat.' },
          {
            bg: 'Погледнете нагоре и изтеглете тъканите в основата на черепа още съвсем леко.',
            en: 'Look upward and draw the tissues at the base of your skull slightly more.',
          },
          { bg: 'Разтворете лактите встрани.', en: 'Open your elbows to the sides.' },
          {
            bg: 'Вдишайте дълбоко през устата, задръжте и погледнете нагоре и надясно.',
            en: 'Inhale deeply through your mouth, hold, and look up and to the right.',
          },
          { bg: 'Издишайте към центъра.', en: 'Exhale toward center.' },
          { bg: 'Повторете наляво.', en: 'Repeat to the left.' },
          { bg: 'Направете общо 3 повторения на страна в клек.', en: 'Perform 3 repetitions on each side in the squat.' },
          { bg: 'Ако е комфортно, слезте в по-дълбок клек.', en: 'If comfortable, move into a deeper squat.' },
          {
            bg: 'Поставете брадичката към гърдите и приближете лактите.',
            en: 'Bring your chin toward your chest and bring your elbows closer together.',
          },
          { bg: 'Активирайте заключването.', en: 'Activate the lock.' },
          { bg: 'Направете 3 вдишвания и издишвания през устата.', en: 'Perform 3 breaths in and out through your mouth.' },
          {
            bg: 'Направете 3 вдишвания през носа и издишвания през устата.',
            en: 'Perform 3 breaths in through your nose and out through your mouth.',
          },
          {
            bg: 'Бавно повдигнете първо таза нагоре и разгънете гръбначния стълб прешлен по прешлен, докато се изправите.',
            en: 'Slowly raise your pelvis first and extend your spine vertebra by vertebra until you are standing upright.',
          },
          {
            bg: 'Завършете с един спокоен дихателен цикъл през устата.',
            en: 'Finish with one calm breathing cycle through your mouth.',
          },
          { bg: 'Разходете се.', en: 'Walk.' },
        ],
      },
    ],
  },
  {
    id: 'swinger',
    slug: 'suinger',
    category: 'full-body',
    order: 5,
    title: { bg: 'Суингър', en: 'Swinger' },
    intro: [
      {
        bg: 'При „Суингър“ използваме контра-ротация и елементи от феталната позиция, за да работим с едното рамо и противоположния таз. Движението създава повече пространство в зона 2 и може да бъде особено полезно при усещане за скованост в раменете и таза или при спортове с ротация.',
        en: 'In the “Swinger,” we use counter-rotation and elements of the fetal position to work with one shoulder and the opposite side of the pelvis. The movement creates more space in Zone 2 and may be particularly useful when experiencing stiffness in the shoulders and pelvis or when participating in sports involving rotation.',
      },
    ],
    benefits: [
      { bg: 'Намалява напрежението в раменете и тазобедрените стави.', en: 'Reduces tension in the shoulders and hip joints.' },
      { bg: 'Намалява напрежението около лопатките.', en: 'Reduces tension around the shoulder blades.' },
      {
        bg: 'Подпомага движенията при спортове с замах и хвърляне.',
        en: 'Supports movement in sports involving swinging and throwing.',
      },
      { bg: 'Подобрява усещането за позицията на таза и походката.', en: 'Improves awareness of pelvic position and gait.' },
    ],
    instructions: [
      {
        label: { bg: 'Част 1', en: 'Part 1' },
        steps: [
          { bg: 'Застанете с крака на ширината на раменете.', en: 'Stand with your feet shoulder-width apart.' },
          { bg: 'Активирайте заключването и свийте леко коленете.', en: 'Activate the lock and slightly bend your knees.' },
          {
            bg: 'Оставете ръцете да висят отпред, с длани към тялото.',
            en: 'Let your arms hang in front of you, with your palms facing your body.',
          },
          {
            bg: 'Избутайте таза назад, докато върховете на пръстите достигнат коленете.',
            en: 'Push your hips back until your fingertips reach your knees.',
          },
          {
            bg: 'Повдигнете гърдите, сякаш нишка дърпа гръдната кост напред, и погледнете право напред.',
            en: 'Lift your chest as if a thread were pulling your sternum forward, and look straight ahead.',
          },
          { bg: 'Поставете дясната ръка върху лявото рамо.', en: 'Place your right hand on your left shoulder.' },
          {
            bg: 'Поставете лявата ръка над десния лакът, хванете стабилно и изтеглете кожата по задната страна на ръката надолу към лакътя.',
            en: 'Place your left hand above your right elbow, grip firmly, and draw the skin along the back of the arm downward toward the elbow.',
          },
          { bg: 'Завъртете главата надясно.', en: 'Turn your head to the right.' },
          {
            bg: 'Завъртете горната част на тялото наляво и изтеглете дясната ръка през тялото, като я запазите приблизително във форма „L“.',
            en: 'Rotate your upper body to the left and draw your right arm across your body, keeping it approximately in an “L” shape.',
          },
          {
            bg: 'Избутайте таза още назад и влезте в клек, като запазите заключването и погледа нагоре.',
            en: 'Push your hips farther back and move into a squat while maintaining the lock and looking upward.',
          },
          { bg: 'Направете 6 цикъла дишане през устата.', en: 'Perform 6 breathing cycles through your mouth.' },
          { bg: 'Бавно се върнете в изправен стоеж.', en: 'Slowly return to standing.' },
          { bg: 'Разходете се.', en: 'Walk.' },
        ],
      },
      {
        label: { bg: 'Част 2', en: 'Part 2' },
        steps: [
          {
            bg: 'Повторете огледално: лявата ръка върху дясното рамо.',
            en: 'Repeat on the opposite side: left hand on the right shoulder.',
          },
          {
            bg: 'Дясната ръка над левия лакът и изтегля кожата назад и надолу.',
            en: 'Right hand above the left elbow, drawing the skin backward and downward.',
          },
          { bg: 'Главата се завърта наляво, торсът надясно.', en: 'Head turns left, torso turns right.' },
          { bg: 'Влезте в клек с таза назад.', en: 'Move into a squat with the hips back.' },
          { bg: 'Направете 6 спокойни дихателни цикъла през устата.', en: 'Perform 6 calm breathing cycles through the mouth.' },
          {
            bg: 'Върнете се бавно в неутрално положение и се разходете.',
            en: 'Slowly return to a neutral position and walk.',
          },
        ],
      },
    ],
  },
  {
    id: 'pullover',
    slug: 'puloover',
    category: 'full-body',
    order: 6,
    title: { bg: 'Пулоувър', en: 'Pullover' },
    intro: [
      {
        bg: 'Тази маневра създава пространство между рамото и таза от едната страна на тялото и работи с задната част на торса. Подходяща е особено за хора, които прекарват много време в седнало положение, тъй като продължителното седене често се усеща като компресия по задната верига на тялото.',
        en: 'This maneuver creates space between the shoulder and pelvis on one side of the body and works with the back of the torso. It is particularly suitable for people who spend a lot of time sitting, as prolonged sitting can often feel like compression along the posterior chain of the body.',
      },
    ],
    benefits: [
      { bg: 'Подпомага подвижността около корема и кръста.', en: 'Supports mobility around the abdomen and lower back.' },
      { bg: 'Може да стимулира естественото движение на червата.', en: 'May stimulate natural bowel movement.' },
      { bg: 'Намалява напрежението в кръста.', en: 'Reduces tension in the lower back.' },
      {
        bg: 'Създава усещане за по-свободно дишане в задната част на гръдния кош.',
        en: 'Creates a feeling of freer breathing in the back of the rib cage.',
      },
      { bg: 'Работи с областта около бъбреците и задната диафрагма.', en: 'Works with the area around the kidneys and posterior diaphragm.' },
      {
        bg: 'Подпомага вътрешната ротация на таза и тазобедрените стави.',
        en: 'Supports internal rotation of the pelvis and hip joints.',
      },
    ],
    instructions: [
      {
        label: { bg: 'Част 1', en: 'Part 1' },
        steps: [
          { bg: 'Застанете с крака на ширината на раменете.', en: 'Stand with your feet shoulder-width apart.' },
          { bg: 'Активирайте гръбначно-тазовото заключване.', en: 'Activate the spinal-pelvic lock.' },
          {
            bg: 'Поставете дясната ръка върху задната част на лявото рамо, близо до външния ръб, и изтеглете тъканите нагоре.',
            en: 'Place your right hand on the back of your left shoulder, near the outer edge, and draw the tissues upward.',
          },
          {
            bg: 'Поставете лявата ръка върху дясната страна на ребрата и изтеглете тъканите напред.',
            en: 'Place your left hand on the right side of your ribs and draw the tissues forward.',
          },
          { bg: 'Завъртете главата наляво.', en: 'Turn your head to the left.' },
          {
            bg: 'Повдигнете лявото рамо максимално високо, без да местите останалата част на тялото.',
            en: 'Raise your left shoulder as high as possible without moving the rest of your body.',
          },
          { bg: 'Бавно клекнете, като държите гърдите повдигнати.', en: 'Slowly squat while keeping your chest lifted.' },
          { bg: 'Повдигнете лявото рамо още малко, ако е комфортно.', en: 'Raise your left shoulder slightly more if comfortable.' },
          { bg: 'Запазете заключването.', en: 'Maintain the lock.' },
          {
            bg: 'Бавно приближете лявото рамо през тялото към дясното коляно.',
            en: 'Slowly bring your left shoulder across your body toward your right knee.',
          },
          { bg: 'Направете 6 дихателни цикъла през устата.', en: 'Perform 6 breathing cycles through your mouth.' },
          { bg: 'Бавно се разгънете до нормален стоеж.', en: 'Slowly extend back to a normal standing position.' },
          { bg: 'Разходете се.', en: 'Walk.' },
        ],
      },
      {
        label: { bg: 'Част 2', en: 'Part 2' },
        steps: [
          {
            bg: 'Повторете огледално с лявата ръка върху дясното рамо, дясната ръка върху лявата ребрена дъга, глава надясно и дясното рамо насочено към лявото коляно.',
            en: 'Repeat on the opposite side with the left hand on the right shoulder, the right hand on the left rib cage, the head turned right, and the right shoulder directed toward the left knee.',
          },
          {
            bg: 'Направете 6 дихателни цикъла през устата, върнете се в стоеж и се разходете.',
            en: 'Perform 6 breathing cycles through the mouth, return to standing, and walk.',
          },
        ],
      },
    ],
  },
  {
    id: 'pretzel-squat',
    slug: 'klek-gevrek',
    category: 'full-body',
    order: 7,
    title: { bg: 'Клек „Геврек“', en: '“Pretzel” Squat' },
    intro: [
      {
        bg: 'Клекът „Геврек“ използва контра-ротация, за да насочи движение и натоварване към таза, бедрата и краката. Вътрешната ротация на ръцете и спираловидната позиция включват и трите зони на тялото.',
        en: 'The “Pretzel” squat uses counter-rotation to direct movement and loading toward the pelvis, hips, and legs. Internal rotation of the arms and the spiral position engage all three zones of the body.',
      },
    ],
    benefits: [
      { bg: 'Работи с фасцията около таза.', en: 'Works with the fascia around the pelvis.' },
      { bg: 'Намалява напрежението в тазобедрените стави и кръста.', en: 'Reduces tension in the hip joints and lower back.' },
      {
        bg: 'Работи с седалището, задната част на бедрата, слабините и външната страна на бедрото.',
        en: 'Works with the glutes, hamstrings, groin, and outer thigh.',
      },
      {
        bg: 'Подпомага по-равномерното разпределение на натоварването в краката.',
        en: 'Supports more even distribution of load through the legs.',
      },
      { bg: 'Подпомага стабилността на коленете и глезените.', en: 'Supports stability of the knees and ankles.' },
    ],
    instructions: [
      {
        label: { bg: 'Част 1', en: 'Part 1' },
        steps: [
          { bg: 'Застанете с крака на ширината на раменете.', en: 'Stand with your feet shoulder-width apart.' },
          { bg: 'Активирайте заключването.', en: 'Activate the lock.' },
          {
            bg: 'Поставете петата на десния крак до свода на левия, така че стъпалата да образуват „Т“.',
            en: 'Place the heel of your right foot next to the arch of your left foot so that the feet form a “T.”',
          },
          {
            bg: 'Отстъпете с десния крак приблизително 90 см, като запазите същата Т-образна ориентация.',
            en: 'Step the right foot approximately 90 cm backward while maintaining the same T-shaped orientation.',
          },
          {
            bg: 'Изправете двата крака и стабилизирайте коленете без болезнено заключване.',
            en: 'Straighten both legs and stabilize the knees without painful locking.',
          },
          {
            bg: 'Завъртете горната част на тялото максимално надясно в комфортния обхват.',
            en: 'Rotate your upper body as far to the right as comfortable.',
          },
          { bg: 'Протегнете лявата ръка напред.', en: 'Extend your left arm forward.' },
          { bg: 'Поставете дясната ръка върху дясната седалищна половина.', en: 'Place your right hand on the right side of your glute.' },
          {
            bg: 'Леко натиснете таза назад в ръката, така че раменете да се насочват наляво, а таза надясно.',
            en: 'Gently press your pelvis backward into your hand so that your shoulders move toward the left while your pelvis moves toward the right.',
          },
          { bg: 'Поставете лявата ръка върху дясното рамо.', en: 'Place your left hand on your right shoulder.' },
          {
            bg: 'Плъзнете дясната ръка нагоре по гърба между лопатките, с длан навън.',
            en: 'Slide your right hand upward along your back between the shoulder blades, with the palm facing outward.',
          },
          { bg: 'Завъртете главата наляво.', en: 'Turn your head to the left.' },
          { bg: 'Запазете заключването и бавно клекнете.', en: 'Maintain the lock and slowly squat.' },
          { bg: 'Направете 6 дихателни цикъла през устата.', en: 'Perform 6 breathing cycles through your mouth.' },
          {
            bg: 'Разменете ръцете: дясната върху лявото рамо, лявата между лопатките с длан навън.',
            en: 'Switch your hands: right hand on the left shoulder, left hand between the shoulder blades with the palm facing outward.',
          },
          { bg: 'Завъртете главата надясно.', en: 'Turn your head to the right.' },
          { bg: 'Направете 6 дихателни цикъла през устата.', en: 'Perform 6 breathing cycles through your mouth.' },
          { bg: 'Бавно се върнете в нормален стоеж.', en: 'Slowly return to a normal standing position.' },
          { bg: 'Разходете се.', en: 'Walk.' },
        ],
      },
      {
        label: { bg: 'Част 2', en: 'Part 2' },
        steps: [
          {
            bg: 'Повторете огледално: лявата пета до свода на десния крак, след което лявото стъпало се отдалечава назад, запазвайки Т-образната позиция.',
            en: 'Repeat on the opposite side: left heel next to the arch of the right foot, then step the left foot backward while maintaining the T-shaped position.',
          },
          { bg: 'Завъртете торса наляво.', en: 'Rotate your torso to the left.' },
          { bg: 'Протегнете дясната ръка напред.', en: 'Extend your right arm forward.' },
          {
            bg: 'Поставете лявата ръка върху лявата седалищна половина и създайте противоположно усукване между раменете и таза.',
            en: 'Place your left hand on the left side of your glute and create an opposite twist between the shoulders and pelvis.',
          },
          {
            bg: 'Дясната ръка отива върху лявото рамо, лявата между лопатките, глава надясно.',
            en: 'Right hand goes to the left shoulder, left hand between the shoulder blades, head turned right.',
          },
          { bg: 'Клекнете и направете 6 дихателни цикъла през устата.', en: 'Squat and perform 6 breathing cycles through your mouth.' },
          {
            bg: 'Разменете ръцете, завъртете главата наляво и повторете 6 дихателни цикъла.',
            en: 'Switch your hands, turn your head to the left, and repeat 6 breathing cycles.',
          },
          { bg: 'Бавно се изправете и се разходете.', en: 'Slowly stand and walk.' },
        ],
      },
    ],
  },
  {
    id: 'peekaboo',
    slug: 'piikabu',
    category: 'full-body',
    order: 8,
    title: { bg: 'Пийкабу', en: 'Peekaboo' },
    intro: [
      {
        bg: 'Много хора имат асиметрии и натрупано напрежение в областта на главата и врата. В оригиналния материал това се свързва и с преживявания по време на раждането и с начина, по който черепът се адаптира към натиск. Маневрата използва спираловидно движение на кожата и меките тъкани около главата и врата с цел да създаде нов сензорен и механичен стимул.',
        en: 'Many people have asymmetries and accumulated tension around the head and neck. In the original material, this is also connected with experiences during birth and the way the skull adapts to pressure. The maneuver uses a spiral movement of the skin and soft tissues around the head and neck to create a new sensory and mechanical stimulus.',
      },
    ],
    safetyNote: {
      bg: 'Костите на черепа при възрастен не се „наместват“ чрез леки фасциални маневри по начина, по който се намества става. Използвайте тази практика като работа с меки тъкани и усещане, а не като заместител на медицинска оценка при травма, силно главоболие, световъртеж или неврологични симптоми.',
      en: 'The bones of an adult skull are not “repositioned” through gentle fascial maneuvers in the same way that a joint can be repositioned. Use this practice as work with soft tissues and sensation, not as a substitute for medical evaluation in the event of trauma, severe headache, dizziness, or neurological symptoms.',
    },
    benefits: [
      { bg: 'Работи с меките тъкани на врата и главата.', en: 'Works with the soft tissues of the neck and head.' },
      { bg: 'Намалява усещането за напрежение в зона 1.', en: 'Reduces the sensation of tension in Zone 1.' },
      { bg: 'Подпомага по-свободното усещане около синусите и ушите.', en: 'Supports a freer sensation around the sinuses and ears.' },
      { bg: 'Работи с областта на слепоочията и челото.', en: 'Works with the temples and forehead.' },
      {
        bg: 'Може да създаде усещане за облекчение при напрежение, свързано с главоболие.',
        en: 'May create a sense of relief from tension associated with headaches.',
      },
      { bg: 'Подпомага осъзнаването на лицевата симетрия.', en: 'Supports awareness of facial symmetry.' },
    ],
    instructions: [
      {
        steps: [
          { bg: 'Застанете с крака на ширината на раменете.', en: 'Stand with your feet shoulder-width apart.' },
          { bg: 'Активирайте гръбначно-тазовото заключване.', en: 'Activate the spinal-pelvic lock.' },
          {
            bg: 'Поставете дясната ръка в задната част на врата отляво и изтеглете кожата към дясната страна.',
            en: 'Place your right hand on the back of your neck on the left side and draw the skin toward the right.',
          },
          { bg: 'Бавно завъртете главата надясно.', en: 'Slowly turn your head to the right.' },
          {
            bg: 'Доближете вътрешната част на дясната ръка до страничната част на главата, така че да получите стабилна опора.',
            en: 'Bring the inside of your right arm close to the side of your head to create stable support.',
          },
          {
            bg: 'Поставете дланта на лявата ръка върху лявата буза, под окото.',
            en: 'Place the palm of your left hand on your left cheek, below the eye.',
          },
          {
            bg: 'Изтеглете кожата на бузата назад към лявото ухо и съвсем леко нагоре към скулата.',
            en: 'Draw the skin of your cheek backward toward your left ear and very slightly upward toward the cheekbone.',
          },
          { bg: 'Запазете заключването и бавно влезте в клек.', en: 'Maintain the lock and slowly move into a squat.' },
          {
            bg: 'Завъртете горната част на тялото и главата наляво и, ако е комфортно, погледнете леко нагоре.',
            en: 'Rotate your upper body and head to the left and, if comfortable, look slightly upward.',
          },
          {
            bg: 'Направете 6 цикъла: вдишване през носа и издишване през устата.',
            en: 'Perform 6 cycles: inhale through the nose and exhale through the mouth.',
          },
          { bg: 'Бавно се върнете в неутрална позиция.', en: 'Slowly return to a neutral position.' },
          { bg: 'Разходете се.', en: 'Walk.' },
        ],
      },
    ],
  },
  {
    id: 'ear-pull',
    slug: 'izdarpvane-na-uhoto',
    category: 'full-body',
    order: 9,
    title: { bg: 'Издърпване на ухото', en: 'Ear Pull' },
    intro: [
      {
        bg: 'Тази маневра работи с фасцията и меките тъкани на зона 1, като поставя специален фокус върху ушите. Ушите постоянно приемат звукови вибрации, които се обработват от нервната система и участват в ориентацията ни в пространството.',
        en: 'This maneuver works with the fascia and soft tissues of Zone 1, with a particular focus on the ears. The ears constantly receive sound vibrations that are processed by the nervous system and contribute to our spatial orientation.',
      },
    ],
    benefits: [
      { bg: 'Намалява усещането за натиск около ушния канал.', en: 'Reduces the sensation of pressure around the ear canal.' },
      { bg: 'Намалява напрежението във врата и челюстта.', en: 'Reduces tension in the neck and jaw.' },
      { bg: 'Може да създаде усещане за по-голяма яснота и фокус.', en: 'May create a feeling of greater clarity and focus.' },
      {
        bg: 'Може да подпомогне отпускането при напрежение, свързано с главоболие.',
        en: 'May support relaxation when experiencing tension associated with headaches.',
      },
      { bg: 'Работи с лицевата симетрия и усещането за позиция на главата.', en: 'Works with facial symmetry and awareness of head position.' },
    ],
    instructions: [
      {
        label: { bg: 'Част 1 — ляво ухо', en: 'Part 1 — Left Ear' },
        steps: [
          { bg: 'Застанете с крака на ширината на раменете.', en: 'Stand with your feet shoulder-width apart.' },
          { bg: 'Активирайте заключването.', en: 'Activate the lock.' },
          { bg: 'С дясната ръка хванете горната част на лявото ухо.', en: 'With your right hand, hold the upper part of your left ear.' },
          {
            bg: 'С лявата ръка хванете долната част — меката част на ухото.',
            en: 'With your left hand, hold the lower part — the soft earlobe.',
          },
          {
            bg: 'Изтеглете ръцете внимателно в противоположни посоки и задръжте.',
            en: 'Gently pull your hands in opposite directions and hold.',
          },
          { bg: 'Дайте на тялото няколко секунди да се адаптира.', en: 'Give your body a few seconds to adapt.' },
          { bg: 'Изтеглете ухото леко встрани от главата, без болка.', en: 'Gently pull the ear away from the head without pain.' },
          {
            bg: 'Завъртете горната част на ухото леко назад, а долната — леко напред.',
            en: 'Rotate the upper part of the ear slightly backward and the lower part slightly forward.',
          },
          { bg: 'Бавно влезте в клек.', en: 'Slowly move into a squat.' },
          { bg: 'Погледнете нагоре и надясно.', en: 'Look up and to the right.' },
          {
            bg: 'Направете 3 цикъла: вдишване през носа, издишване през устата.',
            en: 'Perform 3 cycles: inhale through the nose, exhale through the mouth.',
          },
          { bg: 'Погледнете нагоре и наляво.', en: 'Look up and to the left.' },
          { bg: 'Направете още 3 цикъла.', en: 'Perform 3 more cycles.' },
          {
            bg: 'Върнете се към центъра, отпуснете захвата и бавно се изправете.',
            en: 'Return to center, release the grip, and slowly stand.',
          },
          { bg: 'Разходете се.', en: 'Walk.' },
        ],
      },
      {
        label: { bg: 'Част 2 — дясно ухо', en: 'Part 2 — Right Ear' },
        steps: [
          {
            bg: 'Повторете огледално: лявата ръка хваща горната част на дясното ухо, а дясната — меката част.',
            en: 'Repeat on the opposite side: left hand holds the upper part of the right ear, while the right hand holds the soft part.',
          },
          {
            bg: 'Изтеглете внимателно, завъртете горната част назад, а долната напред.',
            en: 'Gently pull, rotate the upper part backward and the lower part forward.',
          },
          {
            bg: 'Влезте в клек и изпълнете по 3 дихателни цикъла с поглед нагоре надясно и нагоре наляво.',
            en: 'Move into a squat and perform 3 breathing cycles while looking up and to the right, followed by 3 cycles looking up and to the left.',
          },
          { bg: 'Върнете се в център, отпуснете и се разходете.', en: 'Return to center, release, and walk.' },
        ],
      },
    ],
  },
  {
    id: 'ear-twist',
    slug: 'usukvane-na-ushite',
    category: 'full-body',
    order: 10,
    title: { bg: 'Усукване на ушите', en: 'Ear Twist' },
    intro: [
      {
        bg: 'Това движение работи едновременно с двете уши и с меките тъкани около ушния канал. Целта е да се създаде силен, но контролиран сензорен стимул в зона 1, който може да се усеща и около слепоочията и челюстта.',
        en: 'This movement works with both ears simultaneously and with the soft tissues around the ear canal. The goal is to create a strong but controlled sensory stimulus in Zone 1, which may also be felt around the temples and jaw.',
      },
    ],
    benefits: [
      { bg: 'Намалява напрежението във врата и челюстта.', en: 'Reduces tension in the neck and jaw.' },
      { bg: 'Работи с усещането за натиск около ушите.', en: 'Works with the sensation of pressure around the ears.' },
      { bg: 'Подпомага телесната и пространствената осъзнатост.', en: 'Supports body and spatial awareness.' },
      {
        bg: 'Може да подпомогне отпускането при напрежение около главата.',
        en: 'May support relaxation when experiencing tension around the head.',
      },
      { bg: 'Работи с лицевата симетрия.', en: 'Works with facial symmetry.' },
    ],
    instructions: [
      {
        steps: [
          {
            bg: 'Ако имате дълги нокти, поставете мека салфетка или тънка материя между пръстите и ушите, за да не нараните кожата.',
            en: 'If you have long fingernails, place a soft tissue or thin material between your fingers and ears to avoid injuring the skin.',
          },
          { bg: 'Застанете с крака на ширината на раменете.', en: 'Stand with your feet shoulder-width apart.' },
          { bg: 'Активирайте гръбначно-тазовото заключване.', en: 'Activate the spinal-pelvic lock.' },
          {
            bg: 'Поставете десния палец внимателно във входа на дясното ухо — без да го вкарвате дълбоко.',
            en: 'Carefully place your right thumb at the entrance of the right ear — do not insert it deeply.',
          },
          {
            bg: 'Поставете левия палец по същия начин в лявото ухо.',
            en: 'Place your left thumb in the same way at the entrance of the left ear.',
          },
          {
            bg: 'С останалите пръсти хванете горната част на ушите и завъртете дланите леко напред.',
            en: 'With your remaining fingers, hold the upper parts of the ears and rotate your palms slightly forward.',
          },
          {
            bg: 'Движението може да създаде интензивно разтягане, но не трябва да причинява остра болка.',
            en: 'The movement may create an intense stretch, but it should not cause sharp pain.',
          },
          { bg: 'Отворете и затворете устата 3 пъти.', en: 'Open and close your mouth 3 times.' },
          { bg: 'Погледнете нагоре и отново отворете устата 3 пъти.', en: 'Look upward and open your mouth another 3 times.' },
          {
            bg: 'Вдишайте през устата и завъртете главата надясно; издишайте при връщане в център.',
            en: 'Inhale through your mouth and turn your head to the right; exhale as you return to center.',
          },
          {
            bg: 'Вдишайте през устата и завъртете главата наляво; издишайте при връщане в център.',
            en: 'Inhale through your mouth and turn your head to the left; exhale as you return to center.',
          },
          {
            bg: 'Поставете брадичката към гърдите и направете един дълбок дихателен цикъл.',
            en: 'Bring your chin toward your chest and take one deep breathing cycle.',
          },
          { bg: 'Влезте в клек.', en: 'Move into a squat.' },
          {
            bg: 'Вдишайте през устата и погледнете нагоре и надясно; издишайте към центъра.',
            en: 'Inhale through your mouth and look up and to the right; exhale toward center.',
          },
          { bg: 'Повторете нагоре и наляво.', en: 'Repeat up and to the left.' },
          { bg: 'Бавно се изправете, отпуснете ушите и се разходете.', en: 'Slowly stand, release the ears, and walk.' },
        ],
      },
    ],
  },
  {
    id: 'horn-twist',
    slug: 'usukvane-roga',
    category: 'full-body',
    order: 11,
    title: { bg: 'Усукване „Рога“', en: '“Horns” Twist' },
    intro: [
      {
        bg: 'Фасцията и кожата около главата могат да натрупват напрежение. Главата и вратът са почти постоянно активни през деня, защото поддържат погледа, стойката и ориентацията ни.',
        en: 'The fascia and skin around the head can accumulate tension. The head and neck are almost constantly active throughout the day because they support our gaze, posture, and orientation.',
      },
      {
        bg: 'При „Усукване Рога“ дланите се използват за леко противоположно завъртане на кожата около слепоочията. Така се създава контра-ротационен стимул около глава и врат, който се комбинира с движение и дишане.',
        en: 'In the “Horns” Twist, the palms are used to gently rotate the skin around the temples in opposite directions. This creates a counter-rotational stimulus around the head and neck, combined with movement and breathing.',
      },
    ],
    benefits: [
      { bg: 'Намалява усещането за натиск и напрежение в главата.', en: 'Reduces the sensation of pressure and tension in the head.' },
      { bg: 'Намалява умората около очите.', en: 'Reduces fatigue around the eyes.' },
      { bg: 'Подпомага усещането за яснота и фокус.', en: 'Supports a feeling of clarity and focus.' },
      { bg: 'Работи с напрежението в гръдния кош и таза чрез контра-ротация.', en: 'Works with tension in the chest and pelvis through counter-rotation.' },
      { bg: 'Подпомага осъзнаването на лицевата симетрия.', en: 'Supports awareness of facial symmetry.' },
    ],
    instructions: [
      {
        steps: [
          { bg: 'Застанете с крака на ширината на раменете.', en: 'Stand with your feet shoulder-width apart.' },
          { bg: 'Активирайте гръбначно-тазовото заключване.', en: 'Activate the spinal-pelvic lock.' },
          {
            bg: 'Поставете дясната длан върху дясното слепоочие с пръсти насочени назад.',
            en: 'Place your right palm on your right temple with your fingers pointing backward.',
          },
          {
            bg: 'Поставете лявата длан върху лявото слепоочие с пръсти насочени напред.',
            en: 'Place your left palm on your left temple with your fingers pointing forward.',
          },
          { bg: 'Притиснете главата съвсем леко между дланите.', en: 'Gently press your head between your palms.' },
          {
            bg: 'Завъртете дясната длан напред, като запазите стабилен контакт с кожата.',
            en: 'Rotate your right palm forward while maintaining stable contact with the skin.',
          },
          { bg: 'Завъртете лявата длан назад.', en: 'Rotate your left palm backward.' },
          { bg: 'Пръстите и на двете ръце постепенно се насочват нагоре.', en: 'Gradually direct the fingers of both hands upward.' },
          { bg: 'Преплетете пръстите върху челото.', en: 'Interlace your fingers across your forehead.' },
          { bg: 'Вдишайте през носа и погледнете надясно.', en: 'Inhale through your nose and look to the right.' },
          { bg: 'Издишайте при връщане към центъра.', en: 'Exhale as you return to center.' },
          { bg: 'Вдишайте през носа и погледнете наляво.', en: 'Inhale through your nose and look to the left.' },
          { bg: 'Издишайте към центъра.', en: 'Exhale toward center.' },
          { bg: 'Погледнете нагоре, вдишайте през носа и влезте в клек.', en: 'Look upward, inhale through your nose, and move into a squat.' },
          {
            bg: 'Погледнете нагоре и надясно, вдишайте и издишайте към центъра.',
            en: 'Look up and to the right, inhale, and exhale toward center.',
          },
          { bg: 'Повторете нагоре и наляво.', en: 'Repeat up and to the left.' },
          { bg: 'Бавно се изправете и отпуснете ръцете.', en: 'Slowly stand and release your hands.' },
          { bg: 'Разходете се.', en: 'Walk.' },
        ],
      },
    ],
  },
  {
    id: 'cheek-release',
    slug: 'osvobozhdavane-na-buzite',
    category: 'full-body',
    order: 12,
    title: { bg: 'Освобождаване на бузите', en: 'Cheek Release' },
    intro: [
      {
        bg: 'Много хора поддържат хронично напрежение в челюстта. Често задържаме мисли и чувства, за да избегнем конфликт — неслучайно съществува изразът „прехапвам си езика“. Всеки път, когато ограничаваме изразяването си, може да се увеличи усещането за вътрешно напрежение.',
        en: 'Many people maintain chronic tension in the jaw. We often hold back thoughts and feelings to avoid conflict — hence the expression “bite my tongue.” Every time we restrict our expression, the sensation of internal tension may increase.',
      },
      {
        bg: 'Съвременният начин на хранене също може да влияе върху работата на челюстта. Меките и силно преработени храни изискват по-малко дъвчене, а дъвкателният апарат е създаден за редовно движение.',
        en: 'Modern eating habits may also influence how the jaw functions. Soft and highly processed foods require less chewing, while the chewing apparatus is designed for regular movement.',
      },
      {
        bg: 'Челюстта често отразява нивото на стрес. Когато е силно стегната, напрежението може да се усеща надолу по врата и цялата странична линия на тялото. Тази маневра използва противоположно завъртане на меките тъкани върху дъвкателните мускули, подобно на „Усукване Рога“.',
        en: 'The jaw often reflects our level of stress. When it is highly tense, the tension may be felt down through the neck and along the entire side of the body. This maneuver uses opposite rotation of the soft tissues over the chewing muscles, similar to the “Horns” Twist.',
      },
    ],
    benefits: [
      {
        bg: 'Намалява напрежението и дискомфорта в челюстта и областта на ТМС.',
        en: 'Reduces tension and discomfort in the jaw and TMJ area.',
      },
      { bg: 'Може да намали навика за стискане и скърцане със зъби.', en: 'May reduce the habit of clenching and grinding the teeth.' },
      { bg: 'Намалява общото усещане за стрес.', en: 'Reduces the overall sensation of stress.' },
      { bg: 'Работи с напрежението във врата и главата.', en: 'Works with tension in the neck and head.' },
      { bg: 'Чрез цялостната позиция включва глезените и пръстите на краката.', en: 'Through the overall position, engages the ankles and toes.' },
    ],
    instructions: [
      {
        steps: [
          { bg: 'Застанете с крака на ширината на раменете.', en: 'Stand with your feet shoulder-width apart.' },
          { bg: 'Активирайте заключването.', en: 'Activate the lock.' },
          {
            bg: 'Поставете пръстите на дясната ръка, насочени назад, върху дясната страна на челюстта — в горната част на дъвкателния мускул, точно под скулата.',
            en: 'Place the fingers of your right hand, pointing backward, on the right side of your jaw — over the upper part of the chewing muscle, just below the cheekbone.',
          },
          {
            bg: 'Поставете пръстите на лявата ръка, насочени напред, върху лявата страна на челюстта.',
            en: 'Place the fingers of your left hand, pointing forward, on the left side of your jaw.',
          },
          { bg: 'Притиснете лицето леко между ръцете.', en: 'Gently compress the face between your hands.' },
          {
            bg: 'Завъртете дясната ръка напред, запазвайки контакт с кожата.',
            en: 'Rotate your right hand forward while maintaining contact with the skin.',
          },
          { bg: 'Завъртете лявата ръка назад.', en: 'Rotate your left hand backward.' },
          { bg: 'Пръстите и на двете ръце постепенно се насочват нагоре.', en: 'Gradually direct the fingers of both hands upward.' },
          { bg: 'Вдишайте през носа и погледнете надясно.', en: 'Inhale through your nose and look to the right.' },
          { bg: 'Издишайте при връщане на главата към центъра.', en: 'Exhale as you return your head to center.' },
          { bg: 'Вдишайте през носа и погледнете наляво.', en: 'Inhale through your nose and look to the left.' },
          { bg: 'Издишайте към центъра.', en: 'Exhale toward center.' },
          { bg: 'Вдишайте през носа и погледнете нагоре.', en: 'Inhale through your nose and look upward.' },
          { bg: 'Влезте в клек.', en: 'Move into a squat.' },
          { bg: 'Погледнете нагоре и надясно и вдишайте през носа.', en: 'Look up and to the right and inhale through your nose.' },
          { bg: 'Издишайте към центъра.', en: 'Exhale toward center.' },
          { bg: 'Погледнете нагоре и наляво и вдишайте през носа.', en: 'Look up and to the left and inhale through your nose.' },
          { bg: 'Издишайте към центъра.', en: 'Exhale toward center.' },
          { bg: 'Бавно се изправете и отпуснете ръцете.', en: 'Slowly stand and release your hands.' },
          { bg: 'Разходете се.', en: 'Walk.' },
        ],
      },
    ],
  },
  {
    id: 'organ-reset',
    slug: 'restart-na-organite',
    category: 'organ-reset',
    order: 13,
    title: { bg: 'Рестарт на органите', en: 'Organ Reset' },
    intro: [
      {
        bg: 'В оригиналната система всеки орган се разглежда едновременно като механична, електрохимична и емоционална част от цялото тяло. В тази серия се използва лек натиск с ръце, движение и насочено дишане около зоните, в които се намират органите, с цел по-добра телесна осъзнатост и отпускане на околните меки тъкани.',
        en: 'In the original system, each organ is viewed simultaneously as a mechanical, electrochemical, and emotional part of the whole body. This series uses gentle pressure with the hands, movement, and directed breathing around the areas where the organs are located, with the aim of increasing body awareness and relaxing the surrounding soft tissues.',
      },
    ],
    safetyNote: {
      bg: 'Органите не трябва да се притискат силно. Ако имате операция, херния, възпалително заболяване, бременност, необяснима коремна болка, увеличен орган, жлъчни/бъбречни камъни или друго медицинско състояние, консултирайте се със здравен специалист преди подобна практика.',
      en: 'Organs should not be pressed firmly. If you have had surgery, have a hernia, inflammatory disease, are pregnant, have unexplained abdominal pain, an enlarged organ, gallstones or kidney stones, or another medical condition, consult a healthcare professional before attempting this type of practice.',
    },
    childIds: [
      'organ-reset-ileocecal-valve',
      'organ-reset-gallbladder-liver',
      'organ-reset-stomach',
      'organ-reset-pancreas',
      'organ-reset-bladder',
      'organ-reset-kidneys',
      'organ-reset-spleen',
      'organ-reset-thyroid',
    ],
  },
  {
    id: 'organ-reset-ileocecal-valve',
    slug: 'ileotsekalna-klapa',
    category: 'organ-reset',
    order: 14,
    parentId: 'organ-reset',
    title: { bg: 'Илеоцекална клапа', en: 'Ileocecal Valve' },
    intro: [
      {
        bg: 'Илеоцекалната клапа е малък сфинктер между тънкото и дебелото черво. Тя регулира преминаването на съдържимото от тънкото към дебелото черво. В оригиналната система се използва лек натиск в областта, където приблизително се намира клапата, като част от общата работа с коремната стена и зона 2.',
        en: 'The ileocecal valve is a small sphincter between the small and large intestines. It regulates the passage of contents from the small intestine into the large intestine. In the original system, gentle pressure is applied in the approximate area of the valve as part of the overall work with the abdominal wall and Zone 2.',
      },
    ],
    benefits: [
      { bg: 'Подпомага усещането за по-малко подуване и газове.', en: 'Supports the feeling of reduced bloating and gas.' },
      {
        bg: 'Насочва внимание към движението между тънкото и дебелото черво.',
        en: 'Directs attention toward movement between the small and large intestines.',
      },
      { bg: 'Подпомага регулярността на храносмилателните навици.', en: 'Supports regularity of digestive habits.' },
      { bg: 'Работи с напрежението в дясната страна на таза и корема.', en: 'Works with tension on the right side of the pelvis and abdomen.' },
    ],
    instructions: [
      {
        steps: [
          { bg: 'Застанете с крака на ширината на раменете.', en: 'Stand with your feet shoulder-width apart.' },
          { bg: 'Активирайте гръбначно-тазовото заключване.', en: 'Activate the spinal-pelvic lock.' },
          { bg: 'Поставете лявата ръка върху единия трапецовиден мускул.', en: 'Place your left hand on one trapezius muscle.' },
          {
            bg: 'С дясната ръка намерете пъпа, преместете пръстите около 5 см надясно и приблизително 2–3 см надолу.',
            en: 'With your right hand, locate your navel, then move your fingers approximately 5 cm to the right and about 2–3 cm downward.',
          },
          {
            bg: 'Намерете чувствителна, но не болезнена зона в тази част на корема. Не търсете „органа“ чрез силно натискане.',
            en: 'Find a sensitive but non-painful area in this part of the abdomen. Do not try to locate the “organ” by pressing firmly.',
          },
          {
            bg: 'Притиснете кожата и повърхностните тъкани леко надолу и завъртете по часовниковата стрелка.',
            en: 'Gently press the skin and superficial tissues downward and rotate clockwise.',
          },
          { bg: 'Завъртете главата наляво.', en: 'Turn your head to the left.' },
          { bg: 'Завъртете горната част на тялото надясно.', en: 'Rotate your upper body to the right.' },
          { bg: 'Направете 3 цикъла дишане през устата.', en: 'Perform 3 breathing cycles through your mouth.' },
          {
            bg: 'Направете 3 вдишвания през носа и издишвания през устата.',
            en: 'Perform 3 breaths in through the nose and out through the mouth.',
          },
          { bg: 'Върнете се в неутрално положение.', en: 'Return to a neutral position.' },
          { bg: 'Разходете се.', en: 'Walk.' },
        ],
      },
    ],
  },
  {
    id: 'organ-reset-gallbladder-liver',
    slug: 'zhlachen-mehur-i-cheren-drob',
    category: 'organ-reset',
    order: 15,
    parentId: 'organ-reset',
    title: { bg: 'Жлъчен мехур и черен дроб', en: 'Gallbladder and Liver' },
    intro: [
      {
        bg: 'Жлъчният мехур се намира под черния дроб и съхранява жлъчка, която подпомага храносмилането на мазнините. Черният дроб изпълнява множество важни функции, включително обработка на хранителни вещества, метаболизиране на вещества и детоксикационни процеси.',
        en: 'The gallbladder is located beneath the liver and stores bile, which supports the digestion of fats. The liver performs many important functions, including processing nutrients, metabolizing substances, and detoxification processes.',
      },
      {
        bg: 'Оригиналният материал свързва определени меридианни линии с жлъчния мехур и описва линия от челото, зад ухото, през трапеца, лопатката, външната част на крака и към ходилото. Тези идеи идват от традиционни енергийни системи и не са анатомични структури в смисъла на съвременната медицина.',
        en: 'The original material connects certain meridian lines with the gallbladder and describes a line from the forehead, behind the ear, through the trapezius, shoulder blade, outer leg, and toward the foot. These ideas come from traditional energy systems and are not anatomical structures in the sense of modern medicine.',
      },
      {
        bg: 'В оригиналната философия жлъчният мехур се свързва с усещане за негодувание, а черният дроб — с гняв; балансираното състояние се асоциира със спокойствие, щедрост и прошка.',
        en: 'In the original philosophy, the gallbladder is associated with a feeling of resentment, while the liver is associated with anger; a balanced state is associated with calmness, generosity, and forgiveness.',
      },
    ],
    benefits: [
      { bg: 'Намалява усещането за подуване.', en: 'Reduces the sensation of bloating.' },
      { bg: 'Подпомага отпускането при напрежение и тревожност.', en: 'Supports relaxation during tension and anxiety.' },
      { bg: 'Работи с напрежението около ребрата и раменете.', en: 'Works with tension around the ribs and shoulders.' },
      {
        bg: 'Работи със средната част на гърба, ходилата и вътрешната част на краката чрез общата позиция.',
        en: 'Works with the middle back, feet, and inner legs through the overall position.',
      },
      { bg: 'Може да подпомогне усещането за емоционално отпускане.', en: 'May support a sense of emotional relaxation.' },
    ],
    instructions: [
      {
        steps: [
          { bg: 'Застанете с крака на ширината на раменете.', en: 'Stand with your feet shoulder-width apart.' },
          {
            bg: 'Поставете лявата ръка върху единия трапецовиден мускул и изтеглете леко нагоре.',
            en: 'Place your left hand on one trapezius muscle and gently draw it upward.',
          },
          {
            bg: 'Поставете пръстите на дясната ръка в основата на гръдната кост и се преместете около 5 см надясно.',
            en: 'Place the fingers of your right hand at the base of the sternum and move approximately 5 cm to the right.',
          },
          {
            bg: 'Плъзнете пръстите надолу до долния край на ребрата и меката част на корема.',
            en: 'Slide your fingers downward to the lower edge of the ribs and the soft area of the abdomen.',
          },
          { bg: 'Притиснете леко меките тъкани, без дълбоко натискане.', en: 'Gently press the soft tissues without applying deep pressure.' },
          {
            bg: 'Завъртете пръстите обратно на часовниковата стрелка, така че палецът да се насочи нагоре.',
            en: 'Rotate your fingers counterclockwise so that your thumb points upward.',
          },
          { bg: 'Завъртете главата наляво и торса надясно.', en: 'Turn your head to the left and your torso to the right.' },
          {
            bg: 'Направете 3 дълбоки цикъла вдишване и издишване през устата.',
            en: 'Perform 3 deep breathing cycles in and out through your mouth.',
          },
          {
            bg: 'Направете 3 вдишвания през носа и издишвания през устата.',
            en: 'Perform 3 breaths in through the nose and out through the mouth.',
          },
          { bg: 'Върнете се в нормален стоеж.', en: 'Return to a normal standing position.' },
          { bg: 'Разходете се.', en: 'Walk.' },
        ],
      },
    ],
  },
  {
    id: 'organ-reset-stomach',
    slug: 'stomah',
    category: 'organ-reset',
    order: 16,
    parentId: 'organ-reset',
    title: { bg: 'Стомах', en: 'Stomach' },
    intro: [
      {
        bg: 'Стомахът механично и химично разгражда храната и я подготвя за по-нататъшно храносмилане и усвояване. Проблеми като болка, подуване, газове или киселини могат да имат много причини и при чести или силни симптоми е необходима медицинска оценка.',
        en: 'The stomach mechanically and chemically breaks down food and prepares it for further digestion and absorption. Problems such as pain, bloating, gas, or heartburn can have many causes, and frequent or severe symptoms require medical evaluation.',
      },
    ],
    benefits: [
      { bg: 'Може да създаде усещане за отпускане на коремната стена.', en: 'May create a sensation of relaxation in the abdominal wall.' },
      { bg: 'Работи с напрежението в предната част на бедрата чрез позицията.', en: 'Works with tension in the front of the thighs through the position.' },
      {
        bg: 'Подпомага телесната активност и усещането за готовност за движение.',
        en: 'Supports physical activity and a sense of readiness for movement.',
      },
    ],
    instructions: [
      {
        steps: [
          {
            bg: 'Поставете лявата ръка върху единия трапецовиден мускул и изтеглете леко нагоре.',
            en: 'Place your left hand on one trapezius muscle and gently draw it upward.',
          },
          {
            bg: 'Поставете дясната ръка под лявата ребрена дъга в областта над стомаха.',
            en: 'Place your right hand beneath the left rib cage in the area above the stomach.',
          },
          { bg: 'Притиснете леко тъканите нагоре и ги изтеглете надясно.', en: 'Gently press the tissues upward and draw them to the right.' },
          { bg: 'Завъртете главата наляво и горната част на тялото надясно.', en: 'Turn your head to the left and your upper body to the right.' },
          { bg: 'Направете 3 цикъла вдишване и издишване през устата.', en: 'Perform 3 breathing cycles in and out through your mouth.' },
          {
            bg: 'Направете 3 вдишвания през носа и издишвания през устата.',
            en: 'Perform 3 breaths in through the nose and out through the mouth.',
          },
          { bg: 'Отпуснете и се върнете в нормален стоеж.', en: 'Release and return to a normal standing position.' },
        ],
      },
    ],
  },
  {
    id: 'organ-reset-pancreas',
    slug: 'pankreas',
    category: 'organ-reset',
    order: 17,
    parentId: 'organ-reset',
    title: { bg: 'Панкреас', en: 'Pancreas' },
    intro: [
      {
        bg: 'Панкреасът произвежда храносмилателни ензими и хормони, включително инсулин, който участва в регулирането на кръвната захар. Нарушенията във функцията на панкреаса могат да бъдат сериозни медицински състояния и не се лекуват чрез фасциална маневра.',
        en: 'The pancreas produces digestive enzymes and hormones, including insulin, which participates in regulating blood sugar. Disorders of pancreatic function can be serious medical conditions and are not treated through a fascial maneuver.',
      },
      {
        bg: 'Оригиналната философия свързва областта на панкреаса с усещания за доверие, отвореност и тревожност.',
        en: 'The original philosophy associates the area of the pancreas with feelings of trust, openness, and anxiety.',
      },
    ],
    benefits: [
      { bg: 'Насочва внимание към централната част на корема.', en: 'Directs attention toward the central area of the abdomen.' },
      {
        bg: 'Работи с напрежението в лявата страна на таза чрез контра-ротацията.',
        en: 'Works with tension on the left side of the pelvis through counter-rotation.',
      },
      { bg: 'Може да подпомогне усещането за спокойствие и фокус.', en: 'May support a sense of calm and focus.' },
    ],
    instructions: [
      {
        steps: [
          {
            bg: 'С дясната ръка намерете пъпа и преместете пръстите около 5 см надясно и 2–3 см надолу.',
            en: 'With your right hand, locate your navel and move your fingers approximately 5 cm to the right and 2–3 cm downward.',
          },
          {
            bg: 'Хванете повърхностно кожата и изтеглете тъканите леко нагоре.',
            en: 'Gently grasp the superficial skin and draw the tissues slightly upward.',
          },
          { bg: 'Завъртете главата наляво.', en: 'Turn your head to the left.' },
          { bg: 'Завъртете горната част на тялото надясно.', en: 'Rotate your upper body to the right.' },
          { bg: 'Направете 3 цикъла вдишване и издишване през устата.', en: 'Perform 3 breathing cycles in and out through your mouth.' },
          {
            bg: 'Направете 3 вдишвания през носа и издишвания през устата.',
            en: 'Perform 3 breaths in through the nose and out through the mouth.',
          },
          { bg: 'Върнете се в нормален стоеж.', en: 'Return to a normal standing position.' },
          { bg: 'Разходете се.', en: 'Walk.' },
        ],
      },
    ],
  },
  {
    id: 'organ-reset-bladder',
    slug: 'pikochen-mehur',
    category: 'organ-reset',
    order: 18,
    parentId: 'organ-reset',
    title: { bg: 'Пикочен мехур', en: 'Bladder' },
    intro: [
      {
        bg: 'Пикочният мехур съхранява урината до момента на уриниране. В оригиналната система областта на пикочния мехур се свързва и с емоцията страх, а усещането за увереност се разглежда като противоположно състояние.',
        en: 'The bladder stores urine until the time of urination. In the original system, the bladder area is also associated with the emotion of fear, while a sense of confidence is viewed as the opposite state.',
      },
    ],
    benefits: [
      { bg: 'Работи с усещането за напрежение ниско в таза.', en: 'Works with the sensation of tension low in the pelvis.' },
      {
        bg: 'Насочва внимание към сакрума и опашната кост чрез позицията.',
        en: 'Directs attention toward the sacrum and tailbone through the position.',
      },
      { bg: 'Работи с позицията на таза.', en: 'Works with pelvic positioning.' },
      { bg: 'Може да подпомогне чувството за спокойствие и увереност.', en: 'May support a sense of calm and confidence.' },
    ],
    safetyNote: {
      bg: 'Ако имате изпускане на урина, болка, парене или чести инфекции, потърсете медицинска оценка. Тези симптоми имат различни причини и не бива да се приемат като проблем, който се „коригира“ само с натиск.',
      en: 'If you experience urinary leakage, pain, burning, or frequent infections, seek medical evaluation. These symptoms have different causes and should not be considered a problem that can be “corrected” through pressure alone.',
    },
    instructions: [
      {
        steps: [
          {
            bg: 'Поставете едната или двете ръце ниско върху корема, точно над срамната кост.',
            en: 'Place one or both hands low on the abdomen, just above the pubic bone.',
          },
          { bg: 'Притиснете леко и изтеглете кожата нагоре.', en: 'Gently press and draw the skin upward.' },
          { bg: 'Завъртете главата наляво.', en: 'Turn your head to the left.' },
          { bg: 'Завъртете горната част на тялото надясно.', en: 'Rotate your upper body to the right.' },
          {
            bg: 'Наклонете се леко назад, като внимавате да не притискате силно долната част на корема, и погледнете нагоре.',
            en: 'Lean slightly backward, taking care not to apply strong pressure to the lower abdomen, and look upward.',
          },
          { bg: 'Направете 3 цикъла дишане през устата.', en: 'Perform 3 breathing cycles through your mouth.' },
          {
            bg: 'Направете 3 вдишвания през носа и издишвания през устата.',
            en: 'Perform 3 breaths in through the nose and out through the mouth.',
          },
          { bg: 'Върнете се в нормален стоеж.', en: 'Return to a normal standing position.' },
          { bg: 'Разходете се.', en: 'Walk.' },
        ],
      },
    ],
  },
  {
    id: 'organ-reset-kidneys',
    slug: 'babretsi',
    category: 'organ-reset',
    order: 19,
    parentId: 'organ-reset',
    title: { bg: 'Бъбреци', en: 'Kidneys' },
    intro: [
      {
        bg: 'Бъбреците регулират течностите и електролитите, филтрират кръвта и участват в множество хормонални процеси. Над тях са разположени надбъбречните жлези, които произвеждат хормони, свързани със стресовата реакция.',
        en: 'The kidneys regulate fluids and electrolytes, filter the blood, and participate in numerous hormonal processes. Above them are the adrenal glands, which produce hormones associated with the stress response.',
      },
    ],
    benefits: [
      {
        bg: 'Създава усещане за повече енергия и отваряне на задната част на торса.',
        en: 'Creates a sense of increased energy and opening through the back of the torso.',
      },
      { bg: 'Работи с напрежението около раменете и ребрата.', en: 'Works with tension around the shoulders and ribs.' },
      { bg: 'Подпомага по-дълбокото дишане към задната част на гръдния кош.', en: 'Supports deeper breathing into the back of the chest.' },
    ],
    instructions: [
      {
        label: { bg: 'Част 1', en: 'Part 1' },
        steps: [
          {
            bg: 'Поставете дясната ръка върху единия трапецовиден мускул и изтеглете леко нагоре.',
            en: 'Place your right hand on one trapezius muscle and gently draw it upward.',
          },
          {
            bg: 'Поставете лявата ръка върху страничната част на горната лява ребрена дъга, приблизително на нивото на зърното.',
            en: 'Place your left hand on the side of the upper left rib cage, approximately at nipple level.',
          },
          {
            bg: 'Притиснете ребрата леко и изтеглете повърхностните тъкани надолу.',
            en: 'Gently press the ribs and draw the superficial tissues downward.',
          },
          {
            bg: 'Направете 6 дълбоки вдишвания през устата, като насочвате разширяването към горната и средната част на гърба.',
            en: 'Take 6 deep breaths through your mouth, directing the expansion toward the upper and middle back.',
          },
        ],
      },
      {
        label: { bg: 'Част 2', en: 'Part 2' },
        steps: [
          {
            bg: 'Поставете лявата ръка върху трапецовидния мускул и изтеглете леко нагоре.',
            en: 'Place your left hand on the trapezius muscle and gently draw it upward.',
          },
          {
            bg: 'Поставете дясната ръка върху страничната част на горната дясна ребрена дъга.',
            en: 'Place your right hand on the side of the upper right rib cage.',
          },
          { bg: 'Притиснете леко и изтеглете тъканите надолу.', en: 'Gently press and draw the tissues downward.' },
          {
            bg: 'Направете 6 дълбоки вдишвания през устата, насочвайки разширяването към задната част на гръдния кош.',
            en: 'Take 6 deep breaths through your mouth, directing the expansion toward the back of the chest.',
          },
        ],
      },
    ],
  },
  {
    id: 'organ-reset-spleen',
    slug: 'dalak',
    category: 'organ-reset',
    order: 20,
    parentId: 'organ-reset',
    title: { bg: 'Далак', en: 'Spleen' },
    intro: [
      {
        bg: 'Далакът участва във филтрирането на кръвта и в имунната функция. Той се намира в горната лява част на корема, под ребрата. При увеличен далак или травма в тази зона дълбок натиск може да бъде опасен.',
        en: 'The spleen participates in filtering the blood and in immune function. It is located in the upper left abdomen beneath the ribs. With an enlarged spleen or trauma to this area, deep pressure can be dangerous.',
      },
      { bg: 'Оригиналната философия свързва далака с емоцията тревога.', en: 'The original philosophy associates the spleen with the emotion of worry.' },
    ],
    benefits: [
      { bg: 'Подпомага усещането за спокойна енергия.', en: 'Supports a feeling of calm energy.' },
      { bg: 'Насочва внимание към лявата страна на торса.', en: 'Directs attention toward the left side of the torso.' },
      {
        bg: 'Оригиналният материал свързва практиката с паметта, кожата, косата и ноктите.',
        en: 'The original material connects the practice with memory, skin, hair, and nails.',
      },
    ],
    instructions: [
      {
        steps: [
          {
            bg: 'Поставете дясната ръка върху трапецовиден мускул и изтеглете леко нагоре.',
            en: 'Place your right hand on the trapezius muscle and gently draw it upward.',
          },
          { bg: 'Поставете лявата ръка в основата на лявата ребрена дъга.', en: 'Place your left hand at the base of the left rib cage.' },
          {
            bg: 'Проследете долния ръб на ребрата встрани и назад към лявата страна на гръбнака.',
            en: 'Follow the lower edge of the ribs outward and backward toward the left side of the spine.',
          },
          {
            bg: 'Поставете палеца в меките тъкани в тази зона, без дълбоко натискане, и обхванете леко талията с ръката.',
            en: 'Place your thumb into the soft tissues in this area without applying deep pressure, and gently wrap your hand around the waist.',
          },
          { bg: 'Направете 3 цикъла вдишване и издишване през устата.', en: 'Perform 3 breathing cycles in and out through your mouth.' },
          {
            bg: 'Направете 3 вдишвания през носа и издишвания през устата.',
            en: 'Perform 3 breaths in through the nose and out through the mouth.',
          },
          { bg: 'Отпуснете и се разходете.', en: 'Release and walk.' },
        ],
      },
    ],
  },
  {
    id: 'organ-reset-thyroid',
    slug: 'shtitovidna-zhleza',
    category: 'organ-reset',
    order: 21,
    parentId: 'organ-reset',
    title: { bg: 'Щитовидна жлеза', en: 'Thyroid Gland' },
    intro: [
      {
        bg: 'Щитовидната жлеза е малка жлеза с форма на пеперуда в предната част на врата. Тя произвежда хормони, които участват в регулирането на метаболизма, температурата, енергията и множество телесни процеси.',
        en: 'The thyroid is a small butterfly-shaped gland at the front of the neck. It produces hormones that participate in regulating metabolism, temperature, energy, and numerous bodily processes.',
      },
    ],
    safetyNote: {
      bg: 'Намалената или повишената функция на щитовидната жлеза са медицински състояния, които се диагностицират с преглед и изследвания. Фасциалната работа около врата не замества лечение на хипотиреоидизъм или хипертиреоидизъм.',
      en: 'Reduced or increased thyroid function are medical conditions diagnosed through examination and testing. Fascial work around the neck does not replace treatment for hypothyroidism or hyperthyroidism.',
    },
    benefits: [
      { bg: 'Работи с напрежението в предната част на врата.', en: 'Works with tension in the front of the neck.' },
      { bg: 'Подпомага телесната осъзнатост в зона 1.', en: 'Supports body awareness in Zone 1.' },
      {
        bg: 'Може да създаде усещане за повече пространство около гърлото и по-свободно дишане.',
        en: 'May create a sense of more space around the throat and freer breathing.',
      },
    ],
    instructions: [
      {
        steps: [
          {
            bg: 'Поставете дясната ръка върху предната част на врата, без натиск върху трахеята.',
            en: 'Place your right hand on the front of your neck, without applying pressure to the trachea.',
          },
          { bg: 'Поставете лявата ръка върху задната част на врата.', en: 'Place your left hand on the back of your neck.' },
          {
            bg: 'С дясната ръка изтеглете само кожата и повърхностните тъкани леко нагоре и задръжте.',
            en: 'With your right hand, draw only the skin and superficial tissues gently upward and hold.',
          },
          { bg: 'Направете 3 цикъла дишане през устата.', en: 'Perform 3 breathing cycles through your mouth.' },
          {
            bg: 'Направете 3 вдишвания през носа и издишвания през устата.',
            en: 'Perform 3 breaths in through the nose and out through the mouth.',
          },
          { bg: 'Отпуснете ръцете и се разходете.', en: 'Release your hands and walk.' },
        ],
      },
    ],
  },
  {
    id: 'heart-brain-coherence',
    slug: 'koherentnost-sartse-mozak',
    category: 'closing',
    order: 22,
    title: { bg: 'Кохерентност сърце–мозък', en: 'Heart–Brain Coherence' },
    intro: [
      {
        bg: 'През деня често усещаме напрежение между това, което емоционално искаме, и това, което разумът ни казва, че „трябва“ да направим. Практиката за кохерентност сърце–мозък насочва вниманието последователно към областта на сърцето и към главата с цел да се съчетаят емоционалното преживяване и рационалното мислене.',
        en: 'During the day, we often experience tension between what we emotionally want and what our rational mind tells us we “should” do. The heart–brain coherence practice directs attention sequentially toward the heart area and the head with the aim of bringing emotional experience and rational thinking together.',
      },
    ],
    benefits: [
      { bg: 'Успокоява препускащите мисли и стреса.', en: 'Calms racing thoughts and stress.' },
      { bg: 'Помага за по-силно усещане за присъствие в тялото.', en: 'Helps create a stronger sense of presence in the body.' },
      { bg: 'Подпомага баланса между физическото и емоционалното преживяване.', en: 'Supports balance between physical and emotional experience.' },
    ],
    instructions: [
      {
        steps: [
          { bg: 'Поставете дясната ръка върху гърдите в областта на сърцето.', en: 'Place your right hand on your chest over the heart area.' },
          { bg: 'Поставете лявата ръка върху върха на главата.', en: 'Place your left hand on the top of your head.' },
          { bg: 'Затворете очи.', en: 'Close your eyes.' },
          { bg: 'Направете 3 цикъла вдишване и издишване през устата.', en: 'Perform 3 breathing cycles in and out through your mouth.' },
          {
            bg: 'Направете 3 вдишвания през носа и издишвания през устата.',
            en: 'Perform 3 breaths in through the nose and out through the mouth.',
          },
          {
            bg: 'Насочете цялото си внимание към областта на сърцето и усещанията там.',
            en: 'Direct your full attention toward the heart area and the sensations there.',
          },
          { bg: 'След това насочете вниманието към главата и мислите.', en: 'Then direct your attention toward your head and your thoughts.' },
          {
            bg: 'Премествайте вниманието няколко пъти между сърцето и главата.',
            en: 'Move your attention several times between the heart and the head.',
          },
          { bg: 'Отпуснете се и дишайте бавно и дълбоко.', en: 'Relax and breathe slowly and deeply.' },
          { bg: 'Отворете очи и направете кратка разходка.', en: 'Open your eyes and take a short walk.' },
          { bg: 'Запитайте се: Как се чувствам сега?', en: 'Ask yourself: How do I feel now?' },
        ],
      },
    ],
  },
  {
    id: 'body-scan-2',
    slug: 'body-scan-2',
    category: 'closing',
    order: 23,
    title: { bg: 'Сканиране на тялото #2', en: 'Body Scan #2' },
    intro: [
      {
        bg: 'Благодарете си, че отделихте време за грижа към собственото си тяло. Позволете си за момент да усетите благодарност за това, което тялото ви прави за вас всеки ден.',
        en: 'Thank yourself for taking the time to care for your own body. Allow yourself a moment to feel gratitude for what your body does for you every day.',
      },
    ],
    instructions: [
      {
        steps: [
          { bg: 'Седнете, застанете или легнете удобно.', en: 'Sit, stand, or lie down comfortably.' },
          {
            bg: 'Поемете дълбоко въздух през носа и издишайте през устата.',
            en: 'Take a deep breath through your nose and exhale through your mouth.',
          },
          { bg: 'При издишването затворете очи.', en: 'As you exhale, close your eyes.' },
          { bg: 'Забележете как се чувства тялото ви в този момент.', en: 'Notice how your body feels in this moment.' },
          {
            bg: 'Започнете от върха на главата и преминете бавно с внимание надолу до пръстите на краката.',
            en: 'Start at the top of your head and slowly move your attention downward to your toes.',
          },
          {
            bg: 'Отбележете кое усещане е комфортно и кое не. Не го оценявайте и не се опитвайте веднага да го промените.',
            en: 'Notice which sensations feel comfortable and which do not. Do not judge them or immediately try to change them.',
          },
          {
            bg: 'Сравнете с първото сканиране: променила ли се е някоя зона? Има ли повече лекота, топлина, стабилност или движение? Има ли зона, която изисква повече внимание?',
            en: 'Compare this with the first scan: has anything changed in any area? Is there more ease, warmth, stability, or movement? Is there an area that requires more attention?',
          },
          { bg: 'Когато сте готови, отворете очи.', en: 'When you are ready, open your eyes.' },
        ],
      },
    ],
  },
];
