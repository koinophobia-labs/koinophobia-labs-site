# Higgsfield generation record · 2026-09-14

Phase 8 of the one-studio rebuild. Every render is listed with its verdict,
so a future reader can tell which footage on the site is generated, from
what, and why the rest was rejected. The character sheet is unchanged from
`SHOT_MANIFEST.md`: a single matte near-black Japanese koi, gunmetal diamond
scales with pearl specular edges, no barbels, no colour patches, no text of
any kind. Every prompt carried the standing negative list from the rebuild
document, section 8.

Reference still for every character-anchored render: the existing
`public/koi/poster-hero.webp` (media id `14849b6f-00c7-41ab-8b8f-f1642c82f7d9`),
so the new koi is the old koi.

Spend: 2,091.93 → 1,419.43 credits (672.5 credits, fourteen renders).

## Accepted and ingested

| Brief | Job | Model | Landed as | Used by |
| --- | --- | --- | --- | --- |
| H1 surface loop, 16:9, candidate C | `831147aa-dceb-457d-9b0a-52e4f2c2d5e9` | Kling v3.0 pro, 10 s, start = end frame | `public/koi/koi-surface-{1280,854}.mp4`, `poster-surface.webp`, source at `public/koi/source/koi-surface-1080.mp4` | Home band 00 (journey clip `surface`) |
| H1 surface loop, 9:16 | `37b4911f-bed7-4e2e-bbc9-fcc629d08801` | Seedance 2.5 omni-reference, 12 s | `koi-surface-vertical-{1280,854}.mp4`, `poster-surface-vertical.webp` | Mobile hero poster and loop (H8); engine wiring for a vertical source is a follow-up |
| H2 the pass | `fd2b72ac-feb8-4148-a5d5-2a2f09e2b5f4` | Seedance 2.5 omni-reference, 4 s | `koi-pass-{1280,854}.mp4`, `poster-pass.webp` | Home band 00 → 01 transition (journey `transitionClip: "pass"`) |
| H4 the lattice, v2 | `634a9e20-6e0e-4686-9aba-f9c8e657aa48` | Seedance 2.5 omni-reference, 10 s | `koi-lattice-{1280,854}.mp4`, `poster-lattice.webp` | Home band 02 Lab (journey clip `lattice`) |
| H5 the after-image | `21db9ee2-311d-4d75-954b-78f6045af21d` | Seedance 2.5 omni-reference, 6 s | `koi-afterimage-{1280,854}.mp4`, `poster-afterimage.webp` | `/lab/koi` atmosphere plate, labelled "not evidence" |

H1 candidates A (`a05edf7c…`) and B (`d360b200…`) are on-character and seam
perfectly too; C was chosen for the most visible movement. Seam checks for
all three are in `candidates/h1-seams.png`.

## Rejected, with the reason

| Brief | Job | Model | Reason |
| --- | --- | --- | --- |
| H3 slab 16:9, v1 | `d945e3ea…` | Veo 3.1 | Drew a golden common carp with a visible eye. Off-character. |
| H3 slab 9:16, v1 | `4d9d34ed…` | Veo 3.1 | Same golden carp. |
| H3 slab 16:9, v2 (no fish) | `900dbf22…` | Kling v3.0 | Drew a real iPhone with a notch and camera hole in grey-green water with bubbles. |
| H3 slab 9:16, v2 (no fish) | `2843dc3d…` | Kling v3.0 | Same: a recognisable iPhone with a notch. |
| H4 lattice, v1 | `04041e96…` | Kling v3.0, text only | Pinkish carp, bubbles, and a literal cube of scaffolding. |
| H6 river, v1 | `6d971f65…` | Veo 3.1 | Golden common carp plus a second silhouette. |
| H6 river, v2 | `a435f420…` | Seedance 2.5 omni-reference | Composition is right (one shaft, bridge edge, empty right half) but the koi reads pale and tiny, lit head-on. Held as a candidate, not ingested; `koi-still` stays on the Blake band. |

Contact sheets for every render are in `candidates/`.

## Decisions taken

- **H3 (the slab) is not generated.** Two models in four attempts produced either an off-character fish or a recognisable phone. The device frame on product pages is drawn in CSS already, and a sinking-slab treatment can be built as a CSS animation over the koi water without spending more credits.
- **Veo 3.1 does not honour the character** and is retired for koi shots. Kling v3.0 with a start frame, and Seedance 2.5 with an image reference, both keep the koi black.
- **H7 (the Trendi product film)** is an edit, not a generation, and waits on phase 9's time.
- **H9 (the social plate)** continues to use the existing hero still; its koi is the same character and it already sits right of the title.
- The old clips `koi-lead`, `koi-glass`, and `koi-systems` remain in `lib/koi/journey.ts` and `public/koi/` as fallbacks and are no longer referenced by any destination.

## Rules honoured

No Blake was generated. No product UI was generated. Nothing generated is
presented as evidence: the after-image plate on `/lab/koi` carries a caption
saying so. Every accepted clip was checked frame by frame on a contact sheet
for a second koi, colour, bubbles, text, or a recognisable object.
