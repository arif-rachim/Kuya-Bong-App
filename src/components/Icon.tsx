import type { IconType } from 'react-icons'
import {
  MdAdd, MdAddAPhoto, MdAddModerator, MdApartment, MdArrowBack, MdArrowForward, MdBadge, MdBarChart,
  MdCalendarMonth, MdCalendarToday, MdCall, MdCampaign, MdCancel, MdCheck, MdCheckCircle, MdChevronRight,
  MdChildCare, MdClose, MdDashboard, MdDelete, MdDiversity3, MdEdit, MdError, MdEvent, MdEventAvailable,
  MdEventBusy, MdEventRepeat, MdGroup, MdGroups, MdHistory, MdHome, MdHourglassEmpty, MdHowToReg, MdImage,
  MdInfo, MdInventory2, MdIosShare, MdLightbulb, MdLocationOn, MdLock, MdLogin, MdLogout, MdMail,
  MdMarkEmailRead, MdMedicalServices, MdMedication, MdNotifications, MdPayments, MdPendingActions, MdPerson,
  MdPerson4, MdPersonAdd, MdPersonOff, MdPersonRemove, MdPersonSearch, MdPriorityHigh, MdReceiptLong,
  MdRestartAlt, MdRule, MdSchedule, MdSearch, MdSettings, MdShield, MdShoppingBag, MdSwapHoriz, MdVisibilityOff,
} from 'react-icons/md'
import { cn } from '../lib/cn'

// Bundled SVG icons (react-icons / Material Design) keyed by the old Material
// Symbols ids, so every existing <Icon name="..."> call still works — but the
// glyphs ship in the JS bundle instead of an async font (no flash of raw
// ligature text on first paint).
const ICONS: Record<string, IconType> = {
  add: MdAdd, add_a_photo: MdAddAPhoto, add_moderator: MdAddModerator, apartment: MdApartment,
  arrow_back: MdArrowBack, arrow_forward: MdArrowForward, badge: MdBadge, bar_chart: MdBarChart,
  calendar_month: MdCalendarMonth, calendar_today: MdCalendarToday, call: MdCall, campaign: MdCampaign,
  cancel: MdCancel, check: MdCheck, check_circle: MdCheckCircle, chevron_right: MdChevronRight,
  child_care: MdChildCare, close: MdClose, dashboard: MdDashboard, delete: MdDelete, diversity_3: MdDiversity3,
  edit: MdEdit, error: MdError, event: MdEvent, event_available: MdEventAvailable, event_busy: MdEventBusy,
  event_repeat: MdEventRepeat, group: MdGroup, groups: MdGroups, history: MdHistory, home: MdHome,
  hourglass_empty: MdHourglassEmpty, image: MdImage, info: MdInfo, inventory_2: MdInventory2, ios_share: MdIosShare,
  lightbulb: MdLightbulb, location_on: MdLocationOn, lock: MdLock, login: MdLogin, logout: MdLogout, mail: MdMail,
  mark_email_read: MdMarkEmailRead, medical_services: MdMedicalServices, medication: MdMedication,
  notifications: MdNotifications, payments: MdPayments, pending_actions: MdPendingActions, person: MdPerson,
  person_4: MdPerson4, person_add: MdPersonAdd, person_check: MdHowToReg, person_off: MdPersonOff,
  person_remove: MdPersonRemove, person_search: MdPersonSearch, priority_high: MdPriorityHigh,
  receipt_long: MdReceiptLong, restart_alt: MdRestartAlt, rule: MdRule, schedule: MdSchedule, search: MdSearch,
  settings: MdSettings, shield_person: MdShield, shopping_bag: MdShoppingBag, swap_horiz: MdSwapHoriz,
  visibility_off: MdVisibilityOff,
}

/**
 * Icon by Material Symbols name. `fill` is accepted for API compatibility (the
 * Material Design glyphs are already solid). `size` defaults to 24px to match
 * the old Material Symbols default. Colour follows the text colour (currentColor).
 */
export function Icon({ name, className, size = 24 }: { name: string; className?: string; fill?: boolean; size?: number }) {
  const Glyph = ICONS[name] ?? MdInfo
  return <Glyph className={cn('inline-block', className)} size={size} aria-hidden focusable={false} />
}
