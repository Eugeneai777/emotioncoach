export interface Theme {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  textColor: string;
}

export const themes: Theme[] = [
  {
    id: 'purple',
    name: '紫色梦幻',
    emoji: '💜',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff'
  },
  {
    id: 'blue',
    name: '蓝色海洋',
    emoji: '🌊',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    textColor: '#ffffff'
  },
  {
    id: 'pink',
    name: '粉色浪漫',
    emoji: '🌸',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    textColor: '#ffffff'
  },
  {
    id: 'green',
    name: '绿色清新',
    emoji: '🌿',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    textColor: '#ffffff'
  },
  {
    id: 'orange',
    name: '橙色活力',
    emoji: '🔥',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    textColor: '#ffffff'
  },
  {
    id: 'sunset',
    name: '日落黄昏',
    emoji: '🌅',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    textColor: '#1a1a1a'
  },
  {
    id: 'galaxy',
    name: '星空银河',
    emoji: '✨',
    gradient: 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)',
    textColor: '#ffffff'
  },
  {
    id: 'custom',
    name: '自定义',
    emoji: '🖼️',
    gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    textColor: '#1a1a1a'
  }
];

export const getThemeById = (id: string): Theme => {
  return themes.find(theme => theme.id === id) || themes[0];
};
