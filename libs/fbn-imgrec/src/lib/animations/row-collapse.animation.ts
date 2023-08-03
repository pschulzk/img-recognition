import { animate, state, style, transition, trigger } from '@angular/animations'

export const rowCollapseAnimation = trigger('rowCollapseAnimation', [
  state(
    'in',
    style({
      opacity: 1,
      height: '*',
      'padding-top': '*',
      'padding-bottom': '*',
      'margin-top': '*',
      'margin-bottom': '*',
    }),
  ),
  transition(':enter', [
    style({
      opacity: 0,
      height: '0rem',
      'padding-top': '0',
      'padding-bottom': '0',
      'margin-top': '0',
      'margin-bottom': '0',
    }),
    animate(100),
  ]),
  transition(
    ':leave',
    animate(
      100,
      style({
        opacity: 0,
        height: '0rem',
        'padding-top': '0',
        'padding-bottom': '0',
        'margin-top': '0',
        'margin-bottom': '0',
      }),
    ),
  ),
])
