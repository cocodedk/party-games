import * as stylex from '@stylexjs/stylex';

/** Sets the StyleX classes (and dynamic style variables) of a node. */
export function apply(node, ...looks) {
  const { className, style } = stylex.props(...looks);
  node.className = className || '';
  for (const key in style) node.style.setProperty(key, style[key]);
}
