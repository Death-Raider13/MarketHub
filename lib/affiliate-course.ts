export type AffiliateQuizQuestion = {
  id: string
  question: string
  options: string[]
  answer: number
  explanation: string
}

export const affiliateCourseModules = [
  { id: 1, title: 'What is affiliate marketing?', summary: 'Understand the affiliate role, commissions, trust, communication, and consistency.' },
  { id: 2, title: 'How affiliate marketing works', summary: 'Choose a useful product, identify the audience, create content, explain the offer, and follow up.' },
  { id: 3, title: 'How to get customers', summary: 'Use targeted, problem-focused marketing instead of repeatedly posting a link.' },
  { id: 4, title: 'The content-to-customer method', summary: 'Move from attention to value, trust, interest, and a clear call to action.' },
  { id: 5, title: 'Using WhatsApp for affiliate marketing', summary: 'Educate, engage, and recommend through useful status updates without spamming.' },
  { id: 6, title: 'Turning interest into sales', summary: 'Recognize buying signals, listen to needs, recommend honestly, and allow the customer to decide.' },
  { id: 7, title: 'Affiliate marketing mistakes to avoid', summary: 'Avoid spam, false promises, guaranteed-income claims, fake testimonials, and misleading content.' },
  { id: 8, title: 'Building your personal brand', summary: 'Build a recognizable, trustworthy identity around a clear student-resource niche.' },
  { id: 9, title: 'Community access', summary: 'Join the official affiliate community using the link provided by the MarketHub team.' },
  { id: 10, title: 'Assignment', summary: 'Explain affiliate marketing and describe ethical ways to promote products.' },
] as const

export const affiliateQuiz: AffiliateQuizQuestion[] = [
  { id: 'q1', question: 'What does an affiliate marketer primarily do?', options: ['Create every product they promote', 'Connect the right customer with a useful product', 'Guarantee income to customers', 'Send the same link to everyone'], answer: 1, explanation: 'The affiliate connects a suitable customer to a product and earns when a qualifying action occurs.' },
  { id: 'q2', question: 'What should you do before promoting a product?', options: ['Understand and believe the product can genuinely help people', 'Promise that everyone will make money', 'Buy fake followers', 'Hide the price'], answer: 0, explanation: 'Ethical promotion starts with understanding the product and its genuine value.' },
  { id: 'q3', question: 'Which sequence describes the content-to-customer method?', options: ['Link → spam → pressure → sale', 'Attention → value → solution → call to action', 'Price → discount → pressure → sale', 'Follower → follower → follower → sale'], answer: 1, explanation: 'Useful content earns attention and trust before the product is introduced.' },
  { id: 'q4', question: 'What is the recommended WhatsApp approach?', options: ['Post the affiliate link repeatedly', 'Educate, engage, and recommend', 'Message every contact every hour', 'Use misleading testimonials'], answer: 1, explanation: 'WhatsApp works best when you provide value and build relationships rather than spam.' },
  { id: 'q5', question: 'Which is a buying signal?', options: ['Someone asks how much the product costs', 'Someone blocks your account', 'Someone never sees your content', 'Someone asks for unrelated news'], answer: 0, explanation: 'Questions about price, availability, samples, or registration show active interest.' },
  { id: 'q6', question: 'Which practice is prohibited?', options: ['Explaining product benefits clearly', 'Following up politely', 'Claiming guaranteed income', 'Teaching something useful'], answer: 2, explanation: 'Never make false promises or claim guaranteed income.' },
  { id: 'q7', question: 'Why build a personal brand?', options: ['People buy from people they trust', 'It removes the need to understand products', 'It guarantees every post becomes viral', 'It allows you to hide your identity'], answer: 0, explanation: 'A clear, trustworthy identity helps the right audience understand what you do.' },
  { id: 'q8', question: 'What should you do after a customer shows interest?', options: ['Pressure them until they buy', 'Listen, understand, recommend, explain, and let them decide', 'Send unrelated links', 'Pretend to be another customer'], answer: 1, explanation: 'Respectful selling focuses on the customer’s need and leaves the decision to them.' },
]

export const AFFILIATE_QUIZ_PASS_PERCENT = 75
