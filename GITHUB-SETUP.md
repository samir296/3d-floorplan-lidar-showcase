# Publish the selected showcase on GitHub

## Suggested repository settings

**Name:** `appcodie-3d-showcase`

**Description:**
Interactive 3D house explorer and floor-plan demo by Appcodie. Explore room measurements, camera controls and custom LiDAR, RoomPlan, web and mobile development.

**Website:** https://codezlet.com/

**Topics:**
`threejs`, `3d-website`, `floor-plan`, `roomplan`, `lidar`, `webgl`, `javascript`,
`proptech`, `house-inspection`, `app-development`, `appcodie`

## Upload with Git

1. Extract this ZIP and open a terminal inside `appcodie-3d-showcase`.
2. On GitHub, create a **new public repository** with the name above. Leave the
   initial README, license and .gitignore options unchecked; these are included.
3. Replace YOUR_USERNAME below with the owner of that new repository, then run:

```bash
git init
git add .
git commit -m "Add selected Appcodie 3D showcase demos"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/appcodie-3d-showcase.git
git push -u origin main
```

Use your normal GitHub sign-in. Do not paste access tokens into source files or
README examples. These commands are for the new extracted folder and an empty
repository; no force push is needed.

## Optional live GitHub Pages demo

In repository Settings → Pages, choose Deploy from a branch, then `main` and
`/ (root)`, and save. After deployment, use the URL GitHub provides. The relative
asset paths support a repository subdirectory. `.nojekyll` is included.

The README's complete-website link intentionally opens Codezlet; after Pages is
live you can add a separate “Try these demos” link using your actual Pages URL.
Set a social preview image using the supplied `house-cutaway.webp` after exporting
it as a PNG/JPEG accepted by GitHub, or use your own screenshot.

## After publishing

- Pin the repository on your GitHub profile.
- Add the About description, website and topics above.
- Link to it from your Appcodie portfolio with a short explanation of the demos.
- Keep the contact links prominent and the demo measurements clearly labelled.
- Add real project case studies only when you have permission to publish them.
- Keep the repository focused on these selected examples.

## Suggested announcement

We’ve shared a small, runnable selection of our 3D web work: an interactive
floor-plan demo and a furnished house explorer with room selection, dimensions
and camera controls. Explore the code, try the interactions, and see how a spatial
interface can become part of your next product.

Building a LiDAR app, floor-plan tool or interactive 3D website? Connect with
Appcodie: https://www.appcodie.com/contact

Add your actual GitHub repository URL before posting.

Reference: [GitHub Pages publishing instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
