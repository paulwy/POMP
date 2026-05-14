import React, { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  style?: React.CSSProperties;
}

const SafeImage: React.FC<SafeImageProps> = ({ src, alt, className = '', fallbackSrc, style }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const defaultFallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNkY4Ii8+CjxwYXRoIGQ9Ik0xMDAgNjBDOTAgNjAgODAgNzAgODAgODBDODAgOTAgOTAgMTAwIDEwMCAxMDBDMTEwIDEwMCAxMjAgOTAgMTIwIDgwQzEyMCA3MCAxMTAgNjAgMTAwIDYwWiIgZmlsbD0iIzk5QTFCMyIvPgo8cGF0aCBkPSJNMTYwIDE0MEwxMjAgMTQwTDEyMCAxNjBDMTIwIDE2NSAxMTUgMTcwIDEyMCAxNzBDMTc1IDE3MCAxODAgMTY1IDE4MCAxNjBMMTgwIDE0MEwxNjAgMTQwWiIgZmlsbD0iIzk5QTFCMyIvPgo8L3N2Zz4K';

  const handleError = () => {
    if (!hasError) {
      setImgSrc(fallbackSrc || defaultFallback);
      setHasError(true);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default SafeImage;
