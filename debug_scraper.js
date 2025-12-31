const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('debug_photos.html', 'utf8');
const $ = cheerio.load(html);

console.log('HTML length:', html.length);

const scriptContent = $('script').map((i, el) => $(el).html()).get().join(' ');

// Find all URLs and show more context
const urlRegex = /https:\/\/lh3\.googleusercontent\.com\/[^\s"]+/g;
let matches = [];
let match;

while ((match = urlRegex.exec(scriptContent)) !== null && matches.length < 5) {
    const start = Math.max(0, match.index - 100);
    const end = Math.min(scriptContent.length, match.index + 300);
    matches.push({
        url: match[0],
        context: scriptContent.substring(start, end)
    });
}

console.log('\n=== Found', matches.length, 'sample URLs ===\n');
matches.forEach((m, i) => {
    console.log(`\n--- Sample ${i + 1} ---`);
    console.log('URL:', m.url.substring(0, 80) + '...');
    console.log('Context:', m.context);
});

// Try alternative regex patterns
console.log('\n\n=== Testing Alternative Patterns ===\n');

// Pattern 1: Look for array with URL and numbers
const pattern1 = /\["(https:\/\/lh3\.googleusercontent\.com\/[^"]+)"\s*,\s*(\d+)\s*,\s*(\d+)/g;
const matches1 = [];
while ((match = pattern1.exec(scriptContent)) !== null && matches1.length < 3) {
    matches1.push(match[0]);
}
console.log('Pattern 1 (["url",w,h]):', matches1.length, 'matches');
if (matches1.length > 0) console.log('Sample:', matches1[0].substring(0, 100));

// Pattern 2: Just URL followed by dimensions
const pattern2 = /"(https:\/\/lh3\.googleusercontent\.com\/[^"]+)"\s*,\s*(\d+)\s*,\s*(\d+)/g;
const matches2 = [];
while ((match = pattern2.exec(scriptContent)) !== null && matches2.length < 3) {
    matches2.push(match[0]);
}
console.log('\nPattern 2 ("url",w,h):', matches2.length, 'matches');
if (matches2.length > 0) console.log('Sample:', matches2[0].substring(0, 100));

// Pattern 3: URL in quotes anywhere
const pattern3 = /"(https:\/\/lh3\.googleusercontent\.com\/[^"]+)"/g;
const matches3 = [];
while ((match = pattern3.exec(scriptContent)) !== null && matches3.length < 3) {
    matches3.push(match[1]);
}
console.log('\nPattern 3 (just "url"):', matches3.length, 'matches');
if (matches3.length > 0) console.log('Sample:', matches3[0].substring(0, 80));
