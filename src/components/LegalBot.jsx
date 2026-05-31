import { useState, useEffect, useRef, useCallback } from 'react'
import Fuse from 'fuse.js'
import './LegalBot.css'


const SUGGESTIONS = [
  'Helmet fine in India',
  'Speeding penalty Dubai',
  'DUI fine California',
  'Red light violation UK',
  'Drunk driving Germany',
  'Seat belt fine New York',
]


const DICT = {
  en: {
    welcome: "👋 Hi! I'm **DriveLegal AI**, your traffic law assistant.\n\nAsk me about fines, violations, or traffic rules in any supported region.\n\nTry something like *\"helmet fine in Delhi\"* or *\"speeding penalty in California\"*.",
    inputPlaceholder: "Ask about traffic laws…",
    loading: "Loading data…",
    offlineReady: "Offline Ready",
    notFound: "I couldn't find a specific rule for that. Try specifying the city, vehicle type, or violation.\n\nFor example:\n• *\"fine for overspeeding car in Dubai\"*\n• *\"helmet violation two-wheeler India\"*\n• *\"drunk driving penalty California\"*",
    related: "📌 **Related violations:**",
    fine: "Fine",
    repeatFine: "Repeat Offense",
    code: "Official Legal Citation",
    basedOn: (region, country, vehicle) => `Based on the rules in **${region}**, **${country}** for a **${vehicle}**:`,
    relatedFormat: (violation, region, country, fine) => `• **${violation}** in ${region}, ${country} — ${fine}`,
  },
  de: {
    welcome: "👋 Hallo! Ich bin **DriveLegal AI**, Ihr Verkehrsrechtsassistent.\n\nFragen Sie mich nach Bußgeldern, Verstößen oder Verkehrsregeln in jeder unterstützten Region.\n\nVersuchen Sie etwas wie *\"Helmstrafe in Delhi\"* oder *\"Geschwindigkeitsüberschreitung in Kalifornien\"*.",
    inputPlaceholder: "Fragen Sie nach Verkehrsregeln…",
    loading: "Daten werden geladen…",
    offlineReady: "Offline Bereit",
    notFound: "Ich konnte keine spezifische Regel dafür finden. Versuchen Sie, die Stadt, den Fahrzeugtyp oder den Verstoß anzugeben.\n\nZum Beispiel:\n• *\"Strafe für Geschwindigkeitsüberschreitung in Dubai\"*\n• *\"Helmverstoß Zweirad Indien\"*\n• *\"Trunkenheit am Steuer Strafe Kalifornien\"*",
    related: "📌 **Ähnliche Verstöße:**",
    fine: "Bußgeld",
    repeatFine: "Wiederholungstat",
    code: "Offizielles Gesetzeszitat",
    basedOn: (region, country, vehicle) => `Basierend auf den Regeln in **${region}**, **${country}** für ein **${vehicle}**:`,
    relatedFormat: (violation, region, country, fine) => `• **${violation}** in ${region}, ${country} — ${fine}`,
  },
  hi: {
    welcome: "👋 नमस्ते! मैं **DriveLegal AI** हूँ, आपका यातायात कानून सहायक।\n\nमुझसे किसी भी समर्थित क्षेत्र में जुर्माने, उल्लंघन या यातायात नियमों के बारे में पूछें।\n\nकुछ ऐसा पूछने का प्रयास करें जैसे *\"दिल्ली में हेलमेट जुर्माना\"* या *\"कैलिफ़ोर्निया में ओवरस्पीडिंग जुर्माना\"*।",
    inputPlaceholder: "यातायात नियमों के बारे में पूछें…",
    loading: "डेटा लोड हो रहा है…",
    offlineReady: "ऑफ़लाइन तैयार",
    notFound: "मुझे इसके लिए कोई विशिष्ट नियम नहीं मिला। शहर, वाहन प्रकार या उल्लंघन निर्दिष्ट करने का प्रयास करें।\n\nउदाहरण के लिए:\n• *\"दुबई में तेज गति से कार चलाने पर जुर्माना\"*\n• *\"हेलमेट उल्लंघन दोपहिया वाहन भारत\"*\n• *\"कैलिफ़ोर्निया में शराब पीकर गाड़ी चलाने पर जुर्माना\"*",
    related: "📌 **संबंधित उल्लंघन:**",
    fine: "जुर्माना",
    repeatFine: "बार-बार अपराध",
    code: "आधिकारिक कानूनी उद्धरण",
    basedOn: (region, country, vehicle) => `**${region}**, **${country}** में **${vehicle}** के नियमों के आधार पर:`,
    relatedFormat: (violation, region, country, fine) => `• **${violation}** ${region}, ${country} में — ${fine}`,
  }
}


function flattenRules(data) {
  const flat = []
  for (const countryObj of data) {
    for (const region of countryObj.regions) {
      for (const vt of region.vehicleTypes) {
        for (const v of vt.violations) {
          flat.push({
            country: countryObj.country,
            currency: countryObj.currency,
            region: region.name,
            vehicleType: vt.type,
            violationName: v.name,
            code: v.code,
            fine: v.fine,
            repeatFine: v.repeatFine,
            description: v.description,
            searchText: `${v.name} ${v.description} ${region.name} ${countryObj.country} ${vt.type}`,
          })
        }
      }
    }
  }
  return flat
}


function formatFine(amount, currency) {
  try {
    const localeMap = {
      INR: 'en-IN',
      EUR: 'de-DE',
      GBP: 'en-GB',
      AED: 'ar-AE',
      USD: 'en-US',
    }
    return new Intl.NumberFormat(localeMap[currency] || 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}


function renderBotText(text) {
  return text.split('\n').map((line, i) => {
    if (line.trim() === '---') {
      return <hr key={i} className="legalbot-hr" />
    }
    const html = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
    return (
      <span key={i} className="legalbot-line">
        <span dangerouslySetInnerHTML={{ __html: html }} />
      </span>
    )
  })
}




function LegalBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [lang, setLang] = useState('en')
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      isWelcome: true,
      text: "",
    },
  ])
  const [input, setInput] = useState('')
  const [fuse, setFuse] = useState(null)
  const [dataReady, setDataReady] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const isOpenRef = useRef(isOpen)

  
  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  
  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-legalbot', handleOpen)
    return () => window.removeEventListener('open-legalbot', handleOpen)
  }, [])

  
  useEffect(() => {
    fetch('/data/trafficRules.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load traffic rules')
        return res.json()
      })
      .then((data) => {
        const flat = flattenRules(data)
        const fuseInstance = new Fuse(flat, {
          keys: ['searchText'],
          threshold: 0.6,
          ignoreLocation: true,
          useExtendedSearch: true,
          includeScore: true,
          minMatchCharLength: 2,
        })
        setFuse(fuseInstance)
        setDataReady(true)
      })
      .catch(() => {
        setDataReady(false)
      })
  }, [])

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  
  const addBotReply = useCallback((text) => {
    setIsTyping(true)
    const delay = 500 + Math.random() * 500
    setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [...prev, { role: 'bot', text }])
    }, delay)
  }, [])

  
  const processQuery = useCallback(
    async (query) => {
      if (!fuse) return

      const userMsg = { role: 'user', text: query }
      const nextMessages = [...messages.filter(m => !m.isWelcome), userMsg]
      
      
      setMessages((prev) => [...prev, userMsg])
      setIsTyping(true)

      
      try {
        const res = await fetch('http://localhost:5000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: nextMessages })
        })

        if (res.ok) {
          const data = await res.json()
          setIsTyping(false)
          setMessages((prev) => [...prev, { role: 'bot', text: data.reply }])
          return
        }
      } catch (err) {
        console.warn('AI chat endpoint unreachable, falling back to offline search.', err)
      }

      
      setIsTyping(false)
      const stopWords = ['fine', 'for', 'in', 'penalty', 'what', 'is', 'the', 'how', 'much', 'a', 'an', 'of', 'on', 'to', 'do', 'i', 'get']
      const sanitized = query.toLowerCase().replace(/[^\w\s]/g, '')
      const cleanQuery = sanitized.split(/\s+/).filter(w => !stopWords.includes(w)).join(' ')
      
      const searchStr = cleanQuery.length > 2 ? cleanQuery : sanitized
      const results = fuse.search(searchStr)
      const goodResults = results.filter((r) => r.score < 0.6)

      const dict = DICT[lang]

      if (goodResults.length > 0) {
        const top = goodResults[0].item

        let reply = `${dict.basedOn(top.region, top.country, top.vehicleType)}\n\n`
        reply += `📋 **${top.violationName}**\n`
        reply += `📝 ${dict.code}: \`${top.code}\`\n`
        reply += `💰 ${dict.fine}: **${formatFine(top.fine, top.currency)}**`

        if (top.repeatFine && top.repeatFine !== top.fine) {
          reply += `\n🔁 ${dict.repeatFine}: **${formatFine(top.repeatFine, top.currency)}**`
        }

        reply += `\n\n${top.description}`

        
        const additional = goodResults.slice(1, 4)
        if (additional.length > 0) {
          reply += `\n\n---\n${dict.related}`
          for (const r of additional) {
            const it = r.item
            reply += `\n${dict.relatedFormat(it.violationName, it.region, it.country, formatFine(it.fine, it.currency))}`
          }
        }

        
        addBotReply(reply)
      } else {
        addBotReply(dict.notFound)
      }
    },
    [fuse, messages, addBotReply, lang]
  )

  
  const handleSend = useCallback(() => {
    const query = input.trim()
    if (!query || !fuse) return
    setInput('')
    processQuery(query)
  }, [input, fuse, processQuery])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChipClick = (suggestion) => {
    processQuery(suggestion)
  }

  const showSuggestions = messages.length <= 1

  
  return (
    <>
      
      <div
        className={`legalbot-panel ${isOpen ? 'legalbot-panel--open' : ''}`}
        role="dialog"
        aria-label="DriveLegal AI Chatbot"
      >
        
        <div className="legalbot-header">
          <div className="legalbot-header-left">
            <div className="legalbot-avatar">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="legalbot-header-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3>DriveLegal AI</h3>
                <select 
                  value={lang} 
                  onChange={(e) => setLang(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '0.25rem', fontSize: '0.7rem', padding: '0.1rem 0.25rem', outline: 'none', cursor: 'pointer' }}
                  aria-label="Select language"
                >
                  <option value="en">EN</option>
                  <option value="de">DE</option>
                  <option value="hi">HI</option>
                </select>
              </div>
              <span className="legalbot-status-text">
                <span className="legalbot-status-dot" />
                {dataReady ? DICT[lang].offlineReady : DICT[lang].loading}
              </span>
            </div>
          </div>
          <button
            className="legalbot-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close chatbot"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        
        <div className="legalbot-messages" aria-live="polite">
          {messages.map((msg, i) => (
            <div key={i} className={`legalbot-msg legalbot-msg--${msg.role}`}>
              {msg.role === 'bot' && (
                <div className="legalbot-msg-avatar">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
              )}
              <div className="legalbot-msg-bubble">
                {msg.role === 'bot' ? renderBotText(msg.isWelcome ? DICT[lang].welcome : msg.text) : msg.text}
              </div>
            </div>
          ))}

          
          {isTyping && (
            <div className="legalbot-msg legalbot-msg--bot">
              <div className="legalbot-msg-avatar">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="legalbot-msg-bubble legalbot-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        
        {showSuggestions && dataReady && (
          <div className="legalbot-chips">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="legalbot-chip"
                onClick={() => handleChipClick(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        
        <div className="legalbot-input-area">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={dataReady ? DICT[lang].inputPlaceholder : DICT[lang].loading}
            disabled={!dataReady}
            aria-label="Type your traffic law question"
            id="legalbot-input"
          />
          <button
            className="legalbot-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || !dataReady}
            aria-label="Send message"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      
      <button
        className={`legalbot-fab ${isOpen ? 'legalbot-fab--open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close chatbot' : 'Open DriveLegal AI chatbot'}
      >
        <svg
          className="legalbot-fab-icon legalbot-fab-icon--chat"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        <svg
          className="legalbot-fab-icon legalbot-fab-icon--close"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </>
  )
}

export default LegalBot
