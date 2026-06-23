import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

function isEscaped(text, idx) {
  // Count preceding backslashes
  let count = 0;
  for (let i = idx - 1; i >= 0 && text[i] === '\\'; i--) count++;
  return count % 2 === 1;
}

function findNextUnescaped(text, char, from) {
  for (let i = from; i < text.length; i++) {
    if (text[i] === char && !isEscaped(text, i)) return i;
  }
  return -1;
}

function tokenize(input) {
  const segments = [];
  if (!input) return segments;
  let i = 0;
  while (i < input.length) {
    // Block math $$...$$
    if (input.startsWith('$$', i)) {
      const j = input.indexOf('$$', i + 2);
      if (j !== -1) {
        const latex = input.slice(i + 2, j).trim();
        segments.push({ type: 'block', latex });
        i = j + 2;
        continue;
      }
      // If no closing $$, treat as plain text
    }
    // Inline math $...$
    if (input[i] === '$' && !isEscaped(input, i)) {
      const j = findNextUnescaped(input, '$', i + 1);
      if (j !== -1) {
        const latex = input.slice(i + 1, j).trim();
        segments.push({ type: 'inline', latex });
        i = j + 1;
        continue;
      }
      // No closing $, fall through as text
    }

    // Normal text until next delimiter
    let nextIdx = input.indexOf('$$', i + 1);
    const nextInline = findNextUnescaped(input, '$', i + 1);
    if (nextIdx === -1 || (nextInline !== -1 && nextInline < nextIdx)) {
      nextIdx = nextInline;
    }
    if (nextIdx === -1) {
      segments.push({ type: 'text', text: input.slice(i) });
      break;
    } else {
      segments.push({ type: 'text', text: input.slice(i, nextIdx) });
      i = nextIdx;
    }
  }
  return segments;
}

const preventEvent = (e) => { e.preventDefault(); return false; };

function renderFormattedText(text) {
  if (!text) return '';
  
  // Normalize HTML tags and other delimiters to a standard set
  let normalized = text
    .replace(/<\/?b>/gi, '**')
    .replace(/<\/?strong>/gi, '**')
    .replace(/<\/?i>/gi, '*')
    .replace(/<\/?em>/gi, '*')
    .replace(/<u>/gi, '__u__')
    .replace(/<\/u>/gi, '__u__')
    .replace(/_([^_]+)_/g, '*$1*'); // Normalize markdown _italic_ to *italic*

  // Recursive parser to support nesting
  function parseNode(str) {
    if (!str) return [];
    
    // Match first occurrence of bold (**...**), underline (__u__...__u__), or italic (*...*)
    const regex = /(\*\*([^*]+)\*\*|__u__([^_]+)__u__|\*([^*]+)\*)/;
    const match = str.match(regex);
    
    if (!match) {
      return [str];
    }
    
    const index = match.index;
    const matchStr = match[0];
    const prefix = str.substring(0, index);
    const suffix = str.substring(index + matchStr.length);
    
    let content = '';
    let type = '';
    
    if (matchStr.startsWith('**')) {
      type = 'bold';
      content = match[2];
    } else if (matchStr.startsWith('__u__')) {
      type = 'underline';
      content = match[3];
    } else if (matchStr.startsWith('*')) {
      type = 'italic';
      content = match[4];
    }
    
    const prefixNodes = prefix ? [prefix] : [];
    const suffixNodes = parseNode(suffix);
    
    let matchNode;
    if (type === 'bold') {
      matchNode = <strong key={index} className="font-bold">{parseNode(content)}</strong>;
    } else if (type === 'italic') {
      matchNode = <em key={index} className="italic">{parseNode(content)}</em>;
    } else if (type === 'underline') {
      matchNode = <u key={index} className="underline">{parseNode(content)}</u>;
    }
    
    return [...prefixNodes, matchNode, ...suffixNodes];
  }

  return parseNode(normalized);
}

const MathText = ({ text = '', as: As = 'div', className = '' }) => {
  const parts = tokenize(text);
  return (
    <As
      className={className}
      style={{
        whiteSpace: 'pre-wrap',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
      onCopy={preventEvent}
      onCut={preventEvent}
      onContextMenu={preventEvent}
      onDragStart={preventEvent}
      onSelectStart={preventEvent}
    >
      {parts.length === 0 ? null : parts.map((p, idx) => {
        if (p.type === 'text') return <React.Fragment key={idx}>{renderFormattedText(p.text)}</React.Fragment>;
        if (p.type === 'inline') {
          try {
            return <InlineMath key={idx} math={p.latex} />;
          } catch (e) {
            return <code key={idx}>${p.latex}$</code>;
          }
        }
        if (p.type === 'block') {
          try {
            return <div key={idx} className="my-2 overflow-x-auto"><BlockMath math={p.latex} /></div>;
          } catch (e) {
            return <pre key={idx}>$$\n{p.latex}\n$$</pre>;
          }
        }
        return null;
      })}
    </As>
  );
};

export default MathText;
