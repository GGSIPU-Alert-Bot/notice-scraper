import axios from 'axios';
import cheerio from 'cheerio';
import { Notice } from '../models/notice.model';

function encodeSpacesInURL(url: string): string {
  return url.replace(/ /g, '%20');
}

// function extractDateFromUrl(url: string): string | null {
//   if (url === 'http://www.ipu.ac.in/Pubinfo2024/formhost2425210724.pdf') {
//     return '2024-07-21'; // Hardcoded date for this specific URL
//   }

//   const patterns = [
//     /(\d{2})(\d{2})(\d{2})(\d{3})/,  // Matches 200724401
//     /(\d{2})(\d{2})(\d{4})/,         // Matches 16072024
//     /(\d{2})(\d{2})(\d{2})/,         // Matches 200724
//     /[a-z]*(\d{2})(\d{2})(\d{2,4})/i, // Matches nt180724, circ1159130618, etc.
//     /(\d{4})(\d{2})(\d{2})/,          // Matches 20240719 (e.g., formhost2425210724.pdf)
//   ];

//   for (const pattern of patterns) {
//     const match = url.match(pattern);
//     if (match) {
//       let day, month, year;
//       if (match[0].length === 8) {
//         // Handle format like 200724 (YYMMDD)
//         [, year, month, day] = match;
//         year = `20${year}`;
//       } else if (match[0].length === 9) {
//         // Handle format like 200724401 (YYMMDD###)
//         [, day, month, year] = match;
//         year = `20${year}`;
//       } else if (match[0].length === 10) {
//         // Handle format like 20240719 (YYYYMMDD)
//         [, year, month, day] = match;
//       } else {
//         [, day, month, year] = match;
//         if (year.length === 2) {
//           year = `20${year}`;
//         }
//       }

//       // Convert the extracted year, month, day to 'YYYY-MM-DD' format
//       if (isValidDate(day, month, year)) {
//         return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
//       }
//     }
//   }

//   return null;
// }

// function isValidDate(day: string, month: string, year: string): boolean {
//   const d = parseInt(day, 10);
//   const m = parseInt(month, 10);
//   const y = parseInt(year, 10);
  
//   const date = new Date(y, m - 1, d);
//   return date.getFullYear() === y && 
//          date.getMonth() === m - 1 && 
//          date.getDate() === d && 
//          y >= 2018 && 
//          y <= new Date().getFullYear();
// }

async function fetchNoticesHtml(url: string): Promise<string> {
  const response = await axios.get(url);
  return response.data;
}

function parseNotices(html: string): Notice[] {
  const $ = cheerio.load(html);
  const notices: Notice[] = [];
  const seenNotices = new Set<string>(); // To track unique notices

  $('table tr').each((index, element) => {
    const $td = $(element).find('td').first();
    const noticeText = $td.text().trim();
    const $a = $td.find('a');
    const downloadUrl = $a.attr('href');

    if (noticeText && downloadUrl) {
      const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `http://www.ipu.ac.in${downloadUrl}`;
      const encodedUrl = encodeSpacesInURL(fullUrl);
      
      // Create a unique key for this notice
      const noticeKey = `${noticeText}|${encodedUrl}`;

      // Only add the notice if we haven't seen it before
      if (!seenNotices.has(noticeKey)) {
        seenNotices.add(noticeKey);
        
        const createdAt = new Date();
        const noticeDate = createdAt.toISOString().split('T')[0]; // Extract date from createdAt

        notices.push({
          date: noticeDate,
          title: noticeText,
          url: encodedUrl,
          createdAt: createdAt
        });
      }
    }
  });

  return notices;
}

export async function scrapNotices(): Promise<Notice[]> {
  try {
    const html = await fetchNoticesHtml('http://www.ipu.ac.in/notices.php');
    const notices = parseNotices(html);
    console.log(`Found ${notices.length} notices`);
    return notices;
  } catch (error) {
    console.error('Error in scrapNotices:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', error.response?.data);
    }
    return [];
  }
}