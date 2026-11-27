import * as stylex from '@stylexjs/stylex';

// No flex gap, aspect-ratio, clamp() or inset: the TV runs about Chrome 69.
const WHITE = '#fff';
const BLACK = '#000';
const SMALL = '2.2vh'; // the laptop link and the sound prompt

export const styles = stylex.create({
  root: { height: '100%', backgroundColor: BLACK },
  body: {
    margin: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: BLACK,
    color: WHITE,
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', // the canvas text reads it back
  },
  lobby: { display: 'flex', height: '34vh', flexShrink: 0, padding: '2vh 3vw', boxSizing: 'border-box' },
  team: { flex: 1, minWidth: 0 },
  teamRight: { textAlign: 'right' },
  teamName: { margin: '0 0 1vh', fontSize: '4.5vh' },
  list: { margin: 0, padding: 0, listStyle: 'none' },
  player: { fontSize: '3.6vh', fontWeight: 700, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  playerColor: (color) => ({ color }),
  empty: { fontSize: '3.5vh', fontWeight: 400, whiteSpace: 'normal', opacity: 0.8 },
  join: { display: 'flex', alignItems: 'center', margin: '0 1.5vw' },
  qr: { height: '28vh', width: '28vh', backgroundColor: WHITE, borderRadius: '1vh' },
  joinText: { marginLeft: '1.5vw' },
  codeLabel: { margin: 0, fontSize: '3.5vh' },
  code: { margin: 0, fontSize: '12vh', fontWeight: 800, letterSpacing: '0.1em', lineHeight: 1.1 },
  url: { margin: 0, fontSize: '3.5vh' },
  host: { margin: '0.5vh 0 0', fontSize: SMALL, opacity: 0.8 },
  rules: { margin: '1vh 0 0', fontSize: '3.5vh', fontWeight: 700 },
  field: { display: 'block', flex: 1, minHeight: 0, width: '100%' },
  sound: { position: 'fixed', left: 0, right: 0, bottom: '1vh', margin: 0, fontSize: SMALL, opacity: 0.8, textAlign: 'center' },
  status: { margin: 'auto', padding: '0 5vw', fontSize: '6vh', textAlign: 'center' },
});
