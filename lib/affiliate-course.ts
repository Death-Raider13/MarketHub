export type AffiliateQuizQuestion = {
  id: string
  question: string
  options: string[]
  answer: number
  explanation: string
}

export type CourseSection = {
  heading?: string
  text?: string
  bullets?: string[]
  example?: string
}

export type AffiliateCourseModule = {
  id: number
  title: string
  summary: string
  sections: CourseSection[]
}

export const affiliateCourseModules: AffiliateCourseModule[] = [
  {
    id: 1,
    title: 'What is affiliate marketing?',
    summary: 'Understand the affiliate role, commissions, trust, communication, and consistency.',
    sections: [
      {
        heading: 'Who is an Affiliate Marketer?',
        text: 'An affiliate marketer is someone who promotes another person\'s or company\'s product or service and earns a commission when their promotion results in a successful sale or other qualifying action.'
      },
      {
        heading: 'Simple Example',
        text: 'Imagine Fero E-Library has a ₦10,000 course or resource package. You receive a unique affiliate link or referral code. You promote the course to people who may need it.',
        bullets: [
          'Customer → Your Affiliate Link → Fero E-Library → Sale → Commission to You',
          'Your job isn\'t necessarily to create the product. Your job is to connect the right customer with the right product.'
        ]
      },
      {
        heading: 'Important Skills of an Affiliate Marketer',
        text: 'A successful affiliate marketer should develop key foundational skills:',
        bullets: [
          'Communication skills',
          'Marketing skills',
          'Persuasion',
          'Content creation',
          'Customer relationship skills',
          'Social media skills',
          'Basic sales knowledge',
          'Consistency',
          'Honesty and transparency'
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'How affiliate marketing works',
    summary: 'Choose a useful product, identify the audience, create content, explain the offer, and follow up.',
    sections: [
      {
        heading: 'The Basic Process',
        bullets: [
          '1. Choose a product: Select something you understand and believe can genuinely help people.',
          '2. Join the affiliate program: You receive your referral link/code and understand the commission structure.',
          '3. Identify your audience: Know exactly who is likely to need the product.',
          '4. Create promotional content: WhatsApp status, Instagram posts, TikTok videos, Facebook posts, educational reviews, tutorials, and testimonials.',
          '5. Attract potential customers: Don\'t simply tell everyone "BUY THIS!". Instead, identify a problem and demonstrate how the product solves it.',
          '6. Convert the customer: Give clear info about what the product is, who it is for, benefits, price, and how to purchase.',
          '7. Follow up: Some people won\'t buy immediately. A polite follow-up can turn an interested person into a customer.'
        ]
      }
    ]
  },
  {
    id: 3,
    title: 'How to get customers',
    summary: 'Use targeted, problem-focused marketing instead of repeatedly posting a link.',
    sections: [
      {
        heading: 'Value & Target Audience',
        text: 'This is one of the most important parts of affiliate marketing. You don\'t get customers simply by posting your affiliate link repeatedly. You get customers by creating value, building trust, and reaching the right audience.'
      },
      {
        heading: 'Method 1: Know Your Target Audience',
        text: 'Ask yourself: Who needs this product? For Fero E-Library, potential audiences include:',
        bullets: [
          'University students',
          'Secondary school students',
          'Nursing & Medical students',
          'Students preparing for examinations (WAEC, JAMB, PUTME, etc.)'
        ]
      },
      {
        heading: 'Targeted vs General Approach',
        example: 'Instead of saying: "Buy our books.", say something specific like: "Are you a nursing student struggling to organize your anatomy revision? Here is a resource that can help you prepare more effectively." That is targeted marketing.'
      }
    ]
  },
  {
    id: 4,
    title: 'The content-to-customer method',
    summary: 'Move from attention to value, trust, interest, and a clear call to action.',
    sections: [
      {
        heading: 'The Strategy Formula',
        text: 'CONTENT → ATTENTION → TRUST → INTEREST → CUSTOMER',
        bullets: [
          'Step 1: Create attention — Use hooks such as: "3 mistakes students make when preparing for exams."',
          'Step 2: Provide value — Actually teach something useful and actionable.',
          'Step 3: Introduce the solution — Explain that Fero E-Library has resources that can help.',
          'Step 4: Give a Call-to-Action — For example: "Send me a DM if you\'d like to know how to access it."'
        ]
      }
    ]
  },
  {
    id: 5,
    title: 'Using WhatsApp for affiliate marketing',
    summary: 'Educate, engage, and recommend through useful status updates without spamming.',
    sections: [
      {
        heading: 'Direct Relationship Building',
        text: 'WhatsApp is particularly useful because you can build relationships directly with your contacts.'
      },
      {
        heading: 'WhatsApp Status Content Ideas',
        bullets: [
          '1. Educational: "Did you know that active recall can improve your revision? Here\'s how it works..."',
          '2. Problem-focused: "Having difficulty finding reliable past questions?"',
          '3. Social proof: "Another student just joined our resource community! 🎉"',
          '4. Offer: "Fero E-Library is live. Join now and enjoy early-bird benefits."'
        ]
      },
      {
        heading: 'Important Golden Rule',
        text: 'Don\'t spam your contacts. Follow the formula: Educate → Engage → Recommend.'
      }
    ]
  },
  {
    id: 6,
    title: 'How to turn interest into sales',
    summary: 'Recognize buying signals, listen to needs, recommend honestly, and allow the customer to decide.',
    sections: [
      {
        heading: 'Identifying Buying Signals',
        text: 'Someone may ask questions like: "How much is it?", "What books are available?", "How does the affiliate program work?", "Can I see a sample?", or "How do I register?" These are opportunities to provide clear information.'
      },
      {
        heading: 'Ethical Sales Approach',
        text: 'Don\'t pressure people. Instead follow this rhythm:',
        bullets: [
          'Listen carefully to their concerns',
          'Understand their exact academic need',
          'Recommend the appropriate resource',
          'Explain the benefits clearly',
          'Allow them to decide comfortably'
        ]
      }
    ]
  },
  {
    id: 7,
    title: 'Affiliate marketing mistakes to avoid',
    summary: 'Avoid spam, false promises, guaranteed-income claims, fake testimonials, and misleading content.',
    sections: [
      {
        heading: 'Mistakes to Avoid ❌',
        bullets: [
          '❌ Spamming people with unasked links',
          '❌ Making false promises or guaranteed income claims',
          '❌ Pretending to be a customer when you\'re not',
          '❌ Promoting products you don\'t understand',
          '❌ Posting only affiliate links without context',
          '❌ Ignoring customers after they purchase',
          '❌ Copying another marketer\'s content',
          '❌ Buying fake followers or using misleading testimonials'
        ]
      },
      {
        heading: 'The Golden Rule 🌟',
        text: 'Never sacrifice long-term trust for a quick sale.'
      }
    ]
  },
  {
    id: 8,
    title: 'Building your personal brand',
    summary: 'Build a recognizable, trustworthy identity around a clear student-resource niche.',
    sections: [
      {
        heading: 'Why Personal Brand Matters',
        text: 'People don\'t only buy products — people buy from people they trust. Build a recognizable identity around what you do.',
        example: 'Example Bio / Brand Statement: "I\'m a student-resource affiliate helping university students find useful academic materials and revision guides."'
      }
    ]
  },
  {
    id: 9,
    title: 'Access to the group',
    summary: 'Join the official affiliate community to receive marketing materials, graphics, launch updates, and daily mentorship.',
    sections: [
      {
        heading: 'Official Affiliate Community Groups',
        text: 'Connect with fellow Fero E-Library affiliates, receive promotional materials, graphics, launch updates, and daily mentorship inside our official affiliate community channels.'
      },
      {
        heading: 'Why Join the Affiliate Group?',
        bullets: [
          'Receive daily promotional scripts and high-converting status copies.',
          'Access exclusive early-bird promotional banners, book covers, and flyers.',
          'Get direct answers to your marketing and commission payout questions.',
          'Participate in monthly affiliate sales challenges and earn extra cash bonuses!'
        ]
      }
    ]
  },
  {
    id: 10,
    title: 'Assignment & Quiz',
    summary: 'Answer the final quiz questions to verify your knowledge and activate advertising access.',
    sections: [
      {
        heading: 'Final Course Requirement',
        text: 'Review all 10 modules, verify your understanding of target student audiences, ethical promotion methods, and take the quiz below. Scoring 75% or higher unlocks your advertising access automatically!'
      }
    ]
  }
]

export const affiliateQuiz: AffiliateQuizQuestion[] = [
  { id: 'q1', question: 'What does an affiliate marketer primarily do?', options: ['Create every product they promote', 'Connect the right customer with a useful product', 'Guarantee income to customers', 'Send the same link to everyone'], answer: 1, explanation: 'The affiliate connects a suitable customer to a product and earns when a qualifying action occurs.' },
  { id: 'q2', question: 'What should you do before promoting a product?', options: ['Understand and believe the product can genuinely help people', 'Promise that everyone will make money', 'Buy fake followers', 'Hide the price'], answer: 0, explanation: 'Ethical promotion starts with understanding the product and its genuine value.' },
  { id: 'q3', question: 'Which sequence describes the content-to-customer method?', options: ['Link → spam → pressure → sale', 'Attention → value → solution → call to action', 'Price → discount → pressure → sale', 'Follower → follower → follower → sale'], answer: 1, explanation: 'Useful content earns attention and trust before the product is introduced.' },
  { id: 'q4', question: 'What is the recommended WhatsApp approach?', options: ['Post the affiliate link repeatedly', 'Educate, engage, and recommend', 'Message every contact every hour', 'Use misleading testimonials'], answer: 1, explanation: 'WhatsApp works best when you provide value and build relationships rather than spam.' },
  { id: 'q5', question: 'Which is a buying signal?', options: ['Someone asks how much the product costs', 'Someone blocks your account', 'Someone never sees your content', 'Someone asks for unrelated news'], answer: 0, explanation: 'Questions about price, availability, samples, or registration show active interest.' },
  { id: 'q6', question: 'Which practice is prohibited?', options: ['Explaining product benefits clearly', 'Following up politely', 'Claiming guaranteed income', 'Teaching something useful'], answer: 2, explanation: 'Never make false promises or claim guaranteed income.' },
  { id: 'q7', question: 'Why build a personal brand?', options: ['People buy from people they trust', 'It removes the need to understand products', 'It guarantees every post becomes viral', 'It allows you to hide your identity'], answer: 0, explanation: 'A clear, trustworthy identity helps the right audience understand what you do.' },
  { id: 'q8', question: 'What should you do after a customer shows interest?', options: ['Pressure them until they buy', 'Listen, understand, recommend, explain, and let them decide', 'Send unrelated links', 'Pretend to be another customer'], answer: 1, explanation: 'Respectful selling focuses on the customer’s need and leaves the decision to them.' },
  { id: 'q9', question: 'What is affiliate marketing?', options: ['Promoting another person’s or company’s product and earning from a qualifying sale or action', 'Creating fake testimonials for any product', 'Sending random links without understanding the product', 'Guaranteeing income to every customer'], answer: 0, explanation: 'Affiliate marketing connects a suitable customer to another person’s or company’s product for a qualifying commission.' },
  { id: 'q10', question: 'Which is an ethical way to promote products?', options: ['Spam the same link to everyone', 'Make false promises about income', 'Create useful content for the right audience and explain the genuine benefits', 'Pretend to be a customer'], answer: 2, explanation: 'Ethical promotion provides value, targets the right audience, and communicates honestly.' },
]

export const AFFILIATE_QUIZ_PASS_PERCENT = 75
