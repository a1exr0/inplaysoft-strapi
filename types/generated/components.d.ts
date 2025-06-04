import type { Schema, Struct } from '@strapi/strapi';

export interface HeaderMenuButton extends Struct.ComponentSchema {
  collectionName: 'components_header_menu_buttons';
  info: {
    displayName: 'MenuButton';
  };
  attributes: {
    title: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface HomeMiniCard extends Struct.ComponentSchema {
  collectionName: 'components_home_mini_cards';
  info: {
    displayName: 'Mini Card';
  };
  attributes: {
    description: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface HomeProduct extends Struct.ComponentSchema {
  collectionName: 'components_home_products';
  info: {
    description: '';
    displayName: 'Card';
  };
  attributes: {
    description: Schema.Attribute.Text;
    features: Schema.Attribute.Component<'shared.tag', true>;
    image: Schema.Attribute.Media<'images' | 'files'>;
    item: Schema.Attribute.Integer;
    title: Schema.Attribute.String;
  };
}

export interface HomeSection extends Struct.ComponentSchema {
  collectionName: 'components_home_sections';
  info: {
    description: '';
    displayName: 'Section';
  };
  attributes: {
    call_to_action: Schema.Attribute.Component<'shared.button', true>;
    cards: Schema.Attribute.Component<'home.product', true>;
    cover: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    description: Schema.Attribute.Text;
    mini_cards: Schema.Attribute.Component<'home.mini-card', true>;
    order: Schema.Attribute.Integer;
    slider: Schema.Attribute.Media<'images' | 'files', true>;
    summary: Schema.Attribute.Text;
    testimonials: Schema.Attribute.Component<'home.testimonial', true>;
    title: Schema.Attribute.String;
    type: Schema.Attribute.Enumeration<
      [
        'hero',
        'product',
        'solution',
        'stat',
        'value',
        'partner',
        'news',
        'testimonial',
      ]
    >;
  };
}

export interface HomeTestimonial extends Struct.ComponentSchema {
  collectionName: 'components_home_testimonials';
  info: {
    displayName: 'Testimonial';
  };
  attributes: {
    avatar: Schema.Attribute.Media<'images' | 'files', true>;
    comment: Schema.Attribute.Text;
    company: Schema.Attribute.Media<'images' | 'files'>;
    name: Schema.Attribute.String;
    position: Schema.Attribute.String;
    stars: Schema.Attribute.Integer;
  };
}

export interface SharedButton extends Struct.ComponentSchema {
  collectionName: 'components_shared_buttons';
  info: {
    description: '';
    displayName: 'Button';
  };
  attributes: {
    title: Schema.Attribute.String;
    type: Schema.Attribute.Enumeration<['primary', 'secondary', 'social']>;
    url: Schema.Attribute.String;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedMenugroup extends Struct.ComponentSchema {
  collectionName: 'components_shared_menugroups';
  info: {
    displayName: 'menugroup';
  };
  attributes: {
    links: Schema.Attribute.Component<'header.menu-button', true>;
    title: Schema.Attribute.String;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

export interface SharedTag extends Struct.ComponentSchema {
  collectionName: 'components_shared_tags';
  info: {
    description: '';
    displayName: 'Feature';
  };
  attributes: {
    title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'header.menu-button': HeaderMenuButton;
      'home.mini-card': HomeMiniCard;
      'home.product': HomeProduct;
      'home.section': HomeSection;
      'home.testimonial': HomeTestimonial;
      'shared.button': SharedButton;
      'shared.media': SharedMedia;
      'shared.menugroup': SharedMenugroup;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
      'shared.tag': SharedTag;
    }
  }
}
