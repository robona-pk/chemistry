# Signal

**Dating + communication coaching MVP**

Signal is a product experiment exploring how AI-assisted coaching can help people make better connections while learning how they communicate.

## Product hypothesis

Dating apps optimise heavily for **discovery and matching**. Signal explores what happens when the product also helps users navigate the conversation that follows.

The core hypothesis:

> Better, contextual communication support can help users have more intentional conversations without taking control away from them.

## Product problem

Matching is only one part of the dating journey. Once two people match, users can still struggle with:

- What to say next
- How to interpret conversational patterns
- Whether they are communicating clearly
- How to respond without sounding generic or overly scripted

Signal treats conversation quality as a product problem rather than simply a messaging feature.

## MVP

### Discovery
- Onboarding and profile creation
- Interests and MBTI/personality type
- Swipe-style discovery
- Matches and seeded conversations

### Coaching
- Per-conversation coaching consent
- Match-specific conversation coaching
- Suggested replies
- Basic behavioural insights
- Cross-conversation topic intelligence concept

### Prototype infrastructure
- Client-side seeded data
- LocalStorage persistence
- Hatchable API endpoints
- Rule-based coaching MVP

## Product decisions

**1. Coaching is opt-in**

Users explicitly control whether coaching is enabled for a conversation. The product should assist communication, not silently analyse it.

**2. Coaching is contextual**

Generic dating advice is easy to produce and easy to ignore. Signal is designed around the specific conversation and its context.

**3. MVP before infrastructure**

The current prototype deliberately uses seeded data and LocalStorage. This keeps the product loop testable before investing in authentication, persistent data, matching infrastructure, and production AI.

## What I would build next

1. Real authentication and profiles
2. Persistent conversation storage
3. Production messaging
4. A proper evaluation framework for coaching quality
5. LLM-based coaching with guardrails
6. Safety, privacy, reporting, and moderation systems
7. Experiments measuring whether coaching improves conversation outcomes without reducing authenticity

## Tech

- HTML / CSS / JavaScript
- Hatchable
- LocalStorage
- API endpoints for prototype coaching

## Run locally

The frontend is static and can be served with:

```bash
python3 -m http.server 3000 --directory public
```

Then open `http://localhost:3000`.

## Status

**MVP / product experiment — not production-ready.**

This repository intentionally does not include production authentication, a persistent database, real user matching, production messaging, moderation infrastructure, or a production LLM coaching pipeline.
