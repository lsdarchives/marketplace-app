/** Bottom tabs, shared by the native (app-tabs.tsx) and web (app-tabs.web.tsx) tab bars. */
export const TABS = [
  { name: 'index', href: '/', label: 'Home', sf: 'house', md: 'home' },
  { name: 'search', href: '/search', label: 'Search', sf: 'magnifyingglass', md: 'search' },
  { name: 'sell', href: '/sell', label: 'Sell', sf: 'plus.circle', md: 'add_circle' },
  { name: 'inbox', href: '/inbox', label: 'Inbox', sf: 'bubble.left.and.bubble.right', md: 'chat' },
  { name: 'profile', href: '/profile', label: 'Profile', sf: 'person.crop.circle', md: 'account_circle' },
] as const;
