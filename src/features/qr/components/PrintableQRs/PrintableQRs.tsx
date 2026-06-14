import { QRCodeSVG } from 'qrcode.react'
import type { Table } from '@core/domain/entities/Table'
import type { TenantBranding } from '@core/domain/entities/Tenant'
import { isDarkColor } from '@shared/utils/colorScale'

interface PrintableQRsProps {
  tables: Table[]
  branding: TenantBranding
  restaurantName: string
  bgColor?: string
  buildMenuUrl: (tableId: string) => string
}

export function PrintableQRs({ tables, branding, restaurantName, bgColor = '#ffffff', buildMenuUrl }: PrintableQRsProps) {
  const primaryColor = branding.primaryColor || '#e11d48'
  const logoUrl = branding.logoUrl
  
  const isDark = isDarkColor(bgColor)
  const textColor = isDark ? '#ffffff' : '#18181b'
  const mutedTextColor = isDark ? 'rgba(255,255,255,0.6)' : '#a1a1aa'

  return (
    <div className="hidden print:block">
      <style type="text/css" media="print">
        {`
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          .qr-print-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15mm;
            width: 100%;
          }
          .qr-print-card {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e5e5'};
            border-radius: 16px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            position: relative;
            overflow: hidden;
            background: ${bgColor} !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            height: 100%;
            color: ${textColor} !important;
          }
          .qr-print-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background-color: ${primaryColor};
          }
        `}
      </style>

      <div className="qr-print-grid">
        {tables.map((table) => {
          const menuUrl = buildMenuUrl(table.id)
          return (
            <div key={table.id} className="qr-print-card">
              {/* Header: Logo / Name */}
              <div className="mb-4 flex flex-col items-center gap-2">
                {logoUrl ? (
                  <img src={logoUrl} alt={restaurantName} className="h-10 w-10 object-contain rounded-md bg-white p-0.5" />
                ) : null}
                <h1 className="text-sm font-bold tracking-tight leading-tight" style={{ color: textColor }}>
                  {restaurantName}
                </h1>
              </div>

              {/* QR Code */}
              <div className="rounded-xl bg-white p-2 shadow-sm border border-zinc-100 mb-4">
                <QRCodeSVG
                  value={menuUrl}
                  size={110}
                  level="Q"
                  includeMargin={false}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>

              {/* Footer: Table Info */}
              <div className="w-full flex flex-col items-center gap-1 mt-auto pb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: mutedTextColor }}>
                  Escanear para ordenar
                </p>
                <div 
                  className="mt-1 rounded-full px-4 py-1.5 w-full"
                  style={{ backgroundColor: `${primaryColor}${isDark ? '40' : '15'}` }}
                >
                  <p 
                    className="text-sm font-black uppercase tracking-wide"
                    style={{ color: isDark ? '#ffffff' : primaryColor }}
                  >
                    Mesa {table.number}
                  </p>
                </div>
                {table.label && (
                  <p className="mt-1 text-[10px] font-medium" style={{ color: mutedTextColor }}>{table.label}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
