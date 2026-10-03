# Shift Team C League

The league table uses Netlify Blobs for shared results. Visitors can read the table; score edits and resets require an editor key.

## Deploy on Netlify

Deploy this folder (`outputs`) as the site base directory from a Git-connected Netlify project or the Netlify CLI. The `netlify.toml` publishes `public/` and deploys the function from `netlify/functions/`; a static drag-and-drop deploy of only the HTML file will not deploy the function. Netlify installs the `@netlify/blobs` dependency from `package.json` during the build.

In Netlify, open **Project configuration → Environment variables** and add `LEAGUE_EDIT_KEY` with a strong private key. Do not put the key in the HTML or publish it. Redeploy after adding the variable. The first time you edit a score in a browser session, enter that key when prompted; it will be remembered for that tab session. Other visitors can open the site and see the shared results without the key. The page refreshes shared scores every 20 seconds.

The function writes scores to the site's Netlify Blobs store, which persists across deploys. Existing scores saved in an individual browser's `localStorage` do not migrate automatically; enter them again after deploying this version.
