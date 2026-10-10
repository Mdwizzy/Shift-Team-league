# Shift Team C League

The league site uses Netlify Blobs for shared seasons, rosters, fixtures, scores, standings, and playoff results. Visitors can view every season; changes require an editor key.

Add four or more teams to a new season; there is no configured maximum. Starting a season shuffles the roster and generates a double round-robin schedule, including byes when needed. With 4–6 teams, the top four go directly to two-leg semifinals. With 7–8 teams, the top eight play two-leg quarterfinals (a 7-team bracket gives the top seed a bye); with more than eight, the top eight qualify and the rest are eliminated. Quarterfinal and semifinal aggregate draws go to penalties. The semifinal winners play the final for champion and runner-up; the semifinal losers play for third place. Older seasons stay in the season picker as read-only archives.

## Deploy on Netlify

Deploy this folder (`outputs`) as the site base directory from a Git-connected Netlify project or the Netlify CLI. The `netlify.toml` publishes `public/` and deploys the function from `netlify/functions/`; a static drag-and-drop deploy of only the HTML file will not deploy the function. Netlify installs the `@netlify/blobs` dependency from `package.json` during the build.

In Netlify, open **Project configuration → Environment variables** and add `LEAGUE_EDIT_KEY` with a strong private key. Do not put the key in the HTML or publish it. Redeploy after adding the variable. The first time you edit a score in a browser session, enter that key when prompted; it will be remembered for that tab session. Other visitors can open the site and see the shared results without the key. The page refreshes shared scores every 20 seconds.

The function stores all seasons in the site's Netlify Blobs store, which persists across deploys. On first load, it imports the previous shared Season 1 scores into the archive view and creates Season 2 setup. If older results existed only in the current browser's `localStorage`, that browser loads them into the Season 1 archive; they are uploaded to shared storage with the first editor-authorized change (for example, adding the first Season 2 team).
