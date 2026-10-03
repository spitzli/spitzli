// Public content contract provided by the central CMS.

export interface Client {
  id: number;
  name: string;
  website?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  client?: (number | null) | Client;
  summary: string;
  /**
   * Separate paragraphs with a blank line. Do not enter HTML.
   */
  description?: string | null;
  image?: (number | null) | Media;
  category:
    | "Webentwicklung"
    | "Webapps"
    | "APIs & Plattformen"
    | "Cloud & Infrastruktur"
    | "Developer Experience"
    | "Open Source";
  technologies?:
    | {
        name: string;
        id?: string | null;
      }[]
    | null;
  website?: string | null;
  repository?: string | null;
  links?:
    | {
        label: string;
        url: string;
        id?: string | null;
      }[]
    | null;
  /**
   * Optional; enter confirmed dates only.
   */
  period?: string | null;
  projectStatus?: ("unspecified" | "development" | "live" | "completed" | "archived") | null;
  featured?: boolean | null;
  sortOrder: number;
  updatedAt: string;
  createdAt: string;
  _status?: ("draft" | "published") | null;
}

export interface Media {
  id: number;
  alt: string;
  /**
   * Images are stored publicly. Do not upload confidential files or client logos without permission.
   */
  rightsConfirmed: boolean;
  prefix?: string | null;
  _objectKey?: string | null;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  focalX?: number | null;
  focalY?: number | null;
  sizes?: {
    card?: {
      url?: string | null;
      width?: number | null;
      height?: number | null;
      mimeType?: string | null;
      filesize?: number | null;
      filename?: string | null;
    };
  };
}

export interface WebsiteSetting {
  id: number;
  name: string;
  owner: string;
  email: string;
  street: string;
  postcode: string;
  city: string;
  country: string;
  phone?: string | null;
  vatID?: string | null;
  businessID?: string | null;
  register?: string | null;
  databaseProvider?: string | null;
  databaseRegion?: string | null;
  logRetention?: string | null;
  mailProvider?: string | null;
  transfers?: string | null;
  legalReviewed?: boolean | null;
  privacyReviewed?: boolean | null;
  updatedAt?: string | null;
  createdAt?: string | null;
}
