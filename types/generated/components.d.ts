import type { Schema, Struct } from '@strapi/strapi';

export interface SharedBlockSimpleFeature extends Struct.ComponentSchema {
  collectionName: 'components_shared_block_simple_features';
  info: {
    displayName: 'Block - Simple Feature';
  };
  attributes: {
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images' | 'files'>;
    title: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface SharedBlockSuccess extends Struct.ComponentSchema {
  collectionName: 'components_shared_block_successes';
  info: {
    displayName: 'Block - Success';
  };
  attributes: {
    body: Schema.Attribute.RichText;
    buttons: Schema.Attribute.Component<'shared.button', true>;
    header: Schema.Attribute.String;
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

export interface SharedCard extends Struct.ComponentSchema {
  collectionName: 'components_shared_cards';
  info: {
    displayName: 'Card - Icon';
  };
  attributes: {
    description: Schema.Attribute.Text;
    icon_cards: Schema.Attribute.Component<'shared.icon-card', true>;
    title: Schema.Attribute.String;
    visible: Schema.Attribute.Boolean;
  };
}

export interface SharedCardFeature extends Struct.ComponentSchema {
  collectionName: 'components_shared_card_features';
  info: {
    displayName: 'Card - Feature';
  };
  attributes: {
    description: Schema.Attribute.Text;
    features: Schema.Attribute.Component<'shared.product', true>;
    title: Schema.Attribute.String;
    visible: Schema.Attribute.Boolean;
  };
}

export interface SharedCardHighlight extends Struct.ComponentSchema {
  collectionName: 'components_shared_card_highlights';
  info: {
    displayName: 'Card - Highlight';
  };
  attributes: {
    description: Schema.Attribute.Text;
    highlights: Schema.Attribute.Component<'shared.highlight', true>;
    title: Schema.Attribute.String;
    visible: Schema.Attribute.Boolean;
  };
}

export interface SharedCardNews extends Struct.ComponentSchema {
  collectionName: 'components_shared_card_news';
  info: {
    displayName: 'Card - News';
  };
  attributes: {
    button_label: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
    type: Schema.Attribute.Enumeration<['news', 'knowledgebase']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'news'>;
    visible: Schema.Attribute.Boolean;
  };
}

export interface SharedCardRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_card_rich_texts';
  info: {
    displayName: 'Card - RichText';
  };
  attributes: {
    body: Schema.Attribute.RichText;
    visible: Schema.Attribute.Boolean;
  };
}

export interface SharedCardSimpleFeature extends Struct.ComponentSchema {
  collectionName: 'components_shared_card_simple_features';
  info: {
    displayName: 'Card - Simple Feature';
  };
  attributes: {
    description: Schema.Attribute.Text;
    features: Schema.Attribute.Component<'shared.block-simple-feature', true>;
    title: Schema.Attribute.String;
    visible: Schema.Attribute.Boolean;
  };
}

export interface SharedCardSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_card_sliders';
  info: {
    displayName: 'Card - Slider';
  };
  attributes: {
    description: Schema.Attribute.Text;
    sliders: Schema.Attribute.Component<'shared.slider', true>;
    summary: Schema.Attribute.String;
    title: Schema.Attribute.String;
    visible: Schema.Attribute.Boolean;
  };
}

export interface SharedCardSlimFeature extends Struct.ComponentSchema {
  collectionName: 'components_shared_card_slim_features';
  info: {
    displayName: 'Card - Slim Feature';
  };
  attributes: {
    description: Schema.Attribute.Text;
    features: Schema.Attribute.Component<'shared.block-simple-feature', true>;
    title: Schema.Attribute.String;
  };
}

export interface SharedCardTestimonial extends Struct.ComponentSchema {
  collectionName: 'components_shared_card_testimonials';
  info: {
    displayName: 'Card - Testimonial';
  };
  attributes: {
    description: Schema.Attribute.Text;
    testimonials: Schema.Attribute.Component<'shared.testimonial', true>;
    title: Schema.Attribute.String;
    visible: Schema.Attribute.Boolean;
  };
}

export interface SharedDecision extends Struct.ComponentSchema {
  collectionName: 'components_shared_decisions';
  info: {
    displayName: 'Card - Decision';
  };
  attributes: {
    buttons: Schema.Attribute.Component<'shared.button', true>;
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
    visible: Schema.Attribute.Boolean;
  };
}

export interface SharedFaq extends Struct.ComponentSchema {
  collectionName: 'components_shared_faqs';
  info: {
    description: '';
    displayName: 'Card - Faq';
  };
  attributes: {
    description: Schema.Attribute.Text;
    questions: Schema.Attribute.Component<'shared.qa', true>;
    title: Schema.Attribute.String;
    visible: Schema.Attribute.Boolean;
  };
}

export interface SharedFormSales extends Struct.ComponentSchema {
  collectionName: 'components_shared_form_sales';
  info: {
    displayName: 'Form - Contact';
  };
  attributes: {
    business_title: Schema.Attribute.String;
    company_label: Schema.Attribute.String;
    contact_title: Schema.Attribute.String;
    email_label: Schema.Attribute.String;
    expertise_label: Schema.Attribute.String;
    expertise_list: Schema.Attribute.Text;
    expertise_years_label: Schema.Attribute.String;
    expertise_years_list: Schema.Attribute.Text;
    has_experience_label: Schema.Attribute.String;
    has_experience_no: Schema.Attribute.String;
    has_experience_yes: Schema.Attribute.String;
    inquiry_type_label: Schema.Attribute.String;
    inquiry_type_list: Schema.Attribute.Text;
    inquiry_type_title: Schema.Attribute.String;
    license_label: Schema.Attribute.String;
    license_name_label: Schema.Attribute.String;
    license_no: Schema.Attribute.String;
    license_title: Schema.Attribute.String;
    license_type_placeholder: Schema.Attribute.String;
    license_yes: Schema.Attribute.String;
    market_label: Schema.Attribute.String;
    market_list: Schema.Attribute.Text;
    marketing_consent: Schema.Attribute.String;
    message_label: Schema.Attribute.String;
    message_placeholder: Schema.Attribute.String;
    name_label: Schema.Attribute.String;
    phone_label: Schema.Attribute.String;
    privacy_consent: Schema.Attribute.String;
    role_label: Schema.Attribute.String;
    role_list: Schema.Attribute.Text;
    send_button_label: Schema.Attribute.String;
  };
}

export interface SharedHero extends Struct.ComponentSchema {
  collectionName: 'components_shared_heroes';
  info: {
    description: '';
    displayName: 'Card - Hero';
  };
  attributes: {
    buttons: Schema.Attribute.Component<'shared.button', true>;
    cover: Schema.Attribute.Media<'images' | 'files'>;
    description: Schema.Attribute.Text;
    highlights: Schema.Attribute.Component<'shared.highlight', true>;
    title: Schema.Attribute.String;
    type: Schema.Attribute.Enumeration<['primary', 'secondary', 'orange']>;
    visible: Schema.Attribute.Boolean;
  };
}

export interface SharedHighlight extends Struct.ComponentSchema {
  collectionName: 'components_shared_highlights';
  info: {
    displayName: 'Block - Highlight';
  };
  attributes: {
    label: Schema.Attribute.String;
    value: Schema.Attribute.String;
  };
}

export interface SharedIconCard extends Struct.ComponentSchema {
  collectionName: 'components_shared_icon_cards';
  info: {
    displayName: 'Block - Icon';
  };
  attributes: {
    description: Schema.Attribute.String;
    icon: Schema.Attribute.Media<'images' | 'files'>;
    title: Schema.Attribute.String;
    url: Schema.Attribute.String;
    url_label: Schema.Attribute.String;
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

export interface SharedMenuButton extends Struct.ComponentSchema {
  collectionName: 'components_shared_menu_buttons';
  info: {
    description: '';
    displayName: 'Menu Button';
  };
  attributes: {
    icon: Schema.Attribute.Media<'files' | 'images'>;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface SharedMenugroup extends Struct.ComponentSchema {
  collectionName: 'components_shared_menugroups';
  info: {
    displayName: 'Menu Group';
  };
  attributes: {
    links: Schema.Attribute.Component<'shared.menu-button', true>;
    title: Schema.Attribute.String;
  };
}

export interface SharedMiniCard extends Struct.ComponentSchema {
  collectionName: 'components_shared_mini_cards';
  info: {
    displayName: 'Block - Mini Card';
  };
  attributes: {
    description: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SharedProduct extends Struct.ComponentSchema {
  collectionName: 'components_home_products';
  info: {
    description: '';
    displayName: 'Block - Feature';
  };
  attributes: {
    description: Schema.Attribute.Text;
    features: Schema.Attribute.Component<'shared.tag', true>;
    image: Schema.Attribute.Media<'images' | 'files'>;
    item: Schema.Attribute.Integer;
    title: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface SharedQa extends Struct.ComponentSchema {
  collectionName: 'components_shared_qas';
  info: {
    displayName: 'Block - QA';
  };
  attributes: {
    answer: Schema.Attribute.Text;
    question: Schema.Attribute.String;
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

export interface SharedSection extends Struct.ComponentSchema {
  collectionName: 'components_shared_sections';
  info: {
    description: '';
    displayName: 'Card - Section';
  };
  attributes: {
    call_to_action: Schema.Attribute.Component<'shared.button', true>;
    cards: Schema.Attribute.Component<'shared.product', true>;
    cover: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    description: Schema.Attribute.Text;
    mini_cards: Schema.Attribute.Component<'shared.mini-card', true>;
    order: Schema.Attribute.Integer;
    slider: Schema.Attribute.Media<'images' | 'files', true>;
    summary: Schema.Attribute.Text;
    testimonials: Schema.Attribute.Component<'shared.testimonial', true>;
    title: Schema.Attribute.String;
    type: Schema.Attribute.Enumeration<
      [
        'action',
        'hero',
        'product',
        'solution',
        'stat',
        'value',
        'partner',
        'feature',
        'news',
        'testimonial',
      ]
    >;
    visible: Schema.Attribute.Boolean;
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
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Block - Slider';
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

export interface SharedTestimonial extends Struct.ComponentSchema {
  collectionName: 'components_shared_testimonials';
  info: {
    displayName: 'Block - Testimonial';
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

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.block-simple-feature': SharedBlockSimpleFeature;
      'shared.block-success': SharedBlockSuccess;
      'shared.button': SharedButton;
      'shared.card': SharedCard;
      'shared.card-feature': SharedCardFeature;
      'shared.card-highlight': SharedCardHighlight;
      'shared.card-news': SharedCardNews;
      'shared.card-rich-text': SharedCardRichText;
      'shared.card-simple-feature': SharedCardSimpleFeature;
      'shared.card-slider': SharedCardSlider;
      'shared.card-slim-feature': SharedCardSlimFeature;
      'shared.card-testimonial': SharedCardTestimonial;
      'shared.decision': SharedDecision;
      'shared.faq': SharedFaq;
      'shared.form-sales': SharedFormSales;
      'shared.hero': SharedHero;
      'shared.highlight': SharedHighlight;
      'shared.icon-card': SharedIconCard;
      'shared.media': SharedMedia;
      'shared.menu-button': SharedMenuButton;
      'shared.menugroup': SharedMenugroup;
      'shared.mini-card': SharedMiniCard;
      'shared.product': SharedProduct;
      'shared.qa': SharedQa;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.section': SharedSection;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
      'shared.tag': SharedTag;
      'shared.testimonial': SharedTestimonial;
    }
  }
}
