import * as stylex from '@stylexjs/stylex';

// The rest of the page reuses the phone page's styles (web/phone/styles.js).
export const styles = stylex.create({
  controls: {
    position: 'relative', // the controls panel sits at the bottom of this box
    maxWidth: '480px',
    height: '60vh',
    minHeight: '360px',
    margin: '0 auto',
    padding: '24px',
    boxSizing: 'border-box',
    textAlign: 'center',
  },
});
