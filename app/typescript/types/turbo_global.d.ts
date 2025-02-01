// Since Turbo v8 no longer supports types, we must extend the interface to access the navigaor
import { TurboGlobal } from '@hotwired/turbo';

declare module '@hotwired/turbo' {
  interface TurboGlobal {
    navigator: any;
  }
}