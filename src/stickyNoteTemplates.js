import { FabricImage, Group, Textbox, LayoutManager, FixedLayout } from "fabric";

export const STICKY_TEMPLATES = {
  sunny: { name: "Sunny Fold", image: "/sticky-notes/01_sunny_fold.png", foreground: "#553713", headerPosition: { x: .10, y: .20 }, bodyPosition: { x: .10, y: .43 } },
  hearts: { name: "Pink Hearts", image: "/sticky-notes/02_pink_hearts.png", foreground: "#9F1747", headerPosition: { x: .10, y: .20 }, bodyPosition: { x: .10, y: .43 } },
  galaxy: { name: "Lavender Galaxy", image: "/sticky-notes/03_lavender_galaxy.png", foreground: "#39218B", headerPosition: { x: .10, y: .20 }, bodyPosition: { x: .10, y: .43 } },
  kraft: { name: "Vintage Kraft", image: "/sticky-notes/04_vintage_kraft.png", foreground: "#543A24", headerPosition: { x: .10, y: .20 }, bodyPosition: { x: .10, y: .43 } },
  neon: { name: "Dark Neon", image: "/sticky-notes/05_dark_neon.png", foreground: "#50F6FF", headerPosition: { x: .10, y: .20 }, bodyPosition: { x: .10, y: .43 } },
  sky: { name: "Sky & Clouds", image: "/sticky-notes/06_sky_clouds.png", foreground: "#124A99", headerPosition: { x: .10, y: .20 }, bodyPosition: { x: .10, y: .43 } },
  botanical: { name: "Botanical Green", image: "/sticky-notes/07_botanical_green.png", foreground: "#254B25", headerPosition: { x: .10, y: .20 }, bodyPosition: { x: .10, y: .43 } },
  notebook: { name: "Notebook Paper", image: "/sticky-notes/08_notebook_paper.png", foreground: "#174C99", headerPosition: { x: .18, y: .15 }, bodyPosition: { x: .18, y: .40 } },
  minimal: { name: "Minimal Window", image: "/sticky-notes/09_minimal_window.png", foreground: "#252525", headerPosition: { x: .10, y: .22 }, bodyPosition: { x: .10, y: .45 } },
};

export async function createStickyNote({
  template = "sunny", header = "Title", body = "Write something...",
  left = 100, top = 100, width = 280, height = 200,
  headerFont = "Georgia", bodyFont = "Arial", headerSize = 25, bodySize = 17,
  headerColor, bodyColor,
} = {}) {
  const style = STICKY_TEMPLATES[template];
  if (!style) throw new Error(`Unknown sticky note template: ${template}`);
  const background = await FabricImage.fromURL(style.image);
  if (!background.width || !background.height) throw new Error(`Could not load image: ${style.image}`);
  background.set({
    left: 0, top: 0, originX: "left", originY: "top",
    scaleX: width / background.width, scaleY: height / background.height,
    selectable: false, evented: false,
  });
  const headerText = new Textbox(header, {
    left: width * style.headerPosition.x, top: height * style.headerPosition.y,
    width: width * .78, fontFamily: headerFont, fontSize: headerSize,
    fontWeight: "bold", fill: headerColor || style.foreground,
    originX: "left", originY: "top", editable: true, splitByGrapheme: true,
    objectCaching: false,
  });
  headerText.stickyPart = "header";
  const bodyText = new Textbox(body, {
    left: width * style.bodyPosition.x, top: height * style.bodyPosition.y,
    width: width * .78, fontFamily: bodyFont, fontSize: bodySize,
    fill: bodyColor || style.foreground, originX: "left", originY: "top",
    editable: true, splitByGrapheme: true, objectCaching: false,
  });
  bodyText.stickyPart = "body";
  const note = new Group([background, headerText, bodyText], {
    left, top, originX: "left", originY: "top",
    layoutManager: new LayoutManager(new FixedLayout()),
    subTargetCheck: true, interactive: true, objectCaching: false,
  });
  note.stickyNoteData = {
    template, header, body, headerFont, bodyFont, headerSize, bodySize,
    headerColor: headerColor || style.foreground, bodyColor: bodyColor || style.foreground,
    width, height,
  };
  return note;
}
