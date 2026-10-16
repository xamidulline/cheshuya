export type Locale = "ru" | "en";

const copy = {
  ru: {
    outside: "Работа в среде", inside: "Работа с материалом", menu: "Меню", close: "Закрыть",
    streetTitle: "В среде", insideTitle: "В материале",
    streetText: "Поиск новых мест и сооружений за пределами привычных маршрутов. Работа начинается со знакомства с пространством и его особенностями. Рисунок создаётся на месте, без предварительного эскиза, и меняется в зависимости от поверхности и окружающих условий.",
    instagram: "Instagram", video: "Видео", zines: "Зины", cyanotype: "Цианотипия", shirts: "Футболки",
    zinesText: "Издания о месте, слоях и маршрутах уличных работ.",
    cyanotypeText: "Работа с воспоминаниями через технику цианотипии. Каждый отпечаток получается немного другим из-за случайностей и особенностей процесса. Эти изменения перекликаются с тем, как воспоминания со временем теряют одни детали и приобретают другие.",
    comingSoon: "Раздел готовится", objectsLead: "Работа с разными материалами и сочетанием техник. Их свойства и способы обработки становятся основой для экспериментов и импровизации. Форма определяется в процессе работы, а готовые объекты могут существовать в разных пространствах и контекстах.",
    exhibitions: "Выставки", objects: "Объекты", graphics: "Графика", all: "Смотреть раздел",
    metal: "Металл", ceramics: "Керамика", roots: "Корни",
  },
  en: {
    outside: "Work in context", inside: "Work with material", menu: "Menu", close: "Close",
    streetTitle: "In context", insideTitle: "In material",
    streetText: "Searching for new places and structures beyond familiar routes. The work begins with getting to know the space and its particular features. The drawing is created on site, without a preliminary sketch, and changes in response to the surface and surrounding conditions.",
    instagram: "Instagram", video: "Video", zines: "Zines", cyanotype: "Cyanotype", shirts: "T-shirts",
    zinesText: "Publications about place, layers and routes of street works.",
    cyanotypeText: "Working with memories through cyanotype. Each print turns out slightly different because of chance and the particularities of the process. These changes echo the way memories lose some details and acquire others over time.",
    comingSoon: "Section coming soon", objectsLead: "Working with different materials and combinations of techniques. Their properties and methods of processing become the basis for experimentation and improvisation. Form emerges during the work, and the finished objects can exist in different spaces and contexts.",
    exhibitions: "Exhibitions", objects: "Objects", graphics: "Graphics", all: "View section",
    metal: "Metal", ceramics: "Ceramics", roots: "Roots",
  },
} as const;

export const getCopy = (locale: Locale) => copy[locale];

export const zines = [
  { title: "Недостаточно памяти", year: "2026", image: "/media/nedostatochno-pamyati-2026.webp", slug: "nedostatochno-pamyati" },
  { title: "Убежище", year: "2020", image: "/media/IMG_20200621_165755.jpg", slug: "ubezhishche" },
  { title: "Слои", year: "2021", image: "/media/xjsg8vQO7rI.jpg", slug: "sloi" },
];

export const zineDetails = {
  "nedostatochno-pamyati": { ...zines[0], images: [zines[0].image, "/media/nedostatochno-pamyati-01.png", "/media/nedostatochno-pamyati-02.png"], text: "Зин Чешуи фиксирует ключевые принципы создания уличных работ. В издании содержится фотодокументация рисунков, созданных в период с 2018 по 2025 год.\n\nФормат А5, 50 страниц, цветная печать, тираж 50 экземпляров.", previous: "sloi", next: "ubezhishche" },
  ubezhishche: { ...zines[1], images: ["/media/ubezhishche-01.png", "/media/ubezhishche-02.png", "/media/ubezhishche-03.png"], text: "Это зин о месте, которое собирало мои работы с 2014 года по 2019. За этот промежуток времени мой стиль успел измениться, а спот частично это запечатлил.\n\nРазмер 210×210.\nТираж 50 экземпляров.", previous: "nedostatochno-pamyati", next: "sloi" },
  sloi: { ...zines[2], images: ["/media/sloi-01.png", "/media/sloi-02.png", "/media/sloi-03.png"], text: "С меня сползает очередной слой чешуи. На этот раз зин — альбом с коллекцией уличных работ, выполненных за последние 2 года.\n\nРазмер 210×210.\nТираж 35 экземпляров.", previous: "ubezhishche", next: "nedostatochno-pamyati" },
} as const;

export const cyanotypes = [
  "/media/6_(2).jpg", "/media/7_(2).jpg", "/media/8_(2).jpg", "/media/10_(2).jpg",
];

export const exhibitions = [
  { title: "Поля присутствия", note: "ДНИ, Москва", year: "2026", image: "/media/DSCF3126-Recovered_1.png" },
  { title: "Уязвимое место", note: "KMSA, Kazan", year: "2026", image: "/media/001_IMG_6172-HDR.jpg" },
  { title: "Portal", note: "Off-site show at Protvino", year: "2024", image: "/media/SAVE_20240924_153051.jpg" },
  { title: "Black show", note: "Off-site show at Protvino", year: "2024", image: "/media/CHESHUYA_THE_NOSE_DIVE_PAPER_LASER_PRINTING_13X15_CM__2024_(2).jpg" },
  { title: "Rusty box", note: "Off-site show at Almaty", year: "2023", image: "/media/001_IMG_6172-HDR.jpg" },
  { title: "Sleeppy stupor", note: "Off-site show at Almaty", year: "2023", image: "/media/DSCF3126-Recovered_1.png" },
  { title: "Реквием по ЖЭК-арту", note: "VMDPNI, Moscow", year: "2022", image: "/media/IMG_20200621_165755.jpg" },
  { title: "Deep Woods Cold Winters", note: "ISSMAG gallery, Moscow", year: "2022", image: "/media/001_IMG_6172-HDR.jpg" },
  { title: "Kinematika", note: "Mutabor, Moscow", year: "2019", image: "/media/10_(2).jpg" },
];

export const graphics = ["/media/10_(2).jpg", "/media/6_(2).jpg", "/media/7_(2).jpg", "/media/8_(2).jpg", "/media/CHESHUYA_THE_NOSE_DIVE_PAPER_LASER_PRINTING_13X15_CM__2024_(2).jpg", "/media/1_(1).jpg"];

export const objects = [
  { title: "Объект", year: "", image: "/media/1_(1).jpg" },
  { title: "Объект", year: "", image: "/media/_DSF2252.jpg" },
  { title: "Объект", year: "", image: "/media/CHESHUYA_THE_NOSE_DIVE_PAPER_LASER_PRINTING_13X15_CM__2024_(2).jpg" },
];

export const drawings = graphics.map((image) => ({ title: "Рисунок", year: "", image }));
