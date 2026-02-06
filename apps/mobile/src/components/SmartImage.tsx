import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { SvgUri } from 'react-native-svg';

interface SmartImageProps {
  source: { uri: string } | number;
  style?: StyleProp<ImageStyle>;
  fallbackColor?: string;
  onError?: () => void;
  onLoad?: () => void;
}

const SmartImage: React.FC<SmartImageProps> = ({
  source,
  style,
  fallbackColor = '#f0f0f0',
  onError,
  onLoad,
}) => {
  const [isSvg, setIsSvg] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    if (typeof source === 'object' && source.uri) {
      // Check if the URL contains .svg or if it's an SVG format
      const uri = source.uri.toLowerCase();
      setIsSvg(uri.includes('.svg') || uri.includes('image/svg'));
    }
  }, [source]);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const handleLoad = () => {
    setHasError(false);
    onLoad?.();
  };

  // Extract dimensions from style for SVG - simplified approach
  const getStyleDimensions = () => {
    const flatStyle = Array.isArray(style) ? style[0] : style;
    return flatStyle && typeof flatStyle === 'object' ? flatStyle : {};
  };

  const styleDimensions = getStyleDimensions() as ImageStyle;
  const width = Number(styleDimensions.width) || 60;
  const height = Number(styleDimensions.height) || 60;

  if (hasError || typeof source !== 'object' || !source.uri) {
    return (
      <Image
        style={[style, { backgroundColor: fallbackColor }]}
        source={typeof source === 'number' ? source : undefined}
        onError={handleError}
        onLoad={handleLoad}
      />
    );
  }

  if (isSvg) {
    return (
      <SvgUri
        uri={source.uri}
        width={width}
        height={height}
        onError={handleError}
        onLoad={handleLoad}
      />
    );
  }

  return (
    <Image
      source={source}
      style={style}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
};

export default SmartImage;
