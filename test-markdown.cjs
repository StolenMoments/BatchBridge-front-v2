const { marked } = require('marked');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const content = 'Hello **world**! <script>alert(1)</script>';
const rawHtml = marked.parse(content);
const sanitizedHtml = DOMPurify.sanitize(rawHtml);

console.log('Original content:', content);
console.log('Marked output (raw):', rawHtml);
console.log('DOMPurify output (sanitized):', sanitizedHtml);

const escapedContent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rawHtmlEscaped = marked.parse(escapedContent);
const sanitizedHtmlEscaped = DOMPurify.sanitize(rawHtmlEscaped);

console.log('\n--- With escaping ---');
console.log('Escaped content:', escapedContent);
console.log('Marked output (raw):', rawHtmlEscaped);
console.log('DOMPurify output (sanitized):', sanitizedHtmlEscaped);
