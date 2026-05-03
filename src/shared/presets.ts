import type { FormFactorId, PluginSettings, SceneId } from './messages';

export interface FormFactorPreset {
  id: FormFactorId;
  label: string;
  width: number;
  height: number;
}

export const FORM_FACTORS: FormFactorPreset[] = [
  { id: 'desktop', label: 'Desktop (HD)', width: 1920, height: 1080 },
  { id: 'phone', label: 'Phone', width: 1080, height: 1920 },
  { id: 'tablet', label: 'Tablet', width: 1536, height: 2048 },
  { id: 'square', label: 'Square', width: 1024, height: 1024 },
];

export interface ScenePreset {
  id: SceneId;
  label: string;
  modifier: string;
}

export const SCENES: ScenePreset[] = [
  { id: 'none', label: 'None', modifier: '' },
  {
    id: 'sunrise',
    label: 'Sunrise',
    modifier:
      '. Lighting: early dawn, 6am. Low warm peachy-gold sun raking from a low angle, long soft shadows across the ground, sky gradient from deep orange near the horizon to pale dusty blue overhead, faint mist in the air, almost no people visible.',
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    modifier:
      '. Lighting: midday. Deep clear blue sky with a few high cloud streaks, sharp defined shadows directly under elements, crisp bright neutral natural light, full daylight clarity, normal pedestrian activity.',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    modifier:
      '. Lighting: golden hour dusk. Sky burning orange, pink and violet near the horizon shading to indigo overhead, long warm shadows raking across all surfaces, warm amber glow on every facade and reflective surface, last light.',
  },
  {
    id: 'night',
    label: 'Night',
    modifier:
      '. Lighting: 10pm. Deep blue-black sky, scene illuminated by city lights, neon signs and warm window light, wet pavement reflecting coloured highlights, grain amplified, ambient streetlight glow.',
  },
];

export interface CityPreset {
  id: string;
  label: string;
  promptAddition: string;
}

export const CITIES: CityPreset[] = [
  {
    id: 'tokyo',
    label: 'Tokyo',
    promptAddition:
      'Shibuya scramble crossing in central Tokyo, viewed from an elevated angle on the second floor of a building looking down and across. Wide composition showing all five painted crosswalk lines converging in the centre, the iconic curved facade of the Q-Front department store on the left covered in giant vertical advertising screens, a sleek glass office tower on the right, one yellow Tokyo taxi waiting at the lights in the foreground, a few pedestrians mid-stride on the white painted lines. Same camera position and framing every time.',
  },
  {
    id: 'paris',
    label: 'Paris',
    promptAddition:
      'Pont Alexandre III bridge in Paris, photographed from the north end of the bridge looking south toward Les Invalides. Wide composition centred exactly on the bridge axis: gilded bronze pegasus statues on tall ornate stone pillars frame the foreground left and right, the gold dome of Les Invalides sits on the horizon directly down the centre line, ornate Belle Époque green-and-gold lamp posts repeat in perspective along both parapets, the Seine flows beneath. Same camera position and framing every time.',
  },
  {
    id: 'helsinki',
    label: 'Helsinki',
    promptAddition:
      'Helsinki Cathedral viewed from Senate Square. Symmetrical wide composition, camera at ground level facing the cathedral straight on: the full white neoclassical facade fills the upper frame, the green copper dome and four corner cupolas centred above, Corinthian columns across the front, broad stone steps cascading down toward the camera, the bronze statue of Tsar Alexander II standing centred on its pedestal in the cobblestone square in the foreground. Same camera position and framing every time.',
  },
  {
    id: 'singapore',
    label: 'Singapore',
    promptAddition:
      "Marina Bay waterfront in Singapore, photographed from the promenade on the northern side of the bay looking south across the water. Wide composition: the three connected towers of Marina Bay Sands with the boat-shaped SkyPark on top sit centred in frame, mirrored in the still water of the bay, the lotus-flower shape of the ArtScience Museum visible on the right edge, the bay's railing and a strip of empty granite promenade in the foreground. Same camera position and framing every time.",
  },
  {
    id: 'london',
    label: 'London',
    promptAddition:
      'Tower Bridge in London, photographed from the north bank Thames Path near St. Katharine Docks. Wide composition showing the full bridge slightly off-centre to the right: both Gothic stone-clad towers, the central elevated walkway, the suspension chains, the Thames flowing beneath, the buildings of Bermondsey on the south bank in the background, low riverside iron railings and stone parapet in the foreground. Same camera position and framing every time.',
  },
];

export interface StylePreset {
  id: string;
  label: string;
  promptAddition: string;
}

export const STYLES: StylePreset[] = [
  {
    id: 'documentary-flash',
    label: 'Documentary Flash',
    promptAddition:
      '35mm film photo, Kodak Portra 400, on-camera flash, Martin Parr style, Juergen Teller style. Warm saturated colours, candid moment, slightly overexposed highlights.',
  },
  {
    id: 'city-architecture',
    label: 'City Architecture',
    promptAddition:
      '35mm film photography, Kodak Portra 400, slight grain, natural light, no flash. Arty editorial documentary style. Wim Wenders, Stephen Shore colour sensibility. Ultra realistic, muted saturation, lifted blacks, faded highlights, cinematic.',
  },
  {
    id: 'business-class',
    label: 'Business Class',
    promptAddition:
      '35mm film photo, Kodak Portra 400, Juergen Teller style. Warm golden amber tones, premium cabin interior, airy and spacious, editorial, photorealistic.',
  },
  {
    id: 'night-city',
    label: 'Night City',
    promptAddition:
      '35mm film photography, Kodak Portra 800, high grain, night scene, neon light, wet streets, deep shadows, cinematic, editorial.',
  },
];

export const DEFAULT_PROMPT_TEMPLATE =
  '{prompt}, professional photography, sharp focus, high detail, 4k';

export const DEFAULT_NEGATIVE_PROMPT =
  'blurry, distorted, low quality, watermark, text, signature, deformed, bad anatomy, cropped, low resolution, jpeg artifacts, CGI, illustration, render, dark, underexposed';

export const DEFAULT_SETTINGS: PluginSettings = {
  apiKeys: {},
  defaults: {
    providerId: 'gemini',
    modelId: 'gemini-2.5-flash-image',
    formFactor: 'desktop',
    promptTemplate: DEFAULT_PROMPT_TEMPLATE,
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  },
};
