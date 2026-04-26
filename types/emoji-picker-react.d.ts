declare module 'emoji-picker-react' {
  import * as React from 'react';

  export enum SuggestionMode {
    RECENT = 'recent',
    FREQUENT = 'frequent',
  }

  export enum EmojiStyle {
    NATIVE = 'native',
    APPLE = 'apple',
    TWITTER = 'twitter',
    GOOGLE = 'google',
    FACEBOOK = 'facebook',
  }

  export enum Theme {
    DARK = 'dark',
    LIGHT = 'light',
    AUTO = 'auto',
  }

  export enum SkinTones {
    NEUTRAL = 'neutral',
    LIGHT = '1f3fb',
    MEDIUM_LIGHT = '1f3fc',
    MEDIUM = '1f3fd',
    MEDIUM_DARK = '1f3fe',
    DARK = '1f3ff',
  }

  export enum Categories {
    SUGGESTED = 'suggested',
    CUSTOM = 'custom',
    SMILEYS_PEOPLE = 'smileys_people',
    ANIMALS_NATURE = 'animals_nature',
    FOOD_DRINK = 'food_drink',
    TRAVEL_PLACES = 'travel_places',
    ACTIVITIES = 'activities',
    OBJECTS = 'objects',
    SYMBOLS = 'symbols',
    FLAGS = 'flags',
  }

  export enum SkinTonePickerLocation {
    SEARCH = 'SEARCH',
    PREVIEW = 'PREVIEW',
  }

  export type EmojiClickData = {
    activeSkinTone: SkinTones;
    emoji: string;
    getImageUrl: (emojiStyle?: EmojiStyle) => string;
    imageUrl: string;
    isCustom: boolean;
    names: string[];
    unified: string;
    unifiedWithoutSkinTone: string;
  };

  export type PickerProps = {
    onEmojiClick?: (emojiData: EmojiClickData, event: MouseEvent) => void;
    onReactionClick?: (emojiData: EmojiClickData, event: MouseEvent) => void;
    onSkinToneChange?: (skinTone: SkinTones) => void;
    theme?: Theme;
    emojiStyle?: EmojiStyle;
    skinTonesDisabled?: boolean;
    autoFocusSearch?: boolean;
    searchDisabled?: boolean;
    searchPlaceholder?: string;
    lazyLoadEmojis?: boolean;
    defaultSkinTone?: SkinTones;
    skinTonePickerLocation?: SkinTonePickerLocation;
    suggestedEmojisMode?: SuggestionMode;
    emojiVersion?: string;
    height?: string | number;
    width?: string | number;
    style?: React.CSSProperties;
    className?: string;
    open?: boolean;
    reactionsDefaultOpen?: boolean;
    reactions?: string[];
    allowExpandReactions?: boolean;
    hiddenEmojis?: string[];
    previewConfig?: {
      defaultEmoji?: string;
      defaultCaption?: string;
      showPreview?: boolean;
    };
  };

  export function emojiByUnified(unified: string): unknown;

  export const Emoji: React.FC<{
    unified: string;
    size?: number;
    emojiStyle?: EmojiStyle;
  }>;

  const EmojiPicker: React.MemoExoticComponent<React.FC<PickerProps>>;
  export default EmojiPicker;
}
