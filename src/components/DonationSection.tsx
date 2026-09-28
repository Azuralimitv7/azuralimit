"use client";

import { useState } from "react";
import { sfx } from "@/lib/sound";
import { toast } from "./Toasts";
import { useAzura } from "./ThemeProvider";
import {
  EmblemBnb,
  EmblemDana,
  EmblemEth,
  EmblemMatic,
  EmblemPepe,
  EmblemUsdt,
  IconCheck,
  IconCopy,
  IconExternal,
  IconHeartStamp,
  IconQr,
  IconX,
} from "./Icons";

export const DANA_URL =
  "https://link.dana.id/minta?full_url=https://qr.dana.id/v1/281012012025053106592119";

export const EVM_ADDRESS = "0x8B10E4D8aa6eB65071992BebBEa863b93F2a3B82";

export interface CryptoChannel {
  id: string;
  code: string;
  token: string;
  networkLabel: string;
  networkTag: string;
  chainGroup: "bsc" | "polygon" | "base" | "arb" | "eth";
  address: string;
  note: string;
  badgeColor: string;
  Emblem: React.ComponentType<{ className?: string }>;
}

export const CRYPTO_CHANNELS: CryptoChannel[] = [
  {
    id: "usdt-bsc",
    code: "01",
    token: "USDT",
    networkLabel: "USDT jaringan BCS(bep20)",
    networkTag: "BCS (BEP20)",
    chainGroup: "bsc",
    address: EVM_ADDRESS,
    note: "Tether USD melalui jaringan BNB Smart Chain (BEP20)",
    badgeColor: "#00594E",
    Emblem: EmblemUsdt,
  },
  {
    id: "usdt-polygon",
    code: "02",
    token: "USDT",
    networkLabel: "USDT jaringan Polygon",
    networkTag: "Polygon",
    chainGroup: "polygon",
    address: EVM_ADDRESS,
    note: "Tether USD melalui jaringan Polygon PoS",
    badgeColor: "#00594E",
    Emblem: EmblemUsdt,
  },
  {
    id: "eth-base",
    code: "03",
    token: "ETH",
    networkLabel: "ETH jaringan base",
    networkTag: "base",
    chainGroup: "base",
    address: EVM_ADDRESS,
    note: "Ether melalui jaringan Layer-2 Base",
    badgeColor: "#124D95",
    Emblem: EmblemEth,
  },
  {
    id: "eth-arb",
    code: "04",
    token: "ETH",
    networkLabel: "ETH jaringan arb_one",
    networkTag: "arb_one",
    chainGroup: "arb",
    address: EVM_ADDRESS,
    note: "Ether melalui jaringan Arbitrum One (arb_one)",
    badgeColor: "#124D95",
    Emblem: EmblemEth,
  },
  {
    id: "bnb-bsc",
    code: "05",
    token: "BNB",
    networkLabel: "BNB jaringan BSC(bep20)",
    networkTag: "BSC (BEP20)",
    chainGroup: "bsc",
    address: EVM_ADDRESS,
    note: "Koin native BNB melalui jaringan BNB Smart Chain (BEP20)",
    badgeColor: "#C47623",
    Emblem: EmblemBnb,
  },
  {
    id: "matic-polygon",
    code: "06",
    token: "MATIC",
    networkLabel: "MATIC jaringan polygon",
    networkTag: "polygon",
    chainGroup: "polygon",
    address: EVM_ADDRESS,
    note: "Token native MATIC / POL melalui jaringan Polygon",
    badgeColor: "#781C2E",
    Emblem: EmblemMatic,
  },
  {
    id: "pepe-erc20",
    code: "07",
    token: "PEPE",
    networkLabel: "PEPE jaringan Ethereum (erc20)",
    networkTag: "Ethereum (ERC20)",
    chainGroup: "eth",
    address: EVM_ADDRESS,
    note: "Token PEPE di jaringan utama Ethereum (ERC20)",
    badgeColor: "#00594E",
    Emblem: EmblemPepe,
  },
];

const FILTERS: { id: "all" | CryptoChannel["chainGroup"]; label: string }[] = [
  { id: "all", label: "Semua (7)" },
  { id: "bsc", label: "BSC / BEP20 (2)" },
  { id: "polygon", label: "Polygon (2)" },
  { id: "base", label: "Base (1)" },
  { id: "arb", label: "arb_one (1)" },
  { id: "eth", label: "Ethereum ERC20 (1)" },
];

export default function DonationSection({
  standalone = false,
}: {
  standalone?: boolean;
}) {
  const { celebrate } = useAzura();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | CryptoChannel["chainGroup"]>("all");
  const [qrModal, setQrModal] = useState<{
    title: string;
    subtitle: string;
    value: string;
    qrSrc: string;
    isUrl?: boolean;
  } | null>(null);

  const copyText = async (
    id: string,
    text: string,
    label: string,
    ev?: React.MouseEvent<HTMLElement>,
  ) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    sfx.chime();
    setCopiedId(id);
    if (ev) {
      const r = ev.currentTarget.getBoundingClientRect();
      celebrate(r.left + r.width / 2, r.top + r.height / 2, 26, 0.95);
    }
    toast(`${label} berhasil disalin ke papan klip`, "ok");
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2200);
  };

  const visibleChannels =
    filter === "all"
      ? CRYPTO_CHANNELS
      : CRYPTO_CHANNELS.filter((c) => c.chainGroup === filter);

  return (
    <section
      id="donasi"
      aria-label="Halaman Donasi dan Dukungan Kreator"
      className="az-card relative overflow-hidden"
    >
      {/* Top ruler strip */}
      <div className="az-ruler-strip flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line-strong)] px-4 py-2 text-[11px] font-mono tracking-wider text-[var(--ink-soft)]">
        <span className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 bg-[var(--accent)]" />
          LEMBAR DUKUNGAN KREATOR // SERI 2026
        </span>
        <span>BEBAS IKLAN · BEBAS LANGGANAN · 100% DIJALANKAN DI BROWSER</span>
      </div>

      <div className="p-5 sm:p-7">
        {/* Editorial header */}
        <div className="flex flex-col justify-between gap-4 border-b border-dashed border-[var(--line-strong)] pb-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 border border-[var(--line-strong)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-[var(--accent)]">
              <IconHeartStamp className="h-3.5 w-3.5" />
              {standalone ? "Halaman Donasi" : "Kotak Apresiasi Studio"}
            </div>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
              Bantu Azuralimit tetap hidup, mandiri, dan gratis dipakai siapa saja.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-faint)]">
              Alat potong ini dirakit tanpa paywall, tanpa watermark, dan tanpa mengunggah
              gambar kamu ke server mana pun. Kalau studio kecil ini menghemat waktumu saat
              memotong sprite, komik, atau feed desain, kamu bisa mentraktir kopi lewat{" "}
              <strong className="font-semibold text-[var(--ink)]">DANA</strong> atau{" "}
              <strong className="font-semibold text-[var(--ink)]">7 jaringan kripto</strong>{" "}
              di bawah ini.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 self-start border border-[var(--line-strong)] bg-[var(--surface-2)] px-3.5 py-2.5">
            <img
              src="/assets/studio-stamp.svg"
              alt="Stempel Studio Azuralimit"
              className="h-11 w-11 shrink-0"
            />
            <div className="font-mono text-[11px] leading-snug">
              <div className="font-bold text-[var(--ink)]">STATUS STUDIO: AKTIF</div>
              <div className="text-[var(--ink-faint)]">8 jalur donasi terverifikasi</div>
            </div>
          </div>
        </div>

        {/* Main 2-column layout: DANA ticket on left, 7 Crypto channels on right */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* LEFT: DANA Voucher Card */}
          <div className="lg:col-span-5">
            <div className="az-ticket flex h-full flex-col justify-between border border-[var(--line-strong)] bg-[var(--surface-2)] p-5">
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-dashed border-[var(--line-strong)] pb-3">
                  <div className="flex items-center gap-2.5">
                    <EmblemDana className="h-8 w-8 shrink-0" />
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--ink-soft)]">
                        DOMPET DIGITAL INDONESIA
                      </span>
                      <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
                        Donasi via DANA
                      </h3>
                    </div>
                  </div>
                  <span className="border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--accent)]">
                    INSTAN · QRIS/DANA
                  </span>
                </div>

                {/* Scannable QR Preview */}
                <div className="mt-4 flex flex-col items-center gap-3 border border-[var(--line)] bg-[var(--surface-3)] p-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setQrModal({
                        title: "Donasi DANA — Azuralimit",
                        subtitle: "Pindai dengan aplikasi DANA atau klik tombol buka tautan",
                        value: DANA_URL,
                        qrSrc: "/assets/qr-dana.svg",
                        isUrl: true,
                      });
                    }}
                    className="group relative shrink-0 border-2 border-[#002147] bg-[#FFF6E4] p-2 shadow-[3px_3px_0_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5"
                    title="Perbesar kode QR DANA"
                  >
                    <img
                      src="/assets/qr-dana.svg"
                      alt="Kode QR DANA Azuralimit"
                      className="h-28 w-28 object-contain"
                    />
                    <span className="mt-1 block text-center font-mono text-[9px] font-bold uppercase tracking-wider text-[#002147]">
                      Klik Perbesar
                    </span>
                  </button>

                  <div className="min-w-0 flex-1 space-y-2 text-xs">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
                      TAUTAN RESMI DANA MINTA:
                    </div>
                    <div className="az-num break-all border border-[var(--line)] bg-[var(--surface)] p-2.5 font-mono text-[11px] leading-relaxed text-[var(--ink)] select-all">
                      {DANA_URL}
                    </div>
                    <p className="text-[11px] leading-normal text-[var(--ink-faint)]">
                      Bisa dibuka langsung di HP atau dipindai dari layar komputer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5 pt-2">
                <a
                  href={DANA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sfx.click()}
                  className="az-btn az-btn-primary h-10 flex-1 px-4 font-mono text-xs uppercase tracking-wider"
                >
                  <IconExternal className="h-4 w-4" />
                  Buka Tautan DANA
                </a>
                <button
                  type="button"
                  onClick={(e) => copyText("dana-link", DANA_URL, "Tautan DANA", e)}
                  className="az-btn az-btn-ghost h-10 px-3.5 font-mono text-xs uppercase tracking-wider"
                >
                  {copiedId === "dana-link" ? (
                    <>
                      <IconCheck className="h-4 w-4 text-[var(--good)]" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <IconCopy className="h-4 w-4" />
                      Salin Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: 7 Crypto Networks */}
          <div className="lg:col-span-7">
            <div className="flex h-full flex-col justify-between border border-[var(--line-strong)] bg-[var(--surface-2)] p-5">
              <div>
                {/* Header + universal EVM wallet bar */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-[var(--line-strong)] pb-3.5">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--ink-soft)]">
                      DOMPET MULTI-JARINGAN EVM (7 SALURAN)
                    </span>
                    <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
                      Transfer Kripto / Web3
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setQrModal({
                          title: "Alamat Dompet EVM Azuralimit",
                          subtitle:
                            "Mendukung USDT (BSC/Polygon), ETH (Base/arb_one), BNB (BSC), MATIC (Polygon), PEPE (ERC20)",
                          value: EVM_ADDRESS,
                          qrSrc: "/assets/qr-evm.svg",
                        });
                      }}
                      className="az-btn az-btn-ghost h-8 px-3 font-mono text-[11px] uppercase tracking-wider"
                    >
                      <IconQr className="h-3.5 w-3.5" />
                      QR Alamat
                    </button>
                    <button
                      type="button"
                      onClick={(e) =>
                        copyText("master-evm", EVM_ADDRESS, "Alamat dompet 0x8B10…3B82", e)
                      }
                      className="az-btn az-btn-primary h-8 px-3 font-mono text-[11px] uppercase tracking-wider"
                    >
                      {copiedId === "master-evm" ? (
                        <>
                          <IconCheck className="h-3.5 w-3.5" />
                          Alamat Tersalin
                        </>
                      ) : (
                        <>
                          <IconCopy className="h-3.5 w-3.5" />
                          Salin 0x8B10…3B82
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Filter tabs by chain */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {FILTERS.map((f) => {
                    const active = filter === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          sfx.tick();
                          setFilter(f.id);
                        }}
                        className={`border px-2.5 py-1 font-mono text-[11px] font-semibold transition ${
                          active
                            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]"
                            : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-faint)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>

                {/* List of all 7 requested token + network pairs */}
                <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
                  {visibleChannels.map((item) => {
                    const isCopied = copiedId === item.id;
                    const Emblem = item.Emblem;
                    return (
                      <div
                        key={item.id}
                        className="group flex flex-col justify-between border border-[var(--line)] bg-[var(--surface-3)] p-3 transition hover:border-[var(--accent-line)]"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <Emblem className="h-7 w-7 shrink-0" />
                              <div>
                                <div className="font-mono text-xs font-bold text-[var(--ink)]">
                                  {item.networkLabel}
                                </div>
                                <div className="text-[11px] text-[var(--ink-faint)]">
                                  {item.note}
                                </div>
                              </div>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-[var(--ink-soft)]">
                              #{item.code}
                            </span>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between gap-2 border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5">
                            <code className="az-num truncate font-mono text-[11px] text-[var(--ink)] select-all">
                              {item.address}
                            </code>
                            <span className="shrink-0 border border-[var(--line-strong)] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-[var(--accent)]">
                              {item.networkTag}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) =>
                              copyText(item.id, item.address, item.networkLabel, e)
                            }
                            className={`az-btn h-8 flex-1 px-2.5 font-mono text-[11px] uppercase tracking-wider ${
                              isCopied ? "az-btn-good" : "az-btn-ghost"
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <IconCheck className="h-3.5 w-3.5" />
                                Tersalin!
                              </>
                            ) : (
                              <>
                                <IconCopy className="h-3.5 w-3.5" />
                                Salin Alamat
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              sfx.click();
                              setQrModal({
                                title: item.networkLabel,
                                subtitle: item.note,
                                value: item.address,
                                qrSrc: "/assets/qr-evm.svg",
                              });
                            }}
                            className="az-icon-btn h-8 w-8 shrink-0"
                            title={`Tampilkan QR untuk ${item.networkLabel}`}
                            aria-label={`QR ${item.networkLabel}`}
                          >
                            <IconQr className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-[var(--line-strong)] pt-3 font-mono text-[11px] text-[var(--ink-faint)]">
                <span>
                  Alamat terpadu EVM:{" "}
                  <strong className="text-[var(--ink)] select-all">{EVM_ADDRESS}</strong>
                </span>
                <span className="text-[var(--accent)]">
                  Pastikan jaringan pengiriman sesuai label
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Lightbox Modal */}
      {qrModal && (
        <div
          className="az-veil fixed inset-0 z-[90] flex items-center justify-center bg-[var(--overlay)] p-4 backdrop-blur-sm"
          onClick={() => setQrModal(null)}
          role="dialog"
          aria-modal="true"
          aria-label={qrModal.title}
        >
          <div
            className="az-modal-in az-card w-full max-w-md overflow-hidden p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line-strong)] pb-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)]">
                  PINDAI KODE QR DONASI
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
                  {qrModal.title}
                </h3>
                <p className="mt-0.5 text-xs text-[var(--ink-faint)]">{qrModal.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setQrModal(null)}
                className="az-icon-btn h-8 w-8 shrink-0"
                aria-label="Tutup modal QR"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <div className="my-5 flex flex-col items-center">
              <div className="border-2 border-[#002147] bg-[#FFF6E4] p-3 shadow-[4px_4px_0_rgba(0,0,0,0.4)]">
                <img
                  src={qrModal.qrSrc}
                  alt={qrModal.title}
                  className="h-56 w-56 object-contain"
                />
              </div>
              <div className="mt-4 w-full break-all border border-[var(--line-strong)] bg-[var(--surface-2)] p-3 text-center font-mono text-xs text-[var(--ink)] select-all">
                {qrModal.value}
              </div>
            </div>

            <div className="flex gap-2">
              {qrModal.isUrl && (
                <a
                  href={qrModal.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="az-btn az-btn-primary h-10 flex-1 font-mono text-xs uppercase tracking-wider"
                >
                  <IconExternal className="h-4 w-4" />
                  Buka DANA
                </a>
              )}
              <button
                type="button"
                onClick={(e) => copyText("modal-copy", qrModal.value, qrModal.title, e)}
                className="az-btn az-btn-ghost h-10 flex-1 font-mono text-xs uppercase tracking-wider"
              >
                <IconCopy className="h-4 w-4" />
                Salin
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
