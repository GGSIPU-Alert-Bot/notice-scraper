import axios from 'axios';
import cheerio from 'cheerio';
import { Notice } from '../models/notice.model';

function extractDateFromUrl(url: string): string | null {
  // Regex patterns to match various date formats in the URL
  const patterns = [
    /(\d{2})(\d{2})(\d{2})(\d{3})/,  // Matches 200724401
    /(\d{2})(\d{2})(\d{4})/,         // Matches 16072024
    /(\d{2})(\d{2})(\d{2})/,         // Matches 200724
    /[a-z]*(\d{2})(\d{2})(\d{2,4})/i // Matches nt180724, circ1159130618, etc.
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      let day, month, year;
      if (match[0].length === 9) {
        // Format: DDMMYYYY + 3 digits
        [, day, month, year] = match;
      } else if (match[0].length === 8) {
        // Format: DDMMYYYY
        [, day, month, year] = match;
      } else {
        // Other formats
        [, day, month, year] = match;
        if (year.length === 2) {
          year = `20${year}`;
        }
      }

      if (isValidDate(day, month, year)) {
        return `${day}/${month}/${year}`;
      }
    }
  }

  return null;
}

function isValidDate(day: string, month: string, year: string): boolean {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && 
         date.getMonth() === m - 1 && 
         date.getDate() === d && 
         y >= 2018 && 
         y <= new Date().getFullYear();
}

export async function scrapNotices(): Promise<Notice[]> {
  try {
    console.log('Attempting to fetch notices...');
    const response = await axios.get('http://www.ipu.ac.in/notices.php');
    console.log('Response status:', response.status);
    
    const $ = cheerio.load(response.data);
    const notices: Notice[] = [];
    let lastValidDate: string | null = null;

    console.log('Parsing HTML...');
    
    $('table tr').each((index, element) => {
      const $td = $(element).find('td').first();
      const noticeText = $td.text().trim();
      const $a = $td.find('a');
      const downloadUrl = $a.attr('href');

      if (noticeText && downloadUrl) {
        const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `http://www.ipu.ac.in${downloadUrl}`;
        let extractedDate = extractDateFromUrl(fullUrl);

        if (fullUrl.includes('youtube.com') || fullUrl.includes('youtu.be')) {
          extractedDate = lastValidDate;
        } else if (extractedDate) {
          lastValidDate = extractedDate;
        }

        if (!extractedDate) {
          console.log(`Failed to extract date from URL: ${fullUrl}`);
          console.log(`Notice text: ${noticeText}`);
          // Try to extract date from notice text if URL extraction failed
          const textDateMatch = noticeText.match(/(\d{1,2})[\.-](\d{1,2})[\.-](\d{2,4})/);
          if (textDateMatch) {
            let [, day, month, year] = textDateMatch;
            if (year.length === 2) year = `20${year}`;
            if (isValidDate(day, month, year)) {
              extractedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
              console.log(`Extracted date ${extractedDate} from notice text`);
            }
          }
        }
        else {
          console.log(`Successfully extracted date ${extractedDate} from URL: ${fullUrl}`);
        }

        notices.push({
          date: extractedDate || lastValidDate || 'Unknown',
          title: noticeText,
          url: fullUrl
        });
      }
    });


    // Forward pass to fill in dates for YouTube links
    for (let i = 0; i < notices.length; i++) {
      if (notices[i].date === 'Unknown' && (notices[i].url.includes('youtube.com') || notices[i].url.includes('youtu.be'))) {
        // Look for the next valid date
        for (let j = i + 1; j < notices.length; j++) {
          if (notices[j].date !== 'Unknown') {
            notices[i].date = notices[j].date;
            break;
          }
        }
      }
    }

    // Backward pass to fill any remaining unknown dates
    for (let i = notices.length - 1; i >= 0; i--) {
      if (notices[i].date === 'Unknown') {
        // Look for the previous valid date
        for (let j = i - 1; j >= 0; j--) {
          if (notices[j].date !== 'Unknown') {
            notices[i].date = notices[j].date;
            break;
          }
        }
      }
    }

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