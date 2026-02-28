# CodeBlock Component - Manual Verification Guide

## Component Location
`src/components/capsule/CodeBlock.tsx`

## Features Implemented
✅ Syntax highlighting using react-syntax-highlighter
✅ Copy button with visual feedback
✅ Support for 25+ programming languages
✅ Line numbers (configurable)
✅ Line highlighting capability
✅ Dark/Light theme support
✅ Error handling for empty code
✅ Responsive design with Tailwind CSS
✅ Smooth animations with framer-motion

## Manual Verification Steps

### 1. Test Python Code Block
```tsx
import CodeBlock from '@/components/capsule/CodeBlock'

<CodeBlock
  code={`def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    sequence = [0, 1]
    for i in range(2, n):
        sequence.append(sequence[i-1] + sequence[i-2])
    return sequence`}
  language="python"
  title="fibonacci.py"
  showLineNumbers={true}
/>
```

**Expected Result:**
- Python syntax highlighting with correct colors
- Line numbers visible on the left
- Copy button in the top-right
- Title shows "fibonacci.py"

### 2. Test JavaScript Code Block
```tsx
<CodeBlock
  code={`async function fetchData(url) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
  }
}`}
  language="javascript"
  showLineNumbers={true}
/>
```

**Expected Result:**
- JavaScript syntax highlighting
- Keywords like `async`, `await`, `try`, `catch` properly colored
- Copy button functional

### 3. Test JSON Code Block
```tsx
<CodeBlock
  code={`{
  "name": "GENIA",
  "version": "3.1.1",
  "features": ["syntax-highlighting", "copy-button"]
}`}
  language="json"
  title="config.json"
/>
```

**Expected Result:**
- JSON syntax highlighting
- Keys and values properly colored
- Copy button works

### 4. Test Copy Button Functionality
1. Click the "Copier" button
2. **Expected:** Button shows "Copié!" with a green checkmark icon
3. **Expected:** After 2 seconds, button returns to "Copier" state
4. Paste the copied content elsewhere
5. **Expected:** Content matches exactly what was displayed

### 5. Test Line Highlighting
```tsx
<CodeBlock
  code={`function example() {
  const a = 1;
  const b = 2;
  const sum = a + b;
  return sum;
}`}
  language="typescript"
  highlightLines={[3, 4, 5]}
/>
```

**Expected Result:**
- Lines 3, 4, and 5 have blue highlight background
- Blue border on the left of highlighted lines

### 6. Test Without Line Numbers
```tsx
<CodeBlock
  code={`console.log('Hello, World!');`}
  language="javascript"
  showLineNumbers={false}
/>
```

**Expected Result:**
- No line numbers displayed
- Code block still properly formatted

### 7. Test Empty Code Error Handling
```tsx
<CodeBlock
  code=""
  language="python"
/>
```

**Expected Result:**
- Yellow warning box appears
- AlertCircle icon visible
- Message: "Aucun code à afficher"

## Supported Languages
The component supports 25+ languages including:
- JavaScript, TypeScript, JSX, TSX
- Python, Java, C++, C#, Go, Rust
- HTML, CSS, SCSS
- JSON, YAML, XML
- Bash, Shell, SQL
- PHP, Ruby, Swift, Kotlin
- Markdown

## Visual Checklist
- [ ] Syntax highlighting works for Python
- [ ] Syntax highlighting works for JavaScript
- [ ] Syntax highlighting works for JSON
- [ ] Copy button shows and functions correctly
- [ ] Copy button animation (Copié! with checkmark) works
- [ ] Line numbers display when enabled
- [ ] Line highlighting works (blue background & border)
- [ ] Component has proper dark theme styling
- [ ] Header shows language badge or title
- [ ] Code is scrollable for long content
- [ ] Responsive design works on mobile
- [ ] Error state shows for empty code

## Integration Example
Here's how to use it in a capsule page:

```tsx
'use client'

import CodeBlock from '@/components/capsule/CodeBlock'

export default function CapsulePage() {
  const exampleCode = `print("Hello from GENIA!")`

  return (
    <div className="space-y-4">
      <h2>Code Example</h2>
      <CodeBlock
        code={exampleCode}
        language="python"
        title="hello.py"
        showLineNumbers={true}
      />
    </div>
  )
}
```

## Notes
- The component uses `react-syntax-highlighter` with Prism renderer
- Dark theme uses `vscDarkPlus` style
- Light theme uses `prism` style
- Auto theme defaults to dark (can be enhanced with system theme detection)
- Copy functionality uses the Clipboard API
- All animations use framer-motion for smooth transitions
