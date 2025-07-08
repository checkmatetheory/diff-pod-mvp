# **Diffused: Event Content Diffusion Platform**
## **Product Requirements Document (PRD)**

### **🎯 The White Core Network Effect**

**The Network Effect:** Every event recap becomes a lead magnet that drives attendees to **future events**, creating a self-reinforcing loop where content consumers become event participants, and event participants become content amplifiers.

**The Viral Mechanism:** 
- Event attendees share branded recaps → Non-attendees discover content → Non-attendees want to attend future events → Event grows → More content to share

---

## **🏗️ Subdomain Architecture Strategy**

### **Decision: Event-Level Subdomains (NOT Panel-Level)**

**Format:** `{event-slug}.diffused.app`

**Examples:**
- `tech-summit-2024.diffused.app`
- `fintech-forum.diffused.app` 
- `crypto-conference.diffused.app`

### **Why Event-Level vs Panel-Level:**

✅ **Event-Level Benefits:**
- **Brand Recognition**: Event name in URL builds event brand equity
- **SEO Authority**: All content under one domain builds domain authority
- **Social Sharing**: Easier to remember and share `fintech-forum.diffused.app`
- **Content Discovery**: Users can browse all sessions from an event
- **Lead Generation**: One subdomain = one clear call-to-action (next year's event)

❌ **Panel-Level Problems:**
- **Fragmentation**: `ai-panel.diffused.app` doesn't build event brand
- **Confusion**: Too many subdomains dilute brand recognition
- **SEO Weakness**: Splits authority across multiple domains
- **Poor UX**: Users can't discover related content

### **URL Structure:**
```
tech-summit-2024.diffused.app/
├── /                          # Event landing page
├── /sessions/ai-fintech       # Individual session recap
├── /sessions/crypto-trends    # Individual session recap
├── /speakers                  # Speaker directory
└── /register-2025            # Next event registration
```

---

## **🔥 Core Value Proposition**

**For Event Producers:**
> "Turn your conference into a year-round lead generation engine that fills next year's event"

**For Attendees:**
> "Never lose track of the insights you paid to hear"

**For Non-Attendees:**
> "Get the FOMO you need to attend next year"

---

## **🎪 The Network Effect Mechanics**

### **1. Content Amplification Loop**
```
Event Happens → AI Generates Branded Recaps → Attendees Share → 
Non-Attendees Discover → Want Future Access → Register for Next Event
```

### **2. Social Proof Engine**
- **Attendee Attribution**: "Sarah Johnson attended Tech Summit 2024"
- **Exclusive Access**: "Get the full insights - attend next year"
- **FOMO Generation**: "You missed this, don't miss next year"

### **3. Lead Capture Mechanism**
- **Email Gate**: Full content requires email (lead capture)
- **Registration CTA**: Direct path to next event registration
- **Status Signaling**: Attendees get special sharing attribution

---

## **🚀 MVP Feature Set**

### **Phase 1: Core Diffusion Engine (Week 1-2)**

#### **Content Generation**
- AI-powered podcast generation (2-3 min recaps)
- Blog post generation (800-1200 words)
- Social media posts (LinkedIn, Twitter)
- Executive summary (200 words)

#### **Public Sharing Engine**
- Event-branded landing pages (`{event}.diffused.app`)
- Email-gated content access
- Social sharing with attendee attribution
- Mobile-optimized recap pages

#### **Lead Capture System**
- Email collection for full content access
- Next event registration integration
- Attendee vs non-attendee tracking
- Attribution tracking for shares

### **Phase 2: Network Amplification (Week 3-4)**

#### **Viral Mechanics**
- Attendee badge system ("I was there")
- Exclusive content for attendees
- Referral tracking and rewards
- Social proof display

#### **Analytics Dashboard**
- Recap views and engagement
- Lead generation metrics
- Conversion to next event registrations
- Viral coefficient tracking

---

## **📊 Success Metrics**

### **Primary KPIs**
1. **Viral Coefficient**: Shares per attendee (Target: 3+)
2. **Lead Conversion**: Email signups per recap view (Target: 15%+)
3. **Event Registration**: Next event signups from content (Target: 5%+)
4. **Content Consumption**: Time spent on recap pages (Target: 2+ min)

### **Secondary KPIs**
- SEO traffic to event subdomains
- Social media reach and engagement
- Return visitor rate to event domains
- Content completion rates

---

## **🎬 User Journey: The Network Effect**

### **Attendee Journey**
1. **During Event**: Upload session recordings via mobile app
2. **Day After Event**: Receive branded recap via email
3. **Share Phase**: Share recap with colleagues (social proof + attribution)
4. **Retention**: Access content throughout year on event subdomain

### **Non-Attendee Journey**
1. **Discovery**: Find shared recap via social media
2. **Engagement**: Read summary, want more content
3. **Lead Capture**: Enter email for full access
4. **Conversion**: Receive follow-up about next year's event
5. **Registration**: Sign up for next event to avoid FOMO

### **Event Producer Journey**
1. **Setup**: Create event subdomain and branding
2. **Content Upload**: Event team uploads session recordings
3. **Distribution**: Automated recap generation and distribution
4. **Analytics**: Track engagement and lead generation
5. **Conversion**: Drive next event registrations year-round

---

## **🔧 Technical Architecture**

### **Subdomain Management**
- Wildcard SSL: `*.diffused.app`
- Dynamic routing based on subdomain
- Event-specific branding injection
- Custom domain support (enterprise)

### **Content Pipeline**
- Audio/video processing (Supabase Storage)
- AI content generation (OpenAI/ElevenLabs)
- Static site generation (Next.js)
- CDN distribution (Vercel Edge)

### **Database Schema**
```sql
events (subdomain, name, branding, next_event_date)
sessions (event_id, title, audio_url, processing_status)
content (session_id, podcast_url, blog_content, social_content)
leads (email, event_id, source, attended_status)
shares (session_id, user_id, platform, timestamp)
```

---

## **💰 Monetization Strategy**

### **Tiered Pricing**
- **Free**: 1 event, basic branding, Diffused attribution
- **Pro ($99/event)**: Custom branding, analytics, lead export
- **Enterprise ($500/event)**: Custom domain, white-label, CRM integration

### **Revenue Streams**
1. **Event Licensing**: Per-event fees
2. **Lead Generation**: Success fees for registrations
3. **Enterprise Integration**: Custom development
4. **Content Syndication**: Revenue share with content partners

---

## **⚡ Competitive Advantage**

### **Unique Differentiators**
1. **Event-Centric Branding**: Content builds event brand equity
2. **Year-Round Engagement**: Content works 365 days, not just during event
3. **Lead Generation Engine**: Directly drives future event attendance
4. **Social Proof Amplification**: Attendee attribution creates FOMO
5. **Network Effect**: Each user increases value for all users

### **Moat Building**
- **Data Network Effect**: More events = better AI content generation
- **Brand Network Effect**: Prestigious events attract more prestigious events
- **Content Flywheel**: Quality content attracts quality events
- **Distribution Network**: Attendee networks become distribution channels

---

## **📈 Go-to-Market Strategy**

### **Week 1: Proof of Concept**
- Build MVP with 1 test event
- Generate 5 different content types
- Test email collection flow
- Measure basic engagement

### **Week 2: Beta Launch**
- Recruit 3 beta event partners
- Implement event-level subdomains
- Add attendee attribution
- Track viral coefficient

### **Week 3: Product-Market Fit**
- Optimize conversion funnels
- Add social sharing features
- Implement analytics dashboard
- Measure next-event conversion

### **Week 4: Scale Preparation**
- Automate onboarding flow
- Build payment system
- Create marketing website
- Prepare for public launch

---

## **🎯 The Core Insight**

**The platform succeeds when event content becomes a more effective marketing channel than traditional event marketing.**

When sharing a recap generates more next-year registrations than the original event marketing budget, we've achieved product-market fit.

The network effect kicks in when attendees become unpaid marketers because sharing content with attribution signals their professional status and expertise.

**The goal: Make every event a year-round lead generation engine powered by AI and amplified by social networks.** 