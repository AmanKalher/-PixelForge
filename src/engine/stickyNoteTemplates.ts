import { FabricImage, Group, Textbox, LayoutManager, FixedLayout } from 'fabric';

export interface StickyTemplate {
  name: string;
  image: string;
  foreground: string;
  headerPosition: { x: number; y: number };
  bodyPosition: { x: number; y: number };
}

export const STICKY_TEMPLATES: Record<string, StickyTemplate> = {
  sunny: {
    name: 'Sunny Fold',
    image: '/sticky-notes/01_sunny_fold.png',
    foreground: '#553713',
    headerPosition: { x: 0.1, y: 0.2 },
    bodyPosition: { x: 0.1, y: 0.43 },
  },
  hearts: {
    name: 'Pink Hearts',
    image: '/sticky-notes/02_pink_hearts.png',
    foreground: '#9F1747',
    headerPosition: { x: 0.1, y: 0.2 },
    bodyPosition: { x: 0.1, y: 0.43 },
  },
  galaxy: {
    name: 'Lavender Galaxy',
    image: '/sticky-notes/03_lavender_galaxy.png',
    foreground: '#39218B',
    headerPosition: { x: 0.1, y: 0.2 },
    bodyPosition: { x: 0.1, y: 0.43 },
  },
  kraft: {
    name: 'Vintage Kraft',
    image: '/sticky-notes/04_vintage_kraft.png',
    foreground: '#543A24',
    headerPosition: { x: 0.1, y: 0.2 },
    bodyPosition: { x: 0.1, y: 0.43 },
  },
  neon: {
    name: 'Dark Neon',
    image: '/sticky-notes/05_dark_neon.png',
    foreground: '#50F6FF',
    headerPosition: { x: 0.1, y: 0.2 },
    bodyPosition: { x: 0.1, y: 0.43 },
  },
  sky: {
    name: 'Sky & Clouds',
    image: '/sticky-notes/06_sky_clouds.png',
    foreground: '#124A99',
    headerPosition: { x: 0.1, y: 0.2 },
    bodyPosition: { x: 0.1, y: 0.43 },
  },
  botanical: {
    name: 'Botanical Green',
    image: '/sticky-notes/07_botanical_green.png',
    foreground: '#254B25',
    headerPosition: { x: 0.1, y: 0.2 },
    bodyPosition: { x: 0.1, y: 0.43 },
  },
  notebook: {
    name: 'Notebook Paper',
    image: '/sticky-notes/08_notebook_paper.png',
    foreground: '#174C99',
    headerPosition: { x: 0.18, y: 0.15 },
    bodyPosition: { x: 0.18, y: 0.4 },
  },
  minimal: {
    name: 'Minimal Window',
    image: '/sticky-notes/09_minimal_window.png',
    foreground: '#252525',
    headerPosition: { x: 0.1, y: 0.22 },
    bodyPosition: { x: 0.1, y: 0.45 },
  },
};

export interface CreateStickyNoteOptions {
  template?: string;
  header?: string;
  body?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  headerFont?: string;
  bodyFont?: string;
  headerSize?: number;
  bodySize?: number;
  headerColor?: string;
  bodyColor?: string;
}

export async function createStickyNote({
  template = 'sunny',
  header = 'Title',
  body = 'Write something...',
  left = 100,
  top = 100,
  width = 280,
  height = 200,
  headerFont = 'Georgia',
  bodyFont = 'Arial',
  headerSize = 25,
  bodySize = 17,
  headerColor,
  bodyColor,
}: CreateStickyNoteOptions = {}): Promise<Group> {
  const style = STICKY_TEMPLATES[template] || STICKY_TEMPLATES.sunny;
  const background = await FabricImage.fromURL(style.image);
  if (!background.width || !background.height) {
    throw new Error(`Could not load image: ${style.image}`);
  }

  background.set({
    left: 0,
    top: 0,
    originX: 'left',
    originY: 'top',
    scaleX: width / background.width,
    scaleY: height / background.height,
    selectable: false,
    evented: false,
  });

  const headerText = new Textbox(header, {
    left: width * style.headerPosition.x,
    top: height * style.headerPosition.y,
    width: width * 0.78,
    fontFamily: headerFont,
    fontSize: headerSize,
    fontWeight: 'bold',
    fill: headerColor || style.foreground,
    originX: 'left',
    originY: 'top',
    editable: true,
    splitByGrapheme: true,
    objectCaching: false,
  });
  (headerText as any).stickyPart = 'header';

  const bodyText = new Textbox(body, {
    left: width * style.bodyPosition.x,
    top: height * style.bodyPosition.y,
    width: width * 0.78,
    fontFamily: bodyFont,
    fontSize: bodySize,
    fill: bodyColor || style.foreground,
    originX: 'left',
    originY: 'top',
    editable: true,
    splitByGrapheme: true,
    objectCaching: false,
  });
  (bodyText as any).stickyPart = 'body';

  const note = new Group([background, headerText, bodyText], {
    left,
    top,
    originX: 'left',
    originY: 'top',
    layoutManager: new LayoutManager(new FixedLayout()),
    subTargetCheck: true,
    interactive: true,
    objectCaching: false,
  });

  (note as any).stickyNoteData = {
    template,
    header,
    body,
    headerFont,
    bodyFont,
    headerSize,
    bodySize,
    headerColor: headerColor || style.foreground,
    bodyColor: bodyColor || style.foreground,
    width,
    height,
  };
  (note as any).isPixelForgeSticky = true;
  (note as any).pixelForgeObjectType = 'sticky';

  return note;
}
