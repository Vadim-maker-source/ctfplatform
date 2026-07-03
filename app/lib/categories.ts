export const CATEGORIES = [
  "WEB",
  "CRYPTO",
  "FORENSICS",
  "PWN",
  "REVERSE",
  "STEGANOGRAPHY",
  "OSINT",
  "MISC",
  "NETWORK",
  "LINUX",
  "UCUCUGA",
] as const

export type CategoryValue = (typeof CATEGORIES)[number]

export const CATEGORY_LABELS: Record<CategoryValue, string> = {
  WEB: "Web",
  CRYPTO: "Crypto",
  FORENSICS: "Forensics",
  PWN: "Pwn",
  REVERSE: "Reverse",
  STEGANOGRAPHY: "Steganography",
  OSINT: "OSINT",
  MISC: "Misc",
  NETWORK: "Network",
  LINUX: "Linux",
  UCUCUGA: "Ucucuga",
}
