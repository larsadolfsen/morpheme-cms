import type { Messages } from '../da-DK';

export const preview: Messages['preview'] = {
  button: 'Preview',
  title: 'Preview',
  device: 'Show as',
  phone: 'Phone',
  computer: 'Computer',
  making: 'Making the preview…',
  failed: (error) => `Could not create the preview: ${error}`,
  notHere: 'That page cannot be previewed.',
  pageNotLoaded: (status) => `The page answered ${status}.`,
};
