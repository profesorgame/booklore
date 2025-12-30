import {SortOption} from './sort.model';

export interface Shelf {
  id?: number;
  name: string;
  icon: string;
  iconType?: 'PRIME_NG' | 'CUSTOM_SVG';
  sort?: SortOption;
  autoEmailEnabled?: boolean;
  autoEmailProviderId?: number | null;
  autoEmailRecipientId?: number | null;
}
