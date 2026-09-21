import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export class CapacitorBridge {
  private static isInitialized = false;

  public static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  public static getPlatform(): string {
    return Capacitor.getPlatform();
  }

  /**
   * Initializes native Android & iOS lifecycle, status bar, and orientation listeners.
   */
  public static async initNativeEnvironment(): Promise<void> {
    if (this.isInitialized || !this.isNative()) return;
    this.isInitialized = true;

    try {
      // 1. Status Bar Setup
      await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      await StatusBar.setBackgroundColor({ color: '#020617' }).catch(() => {});
      await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    } catch (e) {
      console.warn('Capacitor StatusBar init skipped:', e);
    }

    try {
      // 2. Lock to Portrait for optimal arcade mobile gameplay
      await ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
    } catch (e) {
      console.warn('Capacitor ScreenOrientation init skipped:', e);
    }
  }

  /**
   * Registers a hardware Back Button listener for Android devices.
   */
  public static registerBackButton(onBack: () => boolean | void): () => void {
    if (!this.isNative()) return () => {};

    let listenerHandle: any = null;
    App.addListener('backButton', ({ canGoBack }) => {
      const handled = onBack();
      // If handler returned true, it means it handled the back navigation internally.
      // Otherwise, if canGoBack is false, minimize or exit app.
      if (!handled && !canGoBack) {
        App.exitApp().catch(() => {});
      }
    }).then((handle) => {
      listenerHandle = handle;
    }).catch(() => {});

    return () => {
      if (listenerHandle && listenerHandle.remove) {
        listenerHandle.remove();
      }
    };
  }

  /**
   * Trigger native impact vibration (Light, Medium, Heavy).
   */
  public static async triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    if (this.isNative()) {
      try {
        const impactStyle =
          style === 'heavy'
            ? ImpactStyle.Heavy
            : style === 'medium'
            ? ImpactStyle.Medium
            : ImpactStyle.Light;
        await Haptics.impact({ style: impactStyle });
        return;
      } catch {
        // Fallback below
      }
    }

    // Web vibration fallback
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        const duration = style === 'heavy' ? 40 : style === 'medium' ? 25 : 12;
        navigator.vibrate(duration);
      } catch {
        // Ignore fallback errors
      }
    }
  }

  /**
   * Trigger native notification vibration (Success, Warning, Error).
   */
  public static async triggerHapticNotification(type: 'success' | 'warning' | 'error' = 'success'): Promise<void> {
    if (this.isNative()) {
      try {
        const notificationType =
          type === 'error'
            ? NotificationType.Error
            : type === 'warning'
            ? NotificationType.Warning
            : NotificationType.Success;
        await Haptics.notification({ type: notificationType });
        return;
      } catch {
        // Fallback below
      }
    }

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        if (type === 'error') {
          navigator.vibrate([40, 60, 40]);
        } else if (type === 'warning') {
          navigator.vibrate([30, 40, 30]);
        } else {
          navigator.vibrate([20, 40, 20]);
        }
      } catch {
        // Ignore fallback errors
      }
    }
  }

  /**
   * Trigger subtle click/selection haptic.
   */
  public static async triggerSelectionHaptic(): Promise<void> {
    if (this.isNative()) {
      try {
        await Haptics.selectionStart();
        await Haptics.selectionChanged();
        await Haptics.selectionEnd();
        return;
      } catch {
        // Fallback below
      }
    }

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(8);
      } catch {
        // Ignore
      }
    }
  }
}
