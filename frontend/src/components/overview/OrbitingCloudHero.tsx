import { useState, useMemo } from "react"
import { useTheme } from "../../state/theme"
import OrbitImages from "../ui/OrbitImages"

/**
 * Centered High-Fidelity Vector Cloud Provider Logos
 * (Retained for backward compatibility)
 */
export function GoogleCloudIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
        fill="#4285F4"
      />
      <path
        d="M12 4c2.8 0 5.24 1.54 6.52 3.83L17.1 9.2A5.32 5.32 0 0 0 12 6.2c-2.9 0-5.3 2.1-5.7 4.9L4.2 10.6C4.8 6.9 8.1 4 12 4z"
        fill="#EA4335"
      />
      <path
        d="M19.35 10.04c-.3 0-.6.04-.9.1l-.8 1.9c.5-.1 1.1-.1 1.7-.1 2 0 3.6 1.6 3.6 3.6 0 .5-.1 1-.3 1.5l1.9.7c.3-.7.4-1.4.4-2.2 0-2.7-2.1-4.9-4.7-5z"
        fill="#FBBC05"
      />
      <path
        d="M6 20h13c.7 0 1.4-.2 2-.5l-1-1.8c-.3.2-.6.3-1 .3H6c-2.2 0-4-1.8-4-4 0-1.8 1.2-3.4 3-3.8l-.4-2C2.1 9.7 0 12.1 0 15c0 2.8 2.7 5 6 5z"
        fill="#34A853"
      />
    </svg>
  )
}

export function AzureIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <path d="M20.2 10.5L9.5 39.8h15.2l-4.5-29.3z" fill="#0078D4" />
      <path d="M20.2 10.5l14.8 26.2-10.3 3.1-4.5-29.3z" fill="#50E6FF" />
      <path d="M24.7 39.8l10.3-3.1 19.5 16.8H38.2L24.7 39.8z" fill="#0078D4" />
      <path d="M20.2 10.5h16.5l17.8 43H38.2L20.2 10.5z" fill="#0089D6" />
    </svg>
  )
}

export function AwsIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 64" className={className} fill="none">
      <path
        d="M26.2 32.8c-2.4 0-4.3-.6-5.6-1.8-1.3-1.2-2-2.9-2-5.1 0-2.3.7-4 2.2-5.2 1.5-1.2 3.6-1.8 6.3-1.8 2.3 0 4.2.4 5.6 1.1v-1.6c0-1.6-.4-2.8-1.3-3.6-.9-.8-2.2-1.2-3.9-1.2-1.5 0-2.9.3-4.1.9-1.2.6-2.1 1.4-2.8 2.4l-4.5-3.3c1.2-1.6 2.7-2.8 4.7-3.7 2-1 4.3-1.4 7-1.4 3.7 0 6.5.9 8.3 2.7 1.8 1.8 2.7 4.5 2.7 8.1v15.2h-6.2v-3.4c-1.3 1.3-2.7 2.3-4.3 2.9-1.4.7-3.2 1-5.1 1zm1.2-5.4c1.6 0 3-.4 4.1-1.2 1.1-.8 1.8-2 2-3.4-.9-.5-2.2-.8-3.7-.8-1.5 0-2.6.3-3.3.9-.7.6-1.1 1.4-1.1 2.4 0 .8.3 1.4.8 1.7.5.3 1.1.4 1.9.4z"
        className="fill-[#232F3E] dark:fill-[#F5F0E6] transition-colors"
      />
      <path
        d="M54.1 32.4h-6.1l-6-23.1h6.5l3.2 14.6 3.5-14.6h5.8l3.4 14.6 3.3-14.6h6.4l-6.1 23.1h-6.1l-3.8-14.4-3.7 14.4z"
        className="fill-[#232F3E] dark:fill-[#F5F0E6] transition-colors"
      />
      <path
        d="M80.2 32.8c-2.8 0-5.1-.5-6.9-1.5-1.8-1-3-2.5-3.7-4.4l5.5-2.5c.5 1.3 1.3 2.3 2.4 2.9 1.1.6 2.4.9 3.9.9 1.4 0 2.5-.3 3.3-.8.8-.5 1.2-1.2 1.2-2 0-.8-.3-1.4-.9-1.8-.6-.4-1.7-.8-3.3-1.2l-3.2-.8c-2.4-.6-4.2-1.5-5.3-2.7-1.1-1.2-1.6-2.8-1.6-4.7 0-2.2.8-3.9 2.4-5.3 1.6-1.3 3.8-2 6.5-2 2.3 0 4.3.4 6 1.3 1.6.9 2.8 2.2 3.5 3.9l-5.3 2.5c-.4-1-1-1.7-1.9-2.2-.9-.5-2-.7-3.2-.7-1.2 0-2.1.2-2.8.7-.7.5-1.1 1.1-1.1 1.8 0 .6.3 1.1.8 1.5.5.4 1.4.7 2.6 1l3.5.9c2.7.7 4.7 1.7 5.8 3 1.1 1.3 1.7 3 1.7 5 0 2.3-.8 4.2-2.5 5.6-1.7 1.5-4 2.2-7 2.2z"
        className="fill-[#232F3E] dark:fill-[#F5F0E6] transition-colors"
      />
      <path
        d="M89.8 45.4c-8.9 6.2-22.1 9.5-36.9 9.5-18.7 0-35.3-5.2-46.7-13.9-.9-.7-.1-1.7.9-1.1 11.1 7.2 26.6 11.6 44.5 11.6 13.5 0 25.8-2.8 35.8-8.1 1.6-.9 3.2.7 1.5 2z"
        fill="#FF9900"
      />
      <path
        d="M87.8 42.4l4.9-1.3-1.6 4.9c-.3.8.3 1.3 1 .8l4.4-3.5c.7-.6.6-1.4-.2-1.8l-5.2-2.5c-.8-.4-1.3.1-1 1z"
        fill="#FF9900"
      />
    </svg>
  )
}

export function OracleIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <path
        d="M32 18c-12.1 0-22 6.3-22 14s9.9 14 22 14 22-6.3 22-14-9.9-14-22-14zm0 21.8c-8.3 0-15-3.5-15-7.8s6.7-7.8 15-7.8 15 3.5 15 7.8-6.7 7.8-15 7.8z"
        fill="#C74634"
      />
    </svg>
  )
}

export function IbmCloudIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <path d="M32 10l16 9.2-16 9.2-16-9.2L32 10z" fill="#FF5252" />
      <path d="M16 19.2l16 9.2v18.5l-16-9.2V19.2z" fill="#D32F2F" />
      <path d="M48 19.2v18.5l-16 9.2V28.4l16-9.2z" fill="#B71C1C" />
      <path d="M26 31l6-3.5 6 3.5v7l-6 3.5-6-3.5v-7z" fill="#FFFFFF" opacity="0.95" />
      <path d="M32 37l-4-2.3v-4.6l4 2.3 4-2.3v4.6L32 37z" fill="#D32F2F" />
    </svg>
  )
}

/**
 * High-Fidelity Realistic 3D Cloud Provider SVG Tokens
 * Sculpted with authentic brand aesthetics, volumetric 3D gradients, specular reflections, and chamfered bevels
 */
function createRealisticSvgUri(provider: "gcp" | "azure" | "aws" | "r2" | "b2" | "oracle" | "ibm"): string {
  let svgContent = ""

  switch (provider) {
    case "aws":
      svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <defs>
            <linearGradient id="awsBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#242E3F" />
              <stop offset="50%" stop-color="#161D29" />
              <stop offset="100%" stop-color="#0E131C" />
            </linearGradient>
            <linearGradient id="awsRim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFB347" stop-opacity="0.95" />
              <stop offset="40%" stop-color="#FF9900" stop-opacity="0.6" />
              <stop offset="100%" stop-color="#0F172A" stop-opacity="0.8" />
            </linearGradient>
            <linearGradient id="s3Metal" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF" />
              <stop offset="65%" stop-color="#F1F5F9" />
              <stop offset="100%" stop-color="#CBD5E1" />
            </linearGradient>
            <linearGradient id="awsSmile" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#FFBD59" />
              <stop offset="50%" stop-color="#FF9900" />
              <stop offset="100%" stop-color="#FF7A00" />
            </linearGradient>
            <filter id="awsGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="3" flood-color="#FF9900" flood-opacity="0.45" />
            </filter>
          </defs>
          <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#awsBg)" stroke="url(#awsRim)" stroke-width="2.2" />
          <path d="M6 24 C6 13 14 6 25 6 L75 6 C86 6 94 13 94 24 L94 42 C68 46 32 38 6 48 Z" fill="#FFFFFF" fill-opacity="0.08" />
          
          <g transform="translate(0, 4)">
            <text x="50" y="27" text-anchor="middle" fill="#94A3B8" font-size="10" font-weight="800" font-family="system-ui, -apple-system, sans-serif" letter-spacing="2px">AWS</text>
            <text x="50" y="55" text-anchor="middle" fill="url(#s3Metal)" font-size="30" font-weight="900" font-family="system-ui, -apple-system, sans-serif" letter-spacing="-0.5px" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.65))">S3</text>
            <g filter="url(#awsGlow)">
              <path d="M26 67 C36 75 64 75 74 67" stroke="url(#awsSmile)" stroke-width="4.2" stroke-linecap="round" fill="none" />
              <polygon points="76,66 70,62 70,70" fill="#FF9900" />
            </g>
          </g>
        </svg>
      `
      break

    case "gcp":
      svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <defs>
            <linearGradient id="gcpBg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF" />
              <stop offset="60%" stop-color="#F8FAFC" />
              <stop offset="100%" stop-color="#E2E8F0" />
            </linearGradient>
            <linearGradient id="gcpRim" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
              <stop offset="100%" stop-color="#CBD5E1" stop-opacity="0.8" />
            </linearGradient>
            <radialGradient id="gcpBlue" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#60A5FA" />
              <stop offset="55%" stop-color="#4285F4" />
              <stop offset="100%" stop-color="#1D4ED8" />
            </radialGradient>
            <radialGradient id="gcpGreen" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#4ADE80" />
              <stop offset="55%" stop-color="#34A853" />
              <stop offset="100%" stop-color="#15803D" />
            </radialGradient>
            <radialGradient id="gcpYellow" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#FDE047" />
              <stop offset="55%" stop-color="#FBBC05" />
              <stop offset="100%" stop-color="#CA8A04" />
            </radialGradient>
            <radialGradient id="gcpRed" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#F87171" />
              <stop offset="55%" stop-color="#EA4335" />
              <stop offset="100%" stop-color="#B91C1C" />
            </radialGradient>
            <filter id="cloudShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="5" stdDeviation="4.5" flood-color="#1E293B" flood-opacity="0.22" />
            </filter>
          </defs>
          <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#gcpBg)" stroke="url(#gcpRim)" stroke-width="2.2" />
          <path d="M6 24 C6 13 14 6 25 6 L75 6 C86 6 94 13 94 24 L94 42 C68 46 32 38 6 48 Z" fill="#FFFFFF" fill-opacity="0.65" />
          <g filter="url(#cloudShadow)" transform="translate(18, 22) scale(2.65)">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="url(#gcpBlue)"/>
            <path d="M12 4c2.8 0 5.24 1.54 6.52 3.83L17.1 9.2A5.32 5.32 0 0 0 12 6.2c-2.9 0-5.3 2.1-5.7 4.9L4.2 10.6C4.8 6.9 8.1 4 12 4z" fill="url(#gcpRed)"/>
            <path d="M19.35 10.04c-.3 0-.6.04-.9.1l-.8 1.9c.5-.1 1.1-.1 1.7-.1 2 0 3.6 1.6 3.6 3.6 0 .5-.1 1-.3 1.5l1.9.7c.3-.7.4-1.4.4-2.2 0-2.7-2.1-4.9-4.7-5z" fill="url(#gcpYellow)"/>
            <path d="M6 20h13c.7 0 1.4-.2 2-.5l-1-1.8c-.3.2-.6.3-1 .3H6c-2.2 0-4-1.8-4-4 0-1.8 1.2-3.4 3-3.8l-.4-2C2.1 9.7 0 12.1 0 15c0 2.8 2.7 5 6 5z" fill="url(#gcpGreen)"/>
          </g>
          <text x="50" y="86" text-anchor="middle" fill="#64748B" font-size="8.5" font-weight="800" font-family="system-ui, -apple-system, sans-serif" letter-spacing="1.5px">GOOGLE CLOUD</text>
        </svg>
      `
      break

    case "azure":
      svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <defs>
            <linearGradient id="azBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0B1A30" />
              <stop offset="60%" stop-color="#050E1A" />
              <stop offset="100%" stop-color="#02060D" />
            </linearGradient>
            <linearGradient id="azRim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#50E6FF" stop-opacity="0.85" />
              <stop offset="40%" stop-color="#0078D4" stop-opacity="0.5" />
              <stop offset="100%" stop-color="#002B54" stop-opacity="0.8" />
            </linearGradient>
            <linearGradient id="azFacet1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0078D4" />
              <stop offset="100%" stop-color="#004578" />
            </linearGradient>
            <linearGradient id="azFacet2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#50E6FF" />
              <stop offset="60%" stop-color="#00A4EF" />
              <stop offset="100%" stop-color="#0078D4" />
            </linearGradient>
            <linearGradient id="azFacet3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#008AD7" />
              <stop offset="100%" stop-color="#005A9E" />
            </linearGradient>
            <filter id="azGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#0078D4" flood-opacity="0.5" />
            </filter>
          </defs>
          <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#azBg)" stroke="url(#azRim)" stroke-width="2.2" />
          <path d="M6 24 C6 13 14 6 25 6 L75 6 C86 6 94 13 94 24 L94 42 C68 46 32 38 6 48 Z" fill="#FFFFFF" fill-opacity="0.08" />
          <g filter="url(#azGlow)" transform="translate(20, 16) scale(0.95)">
            <path d="M20.2 10.5L9.5 39.8h15.2l-4.5-29.3z" fill="url(#azFacet1)" />
            <path d="M20.2 10.5l14.8 26.2-10.3 3.1-4.5-29.3z" fill="url(#azFacet2)" />
            <path d="M24.7 39.8l10.3-3.1 19.5 16.8H38.2L24.7 39.8z" fill="url(#azFacet1)" />
            <path d="M20.2 10.5h16.5l17.8 43H38.2L20.2 10.5z" fill="url(#azFacet3)" />
          </g>
          <text x="50" y="85" text-anchor="middle" fill="#7DD3FC" font-size="8.5" font-weight="800" font-family="system-ui, -apple-system, sans-serif" letter-spacing="1.5px">AZURE BLOB</text>
        </svg>
      `
      break

    case "r2":
      svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <defs>
            <linearGradient id="r2Bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#221A14" />
              <stop offset="60%" stop-color="#140E0A" />
              <stop offset="100%" stop-color="#0A0705" />
            </linearGradient>
            <linearGradient id="r2Rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F38020" stop-opacity="0.9" />
              <stop offset="50%" stop-color="#78350F" stop-opacity="0.4" />
              <stop offset="100%" stop-color="#451A03" stop-opacity="0.8" />
            </linearGradient>
            <linearGradient id="r2Cloud" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FF9E43" />
              <stop offset="60%" stop-color="#F38020" />
              <stop offset="100%" stop-color="#D95B00" />
            </linearGradient>
            <linearGradient id="r2Flame" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FFF066" />
              <stop offset="60%" stop-color="#FAAD3F" />
              <stop offset="100%" stop-color="#F38020" />
            </linearGradient>
            <filter id="r2Glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#F38020" flood-opacity="0.5" />
            </filter>
          </defs>
          <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#r2Bg)" stroke="url(#r2Rim)" stroke-width="2.2" />
          <path d="M6 24 C6 13 14 6 25 6 L75 6 C86 6 94 13 94 24 L94 42 C68 46 32 38 6 48 Z" fill="#FFFFFF" fill-opacity="0.08" />
          <g filter="url(#r2Glow)" transform="translate(18, 16) scale(2.65)">
            <path d="M17.5 11.5c-.1-1.6-1.4-2.9-3-2.9-.7 0-1.4.3-1.8.7-.6-1.3-1.9-2.2-3.4-2.2-2.1 0-3.9 1.8-3.9 4 0 .3 0 .6.1.9-1.2.3-2.1 1.5-2.1 2.8 0 1.6 1.3 2.9 2.9 2.9h11.2c1.5 0 2.7-1.2 2.7-2.7 0-1.4-1.1-2.6-2.5-2.6h-.2z" fill="url(#r2Cloud)" />
            <path d="M14.5 8.6c.6.7.9 1.6.7 2.6l2.4.2c.1-.4.1-.9 0-1.4-.2-.9-.7-1.6-1.4-2-.5.2-1.2.4-1.7.6z" fill="url(#r2Flame)" />
          </g>
          <text x="50" y="74" text-anchor="middle" fill="#FFFFFF" font-size="18" font-weight="900" font-family="ui-monospace, monospace" letter-spacing="1px" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.7))">R2</text>
          <text x="50" y="87" text-anchor="middle" fill="#FB923C" font-size="7.5" font-weight="800" font-family="system-ui, -apple-system, sans-serif" letter-spacing="1.2px">CLOUDFLARE</text>
        </svg>
      `
      break

    case "b2":
      svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <defs>
            <linearGradient id="b2Bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#241014" />
              <stop offset="60%" stop-color="#140608" />
              <stop offset="100%" stop-color="#0A0204" />
            </linearGradient>
            <linearGradient id="b2Rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FF3B30" stop-opacity="0.85" />
              <stop offset="50%" stop-color="#881337" stop-opacity="0.4" />
              <stop offset="100%" stop-color="#4C0519" stop-opacity="0.8" />
            </linearGradient>
            <linearGradient id="b2FlameOuter" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FF453A" />
              <stop offset="60%" stop-color="#ED1C24" />
              <stop offset="100%" stop-color="#990008" />
            </linearGradient>
            <linearGradient id="b2FlameInner" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FFEB3B" />
              <stop offset="60%" stop-color="#FFA028" />
              <stop offset="100%" stop-color="#E65100" />
            </linearGradient>
            <filter id="b2Glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#ED1C24" flood-opacity="0.55" />
            </filter>
          </defs>
          <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#b2Bg)" stroke="url(#b2Rim)" stroke-width="2.2" />
          <path d="M6 24 C6 13 14 6 25 6 L75 6 C86 6 94 13 94 24 L94 42 C68 46 32 38 6 48 Z" fill="#FFFFFF" fill-opacity="0.08" />
          <g filter="url(#b2Glow)" transform="translate(20, 12) scale(2.5)">
            <path d="M12 4.2c.4 1.8-.3 3.3-1.2 4.4-.9 1.1-1.8 2.2-1.8 3.8 0 2.2 1.8 3.9 4 3.9s4-1.7 4-3.9c0-1.8-1-3.2-2.1-4.4-.3.9-.8 1.6-1.5 2-.1-.8.1-1.8-.4-2.6-.6-1-1-2.2-1-3.2z" fill="url(#b2FlameOuter)" />
            <path d="M12 16.3c-1.3 0-2.4-1-2.4-2.3 0-.9.5-1.6 1.1-2.1.2.6.5 1.1 1 1.3 0-.5.2-1.1 0-1.6.5.6.9 1.3.9 2 0 1.5-.7 2.7-1.6 2.7z" fill="url(#b2FlameInner)" />
          </g>
          <text x="50" y="74" text-anchor="middle" fill="#FFFFFF" font-size="18" font-weight="900" font-family="ui-monospace, monospace" letter-spacing="1px" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.7))">B2</text>
          <text x="50" y="87" text-anchor="middle" fill="#F87171" font-size="7.5" font-weight="800" font-family="system-ui, -apple-system, sans-serif" letter-spacing="1.2px">BACKBLAZE</text>
        </svg>
      `
      break

    case "oracle":
      svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <defs>
            <linearGradient id="ociBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#241716" />
              <stop offset="60%" stop-color="#140D0C" />
              <stop offset="100%" stop-color="#0A0606" />
            </linearGradient>
            <linearGradient id="ociRim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#C74634" stop-opacity="0.9" />
              <stop offset="50%" stop-color="#64748B" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#334155" stop-opacity="0.7" />
            </linearGradient>
            <linearGradient id="ociRing" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FF6352" />
              <stop offset="50%" stop-color="#C74634" />
              <stop offset="100%" stop-color="#7C1E12" />
            </linearGradient>
            <linearGradient id="ociText" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF" />
              <stop offset="100%" stop-color="#CBD5E1" />
            </linearGradient>
            <filter id="ociGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4.5" flood-color="#C74634" flood-opacity="0.5" />
            </filter>
          </defs>
          <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#ociBg)" stroke="url(#ociRim)" stroke-width="2.2" />
          <path d="M6 24 C6 13 14 6 25 6 L75 6 C86 6 94 13 94 24 L94 42 C68 46 32 38 6 48 Z" fill="#FFFFFF" fill-opacity="0.08" />
          <g filter="url(#ociGlow)" transform="translate(18, 14) scale(1)">
            <path d="M32 18c-12.1 0-22 6.3-22 14s9.9 14 22 14 22-6.3 22-14-9.9-14-22-14zm0 21.8c-8.3 0-15-3.5-15-7.8s6.7-7.8 15-7.8 15 3.5 15 7.8-6.7 7.8-15 7.8z" fill="url(#ociRing)" />
          </g>
          <text x="50" y="73" text-anchor="middle" fill="url(#ociText)" font-size="16" font-weight="900" font-family="ui-monospace, monospace" letter-spacing="1.2px" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.7))">OCI</text>
          <text x="50" y="86" text-anchor="middle" fill="#F87171" font-size="7.5" font-weight="800" font-family="system-ui, -apple-system, sans-serif" letter-spacing="1.2px">ORACLE CLOUD</text>
        </svg>
      `
      break

    case "ibm":
      svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <defs>
            <linearGradient id="ibmBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0E1933" />
              <stop offset="60%" stop-color="#070C1A" />
              <stop offset="100%" stop-color="#03060D" />
            </linearGradient>
            <linearGradient id="ibmRim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#4589FF" stop-opacity="0.85" />
              <stop offset="50%" stop-color="#0F62FE" stop-opacity="0.4" />
              <stop offset="100%" stop-color="#001D6C" stop-opacity="0.8" />
            </linearGradient>
            <linearGradient id="barGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#0F62FE" />
              <stop offset="100%" stop-color="#4589FF" />
            </linearGradient>
            <linearGradient id="barGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#4589FF" />
              <stop offset="100%" stop-color="#78A9FF" />
            </linearGradient>
            <linearGradient id="barGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#A6C8FF" />
              <stop offset="100%" stop-color="#FFFFFF" />
            </linearGradient>
            <filter id="ibmGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4.5" flood-color="#0F62FE" flood-opacity="0.6" />
            </filter>
          </defs>
          <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#ibmBg)" stroke="url(#ibmRim)" stroke-width="2.2" />
          <path d="M6 24 C6 13 14 6 25 6 L75 6 C86 6 94 13 94 24 L94 42 C68 46 32 38 6 48 Z" fill="#FFFFFF" fill-opacity="0.08" />
          <g filter="url(#ibmGlow)" transform="translate(19, 17) scale(2.6)">
            <rect x="4.5" y="6" width="3" height="1" fill="url(#barGrad1)" rx="0.3" />
            <rect x="9.5" y="6" width="5" height="1" fill="url(#barGrad1)" rx="0.3" />
            <rect x="16.5" y="6" width="3" height="1" fill="url(#barGrad1)" rx="0.3" />
            <rect x="4.5" y="7.5" width="3" height="1" fill="url(#barGrad1)" rx="0.3" />
            <rect x="9.5" y="7.5" width="5" height="1" fill="url(#barGrad1)" rx="0.3" />
            <rect x="16.5" y="7.5" width="3" height="1" fill="url(#barGrad1)" rx="0.3" />
            <rect x="5.5" y="9" width="1.4" height="1" fill="url(#barGrad2)" rx="0.3" />
            <rect x="9.5" y="9" width="5" height="1" fill="url(#barGrad2)" rx="0.3" />
            <rect x="16.5" y="9" width="1.2" height="1" fill="url(#barGrad2)" rx="0.3" />
            <rect x="18.3" y="9" width="1.2" height="1" fill="url(#barGrad2)" rx="0.3" />
            <rect x="5.5" y="10.5" width="1.4" height="1" fill="url(#barGrad2)" rx="0.3" />
            <rect x="9.5" y="10.5" width="4.5" height="1" fill="url(#barGrad2)" rx="0.3" />
            <rect x="16.5" y="10.5" width="1.2" height="1" fill="url(#barGrad2)" rx="0.3" />
            <rect x="18.3" y="10.5" width="1.2" height="1" fill="url(#barGrad2)" rx="0.3" />
            <rect x="5.5" y="12" width="1.4" height="1" fill="url(#barGrad2)" rx="0.3" />
            <rect x="9.5" y="12" width="5" height="1" fill="url(#barGrad2)" rx="0.3" />
            <rect x="16.5" y="12" width="3" height="1" fill="url(#barGrad2)" rx="0.3" />
            <rect x="5.5" y="13.5" width="1.4" height="1" fill="url(#barGrad2)" rx="0.3" />
            <rect x="9.5" y="13.5" width="5" height="1" fill="url(#barGrad2)" rx="0.3" />
            <rect x="16.5" y="13.5" width="1.2" height="1" fill="url(#barGrad2)" rx="0.3" />
            <rect x="18.3" y="13.5" width="1.2" height="1" fill="url(#barGrad2)" rx="0.3" />
            <rect x="4.5" y="15" width="3" height="1" fill="url(#barGrad3)" rx="0.3" />
            <rect x="9.5" y="15" width="5" height="1" fill="url(#barGrad3)" rx="0.3" />
            <rect x="16.5" y="15" width="1.2" height="1" fill="url(#barGrad3)" rx="0.3" />
            <rect x="18.3" y="15" width="1.2" height="1" fill="url(#barGrad3)" rx="0.3" />
            <rect x="4.5" y="16.5" width="3" height="1" fill="url(#barGrad3)" rx="0.3" />
            <rect x="9.5" y="16.5" width="5" height="1" fill="url(#barGrad3)" rx="0.3" />
            <rect x="16.5" y="16.5" width="3" height="1" fill="url(#barGrad3)" rx="0.3" />
          </g>
          <text x="50" y="86" text-anchor="middle" fill="#93C5FD" font-size="8.5" font-weight="800" font-family="system-ui, -apple-system, sans-serif" letter-spacing="1.5px">IBM CLOUD</text>
        </svg>
      `
      break
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`
}

export function OrbitingCloudHero() {
  const { isDark } = useTheme()
  const [activeProvider, setActiveProvider] = useState<string | null>(null)

  // Memoize provider image descriptors with authentic, realistic 3D badges
  const providerImages = useMemo(() => [
    {
      src: createRealisticSvgUri("aws"),
      alt: "AWS S3 — Primary Cold Storage",
    },
    {
      src: createRealisticSvgUri("gcp"),
      alt: "Google Cloud — Multi-Region Storage",
    },
    {
      src: createRealisticSvgUri("azure"),
      alt: "Microsoft Azure — Scalable Blob Storage",
    },
    {
      src: createRealisticSvgUri("r2"),
      alt: "Cloudflare R2 — Zero-Egress Storage",
    },
    {
      src: createRealisticSvgUri("b2"),
      alt: "Backblaze B2 — S3-Compatible Tier",
    },
    {
      src: createRealisticSvgUri("oracle"),
      alt: "Oracle Cloud — High-Performance Vault",
    },
    {
      src: createRealisticSvgUri("ibm"),
      alt: "IBM Cloud — Resilient Compliance Storage",
    },
  ], [])

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[400px] h-[245px] sm:h-[260px] mx-auto select-none">
      {/* ── Background Warm Aura & Celestial Ambient Radiance ── */}
      <div
        className="absolute inset-0 pointer-events-none rounded-full blur-2xl opacity-65 transition-opacity duration-700"
        style={{
          background: isDark
            ? "radial-gradient(circle at 50% 50%, rgba(245, 197, 66, 0.38) 0%, rgba(217, 148, 34, 0.14) 45%, transparent 70%)"
            : "radial-gradient(circle at 50% 50%, rgba(245, 197, 66, 0.30) 0%, rgba(217, 148, 34, 0.09) 45%, transparent 70%)",
        }}
      />

      {/* ── Dominik Koch's React Bits <OrbitImages /> Integration ── */}
      <OrbitImages
        images={providerImages}
        shape="ellipse"
        radiusX={375}
        radiusY={100}
        rotation={-6}
        duration={26}
        itemSize={88}
        depth={0.65}
        showPath={true}
        pathColor={isDark ? "rgba(245, 202, 88, 0.42)" : "rgba(217, 148, 34, 0.42)"}
        pathWidth={1.6}
        pathDash={5}
        draggable={true}
        clickToFront={true}
        itemRadius={22}
        shadow={0.38}
        hoverScale={1.14}
        hoverSpeed={0.25}
        width="100%"
        height="100%"
        onItemClick={(idx) => {
          const provider = providerImages[idx]
          if (provider) {
            setActiveProvider(provider.alt.split("—")[0]?.trim() ?? null)
          }
        }}
        centerContent={
          <div className="relative flex flex-col items-center justify-center cursor-pointer select-none group">
            {/* Layered Golden Glass Plates for 3D Specular Shimmer */}
            <div className="absolute w-[72px] h-[90px] rounded-[22px] bg-amber-400/20 rotate-10 transform scale-95 blur-[1px] pointer-events-none transition-transform duration-300 group-hover:rotate-12" />
            <div className="absolute w-[74px] h-[92px] rounded-[22px] bg-amber-300/30 rotate-5 transform scale-98 pointer-events-none transition-transform duration-300 group-hover:rotate-6" />

            {/* The Main Golden Sovereign Cloud Bar with 3D Bevels */}
            <div className="relative w-[80px] h-[98px] rounded-[22px] bg-gradient-to-br from-[#FFEAA0] via-[#E2A62C] to-[#8C5506] p-[1.5px] shadow-[0_16px_36px_-6px_rgba(202,143,26,0.65),0_6px_16px_rgba(0,0,0,0.14)] flex flex-col items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-105">
              {/* Inner Chamfered Metallic Layer */}
              <div className="relative w-full h-full rounded-[20px] bg-gradient-to-b from-[#FFF2B2] via-[#ECAE28] to-[#995E05] flex flex-col items-center justify-center overflow-hidden border border-white/50 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(80,40,0,0.4)]">
                {/* Diagonal Specular Sheen */}
                <div className="absolute -top-12 -left-12 w-28 h-28 bg-gradient-to-br from-white/50 via-white/10 to-transparent rounded-full blur-[1px] pointer-events-none" />

                {/* 3D Volumetric Pearl Cloud Glyph with Realistic Ambient Occlusion */}
                <svg
                  viewBox="0 0 64 64"
                  className="w-13 h-13 drop-shadow-[0_4px_8px_rgba(115,68,5,0.45)]"
                  fill="none"
                >
                  <defs>
                    <radialGradient id="pearlCloud" cx="45%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="65%" stopColor="#F8FAFC" />
                      <stop offset="85%" stopColor="#E2E8F0" />
                      <stop offset="100%" stopColor="#CBD5E1" />
                    </radialGradient>
                    <linearGradient id="cloudUnderShadow" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                      <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.45" />
                    </linearGradient>
                    <linearGradient id="cloudGloss" x1="0%" y1="0%" x2="100%" y2="50%">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Volumetric 3D Cloud Base */}
                  <path
                    d="M48 28.5C46.5 20.5 39.5 14.5 31 14.5C24.2 14.5 18.3 18.4 15.4 24.1C7.9 24.9 2 31.3 2 39C2 47.3 8.7 54 17 54H48C54.6 54 60 48.6 60 42C60 35.7 55.1 30.5 48.9 30.1L48 28.5Z"
                    fill="url(#pearlCloud)"
                  />
                  {/* Ambient Underside Shade */}
                  <path
                    d="M2 39C2 47.3 8.7 54 17 54H48C54.6 54 60 48.6 60 42C60 38.2 58.2 34.8 55.3 32.7C52 46 25 48 2 39Z"
                    fill="url(#cloudUnderShadow)"
                  />
                  {/* Top Specular Gloss Highlight */}
                  <path
                    d="M31 16.5C38 16.5 43.8 21.3 45.4 28L47.5 30C52.5 30.5 56.5 34.5 57 39.5C54 33 49 28 44 26C38 23 27 21 17 26C18.5 20.5 24.2 16.5 31 16.5Z"
                    fill="url(#cloudGloss)"
                  />
                </svg>

                {/* Debossed Gold Brand Typography */}
                <span className="font-cinzel text-[9px] font-black tracking-[0.22em] text-[#5A3805] drop-shadow-[0_1px_0_rgba(255,245,195,0.85)] uppercase mt-0.5">
                  Nexus
                </span>
              </div>
            </div>

            {/* Click-to-front / Active provider badge */}
            {activeProvider && (
              <div className="absolute -bottom-6.5 whitespace-nowrap rounded-full bg-[#0B1B32]/95 dark:bg-[#1C1812]/95 border border-[#C6A052]/50 px-2.5 py-0.5 text-3xs font-mono font-bold text-[#F5EBD7] shadow-lg animate-fade-in pointer-events-none">
                {activeProvider}
              </div>
            )}
          </div>
        }
      />
    </div>
  )
}
