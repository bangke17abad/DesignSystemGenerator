#!/usr/bin/env node
// Dev tool: builds reference/html-first/icons/{lucide,antd}.json from the npm packages (lucide-static ISC, @ant-design/icons-svg MIT).
// Usage: node tools/dev/gen-icons.mjs <node_modules dir>   (npm i lucide-static@0.460.0 @ant-design/icons-svg@4.4.2)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const nm = process.argv[2];
if (!nm) { console.error('usage: gen-icons.mjs <node_modules>'); process.exit(2); }
const out = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'reference', 'html-first', 'icons');
// engine icon name → [lucide name, Ant Design Icons name]
export const MAP = {
  critical: ['octagon-alert', 'CloseCircleOutlined'], warning: ['triangle-alert', 'ExclamationCircleOutlined'], positive: ['circle-check', 'CheckCircleOutlined'],
  info: ['info', 'InfoCircleOutlined'], 'neutral-negative': ['circle-minus', 'MinusCircleOutlined'], time: ['clock', 'ClockCircleOutlined'], history: ['history', 'HistoryOutlined'],
  restricted: ['lock', 'LockOutlined'], 'chevron-down': ['chevron-down', 'DownOutlined'], 'chevron-up': ['chevron-up', 'UpOutlined'], 'chevron-left': ['chevron-left', 'LeftOutlined'],
  'chevron-right': ['chevron-right', 'RightOutlined'], 'arrow-left': ['arrow-left', 'ArrowLeftOutlined'], 'arrow-right': ['arrow-right', 'ArrowRightOutlined'], close: ['x', 'CloseOutlined'],
  check: ['check', 'CheckOutlined'], minus: ['minus', 'MinusOutlined'], plus: ['plus', 'PlusOutlined'], search: ['search', 'SearchOutlined'], menu: ['menu', 'MenuOutlined'],
  'more-horizontal': ['ellipsis', 'EllipsisOutlined'], 'more-vertical': ['ellipsis-vertical', 'MoreOutlined'], eye: ['eye', 'EyeOutlined'], 'eye-off': ['eye-off', 'EyeInvisibleOutlined'],
  calendar: ['calendar', 'CalendarOutlined'], upload: ['upload', 'UploadOutlined'], download: ['download', 'DownloadOutlined'], file: ['file', 'FileOutlined'], copy: ['copy', 'CopyOutlined'],
  external: ['external-link', 'ExportOutlined'], home: ['house', 'HomeOutlined'], settings: ['settings', 'SettingOutlined'], user: ['user', 'UserOutlined'], users: ['users', 'TeamOutlined'],
  bell: ['bell', 'BellOutlined'], filter: ['filter', 'FilterOutlined'], sort: ['arrow-up-down', 'SwapOutlined'], grip: ['grip-vertical', 'HolderOutlined'], dot: ['dot', 'SmallDashOutlined'],
  offline: ['wifi-off', 'DisconnectOutlined'], refresh: ['refresh-cw', 'ReloadOutlined'], 'drag-handle': ['grip-vertical', 'DragOutlined'], image: ['image', 'PictureOutlined'], link: ['link', 'LinkOutlined'],
  help: ['circle-help', 'QuestionCircleOutlined'], logout: ['log-out', 'LogoutOutlined'], edit: ['pencil', 'EditOutlined'], delete: ['trash-2', 'DeleteOutlined'], dashboard: ['layout-dashboard', 'DashboardOutlined'],
  project: ['folder-kanban', 'ProjectOutlined'], chart: ['chart-line', 'LineChartOutlined'], sparkle: ['sparkles', 'BulbOutlined'], mail: ['mail', 'MailOutlined'], star: ['star', 'StarOutlined'],
  'map-pin': ['map-pin', 'EnvironmentOutlined'], folder: ['folder', 'FolderOutlined'], 'trend-up': ['trending-up', 'RiseOutlined'], 'trend-down': ['trending-down', 'FallOutlined'], 'zoom-in': ['zoom-in', 'ZoomInOutlined'],
  kanban: ['square-kanban', 'AppstoreOutlined'], gauge: ['gauge', 'DashboardOutlined'], shield: ['shield-check', 'SafetyCertificateOutlined'], coin: ['coins', 'DollarOutlined'], flow: ['workflow', 'BranchesOutlined'],
};
const lucide = { $license: 'ISC · lucide-static 0.460.0 · https://lucide.dev', $format: 'stroke, viewBox 0 0 24 24' };
const antd = { $license: 'MIT · @ant-design/icons-svg 4.4.2 · https://ant.design/components/icon', $format: 'fill, per-icon viewBox' };
const req = createRequire(join(nm, 'x.js'));
const attrs = (a) => Object.entries(a).filter(([k]) => k !== 'focusable').map(([k, v]) => `${k}='${v}'`).join(' ');
const node = (n) => `<${n.tag} ${attrs(n.attrs || {})}${n.children ? `>${n.children.map(node).join('')}</${n.tag}>` : '/>'}`;
for (const [name, [l, a]] of Object.entries(MAP)) {
  const svg = readFileSync(join(nm, 'lucide-static', 'icons', `${l}.svg`), 'utf8');
  lucide[name] = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').replace(/\s+/g, ' ').replace(/"/g, "'").trim();
  const ic = req(`@ant-design/icons-svg/lib/asn/${a}.js`).default.icon;
  antd[name] = { viewBox: ic.attrs.viewBox, body: ic.children.map(node).join('') };
}
writeFileSync(join(out, 'lucide.json'), JSON.stringify(lucide, null, 1) + '\n');
writeFileSync(join(out, 'antd.json'), JSON.stringify(antd, null, 1) + '\n');
console.log(`icons: ${Object.keys(MAP).length} × 2 sets`);
