// Renders the small subset of Markdown the AI assistant uses: headings, **bold**, *italic*, `code`,
// bullet and numbered lists, --- dividers and paragraphs. It builds React elements rather than raw HTML,
// so nothing in a reply can inject markup into the page

// **bold**, `code` and *italic* inside a line of text
function renderInline(text) {
  const pieces = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g)
  return pieces.map((piece, i) => {
    if (piece.startsWith('**') && piece.endsWith('**')) return <strong key={i}>{piece.slice(2, -2)}</strong>
    if (piece.startsWith('`') && piece.endsWith('`')) return <code key={i}>{piece.slice(1, -1)}</code>
    if (piece.length > 2 && piece.startsWith('*') && piece.endsWith('*')) return <em key={i}>{piece.slice(1, -1)}</em>
    return piece
  })
}

const BULLET = /^(\s*)[-*•]\s+(.*)$/
const NUMBERED = /^(\s*)\d+[.)]\s+(.*)$/
const HEADING = /^(#{1,6})\s+(.*)$/

function Markdown({ text }) {
  const blocks = []
  let list = null
  let paragraph = []

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'p', text: paragraph.join(' ') })
      paragraph = []
    }
  }
  const flushList = () => {
    if (list) {
      blocks.push(list)
      list = null
    }
  }

  for (const line of text.split('\n')) {
    const bullet = line.match(BULLET)
    const numbered = line.match(NUMBERED)
    const heading = line.match(HEADING)

    if (bullet || numbered) {
      flushParagraph()
      const [, indent, itemText] = bullet || numbered
      const type = bullet ? 'ul' : 'ol'
      // Indented items belong to the list above them; show them nested
      if (!list || (list.type !== type && indent.length === 0)) {
        flushList()
        list = { type, items: [] }
      }
      list.items.push({ text: itemText, nested: indent.length >= 2 })
    } else if (heading) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'h', text: heading[2] })
    } else if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'hr' })
    } else if (line.trim() === '') {
      flushParagraph()
      flushList()
    } else if (list && /^\s{2,}/.test(line)) {
      // A wrapped continuation of the previous list item
      list.items[list.items.length - 1].text += ` ${line.trim()}`
    } else {
      flushList()
      paragraph.push(line.trim())
    }
  }
  flushParagraph()
  flushList()

  return (
    <div className="md">
      {blocks.map((block, i) => {
        if (block.type === 'h') return <h4 key={i}>{renderInline(block.text)}</h4>
        if (block.type === 'hr') return <hr key={i} />
        if (block.type === 'p') return <p key={i}>{renderInline(block.text)}</p>

        const List = block.type
        return (
          <List key={i}>
            {block.items.map((item, j) => (
              <li key={j} className={item.nested ? 'md-nested' : undefined}>{renderInline(item.text)}</li>
            ))}
          </List>
        )
      })}
    </div>
  )
}

export default Markdown
