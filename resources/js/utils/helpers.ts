import { usePage } from '@inertiajs/react';

// Add window type declaration
declare global {
  interface Window {
    location: Location;
  }
}

/**
 * Get company setting value
 */
// const getCompanySetting = (key: string) => {
//   try {
//     const { props } = usePage();
//     const companySettings = (props as any).companyAllSetting || {};
//     return companySettings[key];
//   } catch {
//     return null;
//   }
// };

/**
 * Get admin setting value
 */
// const getAdminSetting = (key: string) => {
//   try {
//     const { props } = usePage();
//     const adminSettings = (props as any).adminAllSetting || {};
//     return adminSettings[key];
//   } catch {
//     return null;
//   }
// };

/**
 * Format date to readable format
 */
// const formatDate = (date: string | Date): string => {
//   if (!date) return '';
//   const format = getCompanySetting('dateFormat') || 'Y-m-d';
//   const d = new Date(date);
//   const year = d.getFullYear();
//   const month = String(d.getMonth() + 1).padStart(2, '0');
//   const day = String(d.getDate()).padStart(2, '0');

//   return format
//     .replace('Y', String(year))
//     .replace('m', month)
//     .replace('d', day);
// };

/**
 * Format time to readable format
 */
// const formatTime = (time: string): string => {
//   if (!time) return '';
//   const timeFormat = getCompanySetting('timeFormat') || 'H:i';
//   const [hours, minutes] = time.split(':');
//   const h = parseInt(hours);
//   const m = String(parseInt(minutes)).padStart(2, '0');

//   if (timeFormat === 'g:i A') {
//     const period = h >= 12 ? 'PM' : 'AM';
//     const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
//     return `${displayHour}:${m} ${period}`;
//   }

//   return timeFormat
//     .replace('H', String(h).padStart(2, '0'))
//     .replace('i', m);
// };

/**
 * Format date and time to readable format
 */
// const formatDateTime = (date: string | Date): string => {
//   if (!date) return '';
//   const dateFormat = getCompanySetting('dateFormat') || 'Y-m-d';
//   const timeFormat = getCompanySetting('timeFormat') || 'H:i';
//   const d = new Date(date);
//   const year = d.getFullYear();
//   const month = String(d.getMonth() + 1).padStart(2, '0');
//   const day = String(d.getDate()).padStart(2, '0');
//   const hours = String(d.getHours()).padStart(2, '0');
//   const minutes = String(d.getMinutes()).padStart(2, '0');

//   const formattedDate = dateFormat
//     .replace('Y', String(year))
//     .replace('m', month)
//     .replace('d', day);

//   const formattedTime = timeFormat
//     .replace('H', hours)
//     .replace('i', minutes);

//   return `${formattedDate} ${formattedTime}`;
// };

/**
 * Get full image path
 */
const getImagePath = (path: string, pageProps?: any): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // If path already contains storage/media, just prepend domain
  if (path.includes('storage/media')) {
    return path.startsWith('/') ? `${window.location.origin}${path}` : `${window.location.origin}/${path}`;
  }

  try {
    const props = pageProps || usePage().props;
    const dynamicPath = `${(props as any).globalSettings?.base_url || window.location.origin}/storage/media/`;
    let imageUrlPrefix = (props as any).imageUrlPrefix || dynamicPath;

    if (!imageUrlPrefix.includes('storage/media')) {
      imageUrlPrefix = imageUrlPrefix.endsWith('/') ? imageUrlPrefix + 'storage/media/' : imageUrlPrefix + '/storage/media/';
    }

    // Handle slash concatenation
    const prefixEndsWithSlash = imageUrlPrefix.endsWith('/');
    const pathStartsWithSlash = path.startsWith('/');

    if (prefixEndsWithSlash && pathStartsWithSlash) {
      return imageUrlPrefix + path.substring(1);
    } else if (!prefixEndsWithSlash && !pathStartsWithSlash) {
      return imageUrlPrefix + '/' + path;
    } else {
      return imageUrlPrefix + path;
    }
  }
  catch {
    const fallbackPrefix = `${window.location.origin}/${window.location.pathname.split('/')[1]}/storage/media/`;
    return path.startsWith('/') ? fallbackPrefix + path.substring(1) : fallbackPrefix + path;
  }
}

/**
 * Get current company ID from page props
 */
const getCompanyId = () => {
  try {
    const { props } = usePage();
    return (props as any).auth?.user?.company_id || (props as any).companyId;
  } catch {
    return null;
  }
};

/**
 * Check if the application is in demo mode
 */
const isDemoMode = () => {
  try {
    const { props } = usePage();
    return (props as any).globalSettings?.is_demo || false;
  } catch {
    return false;
  }
};

/**
 * Check if the application is in SaaS mode
 */
const isSaaS = () => {
  try {
    const { props } = usePage();
    return (props as any).globalSettings?.is_saas || false;
  } catch {
    return false;
  }
};

/**
 * Set a browser cookie
 */
const setCookie = (name: string, value: string, days = 365) => {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

/**
 * Get a browser cookie
 */
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
};

/**
 * Get initials from a name
 */
const getInitials = (name: string): string => {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export {
  getImagePath,
  getCompanyId,
  isDemoMode,
  isSaaS,
  setCookie,
  getCookie,
  getInitials,
};