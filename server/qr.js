import QRCode from 'qrcode';

/** SVG QR code of the phone join link for a room. */
export function qrSvg(base, room) {
  return QRCode.toString(`${base}/?room=${encodeURIComponent(room)}`, { type: 'svg' });
}
