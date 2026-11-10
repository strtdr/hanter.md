import { defineConfig } from 'tinacms';

export default defineConfig({
  clientId: process.env.TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  branch: process.env.TINA_BRANCH ?? 'main',
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
    basePath: 'hanter.md',
  },
  media: {
    tina: {
      mediaRoot: 'images',
      publicFolder: 'public',
    },
  },
  schema: {
    collections: [
      {
        name: 'cars',
        label: 'Cars',
        path: 'src/content',
        format: 'json',
        match: { include: 'cars' },
        ui: {
          allowedActions: { create: false, delete: false },
          filename: { readonly: true, slugify: () => 'cars' },
        },
        fields: [
          {
            type: 'object',
            name: 'brands',
            label: 'Brands',
            list: true,
            ui: { itemProps: (item) => ({ label: item.name }) },
            fields: [
              { type: 'string', name: 'name', label: 'Brand name', required: true },
              {
                type: 'object',
                name: 'models',
                label: 'Models',
                list: true,
                ui: { itemProps: (item) => ({ label: item.name }) },
                fields: [
                  { type: 'string', name: 'name', label: 'Model name', required: true },
                  { type: 'string', name: 'yearRange', label: 'Year range (e.g. 2004-2024)', required: true },
                  {
                    type: 'object',
                    name: 'options',
                    label: 'Seat options',
                    list: true,
                    ui: {
                      itemProps: (item) => ({
                        label: item.label?.ro
                          ? `${item.label.ro} · ${item.meters ?? 0} m²`
                          : 'New seat option',
                      }),
                    },
                    fields: [
                      {
                        type: 'object',
                        name: 'label',
                        label: 'Label (translations)',
                        fields: [
                          { type: 'string', name: 'ro', label: 'RO', required: true },
                          { type: 'string', name: 'ru', label: 'RU', required: true },
                          { type: 'string', name: 'en', label: 'EN', required: true },
                        ],
                      },
                      { type: 'number', name: 'meters', label: 'Base meters of material', required: true },
                      {
                        type: 'object',
                        name: 'suboptions',
                        label: 'Suboptions',
                        list: true,
                        ui: {
                          itemProps: (item) => ({
                            label: item.label?.ro ?? item.id ?? 'New suboption',
                          }),
                        },
                        fields: [
                          { type: 'string', name: 'id', label: 'ID (e.g. carpetCoverage)', required: true },
                          {
                            type: 'object',
                            name: 'label',
                            label: 'Label (translations)',
                            fields: [
                              { type: 'string', name: 'ro', label: 'RO', required: true },
                              { type: 'string', name: 'ru', label: 'RU', required: true },
                              { type: 'string', name: 'en', label: 'EN', required: true },
                            ],
                          },
                          { type: 'number', name: 'extraMeters', label: 'Extra meters', required: true },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'materials',
        label: 'Materials',
        path: 'src/content',
        format: 'json',
        match: { include: 'materials' },
        ui: {
          allowedActions: { create: false, delete: false },
          filename: { readonly: true, slugify: () => 'materials' },
        },
        fields: [
          {
            type: 'object',
            name: 'classes',
            label: 'Material classes',
            list: true,
            ui: { itemProps: (item) => ({ label: item.id }) },
            fields: [
              { type: 'string', name: 'id', label: 'ID', required: true },
              {
                type: 'object',
                name: 'label',
                label: 'Label (translations)',
                fields: [
                  { type: 'string', name: 'ro', label: 'RO', required: true },
                  { type: 'string', name: 'ru', label: 'RU', required: true },
                  { type: 'string', name: 'en', label: 'EN', required: true },
                ],
              },
              {
                type: 'object',
                name: 'items',
                label: 'Items',
                list: true,
                ui: { itemProps: (item) => ({ label: item.id }) },
                fields: [
                  { type: 'string', name: 'id', label: 'ID', required: true },
                  {
                    type: 'object',
                    name: 'label',
                    label: 'Label (translations)',
                    fields: [
                      { type: 'string', name: 'ro', label: 'RO', required: true },
                      { type: 'string', name: 'ru', label: 'RU', required: true },
                      { type: 'string', name: 'en', label: 'EN', required: true },
                    ],
                  },
                  { type: 'number', name: 'pricePerMeter', label: 'Price per meter (MDL)', required: true },
                  { type: 'string', name: 'image', label: 'Swatch image URL', required: true },
                  { type: 'string', name: 'demoImage', label: 'Demo image URL', required: true },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'pricing',
        label: 'Pricing',
        path: 'src/content',
        format: 'json',
        match: { include: 'pricing' },
        ui: {
          allowedActions: { create: false, delete: false },
          filename: { readonly: true, slugify: () => 'pricing' },
        },
        fields: [
          {
            type: 'object',
            name: 'protectiveMats',
            label: 'Protective mats',
            fields: [
              { type: 'number', name: 'withDelta', label: 'WITH protective mats delta (MDL)', required: true },
              { type: 'number', name: 'withoutDelta', label: 'WITHOUT protective mats delta (MDL)', required: true },
              { type: 'number', name: 'onlyProtectivePrice', label: 'ONLY protective mats flat price (MDL)', required: true },
            ],
          },
        ],
      },
      // ===== hanter.md/test: configurator + pagina de prezentare =====
      {
        name: 'testConfigurator',
        label: 'Test · Configurator (prețuri, materiale)',
        path: 'src/content/test',
        format: 'json',
        match: { include: 'configurator' },
        ui: {
          allowedActions: { create: false, delete: false },
          filename: { readonly: true, slugify: () => 'configurator' },
        },
        fields: [
          { type: 'string', name: 'phone', label: 'Telefon (Viber / WhatsApp), ex. +37379089999', required: true },
          { type: 'string', name: 'orderUrl', label: 'Adresa Google Apps Script pentru comenzi' },
          { type: 'number', name: 'roundTo', label: 'Rotunjire preț (lei)', required: true },
          {
            type: 'object',
            name: 'noProtectionDiscount',
            label: 'Fără strat de protecție: cât se scade (lei)',
            fields: [
              { type: 'number', name: 'fiveSeats', label: 'Mașină 5 locuri', required: true },
              { type: 'number', name: 'sevenSeats', label: 'Mașină 7 locuri', required: true },
            ],
          },
          {
            type: 'object',
            name: 'deposit',
            label: 'Avans la comandă (lei)',
            fields: [
              { type: 'number', name: 'salon', label: 'Doar salon', required: true },
              { type: 'number', name: 'withTrunkBack', label: 'Salon + portbagaj jos sau cu spătar', required: true },
              { type: 'number', name: 'withTrunkFull', label: 'Salon + portbagaj full', required: true },
            ],
          },
          { type: 'string', name: 'productionDays', label: 'Termen de fabricare (zile), ex. 2–7' },
          {
            type: 'object',
            name: 'salonFee',
            label: 'Manoperă salon (lei) pe mărime: sub 1,9 m · până la 2,2 m · mai mare',
            fields: [
              { type: 'number', name: 'withSills', label: 'Cu acoperire praguri', list: true },
              { type: 'number', name: 'withoutSills', label: 'Fără acoperire praguri', list: true },
            ],
          },
          {
            type: 'object',
            name: 'finishNames',
            label: 'Denumiri finisaj',
            fields: [
              { type: 'string', name: 'mat', label: 'Mat', required: true },
              { type: 'string', name: 'lucios', label: 'Lucios', required: true },
            ],
          },
          {
            type: 'object',
            name: 'leather',
            label: 'Piele eco',
            list: true,
            ui: { itemProps: (item) => ({ label: `${item.finish ?? ''} · ${item.name ?? 'Material nou'} · ${item.pricePerMeter ?? 0} lei/m` }) },
            fields: [
              { type: 'string', name: 'id', label: 'ID (unic, ex. m8)', required: true },
              { type: 'string', name: 'finish', label: 'Finisaj', options: ['mat', 'lucios'], required: true },
              { type: 'string', name: 'name', label: 'Denumire', required: true },
              { type: 'string', name: 'desc', label: 'Descriere (model cusătură)' },
              { type: 'string', name: 'leatherColor', label: 'Culoare piele (#hex)', required: true },
              { type: 'string', name: 'threadColor', label: 'Culoare ață (#hex)', required: true },
              { type: 'string', name: 'pattern', label: 'Desen cusătură', options: ['romb', 'patrat', 'paralel'], required: true },
              { type: 'number', name: 'pricePerMeter', label: 'Preț pe metru (lei)', required: true },
              { type: 'image', name: 'image', label: 'Fotografie mostră' },
            ],
          },
          {
            type: 'object',
            name: 'protection',
            label: 'Strat de protecție',
            list: true,
            ui: { itemProps: (item) => ({ label: `${item.name ?? 'Nou'} · ${item.pricePerMeter ?? 0} lei/m` }) },
            fields: [
              { type: 'string', name: 'id', label: 'ID (plastic, moale, mocheta, none)', required: true },
              { type: 'string', name: 'name', label: 'Denumire', required: true },
              { type: 'string', name: 'desc', label: 'Descriere scurtă' },
              { type: 'number', name: 'pricePerMeter', label: 'Preț pe metru (lei)', required: true },
              {
                type: 'object',
                name: 'colors',
                label: 'Culori',
                list: true,
                ui: { itemProps: (item) => ({ label: item.name ?? 'Culoare nouă' }) },
                fields: [
                  { type: 'string', name: 'name', label: 'Denumire', required: true },
                  { type: 'string', name: 'css', label: 'Culoare CSS (#hex sau gradient)', required: true },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'salonTypes',
            label: 'Tipuri salon',
            list: true,
            ui: { itemProps: (item) => ({ label: item.name }) },
            fields: [
              { type: 'string', name: 'id', label: 'ID (cu, fara, none)', required: true },
              { type: 'string', name: 'name', label: 'Denumire', required: true },
              { type: 'string', name: 'desc', label: 'Descriere' },
            ],
          },
          {
            type: 'object',
            name: 'trunk',
            label: 'Portbagaj',
            list: true,
            ui: { itemProps: (item) => ({ label: item.name }) },
            fields: [
              { type: 'string', name: 'id', label: 'ID (jos, spatar, full, none)', required: true },
              { type: 'string', name: 'name', label: 'Denumire', required: true },
              { type: 'string', name: 'desc', label: 'Descriere' },
              { type: 'number', name: 'feeMat', label: 'Manoperă piele mat (lei)', required: true },
              { type: 'number', name: 'feeGlossy', label: 'Manoperă piele lucioasă (lei)', required: true },
            ],
          },
          {
            type: 'object',
            name: 'trunkExtras',
            label: 'Portbagaj: opțiuni în plus',
            list: true,
            ui: { itemProps: (item) => ({ label: item.name }) },
            fields: [
              { type: 'string', name: 'id', label: 'ID', required: true },
              { type: 'string', name: 'name', label: 'Denumire', required: true },
              { type: 'string', name: 'desc', label: 'Descriere' },
              { type: 'number', name: 'feeMat', label: 'Preț piele mat (lei)', required: true },
              { type: 'number', name: 'feeGlossy', label: 'Preț piele lucioasă (lei)', required: true },
            ],
          },
          {
            type: 'object',
            name: 'countries',
            label: 'Țări pentru telefon',
            list: true,
            ui: { itemProps: (item) => ({ label: `${item.code} +${item.dial} ${item.name}` }) },
            fields: [
              { type: 'string', name: 'code', label: 'Cod țară (MD, RO…)', required: true },
              { type: 'string', name: 'name', label: 'Denumire', required: true },
              { type: 'string', name: 'dial', label: 'Prefix (fără +)', required: true },
              { type: 'number', name: 'minDigits', label: 'Cifre minim (fără 0 din față)', required: true },
              { type: 'number', name: 'maxDigits', label: 'Cifre maxim', required: true },
              { type: 'string', name: 'example', label: 'Exemplu număr' },
            ],
          },
        ],
      },
      {
        name: 'testLanding',
        label: 'Test · Texte pagină',
        path: 'src/content/test',
        format: 'json',
        match: { include: 'landing' },
        ui: {
          allowedActions: { create: false, delete: false },
          filename: { readonly: true, slugify: () => 'landing' },
        },
        fields: [
          {
            type: 'object',
            name: 'hero',
            label: 'Început de pagină',
            fields: [
              { type: 'string', name: 'tag', label: 'Etichetă mică' },
              { type: 'string', name: 'title', label: 'Titlu', required: true },
              { type: 'string', name: 'lead', label: 'Text', ui: { component: 'textarea' } },
              { type: 'string', name: 'ctaPrimary', label: 'Buton principal' },
              { type: 'string', name: 'ctaSecondary', label: 'Buton secundar' },
              { type: 'string', name: 'leatherCombos', label: 'Număr combinații de piele' },
              { type: 'string', name: 'imageCaption', label: 'Text sub imagine' },
            ],
          },
          {
            type: 'object',
            name: 'benefits',
            label: 'Beneficii',
            fields: [
              { type: 'string', name: 'title', label: 'Titlu' },
              { type: 'string', name: 'intro', label: 'Introducere', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'items',
                label: 'Beneficii',
                list: true,
                ui: { itemProps: (item) => ({ label: item.title }) },
                fields: [
                  { type: 'string', name: 'title', label: 'Titlu', required: true },
                  { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'solution',
            label: 'Soluția',
            fields: [
              { type: 'string', name: 'title', label: 'Titlu' },
              { type: 'string', name: 'intro', label: 'Introducere', ui: { component: 'textarea' } },
              { type: 'string', name: 'badTitle', label: 'Titlu coloană „universale”' },
              { type: 'string', name: 'bad', label: 'Puncte „universale”', list: true },
              { type: 'string', name: 'goodTitle', label: 'Titlu coloană Hanter.md' },
              { type: 'string', name: 'good', label: 'Puncte Hanter.md', list: true },
            ],
          },
          {
            type: 'object',
            name: 'materials',
            label: 'Materiale',
            fields: [
              { type: 'string', name: 'title', label: 'Titlu' },
              { type: 'string', name: 'intro', label: 'Introducere', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'layers',
                label: 'Straturi (de sus în jos)',
                list: true,
                ui: { itemProps: (item) => ({ label: item.title }) },
                fields: [
                  { type: 'string', name: 'title', label: 'Strat', required: true },
                  { type: 'string', name: 'text', label: 'Descriere', ui: { component: 'textarea' } },
                ],
              },
              { type: 'string', name: 'protectionTitle', label: 'Titlu covoraș de protecție' },
              { type: 'string', name: 'protectionIntro', label: 'Introducere covoraș de protecție', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'protectionTypes',
                label: 'Tipuri covoraș de protecție',
                list: true,
                ui: { itemProps: (item) => ({ label: item.title }) },
                fields: [
                  { type: 'string', name: 'title', label: 'Denumire', required: true },
                  { type: 'string', name: 'text', label: 'Descriere', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'steps',
            label: 'Cum comanzi',
            fields: [
              { type: 'string', name: 'title', label: 'Titlu' },
              {
                type: 'object',
                name: 'items',
                label: 'Pași',
                list: true,
                ui: { itemProps: (item) => ({ label: item.title }) },
                fields: [
                  { type: 'string', name: 'title', label: 'Pas', required: true },
                  { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'delivery',
            label: 'Avans, termen și livrare',
            fields: [
              { type: 'string', name: 'title', label: 'Titlu' },
              { type: 'string', name: 'intro', label: 'Introducere', ui: { component: 'textarea' } },
              { type: 'string', name: 'depositTitle', label: 'Titlu card avans (sumele: Test · Configurator → Avans)' },
              { type: 'string', name: 'productionTitle', label: 'Titlu card termen (zilele: Test · Configurator)' },
              { type: 'string', name: 'moldovaTitle', label: 'Titlu Moldova' },
              { type: 'string', name: 'moldovaText', label: 'Text Moldova', ui: { component: 'textarea' } },
              { type: 'string', name: 'workshopAddress', label: 'Adresa atelierului (apare doar dacă e completată)' },
              { type: 'string', name: 'europeTitle', label: 'Titlu Europa' },
              { type: 'string', name: 'europeText', label: 'Text Europa', ui: { component: 'textarea' } },
            ],
          },
          {
            type: 'object',
            name: 'configurator',
            label: 'Titlu configurator',
            fields: [
              { type: 'string', name: 'title', label: 'Titlu' },
              { type: 'string', name: 'intro', label: 'Text' },
            ],
          },
          { type: 'string', name: 'footer', label: 'Subsol', ui: { component: 'textarea' } },
        ],
      },
    ],
  },
});
