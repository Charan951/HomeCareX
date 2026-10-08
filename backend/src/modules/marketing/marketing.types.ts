export interface BannerDto {
  id: string;
  title: string;
  image: string;
  link: string;
  placement:
    | 'HOME'
    | 'HOME_TOP'
    | 'HOME_MIDDLE'
    | 'HOME_BOTTOM';
  startAt: string;
  endAt: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
