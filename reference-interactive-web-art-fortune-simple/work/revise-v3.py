from pathlib import Path
import re
p=Path('outputs/soap-oracle/dist/index.html')
s=p.read_text(encoding='utf-8')
start=s.index('        <svg viewBox="0 0 260 430"')
end=s.index('        </svg>',start)+len('        </svg>')
s=s[:start]+'''        <svg viewBox="0 0 260 430" aria-hidden="true">
          <defs><clipPath id="windowClip"><ellipse cx="127" cy="211" rx="21" ry="48"/></clipPath></defs>
          <path d="M205 27 L234 41 L234 392 L216 408 L62 408 L46 390 L46 44Z" fill="#c5c8c1" stroke="#151515" stroke-width="5" stroke-linejoin="round"/>
          <path d="M55 18 H193 Q218 18 218 43 V387 Q218 405 199 405 H53 Q35 405 35 387 V44 Q35 18 55 18Z" fill="#fffef7" stroke="#151515" stroke-width="5"/>
          <ellipse cx="127" cy="211" rx="21" ry="48" fill="#f0f2ed"/>
          <g clip-path="url(#windowClip)"><rect id="soapLevel" x="104" y="161" width="46" height="100" fill="#b9dff3"/></g>
          <ellipse cx="127" cy="211" rx="21" ry="48" fill="none" stroke="#151515" stroke-width="4"/>
          <path d="M117 405 H137" stroke="#151515" stroke-width="8" stroke-linecap="round"/>
          <g class="press-plate"><path d="M48 389 V345 Q48 316 77 316 H177 Q205 316 205 345 V399 H58 Q48 399 48 389Z" fill="#dadcd5" stroke="#151515" stroke-width="4"/><path d="M69 336 H185" fill="none" stroke="#151515" stroke-width="3"/></g>
        </svg>'''+s[end:]
s=s.replace('fill="#d9b198" stroke="#bd977e" stroke-width="1.1"','fill="#fffef7" stroke="#151515" stroke-width="4.5" stroke-linejoin="round"')
s=s.replace('stroke="#b58f76" stroke-width="1.2" opacity=".55"','stroke="#151515" stroke-width="3.2"')
s=s.replace('      <output id="fortune" aria-live="polite" aria-atomic="true"></output>','')
s=s.replace('  <dialog id="guideDialog"','  <dialog id="resultDialog" class="result-dialog" aria-label="Your fortune"><button id="resultClose" class="close" aria-label="Close fortune">×</button><canvas id="resultShape" width="600" height="400" aria-label="Your actual soap shape"></canvas><output id="fortune" aria-live="polite" aria-atomic="true"></output></dialog>\n  <dialog id="guideDialog"')
p.write_text(s,encoding='utf-8')
