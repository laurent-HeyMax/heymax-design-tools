export const HEYMAX_NATIVE_WIDTH = 540;
export const HEYMAX_NATIVE_HEIGHT = 88;

export function heymaxLogo(opts: {
  transform: string;
  width: number;
  heyFill: string;
  gradientId: string;
}): string {
  const { transform, width, heyFill, gradientId } = opts;
  const scale = width / HEYMAX_NATIVE_WIDTH;
  return `<g transform="${transform} scale(${scale.toFixed(5)})">
    <defs>
      <linearGradient id="${gradientId}" x1="251.467" y1="43.6364" x2="489.741" y2="156.781" gradientUnits="userSpaceOnUse">
        <stop stop-color="#802EFF" />
        <stop offset="1" stop-color="#D400FF" />
      </linearGradient>
    </defs>
    <path d="M482.741 0.363632L498.679 27.9347H499.361L515.469 0.363632H539.077L512.741 44L539.929 87.6364H515.724L499.361 59.767H498.679L482.315 87.6364H458.281L485.341 44L458.963 0.363632H482.741Z" fill="url(#${gradientId})" />
    <path fill-rule="evenodd" clip-rule="evenodd" d="M365.021 87.6364H387.692L391.956 74.0271L391.875 74.0012L393.372 69.3125L396.604 59.192L398.489 53.2898H398.453L408.146 22.3523H408.828L418.542 53.2898H410.155L405.038 69.3125H423.572L429.325 87.6364H451.996L422.55 0.363632H394.468L365.021 87.6364Z" fill="url(#${gradientId})" />
    <path d="M258.072 0.363632H284.194L306.354 54.3977H307.376L329.535 0.363632H355.658V87.6364H335.118V34.0284H334.393L313.427 87.0824H300.302L279.336 33.7301H278.612V87.6364H258.072V0.363632Z" fill="url(#${gradientId})" />
    <path d="M159.555 0.363632H183.12L201.572 36.8835H202.339L220.79 0.363632H244.356L212.438 58.4886V87.6364H191.472V58.4886L159.555 0.363632Z" fill="${heyFill}" />
    <path d="M90.0723 87.6364V0.363632H150.925V17.4943H111.166V35.392H147.814V52.5653H111.166V70.5057H150.925V87.6364H90.0723Z" fill="${heyFill}" />
    <path d="M0.0722656 87.6364V0.363632H21.166V35.392H55.5552V0.363632H76.6064V87.6364H55.5552V52.5653H21.166V87.6364H0.0722656Z" fill="${heyFill}" />
  </g>`;
}
