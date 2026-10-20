import 'styled-components';
import type { GammaTheme } from './index';
declare module 'styled-components' {
  // styled-components theme augmentation.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends GammaTheme {}
}
