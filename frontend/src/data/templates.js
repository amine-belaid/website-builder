export const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank',
    preview: '#f9f9f9',
    sections: []
  },
  {
    id: 'landing',
    name: 'Landing page',
    preview: '#eef2ff',
    sections: [
      { type: 'navbar', props: { logo: 'My Brand', links: ['Home','About','Contact'] }},
      { type: 'hero',   props: { title: 'Build something great', subtitle: 'Start for free today', btnText: 'Get started', bg: '#eef2ff' }},
      { type: 'text',   props: { content: 'We help businesses grow with powerful tools.' }},
    ]
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    preview: '#fef3f2',
    sections: [
      { type: 'navbar', props: { logo: 'Jane Doe', links: ['Work','About','Contact'] }},
      { type: 'hero',   props: { title: 'Designer & Developer', subtitle: 'Based in Paris', bg: '#fef3f2' }},
      { type: 'image',  props: { url: '', alt: 'My work' }},
    ]
  }
]