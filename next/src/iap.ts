/**
 * Gerçek para ile satın alma köprüsü.
 *
 * - Android/iOS: cordova-plugin-purchase (window.CdvPurchase) yüklüyse Google Play / App Store faturalandırması kullanılır.
 * - Geliştirme (vite dev) ya da adres çubuğunda ?iapdev: para çekmeyen test mağazası.
 * - Diğer durumlarda mağaza kapalıdır; oyun bunu dürüstçe söyler.
 *
 * Not: Satın almaların sunucuda doğrulanması (receipt validation) için store.validator ayarlanmalıdır.
 */

export type StoreKind = "native" | "dev" | "none";

export interface StoreProduct {
  id: string;
  consumable: boolean;
}

export interface BuyResult {
  ok: boolean;
  err?: string;
}

interface CdvProduct {
  pricing?: { price?: string };
  owned?: boolean;
  getOffer(): { order(): Promise<{ message?: string } | undefined> } | undefined;
}

interface CdvStore {
  register(p: { id: string; type: string; platform: string }[]): void;
  initialize(platforms: string[]): Promise<unknown>;
  get(id: string): CdvProduct | undefined;
  when(): {
    approved(cb: (tx: { verify(): unknown; finish(): unknown; products: { id: string }[] }) => void): ReturnType<CdvStore["when"]>;
    verified(cb: (r: { finish(): unknown; collection?: unknown; sourceReceipt?: { transactions?: { products: { id: string }[] }[] } }) => void): ReturnType<CdvStore["when"]>;
    finished(cb: (tx: { products: { id: string }[] }) => void): ReturnType<CdvStore["when"]>;
  };
  restorePurchases(): Promise<unknown>;
  validator?: string;
}

interface Cdv {
  store: CdvStore;
  ProductType: { CONSUMABLE: string; NON_CONSUMABLE: string };
  Platform: { GOOGLE_PLAY: string; APPLE_APPSTORE: string };
}

const cdv = (): Cdv | null => (window as unknown as { CdvPurchase?: Cdv }).CdvPurchase ?? null;
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const devMode = () => import.meta.env.DEV || new URLSearchParams(location.search).has("iapdev");

class Iap {
  kind: StoreKind = "none";
  private ready = false;
  private onGrant: ((id: string) => void) | null = null;
  private waiting = new Map<string, (r: BuyResult) => void>();

  /** Mağazayı başlatır; onGrant her onaylanan satın almada bir kez çağrılır (yarım kalanlar dahil). */
  async init(products: StoreProduct[], onGrant: (id: string) => void): Promise<StoreKind> {
    this.onGrant = onGrant;
    const c = cdv();
    if (c) {
      try {
        const platform = isIos() ? c.Platform.APPLE_APPSTORE : c.Platform.GOOGLE_PLAY;
        c.store.register(products.map((p) => ({ id: p.id, type: p.consumable ? c.ProductType.CONSUMABLE : c.ProductType.NON_CONSUMABLE, platform })));
        c.store
          .when()
          .approved((tx) => void tx.verify())
          .verified((r) => void r.finish())
          .finished((tx) => {
            for (const p of tx.products) {
              this.onGrant?.(p.id);
              this.waiting.get(p.id)?.({ ok: true });
              this.waiting.delete(p.id);
            }
          });
        await c.store.initialize([platform]);
        this.kind = "native";
        this.ready = true;
        return this.kind;
      } catch {
        this.kind = "none";
      }
    }
    if (devMode()) {
      this.kind = "dev";
      this.ready = true;
    }
    return this.kind;
  }

  available(): boolean {
    return this.ready && this.kind !== "none";
  }

  /** Mağazanın yerel fiyatı (₺, $, €…); yoksa null. */
  price(id: string): string | null {
    if (this.kind !== "native") return null;
    return cdv()?.store.get(id)?.pricing?.price ?? null;
  }

  async buy(id: string): Promise<BuyResult> {
    if (!this.available()) return { ok: false, err: "Mağaza bu cihazda kullanılamıyor." };
    if (this.kind === "dev") {
      await new Promise((r) => setTimeout(r, 700));
      this.onGrant?.(id);
      return { ok: true };
    }
    const p = cdv()!.store.get(id);
    const offer = p?.getOffer();
    if (!offer) return { ok: false, err: "Ürün bulunamadı." };
    return new Promise<BuyResult>((resolve) => {
      this.waiting.set(id, resolve);
      offer
        .order()
        .then((e) => {
          if (e) {
            this.waiting.delete(id);
            resolve({ ok: false, err: e.message ?? "Satın alma iptal edildi." });
          }
        })
        .catch((e: unknown) => {
          this.waiting.delete(id);
          resolve({ ok: false, err: String(e) });
        });
    });
  }

  async restore(): Promise<void> {
    if (this.kind === "native") await cdv()!.store.restorePurchases();
  }
}

export const iap = new Iap();
