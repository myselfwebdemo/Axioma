# UI & Functionality
– Add button to preview what next numbers will be on the field. Button will call deal() but mark numbers as isPreview: true, which means they will appear opaque (inactive).
\> Add new field to the cell object: "isPreview: boolean"

– When adding more buttons to footer (skill use & preview), slice them to form a sort of a right triangle.
\> Or, in the top-left corner of the deal button, make a cutout for preview button, and in the bottom-right for skill use, both of the same shape as of reboot button

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
> Review: There will be no adding of color themes. "--sys-bg-color" will remain constant. The theme switch, will change the background animation (see "Game Themes: 2." )
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

– At score = `9999`, add another – transcendential level (whitish icon) !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

– Iimplement hint: highlight numbers in between when cannot cross

## Components
– Turn .all_stats into a component, reuse it for all stats and actor info/stats/story, etc.

### Use modal window for alerts and messages to player

## Telegram App
– Tg mini-app works fine!
  In tg full-screen app, theres no spacing on top making buttons go behind wifi icons and island

## Landing page
– Add landing page that allows to choose mode (default: digits from 1-19 excluding 10,
  or randomized: same digits (from 1-19 excluding 10) but SHUFFLED positions)
  :: With introduction of this pagea and 2 modes, it would make sense to bundle each mode in its designated module => adding React.Router. This HOWEVER, might cause issues with Telegram support => I'll 
  need to add new "Telegram Router" – extra completely separate module for this

– Add feedback page for users to send feedback at any time

### Design
– Background should be of black color and have starfall – starfall or numbers (depending on theme preference/meaning). On the bottom of the screen add some moon-like land (normal ground and grass but of color: `moon`, dark grey-purplish). Add path(s). Make every actors walk through it – from left to right, at random times. Maybe add more animations and decorations



# Gameplay
## Characters
– Add actors with their unique abilities

– Character is positioned at the top left left corner of the footer, right above it

– To trigger abilities, click actor icon that is highlighted when ability cooldown has reset

– Character abilities:
   Active
   1. Swap positions of any two numbers on the field plane
   2. Move finger on row/column to sweep it completely.
      :: Double tap to sweep (instead of moving through whole row/column).
      :: Highlight of row/column that is going to get deleted might be added
   3. Undoes last move => restores the field to its previous state
   4. Turn any (or random) number on the board into a 0, which can act as a wild cell
      space, or have an effect on surrounding numbers (to be decided)
   5. Gives ability to cross out digonally (restrictions???)

   Passive
   – [condition] grants [multiplier_magnitude] to score of next match

# Game Themes
1. Add not just multiple color themes, not game modes, add diversity to the icons of numbers!

2. Game bg should become animated and correspond with the theme and icons



# Rules / Usage Page
– By clicking orange "book" button in footer section, rules of the game and overall description of the app and usage is provided. To quickly create content for this section, prompt gpt with: `Create/list content from my game. Rules, about the game (that it's a somewhat of "Numberama clone", my story though: my mom showed me the game on the plane, she used to play it in the university tens of years ago, i played it 3 days on paper – wrote 2 pages and finally won!. the issue on paper is that cleared rows dont dissapear, so even your half page game block of rows is cleared and there's numbers on its edges, you have to keep playing with this game block or rewrite. realizing that, i got an idea to make it digital – and so i did it), usage, etc. List every detail, be rather excessive than barely-informative.`

# Storage
– Store `notifyBeforeReset`

# Settings
– Add toggles:
\> `notifyBeforeReset`

## Settings Appearance
– It keeps same theme as the current game, and its ui elements (such as toggles) are in grassmorphism style