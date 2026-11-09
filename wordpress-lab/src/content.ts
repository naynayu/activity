export const PLAYGROUND_URL = 'https://playground.wordpress.net/'

export interface Step {
  title: string
  /** The one idea for this step, said by the facilitator and shown on phones. */
  idea: string
  /** Hands-on tasks. Each is ticked off by the learner. */
  tasks: string[]
  /** Where to click, for people who get lost. */
  hint?: string
  minutes: number
}

export const STEPS: Step[] = [
  {
    title: 'Get your own WordPress',
    idea: 'Today everyone builds a blog from scratch. WordPress Playground is a real WordPress in your browser: nothing to install, nothing to break.',
    tasks: [
      'Open WordPress Playground on your laptop (link above)',
      'Wait for the site to load, then open the Dashboard (add /wp-admin to the address if you do not see it)',
      'Find the Dashboard menu down the left side: Posts, Pages, Appearance, Settings',
    ],
    hint: 'Use a laptop if you can. Phones are for ticking boxes and asking for help.',
    minutes: 8,
  },
  {
    title: 'Name your blog',
    idea: 'Decide what the blog is about and who it is for. The title and tagline are the first thing visitors see.',
    tasks: [
      'Pick a topic you could write about for a year (food, faith, football, your business)',
      'Go to Settings → General and set the Site Title and a one-line Tagline, then Save Changes',
      'Go to Settings → Permalinks, choose “Post name”, and Save',
      'Open your site in another tab and refresh: see your blog name?',
    ],
    hint: 'Left menu → Settings → General, then Settings → Permalinks.',
    minutes: 8,
  },
  {
    title: 'Write your first post',
    idea: 'Posts are the heart of a blog: dated, newest first. Everything in the editor is a block: a paragraph, a heading, an image.',
    tasks: [
      'Go to Posts → Add New Post and write a title like “Why I started this blog”',
      'Write three sentences, then press + and add a Heading block and an Image block',
      'Click Publish, then View Post',
    ],
    hint: 'Close the welcome pop-up if it appears. Type / on an empty line to search for a block.',
    minutes: 12,
  },
  {
    title: 'Organise with categories',
    idea: 'Categories are the sections of your blog. Tags are the details. A reader who likes one post should be able to find more.',
    tasks: [
      'In the post settings (right panel), create a category for your main topic and assign it',
      'Add two tags to the post, then update it',
      'Write a second post in a different category and publish it',
      'Add a featured image to a post and check how it looks on the site',
    ],
    hint: 'Open the Settings panel with the icon at the top right of the editor.',
    minutes: 12,
  },
  {
    title: 'Create an About page',
    idea: 'Pages are permanent and not dated. Blogs need at least an About page: it is what people check before they trust you.',
    tasks: [
      'Go to Pages → Add New Page and create “About”',
      'Add a heading, a short paragraph about you, and a Button block',
      'Publish it and open it in the browser',
    ],
    hint: 'Posts are the news, pages are the shop front.',
    minutes: 8,
  },
  {
    title: 'Add a menu',
    idea: 'A menu is how visitors move around. Without one, your posts and pages are rooms with no doors.',
    tasks: [
      'Go to Appearance → Editor → Navigation',
      'Add your About page and your category to the menu',
      'Save, then open the site and click each link',
    ],
    hint: 'If you see Appearance → Menus instead, use that: same idea, older theme.',
    minutes: 8,
  },
  {
    title: 'Make it look like you',
    idea: 'A theme is the design layer. Your posts stay the same while the look changes completely.',
    tasks: [
      'Go to Appearance → Editor → Styles and change the colours and the fonts',
      'Go to Appearance → Themes, activate a different theme and see your posts change shape',
      'Check your homepage shows your latest posts (Settings → Reading), then pick the look you like best',
    ],
    hint: 'Changing a theme never deletes your posts or pages.',
    minutes: 12,
  },
  {
    title: 'Add a plugin and comments',
    idea: 'Plugins add features. Install only what you need, because each one is more to maintain. Comments are how readers talk back.',
    tasks: [
      'Go to Settings → Discussion and decide: comments on or off',
      'Go to Plugins → Add New Plugin, search “Contact Form 7” (or any form plugin), then Install and Activate',
      'Create a “Contact” page and put the form on it',
    ],
    hint: 'If a plugin will not install in Playground, ask for help and pick another one.',
    minutes: 10,
  },
  {
    title: 'Show it and keep it',
    idea: 'A real blog needs a domain and hosting. A Playground site is temporary, so save your work before you close the tab.',
    tasks: [
      'Show your neighbour your blog and say who it is for',
      'Save a copy: use the Playground menu to download your site as a .zip',
      'Write down the next three posts you will publish',
    ],
    minutes: 7,
  },
]

export const taskKey = (step: number, task: number) => `${step}:${task}`
