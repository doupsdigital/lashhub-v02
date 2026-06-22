// Dicionário com todas as paletas de cores do sistema (versões Light e Dark)
export interface ThemePalette {
  '--rose-50': string;
  '--rose-100': string;
  '--rose-200': string;
  '--rose-400': string;
  '--rose-600': string;
  '--rose-800': string;
  '--gold': string;
  '--gold-light': string;
  '--bg': string;
  '--surface': string;
  '--text-primary': string;
  '--text-secondary': string;
  '--text-muted': string;
  '--border': string;
}

export const PALETTES: Record<string, { light: ThemePalette; dark: ThemePalette }> = {
  rosa_rose: {
    light: {
      '--rose-50': '#FDF5F5',
      '--rose-100': '#FAE8E8',
      '--rose-200': '#F5CECE',
      '--rose-400': '#D4848A',
      '--rose-600': '#A85560',
      '--rose-800': '#7A2E38',
      '--gold': '#C9A96E',
      '--gold-light': '#F0E6D3',
      '--bg': '#F7F3EE',
      '--surface': '#FFFFFF',
      '--text-primary': '#2C1810',
      '--text-secondary': '#7A6A62',
      '--text-muted': '#B0A097',
      '--border': 'rgba(180, 150, 130, 0.25)',
    },
    dark: {
      '--rose-50': '#2E1C21',
      '--rose-100': '#3A1E22',
      '--rose-200': '#5E3137',
      '--rose-400': '#D4848A',
      '--rose-600': '#E87FA4',
      '--rose-800': '#FAE8F0',
      '--gold': '#D8C3A5',
      '--gold-light': '#2F2A24',
      '--bg': '#120C0D',
      '--surface': '#231619',
      '--text-primary': '#F8F1F2',
      '--text-secondary': '#B5A5A7',
      '--text-muted': '#7A6B6D',
      '--border': 'rgba(245, 206, 206, 0.20)',
    },
  },
  roxo_ametista: {
    light: {
      '--rose-50': '#FAF5FD',
      '--rose-100': '#F2E8FA',
      '--rose-200': '#E4CEDF',
      '--rose-400': '#A384D4',
      '--rose-600': '#7C55A8',
      '--rose-800': '#552E7A',
      '--gold': '#C9A96E',
      '--gold-light': '#F0E6D3',
      '--bg': '#F4EFF7',
      '--surface': '#FFFFFF',
      '--text-primary': '#1A102C',
      '--text-secondary': '#6B627A',
      '--text-muted': '#A399B0',
      '--border': 'rgba(124, 85, 168, 0.23)',
    },
    dark: {
      '--rose-50': '#251830',
      '--rose-100': '#2E1E3D',
      '--rose-200': '#4D3169',
      '--rose-400': '#A384D4',
      '--rose-600': '#B38CE6',
      '--rose-800': '#F2E8FA',
      '--gold': '#D8C3A5',
      '--gold-light': '#2A262E',
      '--bg': '#0F0916',
      '--surface': '#1E162C',
      '--text-primary': '#F2EDF7',
      '--text-secondary': '#A59BB3',
      '--text-muted': '#6D647A',
      '--border': 'rgba(163, 132, 212, 0.20)',
    },
  },
  pink_classico: {
    light: {
      '--rose-50': '#FDF5F8',
      '--rose-100': '#FAE8F0',
      '--rose-200': '#F7CBD9',
      '--rose-400': '#E87FA4',
      '--rose-600': '#D14175',
      '--rose-800': '#9C1F4D',
      '--gold': '#C9A96E',
      '--gold-light': '#F0E6D3',
      '--bg': '#FAF0F3',
      '--surface': '#FFFFFF',
      '--text-primary': '#2C101B',
      '--text-secondary': '#7A626E',
      '--text-muted': '#B097A3',
      '--border': 'rgba(209, 65, 117, 0.22)',
    },
    dark: {
      '--rose-50': '#301824',
      '--rose-100': '#3E1E2E',
      '--rose-200': '#69314D',
      '--rose-400': '#E87FA4',
      '--rose-600': '#F55B93',
      '--rose-800': '#FAE8F0',
      '--gold': '#D8C3A5',
      '--gold-light': '#2E2429',
      '--bg': '#160911',
      '--surface': '#291521',
      '--text-primary': '#F7EDF2',
      '--text-secondary': '#B39BB1',
      '--text-muted': '#7A6475',
      '--border': 'rgba(232, 127, 164, 0.20)',
    },
  },
  terracota_nude: {
    light: {
      '--rose-50': '#FDF7F5',
      '--rose-100': '#FAF0EC',
      '--rose-200': '#FAD1C5',
      '--rose-400': '#E09882',
      '--rose-600': '#C26E54',
      '--rose-800': '#8C3F2B',
      '--gold': '#D29E70',
      '--gold-light': '#F4E7DF',
      '--bg': '#FAF5F2',
      '--surface': '#FFFFFF',
      '--text-primary': '#2C1710',
      '--text-secondary': '#7A6662',
      '--text-muted': '#B09C97',
      '--border': 'rgba(194, 110, 84, 0.23)',
    },
    dark: {
      '--rose-50': '#301E18',
      '--rose-100': '#3D241E',
      '--rose-200': '#693C32',
      '--rose-400': '#E09882',
      '--rose-600': '#EB8A6E',
      '--rose-800': '#FAF0EC',
      '--gold': '#E6B38A',
      '--gold-light': '#2F2624',
      '--bg': '#160E0C',
      '--surface': '#291A16',
      '--text-primary': '#F7EFEA',
      '--text-secondary': '#B3A29E',
      '--text-muted': '#7A6A66',
      '--border': 'rgba(224, 152, 130, 0.20)',
    },
  },
  verde_esmeralda: {
    light: {
      '--rose-50': '#F2FAF8',
      '--rose-100': '#E6F2F0',
      '--rose-200': '#BED9D4',
      '--rose-400': '#488C7F',
      '--rose-600': '#1A6354',
      '--rose-800': '#0F3F34',
      '--gold': '#D4AF37',
      '--gold-light': '#F4EBC1',
      '--bg': '#F3F7F6',
      '--surface': '#FFFFFF',
      '--text-primary': '#102C26',
      '--text-secondary': '#627A75',
      '--text-muted': '#97B0AB',
      '--border': 'rgba(26, 99, 84, 0.23)',
    },
    dark: {
      '--rose-50': '#1A2E2A',
      '--rose-100': '#18332F',
      '--rose-200': '#29544D',
      '--rose-400': '#488C7F',
      '--rose-600': '#5ABAA9',
      '--rose-800': '#E6F2F0',
      '--gold': '#E5C158',
      '--gold-light': '#242D2B',
      '--bg': '#0A1210',
      '--surface': '#162822',
      '--text-primary': '#EDF7F5',
      '--text-secondary': '#9BB3AF',
      '--text-muted': '#647A76',
      '--border': 'rgba(72, 140, 127, 0.20)',
    },
  },
};

export interface PaletteOption {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
}

export const PALETTES_LIST: PaletteOption[] = [
  {
    id: 'rosa_rose',
    name: 'Rosé Premium (Padrão)',
    description: 'Blush rose clássico e aconchegante com fundo creme.',
    primaryColor: '#A85560',
    accentColor: '#C9A96E',
    bgColor: '#F7F3EE',
  },
  {
    id: 'roxo_ametista',
    name: 'Roxo Ametista',
    description: 'Tons de lavanda sofisticados e fundo violeta-suave.',
    primaryColor: '#7C55A8',
    accentColor: '#C9A96E',
    bgColor: '#F4EFF7',
  },
  {
    id: 'pink_classico',
    name: 'Romance Cherry',
    description: 'Rosa vivo romântico com toques florais delicados.',
    primaryColor: '#D14175',
    accentColor: '#C9A96E',
    bgColor: '#FAF0F3',
  },
  {
    id: 'terracota_nude',
    name: 'Terracota Chic',
    description: 'Minimalismo terroso com tons quentes e modernos.',
    primaryColor: '#C26E54',
    accentColor: '#D29E70',
    bgColor: '#FAF5F2',
  },
  {
    id: 'verde_esmeralda',
    name: 'Emerald Luxury',
    description: 'Verde esmeralda com dourado para spas e estéticas de luxo.',
    primaryColor: '#1A6354',
    accentColor: '#D4AF37',
    bgColor: '#F3F7F6',
  },
];

// Aplica a paleta de cores no elemento raiz (:root)
export const applyPalette = (paletteName: string, isDarkMode: boolean) => {
  const selectedName = PALETTES[paletteName] ? paletteName : 'rosa_rose';
  const mode = isDarkMode ? 'dark' : 'light';
  const palette = PALETTES[selectedName][mode];
  const root = document.documentElement;

  Object.entries(palette).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Alterna a classe 'dark' no elemento raiz (<html>) para uso dos seletores CSS
  if (isDarkMode) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};
