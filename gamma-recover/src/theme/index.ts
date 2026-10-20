import { createGlobalStyle } from 'styled-components';
export const theme = {
  brand: { primary: '#0B1B34', accent: '#29C979', accentHover: '#20B66B' },
  background: {
    app: '#F3F5F8',
    surface: '#FFFFFF',
    sidebar: '#0B1B34',
    subtle: '#F7F9FB',
    hover: '#EDF2F7',
    accent: '#EAF8F1',
    active: '#17324C',
  },
  text: {
    primary: '#17283E',
    secondary: '#586A80',
    inverse: '#FFFFFF',
    sidebar: '#B7C5D6',
    mutedInverse: '#94A8BF',
  },
  border: { default: '#DCE3EB', subtle: '#EAF0F5', focus: '#7293AF' },
  status: {
    success: '#137447',
    successBg: '#E8F6EF',
    warning: '#8C590D',
    warningBg: '#FFF4DF',
    danger: '#B43B40',
    dangerBg: '#FDEDEF',
    info: '#275D94',
    infoBg: '#EBF2FA',
  },
  typography: {
    family: '"Segoe UI", system-ui, sans-serif',
    small: '12px',
    body: '14px',
    title: '24px',
    metric: '26px',
    metricCompact: '20px',
    section: '15px',
  },
  spacing: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', xxl: '32px' },
  dimensions: { sidebar: '216px', sidebarCollapsed: '68px', header: '60px', control: '36px' },
  radius: { sm: '5px', md: '8px' },
  shadows: { overlay: '0 16px 48px #0B1B3429' },
  states: { disabled: 0.5 },
  motion: { fast: '140ms ease' },
  chart: { current: '#15995A', previous: '#66829F', grid: '#E8EDF3', muted: '#B6C4D2' },
  breakpoints: { mobile: '760px', tablet: '1100px' },
};
export type GammaTheme = typeof theme;
export const GlobalStyle = createGlobalStyle`
 * { box-sizing:border-box; }
 body { margin:0; font-family:${({ theme }) => theme.typography.family}; font-size:${({ theme }) => theme.typography.body}; color:${({ theme }) => theme.text.primary}; background:${({ theme }) => theme.background.app}; line-height:1.5; }
 button,input,select,textarea { font:inherit; }
 button,a,input,select,textarea { -webkit-tap-highlight-color:transparent; }
 button { cursor:pointer; }
 button:disabled { cursor:not-allowed; opacity:${({ theme }) => theme.states.disabled}; }
 a { color:inherit; text-underline-offset:3px; }
 a:hover { text-decoration-thickness:2px; }
 input[type=checkbox],input[type=radio] { accent-color:${({ theme }) => theme.status.success}; }
 h1,h2,h3,p { margin:0; }
 h1 { font-size:${({ theme }) => theme.typography.title}; font-weight:600; letter-spacing:-.5px; }
 h2,h3 { font-size:${({ theme }) => theme.typography.body}; font-weight:600; }
 small { font-size:${({ theme }) => theme.typography.small}; }
 svg { flex-shrink:0; }
 button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible { outline:3px solid ${({ theme }) => theme.brand.accent}; outline-offset:2px; }
 ::selection { background:${({ theme }) => theme.status.successBg}; }
 @media(prefers-reduced-motion:reduce) { * { scroll-behavior:auto!important; animation:none!important; transition:none!important; } button:active{transform:none!important;} }
`;
