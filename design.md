# Spitzli Development — interface direction

## Brand and purpose
Spitzli Development, always capitalised. A personal software engineer/system architect portfolio, not an agency. One person, direct contact, broad software and infrastructure experience. Google Cloud is part of the stack, not a dedicated navigation item or dominant brand position. No invented metrics, certifications, endorsements or customer-logo permissions.

## Shared visual system
- Dark graphite, violet as a restrained signal. No provider-specific spotlight sections.
- JetBrains Mono for the main display voice, Space Grotesk for readable body text and project titles. Fonts are local.
- Source of truth for colour, type, spacing and timing: `tokens.css`.
- Home: Map / Diagram orientation plus a readable project index. The diagram explains capabilities, not this site's actual deployment architecture.
- Navigation: readable side rail on wide screens, visible wrapping links on small screens. No icon-only navigation.
- Project/detail/legal pages use the same shell and tokens; content stays typographic.
- Footer: personal close from Dominik, then legal links. No synthetic team voice.

## Interaction
Native links, buttons, selects and form fields. Clear focus rings and 44px touch targets. The system map has explicit selected state and a polite live explanation. No scroll hijacking, autoplay, fake terminal/browser chrome or hover-only actions. Reduced motion removes spatial effects.

## Languages and content
English and German use Gettext PO catalogs and locale-prefixed URLs. Browser preferences select the initial language; unsupported languages fall back to English. Explicit language changes persist in a necessary preference cookie. The CMS localises project prose, link labels and image alternatives; brands and technology names remain proper names.

## Contact and publication
The contact form remains visible. Its availability accurately reflects server configuration; it never pretends that a message was sent. Existing publication, legal, privacy and SMTP guards remain in force. hCaptcha loads only after explicit activation and is verified server-side. Visitor-facing copy stays concise: no implementation trivia; the privacy notice explains only actual processing and required rights.
